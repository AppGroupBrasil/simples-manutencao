require('dotenv').config();
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 }  = require('uuid');
const nodemailer      = require('nodemailer');

const {
  db, stmtInsertUser, stmtFindByLogin, stmtFindByEmail, stmtFindById,
  stmtUpdateSenha, stmtUpsertSync, stmtGetSync, stmtGetSyncKey,
  stmtInsertToken, stmtFindToken, stmtMarkTokenUsed, rowToUsuario,
} = require('./db');

const app        = express();
const PORT       = process.env.PORT       || 3001;
const API_KEY    = process.env.API_KEY    || 'simples-api-key-2024';
const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || '7', 10);
const DATA_FILE  = process.env.DATA_FILE  || '/data/trial-ips.json';
const GMAIL_USER = process.env.GMAIL_USER || 'appgroupbrasil@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || '';
const BASE_URL   = process.env.BASE_URL   || 'https://simplesmanutencao.com.br';
const JWT_SECRET = process.env.JWT_SECRET || '';
const PROVISIONING_SECRET = process.env.PROVISIONING_SECRET || '';
const APP_SLUG = 'simples-manutencao';
const STATUS_VALIDOS_LICENCA = new Set(['ativa', 'trial']);

const transporter = GMAIL_PASS ? nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
}) : null;

app.use(express.json({ limit: '50mb' }));
app.set('trust proxy', true);

app.use(cors({
  origin: [
    'https://simplesmanutencao.com.br',
    'https://www.simplesmanutencao.com.br',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ],
  credentials: true,
}));

// ── Trial helpers (legacy – unchanged) ─────────────────────
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { ips: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch { return { ips: [] }; }
}

function saveData(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getIP(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.ip ||
    'unknown'
  );
}

function requireKey(req, res, next) {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

const trialMs = () => TRIAL_DAYS * 24 * 60 * 60 * 1000;

// ── Auth middleware ────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  // Token central (JWT do auth-central com apps[])
  if (JWT_SECRET && token.split('.').length === 3) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (Array.isArray(payload.apps)) {
        const licenca = payload.apps.find(a => a.slug === APP_SLUG);
        if (!licenca || !STATUS_VALIDOS_LICENCA.has(licenca.status)) {
          return res.status(403).json({ error: 'Sem licença ativa para Simples Manutenção' });
        }
        if (licenca.expira_em && new Date(licenca.expira_em) < new Date()) {
          return res.status(403).json({ error: 'Licença expirada' });
        }
        let row = stmtFindById.get(payload.sub);
        if (!row) {
          const roleLocal = licenca.role === 'admin' || licenca.role === 'superadmin' ? 'administrador' : 'usuario';
          stmtInsertUser.run({
            id: payload.sub,
            nome: payload.nome || payload.email || 'Usuário',
            login: (payload.email || payload.sub).toLowerCase(),
            email: payload.email || null,
            senha: '!central!',
            role: roleLocal,
            cargo: null,
            adminId: null,
            supervisorId: null,
            administradorId: null,
            bloqueado: 0,
            plano: null,
            cadastradoEm: Date.now(),
          });
          row = stmtFindById.get(payload.sub);
        }
        req.usuario = rowToUsuario(row);
        return next();
      }
    } catch (_) { /* nao e JWT central; cai pro legado */ }
  }

  // Legado: token = userId direto
  const row = stmtFindById.get(token);
  if (!row) return res.status(401).json({ error: 'Token inválido' });
  req.usuario = rowToUsuario(row);
  next();
}

// ── SSO da central (login único, RS256/JWKS) ───────────────
app.use('/sso', require('./sso'));

