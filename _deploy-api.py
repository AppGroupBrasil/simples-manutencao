#!/usr/bin/env python3
"""
Deploy API + Promover usuário a master.
Uso:  python _deploy-api.py [SENHA_SSH]
Ex:   python _deploy-api.py
Ex:   python _deploy-api.py minha_senha_root
"""
import paramiko, sys, os, stat

HOST = '46.225.191.114'
USER = 'root'
API_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api')
DEPLOY_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deploy-api.sh')
SSH_KEY_PUB = os.path.join(os.path.expanduser('~'), '.ssh', 'hetzner_key.pub')
SSH_KEY = os.path.join(os.path.expanduser('~'), '.ssh', 'hetzner_key')
USER_ID = 'mnop4bube4n'

def run(client, cmd, label=None):
    if label: print(f'  → {label}')
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    code = stdout.channel.recv_exit_status()
    if out: print(f'    {out[-500:]}')
    if err and code != 0: print(f'    ERR: {err[-300:]}')
    return out, err, code

def upload(sftp, local, remote):
    print(f'  📤 {os.path.basename(local)}')
    sftp.put(local, remote)

def connect_with_key(client):
    client.connect(HOST, port=22, username=USER, key_filename=SSH_KEY,
                   timeout=15, allow_agent=False, look_for_keys=False)

def connect_with_password(client, password):
    client.connect(HOST, port=22, username=USER, password=password,
                   timeout=15, allow_agent=False, look_for_keys=False)

def main():
    password = sys.argv[1] if len(sys.argv) >= 2 else None
    print(f'Conectando a {HOST}...')

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        connect_with_key(client)
        print('✅ Conectado com chave SSH!\n')
    except paramiko.AuthenticationException:
        if not password:
            print('❌ Chave SSH rejeitada e nenhuma senha foi informada.')
            print('   Uso: python _deploy-api.py <SENHA_SSH>')
            sys.exit(1)
        try:
            connect_with_password(client, password)
            print('✅ Conectado com senha!\n')
        except paramiko.AuthenticationException:
            print('❌ Senha incorreta! Verifique no painel Hetzner/Coolify.')
            sys.exit(1)

    # 1. Salvar chave SSH
    print('1️⃣  Salvando chave SSH...')
    if os.path.exists(SSH_KEY_PUB):
        with open(SSH_KEY_PUB) as f:
            pub_key = f.read().strip()
        run(client, 'mkdir -p ~/.ssh && chmod 700 ~/.ssh')
        out, _, _ = run(client, 'cat ~/.ssh/authorized_keys 2>/dev/null || echo ""')
        key_sig = ' '.join(pub_key.split()[:2])
        if key_sig not in out:
            run(client, f'echo "{pub_key}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys',
                'Chave adicionada')
        else:
            print('  ✅ Chave já existe')
    else:
        print(f'  ⚠️  {SSH_KEY_PUB} não encontrada')

    # 2. Upload dos ficheiros da API
    print('\n2️⃣  Enviando ficheiros da API...')
    run(client, 'mkdir -p /root/simples-manutencao/api')
    sftp = client.open_sftp()
    for f in ['server.js', 'db.js', 'package.json', 'Dockerfile']:
        local = os.path.join(API_DIR, f)
        if os.path.exists(local):
            upload(sftp, local, f'/root/simples-manutencao/api/{f}')

    # 3. Upload deploy script
    print('\n3️⃣  Enviando deploy-api.sh...')
    if os.path.exists(DEPLOY_SCRIPT):
        upload(sftp, DEPLOY_SCRIPT, '/root/simples-manutencao/deploy-api.sh')
        run(client, 'chmod +x /root/simples-manutencao/deploy-api.sh')
    sftp.close()

    # 4. Build Docker
    print('\n4️⃣  Construindo imagem Docker...')
    run(client, 'cd /root/simples-manutencao/api && docker build -t simples-api . 2>&1 | tail -5', 'docker build')

    # 5. Deploy
    print('\n5️⃣  Re-deploy do container...')
    run(client, 'cd /root/simples-manutencao && bash deploy-api.sh 2>&1', 'deploy-api.sh')

    # 6. Aguardar e verificar
    print('\n6️⃣  Verificando API...')
    import time; time.sleep(4)
    run(client, 'docker logs --tail 5 simples-api 2>&1', 'Logs')

    # 7. Promover usuário a master
    print(f'\n7️⃣  Promovendo {USER_ID} a master...')
    cmd = (
        f"docker exec simples-api node -e \""
        f"const db=require('./db');"
        f"db.db.prepare('UPDATE usuarios SET role=? WHERE id=?').run('master','{USER_ID}');"
        f"const u=db.db.prepare('SELECT id,nome,email,role FROM usuarios WHERE id=?').get('{USER_ID}');"
        f"console.log(JSON.stringify(u));\""
    )
    run(client, cmd, 'SQL UPDATE')

    print('\n' + '='*50)
    print('✅ DEPLOY COMPLETO!')
    print(f'   Email: eduardodominikus@hotmail.com')
    print(f'   Senha: 123456')
    print(f'   Role:  master')
    print(f'   API:   https://api.simplesmanutencao.com.br')
    print('='*50)

    client.close()

if __name__ == '__main__':
    main()
