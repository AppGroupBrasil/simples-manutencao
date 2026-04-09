const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '46.225.191.114';
const USER = 'root';
const PASS = 'rvvLeAFVwUEH';
const KEY_PATH = path.join(process.env.USERPROFILE, '.ssh', 'hetzner_key.pub');

const conn = new Client();

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '', errOut = '';
      stream.on('data', d => { out += d; });
      stream.stderr.on('data', d => { errOut += d; });
      stream.on('close', (code) => {
        resolve({ out: out.trim(), err: errOut.trim(), code });
      });
    });
  });
}

function upload(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const rs = fs.createReadStream(localPath);
      const ws = sftp.createWriteStream(remotePath);
      ws.on('close', () => resolve());
      ws.on('error', reject);
      rs.pipe(ws);
    });
  });
}

async function main() {
  console.log('Conectando ao servidor com senha...');
  
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', (err) => { console.error('❌ ERRO:', err.message); reject(err); });
    conn.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
      finish([PASS]);
    });
    conn.connect({
      host: HOST,
      port: 22,
      username: USER,
      password: PASS,
      tryKeyboard: true,
      debug: (msg) => { if (msg.includes('auth') || msg.includes('Auth')) console.log('  DEBUG:', msg); }
    });
  });
  console.log('✅ Conectado!\n');

  // 1. Salvar chave SSH
  console.log('1️⃣ Salvando chave SSH para acesso futuro...');
  if (fs.existsSync(KEY_PATH)) {
    const pubKey = fs.readFileSync(KEY_PATH, 'utf-8').trim();
    await exec(conn, 'mkdir -p ~/.ssh && chmod 700 ~/.ssh');
    // Verifica se já existe
    const { out: existing } = await exec(conn, 'cat ~/.ssh/authorized_keys 2>/dev/null || echo ""');
    if (!existing.includes(pubKey.split(' ').slice(0, 2).join(' '))) {
      await exec(conn, `echo "${pubKey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`);
      console.log('   ✅ Chave SSH adicionada ao authorized_keys');
    } else {
      console.log('   ✅ Chave SSH já existe no servidor');
    }
  } else {
    console.log('   ⚠️ Chave pública não encontrada em ' + KEY_PATH);
  }

  // 2. Criar pasta da API
  console.log('\n2️⃣ Preparando pasta da API...');
  await exec(conn, 'mkdir -p /root/simples-manutencao/api');

  // 3. Upload dos ficheiros da API
  console.log('\n3️⃣ Enviando ficheiros da API...');
  const apiDir = path.join(__dirname, 'api');
  const files = ['server.js', 'db.js', 'package.json', 'Dockerfile'];
  for (const f of files) {
    const local = path.join(apiDir, f);
    if (fs.existsSync(local)) {
      await upload(conn, local, `/root/simples-manutencao/api/${f}`);
      console.log(`   📤 ${f}`);
    }
  }

  // 4. Upload do deploy script
  console.log('\n4️⃣ Enviando deploy-api.sh...');
  const deployScript = path.join(__dirname, 'deploy-api.sh');
  if (fs.existsSync(deployScript)) {
    await upload(conn, deployScript, '/root/simples-manutencao/deploy-api.sh');
    await exec(conn, 'chmod +x /root/simples-manutencao/deploy-api.sh');
    console.log('   📤 deploy-api.sh');
  }

  // 5. Build da imagem Docker
  console.log('\n5️⃣ Reconstruindo imagem Docker da API...');
  const { out: buildOut, err: buildErr } = await exec(conn, 'cd /root/simples-manutencao/api && docker build -t simples-api . 2>&1');
  const lastLines = buildOut.split('\n').slice(-3).join('\n');
  console.log('   ' + lastLines);
  if (buildOut.includes('Successfully tagged') || buildOut.includes('naming to docker.io')) {
    console.log('   ✅ Build OK');
  }

  // 6. Re-deploy do container
  console.log('\n6️⃣ Re-deploy do container...');
  const { out: deployOut } = await exec(conn, 'cd /root/simples-manutencao && bash deploy-api.sh 2>&1');
  console.log('   ' + deployOut.split('\n').slice(-2).join('\n'));

  // 7. Aguardar container iniciar
  console.log('\n7️⃣ Aguardando API iniciar...');
  await new Promise(r => setTimeout(r, 3000));
  const { out: logs } = await exec(conn, 'docker logs --tail 5 simples-api 2>&1');
  console.log('   ' + logs);

  // 8. Promover usuário a master
  console.log('\n8️⃣ Promovendo usuário a master...');
  const { out: roleOut } = await exec(conn, `docker exec simples-api node -e "const db=require('./db');db.db.prepare('UPDATE usuarios SET role=? WHERE id=?').run('master','mnop4bube4n');const u=db.db.prepare('SELECT id,nome,email,role FROM usuarios WHERE id=?').get('mnop4bube4n');console.log(JSON.stringify(u));"`);
  console.log('   ' + roleOut);

  console.log('\n✅ TUDO PRONTO!');
  console.log('   Email: eduardodominikus@hotmail.com');
  console.log('   Senha: 123456');
  console.log('   Role: master');
  
  conn.end();
}

main().catch(err => {
  console.error('❌ ERRO:', err.message);
  conn.end();
  process.exit(1);
});