// ══════════════════════════════════════════════════════════════
//  PROVISIONING (webhook do auth-central)
// ══════════════════════════════════════════════════════════════
app.post('/provisioning/usuario', (req, res) => {
  const secret = req.headers['x-provisioning-secret'];
  if (!PROVISIONING_SECRET || secret !== PROVISIONING_SECRET) {
    return res.status(403).json({ error: 'Assinatura inválida' });
  }
  const b = req.body || {};
  if (!b.usuario_id || !b.email || !b.nome) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }
  const ativo = b.status === 'ativa' || b.status === 'trial';
  const roleLocal = b.role === 'admin' || b.role === 'superadmin' ? 'administrador' : 'usuario';
  const existing = stmtFindById.get(b.usuario_id);
  if (existing) {
    db.prepare(`UPDATE usuarios SET nome=?, email=?, login=?, role=?, bloqueado=?, atualizado_em=? WHERE id=?`)
      .run(b.nome, b.email, b.email.toLowerCase(), roleLocal, ativo ? 0 : 1, Date.now(), b.usuario_id);
  } else {
    const porEmail = stmtFindByEmail.get(b.email);
    if (porEmail) {
      // Vincula o id central ao usuario existente por email (id eh TEXT, pode atualizar)
      db.prepare(`UPDATE usuarios SET id=?, nome=?, role=?, bloqueado=?, atualizado_em=? WHERE id=?`)
        .run(b.usuario_id, b.nome, roleLocal, ativo ? 0 : 1, Date.now(), porEmail.id);
    } else {
      stmtInsertUser.run({
        id: b.usuario_id,
        nome: b.nome,
        login: b.email.toLowerCase(),
        email: b.email,
        senha: '!central!',
        role: roleLocal,
        cargo: null,
        adminId: null,
        supervisorId: null,
        administradorId: null,
        bloqueado: ativo ? 0 : 1,
        plano: null,
        cadastradoEm: Date.now(),
      });
    }
  }
  res.json({ ok: true, usuario_id: b.usuario_id });
});

// ══════════════════════════════════════════════════════════════
//  AUTH ENDPOINTS
// ══════════════════════════════════════════════════════════════

