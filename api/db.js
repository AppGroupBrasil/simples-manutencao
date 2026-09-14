const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = process.env.DB_DIR || '/data';
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, 'simples.db'));

// WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// ── Create tables ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id            TEXT PRIMARY KEY,
    nome          TEXT NOT NULL,
    login         TEXT NOT NULL UNIQUE,
    email         TEXT,
    senha         TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'administrador',
    cargo         TEXT,
    admin_id      TEXT,
    supervisor_id TEXT,
    administrador_id TEXT,
    bloqueado     INTEGER DEFAULT 0,
    plano         TEXT,
    cadastrado_em INTEGER DEFAULT (strftime('%s','now') * 1000),
    atualizado_em INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS dados_sync (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id TEXT NOT NULL,
    chave      TEXT NOT NULL,
    valor      TEXT NOT NULL,
    atualizado_em INTEGER DEFAULT (strftime('%s','now') * 1000),
    UNIQUE(usuario_id, chave)
  );

  CREATE TABLE IF NOT EXISTS os_compartilhadas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    chamado    TEXT NOT NULL,
    de_id      TEXT NOT NULL,
    de_nome    TEXT NOT NULL,
    para_id    TEXT NOT NULL,
    criado_em  INTEGER DEFAULT (strftime('%s','now') * 1000),
    recebido   INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_os_comp_para ON os_compartilhadas (para_id, recebido);

  CREATE TABLE IF NOT EXISTS os_links (
    token      TEXT PRIMARY KEY,
    chamado    TEXT NOT NULL,
    de_nome    TEXT NOT NULL,
    criado_em  INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id TEXT NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    expira_em  INTEGER NOT NULL,
    usado      INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS acessos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id TEXT NOT NULL,
    em         INTEGER NOT NULL,
    tipo       TEXT NOT NULL,
    ip         TEXT,
    user_agent TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_acessos_usuario_em ON acessos (usuario_id, em);
`);

const stmtInsertAcesso = db.prepare(`INSERT INTO acessos (usuario_id, em, tipo, ip, user_agent) VALUES (?, ?, ?, ?, ?)`);
const stmtUltimoAcesso = db.prepare(`SELECT MAX(em) AS em FROM acessos WHERE usuario_id = ?`);
const JANELA_SESSAO_MS = 30 * 60 * 1000;
const ultimoAcessoCache = new Map();

function registrarAcesso(usuarioId, tipo, req) {
  try {
    const agora = Date.now();
    let ultimo = ultimoAcessoCache.get(usuarioId);
    if (ultimo === undefined) ultimo = stmtUltimoAcesso.get(usuarioId).em || 0;
    ultimoAcessoCache.set(usuarioId, agora);
    if (tipo === 'uso' && agora - ultimo < JANELA_SESSAO_MS) return;
    const ip = String((req && (req.headers['x-forwarded-for'] || req.socket.remoteAddress)) || '').split(',')[0].trim().slice(0, 64) || null;
    const ua = String((req && req.headers['user-agent']) || '').slice(0, 300) || null;
    stmtInsertAcesso.run(usuarioId, agora, tipo, ip, ua);
  } catch (err) {
    console.error('registrar-acesso error:', err.message);
  }
}

const MSG_BLOQUEIO = 'Seu período de testes acabou.';
const stmtContaBloqueada = db.prepare(`SELECT 1 FROM usuarios WHERE bloqueado = 1 AND role != 'master' AND id IN (?, ?) LIMIT 1`);
function contaBloqueada(row) {
  return !!(row && stmtContaBloqueada.get(row.id, row.admin_id || row.id));
}

// ── User helpers ───────────────────────────────────────────
const stmtInsertUser = db.prepare(`
  INSERT INTO usuarios (id, nome, login, email, senha, role, cargo, admin_id, supervisor_id, administrador_id, bloqueado, plano, cadastrado_em)
  VALUES (@id, @nome, @login, @email, @senha, @role, @cargo, @adminId, @supervisorId, @administradorId, @bloqueado, @plano, @cadastradoEm)
`);

const stmtFindByLogin = db.prepare(`SELECT * FROM usuarios WHERE login = ? OR email = ?`);
const stmtFindByEmail = db.prepare(`SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)`);
const stmtFindById = db.prepare(`SELECT * FROM usuarios WHERE id = ?`);
const stmtUpdateSenha = db.prepare(`UPDATE usuarios SET senha = ?, atualizado_em = ? WHERE id = ?`);

function rowToUsuario(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    login: row.login,
    email: row.email,
    senha: row.senha,
    role: row.role,
    cargo: row.cargo,
    adminId: row.admin_id,
    supervisorId: row.supervisor_id,
    administradorId: row.administrador_id,
    bloqueado: !!row.bloqueado,
    plano: row.plano,
    cadastradoEm: row.cadastrado_em,
  };
}

// ── Seed master (controle geral). Idempotente. ─────────────
// Sem isto o master so existe local (fallback) e nunca tem sessao no
// servidor -> os endpoints /admin/cliente/* ficariam inacessiveis.
// Senha default = a mesma usada localmente; sobrescrevivel por env.
(() => {
  const email = (process.env.MASTER_EMAIL || 'eduardodominikus@hotmail.com').toLowerCase();
  const senha = process.env.MASTER_SENHA || '123456';
  const existente = stmtFindByEmail.get(email);
  if (existente) {
    // Garante papel master e limpa vinculos legados (admin_id/supervisor_id): sem isso
    // o master conta como "funcionario" de outro admin e poderia ser apagado numa
    // exclusao em cascata desse admin.
    const precisa = existente.role !== 'master'
      || existente.admin_id != null
      || existente.administrador_id != null
      || existente.supervisor_id != null;
    if (precisa) {
      db.prepare(`UPDATE usuarios SET role='master', admin_id=NULL, administrador_id=NULL, supervisor_id=NULL, atualizado_em=? WHERE id=?`)
        .run(Date.now(), existente.id);
    }
    return;
  }
  try {
    stmtInsertUser.run({
      id: 'master', nome: 'Master', login: email, email,
      senha, role: 'master', cargo: null,
      adminId: null, supervisorId: null, administradorId: null,
      bloqueado: 0, plano: null, cadastradoEm: Date.now(),
    });
  } catch (_) { /* corrida de concorrencia: ok */ }
})();

// ── Sync helpers ───────────────────────────────────────────
const stmtUpsertSync = db.prepare(`
  INSERT INTO dados_sync (usuario_id, chave, valor, atualizado_em)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(usuario_id, chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em
`);

const stmtGetSync = db.prepare(`SELECT chave, valor, atualizado_em FROM dados_sync WHERE usuario_id = ?`);
const stmtGetSyncKey = db.prepare(`SELECT valor, atualizado_em FROM dados_sync WHERE usuario_id = ? AND chave = ?`);

// ── OS compartilhadas helpers ──────────────────────────────
const stmtInsertOsComp = db.prepare(`
  INSERT INTO os_compartilhadas (chamado, de_id, de_nome, para_id, criado_em)
  VALUES (?, ?, ?, ?, ?)
`);
const stmtGetOsCompPara = db.prepare(`
  SELECT id, chamado, de_id, de_nome, criado_em FROM os_compartilhadas
  WHERE para_id = ? AND recebido = 0 ORDER BY criado_em
`);
const stmtMarkOsCompRecebida = db.prepare(`
  UPDATE os_compartilhadas SET recebido = 1 WHERE id = ? AND para_id = ?
`);
const stmtInsertOsLink = db.prepare(`
  INSERT INTO os_links (token, chamado, de_nome, criado_em) VALUES (?, ?, ?, ?)
`);
const stmtGetOsLink = db.prepare(`SELECT chamado, de_nome, criado_em FROM os_links WHERE token = ?`);

// ── Reset token helpers ────────────────────────────────────
const stmtInsertToken = db.prepare(`INSERT INTO reset_tokens (usuario_id, token, expira_em) VALUES (?, ?, ?)`);
const stmtFindToken = db.prepare(`SELECT * FROM reset_tokens WHERE token = ? AND usado = 0 AND expira_em > ?`);
const stmtMarkTokenUsed = db.prepare(`UPDATE reset_tokens SET usado = 1 WHERE token = ?`);

module.exports = {
  db,
  registrarAcesso, contaBloqueada, MSG_BLOQUEIO,
  stmtInsertUser,
  stmtFindByLogin,
  stmtFindByEmail,
  stmtFindById,
  stmtUpdateSenha,
  stmtUpsertSync,
  stmtGetSync,
  stmtGetSyncKey,
  stmtInsertOsComp,
  stmtGetOsCompPara,
  stmtMarkOsCompRecebida,
  stmtInsertOsLink,
  stmtGetOsLink,
  stmtInsertToken,
  stmtFindToken,
  stmtMarkTokenUsed,
  rowToUsuario,
};
