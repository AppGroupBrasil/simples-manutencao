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

  CREATE TABLE IF NOT EXISTS reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id TEXT NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    expira_em  INTEGER NOT NULL,
    usado      INTEGER DEFAULT 0
  );
`);

// ── User helpers ───────────────────────────────────────────
const stmtInsertUser = db.prepare(`
  INSERT INTO usuarios (id, nome, login, email, senha, role, cargo, admin_id, supervisor_id, administrador_id, bloqueado, plano, cadastrado_em)
  VALUES (@id, @nome, @login, @email, @senha, @role, @cargo, @adminId, @supervisorId, @administradorId, @bloqueado, @plano, @cadastradoEm)
`);

// Indexes for hot lookup paths
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_usuarios_admin   ON usuarios(admin_id);
  CREATE INDEX IF NOT EXISTS idx_usuarios_email   ON usuarios(email);
  CREATE INDEX IF NOT EXISTS idx_dados_sync_user  ON dados_sync(usuario_id);
  CREATE INDEX IF NOT EXISTS idx_reset_tokens_tok ON reset_tokens(token);
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

// ── Sync helpers ───────────────────────────────────────────
const stmtUpsertSync = db.prepare(`
  INSERT INTO dados_sync (usuario_id, chave, valor, atualizado_em)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(usuario_id, chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em
`);

const stmtGetSync = db.prepare(`SELECT chave, valor, atualizado_em FROM dados_sync WHERE usuario_id = ?`);

// ── Reset token helpers ────────────────────────────────────
const stmtInsertToken = db.prepare(`INSERT INTO reset_tokens (usuario_id, token, expira_em) VALUES (?, ?, ?)`);
const stmtFindToken = db.prepare(`SELECT * FROM reset_tokens WHERE token = ? AND usado = 0 AND expira_em > ?`);
const stmtMarkTokenUsed = db.prepare(`UPDATE reset_tokens SET usado = 1 WHERE token = ?`);

module.exports = {
  db,
  stmtInsertUser,
  stmtFindByLogin,
  stmtFindByEmail,
  stmtFindById,
  stmtUpdateSenha,
  stmtUpsertSync,
  stmtGetSync,
  stmtInsertToken,
  stmtFindToken,
  stmtMarkTokenUsed,
  rowToUsuario,
};