// ── POST /admin/set-role (protegido por API_KEY) ───────────
app.post('/admin/set-role', (req, res) => {
  const key = (req.headers['x-api-key'] || '').trim();
  if (key !== API_KEY) return res.status(403).json({ error: 'Forbidden' });
  const { userId, role } = req.body || {};
  if (!userId || !role) return res.status(400).json({ error: 'userId e role são obrigatórios' });
  const valid = ['master', 'administrador', 'supervisor', 'funcionario'];
  if (!valid.includes(role)) return res.status(400).json({ error: `Role inválido. Use: ${valid.join(', ')}` });
  try {
    db.prepare('UPDATE usuarios SET role = ? WHERE id = ?').run(role, userId);
    const u = stmtFindById.get(userId);
    if (!u) return res.status(404).json({ error: 'Usuário não encontrado' });
    const { senha: _, ...safe } = rowToUsuario(u);
    res.json({ ok: true, usuario: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/register ────────────────────────────────────
app.post('/auth/register', (req, res) => {
  try {
    const { nome, email, senha } = req.body || {};
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

    const emailNorm = email.trim().toLowerCase();
    const existing = stmtFindByLogin.get(emailNorm, emailNorm);
    if (existing) return res.status(409).json({ error: 'Já existe uma conta com esse e-mail' });

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    stmtInsertUser.run({
      id, nome: nome.trim(), login: emailNorm, email: emailNorm,
      senha, role: 'administrador', cargo: null,
      adminId: id, supervisorId: null, administradorId: id,
      bloqueado: 0, plano: null, cadastradoEm: Date.now(),
    });

    const user = rowToUsuario(stmtFindById.get(id));
    const { senha: _, ...safe } = user;
    res.json({ ok: true, usuario: safe, token: id });
  } catch (err) {
    console.error('register error:', err.message);
    res.status(500).json({ error: 'Erro ao registrar' });
  }
});

// ── POST /auth/login ───────────────────────────────────────
app.post('/auth/login', (req, res) => {
  try {
    const { login, senha } = req.body || {};
    if (!login || !senha) return res.status(400).json({ error: 'Login e senha obrigatórios' });

    const loginNorm = login.trim().toLowerCase();
    const row = stmtFindByLogin.get(loginNorm, loginNorm);
    if (!row) return res.status(401).json({ error: 'Login ou senha incorretos' });

    const user = rowToUsuario(row);
    if (user.senha !== senha) return res.status(401).json({ error: 'Login ou senha incorretos' });
    if (user.bloqueado) return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o suporte.' });

    const { senha: _, ...safe } = user;
    res.json({ ok: true, usuario: safe, token: user.id });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ── POST /auth/forgot-password ─────────────────────────────
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'E-mail obrigatório' });

    const emailNorm = email.trim().toLowerCase();
    const row = stmtFindByEmail.get(emailNorm);

    // Always return OK to not reveal if email exists
    if (!row) return res.json({ ok: true, msg: 'Se o e-mail existir, enviaremos as instruções.' });

    const user = rowToUsuario(row);
    const token = uuidv4();
    const expiraEm = Date.now() + 30 * 60 * 1000; // 30 min
    stmtInsertToken.run(user.id, token, expiraEm);

    const resetLink = `${BASE_URL}/reset-senha?token=${token}`;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `Simples Manutenção <${GMAIL_USER}>`,
          to: user.email,
          subject: 'Recuperação de Senha — Simples Manutenção',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#FF8F00">🔑 Recuperar Senha</h2>
              <p>Olá <strong>${user.nome}</strong>,</p>
              <p>Recebemos uma solicitação para redefinir sua senha.</p>
              <p>Clique no botão abaixo (válido por 30 minutos):</p>
              <a href="${resetLink}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#FFD600,#FF8F00);color:#0D0D0D;border-radius:12px;font-weight:900;text-decoration:none;font-size:15px;margin:16px 0">
                Redefinir Senha
              </a>
              <p style="font-size:12px;color:#888">Se você não solicitou, ignore este e-mail.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
              <p style="font-size:12px;color:#aaa">Simples Manutenção — simplesmanutencao.com.br</p>
            </div>
          `,
        });
        console.log(`[EMAIL] Enviado para ${user.email}`);
      } catch (mailErr) {
        console.error(`[EMAIL] Falha ao enviar para ${user.email}:`, mailErr.message);
      }
    } else {
      // Fallback: log the link (no Gmail password configured)
      console.log(`[RESET] ${user.email} → ${resetLink}`);
    }

    res.json({ ok: true, msg: 'Se o e-mail existir, enviaremos as instruções.' });
  } catch (err) {
    console.error('forgot-password error:', err.message);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// ── POST /auth/reset-password ──────────────────────────────
app.post('/auth/reset-password', (req, res) => {
  try {
    const { token, novaSenha } = req.body || {};
    if (!token || !novaSenha) return res.status(400).json({ error: 'Token e nova senha obrigatórios' });
    if (novaSenha.length < 4) return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });

    const row = stmtFindToken.get(token, Date.now());
    if (!row) return res.status(400).json({ error: 'Link expirado ou inválido. Solicite novamente.' });

    stmtUpdateSenha.run(novaSenha, Date.now(), row.usuario_id);
    stmtMarkTokenUsed.run(token);

    res.json({ ok: true, msg: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error('reset-password error:', err.message);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// ── POST /auth/create-user ─────────────────────────────────
// Admin creates employee
app.post('/auth/create-user', requireAuth, (req, res) => {
  try {
    const { nome, cargo, senha, role } = req.body || {};
    if (!nome || !senha) return res.status(400).json({ error: 'Nome e senha obrigatórios' });

    const loginGerado = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

    stmtInsertUser.run({
      id, nome: nome.trim(), login: loginGerado, email: null,
      senha, role: role || 'funcionario', cargo: cargo || null,
      adminId: req.usuario.adminId || req.usuario.id,
      supervisorId: null, administradorId: req.usuario.administradorId || req.usuario.id,
      bloqueado: 0, plano: null, cadastradoEm: Date.now(),
    });

    res.json({ ok: true, login: loginGerado, id });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Login já existe' });
    console.error('create-user error:', err.message);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// ── DELETE /auth/user/:id ──────────────────────────────────
app.delete('/auth/user/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('delete-user error:', err.message);
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

// ── GET /auth/users ────────────────────────────────────────
app.get('/auth/users', requireAuth, (req, res) => {
  try {
    const adminId = req.usuario.adminId || req.usuario.id;
    const rows = db.prepare('SELECT * FROM usuarios WHERE admin_id = ? OR id = ?').all(adminId, adminId);
    const users = rows.map(r => {
      const u = rowToUsuario(r);
      const { senha: _, ...safe } = u;
      return safe;
    });
    res.json({ usuarios: users });
  } catch (err) {
    console.error('list-users error:', err.message);
    res.status(500).json({ error: 'Erro ao listar' });
  }
});

// ══════════════════════════════════════════════════════════════
//  DATA SYNC ENDPOINTS
// ══════════════════════════════════════════════════════════════

// Syncable keys — all localStorage keys the app uses
const SYNC_KEYS = [
  'manutencao_chamados_v2',
  'manutencao_funcoes_v2',
  'sm_usuarios_v2',
  'sm_checklists_v2',
  'sm_cad_tecnicos',
  'sm_cad_gestores',
  'sm_cad_prestadoras',
  'sm_cad_maquinas',
  'sm_cad_tipos_manutencao',
  'sm_cad_emails_os',
  'sm_cad_whatsapp_os',
  'sm_logo_empresa',
  'sm_contador_recibos',
  'sm_contador_recibos_simples',
  'sm_contador_os_at',
  'sm_contador_os_geral',
  'sm_contador_os_mc',
  'sm_contador_os_mp',
  'sm_contador_os_inst',
  'sm_contador_os_vist',
  'sm_contador_orcamentos',
  'sm_documentos_v2',
  'sm_shared_os_data',
];

// ── POST /sync/upload ──────────────────────────────────────
// Client sends all data → server saves
app.post('/sync/upload', requireAuth, (req, res) => {
  try {
    const { dados } = req.body || {};
    if (!dados || typeof dados !== 'object') return res.status(400).json({ error: 'Dados inválidos' });

    const userId = req.usuario.adminId || req.usuario.id;
    const now = Date.now();

    const upsert = db.transaction(() => {
      for (const [chave, valor] of Object.entries(dados)) {
        if (!SYNC_KEYS.includes(chave)) continue;
        const json = typeof valor === 'string' ? valor : JSON.stringify(valor);
        stmtUpsertSync.run(userId, chave, json, now);
      }
    });
    upsert();

    res.json({ ok: true, sincronizado: Object.keys(dados).length });
  } catch (err) {
    console.error('upload error:', err.message);
    res.status(500).json({ error: 'Erro ao salvar dados' });
  }
});

// ── GET /sync/download ─────────────────────────────────────
// Client requests all data from server
app.get('/sync/download', requireAuth, (req, res) => {
  try {
    const userId = req.usuario.adminId || req.usuario.id;
    const rows = stmtGetSync.all(userId);
    const dados = {};
    for (const row of rows) {
      dados[row.chave] = row.valor;
    }
    res.json({ ok: true, dados });
  } catch (err) {
    console.error('download error:', err.message);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// ── GET /sync/status ───────────────────────────────────────
// Check last sync timestamp per key
app.get('/sync/status', requireAuth, (req, res) => {
  try {
    const userId = req.usuario.adminId || req.usuario.id;
    const rows = stmtGetSync.all(userId);
    const status = {};
    for (const row of rows) {
      status[row.chave] = row.atualizado_em;
    }
    res.json({ ok: true, status });
  } catch (err) {
    console.error('sync-status error:', err.message);
    res.status(500).json({ error: 'Erro' });
  }
});

// ══════════════════════════════════════════════════════════════
//  TRIAL ENDPOINTS (legacy – unchanged)
// ══════════════════════════════════════════════════════════════

app.post('/trial/check', (req, res) => {
  const ip   = getIP(req);
  const data = loadData();
  const record = data.ips.find(r => r.ip === ip);

  if (!record) return res.json({ permitido: true });
  if (record.bloqueado) return res.json({ permitido: false, motivo: 'bloqueado' });

  const expirado = (Date.now() - record.registradoEm) > trialMs();
  if (expirado) return res.json({ permitido: false, motivo: 'trial_expirado' });

  return res.json({ permitido: true, trialAtivo: true });
});

app.post('/trial/register', (req, res) => {
  const ip    = getIP(req);
  const email = (req.body?.email || '').trim().toLowerCase();
  const data  = loadData();

  const existing = data.ips.find(r => r.ip === ip);
  if (existing) {
    if (email && !existing.emails.includes(email)) {
      existing.emails.push(email);
      saveData(data);
    }
    return res.json({ ok: true });
  }

  data.ips.push({ ip, emails: email ? [email] : [], registradoEm: Date.now(), bloqueado: false });
  saveData(data);
  res.json({ ok: true });
});

app.get('/trial/list', requireKey, (req, res) => {
  const data = loadData();
  const now  = Date.now();
  const lista = data.ips.map(r => ({
    ...r,
    diasRegistrado: Math.floor((now - r.registradoEm) / (1000 * 60 * 60 * 24)),
    trialExpirado:  (now - r.registradoEm) > trialMs(),
  }));
  res.json({ ips: lista });
});

app.delete('/trial/unblock', requireKey, (req, res) => {
  const ip   = req.body?.ip;
  const data = loadData();
  if (!data.ips.find(r => r.ip === ip)) return res.status(404).json({ error: 'IP não encontrado' });
  data.ips = data.ips.filter(r => r.ip !== ip);
  saveData(data);
  res.json({ ok: true });
});

app.post('/trial/block', requireKey, (req, res) => {
  const ip   = req.body?.ip;
  const data = loadData();
  const rec  = data.ips.find(r => r.ip === ip);
  if (rec) { rec.bloqueado = true; }
  else { data.ips.push({ ip, emails: [], registradoEm: Date.now(), bloqueado: true }); }
  saveData(data);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  PUBLIC CHAMADO LOOKUP (by protocol)
// ══════════════════════════════════════════════════════════════
app.get('/chamado/:protocolo', (req, res) => {
  try {
    const protocolo = req.params.protocolo;
    if (!protocolo) return res.status(400).json({ error: 'Protocolo obrigatório' });

    // Search all users' sync data for the chamado with this protocol
    const rows = db.prepare(
      "SELECT valor FROM sync_data WHERE chave = 'manutencao_chamados_v2'"
    ).all();

    for (const row of rows) {
      try {
        const chamados = JSON.parse(row.valor);
        const arr = Array.isArray(chamados) ? chamados : [];
        const found = arr.find(c => c.protocolo === protocolo);
        if (found) {
          // Return only safe public fields
          return res.json({
            ok: true,
            chamado: {
              protocolo: found.protocolo,
              funcaoNome: found.funcaoNome || '',
              funcaoIcone: found.funcaoIcone || '',
              funcaoCor: found.funcaoCor || '',
              status: found.status || 'aberto',
              responsavel: found.responsavel || '',
              criadoEm: found.criadoEm || null,
              horarioInicial: found.horarioInicial || null,
              horarioFinal: found.horarioFinal || null,
              tempoTotal: found.tempoTotal || null,
              osTitulo: found.osTitulo || '',
              osNumero: found.osNumero || '',
              observacoes: found.observacoes || '',
              respostas: found.respostas || {},
            },
          });
        }
      } catch { /* skip malformed */ }
    }

    res.status(404).json({ error: 'Chamado não encontrado' });
  } catch (err) {
    console.error('chamado-lookup error:', err.message);
    res.status(500).json({ error: 'Erro ao buscar chamado' });
  }
});

// ── Health ─────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, trialDias: TRIAL_DAYS, db: 'sqlite' }));

app.listen(PORT, () => console.log(`✅ API rodando na porta ${PORT} (SQLite + Sync + Resend)`));
