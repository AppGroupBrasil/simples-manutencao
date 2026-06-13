// ─────────────────────────────────────────────────────────────────────────────
// SSO da central (App Condomínio) — login único.
// A central assina o token com a chave PRIVADA (RS256); aqui verificamos só pela
// chave PÚBLICA do JWKS — nada a vazar. O cadastro da central é a fonte única da
// verdade: a cada acesso regravamos (read-only) o usuário. Fluxo: o hub redireciona
// para o front ${site}/sso?token=<JWT> → a SPA faz POST /sso { token } aqui →
// verifica RS256/JWKS → JIT upsert → devolve { token, usuario } → SPA guarda e
// navega para /manutencao. O id local do usuário É o sub (UUID) da central.
// ─────────────────────────────────────────────────────────────────────────────
const { Router } = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db, stmtFindById, stmtFindByEmail, stmtInsertUser, rowToUsuario } = require('./db');

const router = Router();
const ISS = 'auth-central';
const AUDIENCE = process.env.SSO_AUDIENCE || 'simples-manutencao';
const JWKS_URL = process.env.SSO_JWKS_URL || 'https://auth.appgroupbrasil.com.br/api/v1/sso/jwks.json';

let jwksCache = null;
let jwksCacheAt = 0;
const JWKS_TTL = 5 * 60 * 1000;

async function carregarJwks() {
  if (jwksCache && Date.now() - jwksCacheAt < JWKS_TTL) return jwksCache;
  const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`JWKS ${res.status}`);
  const body = await res.json();
  const pems = new Map();
  for (const k of body.keys || []) {
    if (k.kty !== 'RSA') continue;
    const pem = crypto.createPublicKey({ key: k, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
    pems.set(k.kid || 'default', pem);
  }
  jwksCache = pems;
  jwksCacheAt = Date.now();
  return pems;
}

function lerKid(token) {
  try {
    const head = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
    return head.kid || null;
  } catch { return null; }
}

async function verificarSso(token) {
  const pems = await carregarJwks();
  const kid = lerKid(token);
  const candidatos = kid && pems.has(kid) ? [pems.get(kid)] : [...pems.values()];
  if (candidatos.length === 0) throw new Error('JWKS sem chave RSA');
  let ultimoErro;
  for (const pem of candidatos) {
    try {
      return jwt.verify(token, pem, { algorithms: ['RS256'], issuer: ISS, audience: AUDIENCE });
    } catch (e) { ultimoErro = e; }
  }
  throw ultimoErro || new Error('assinatura inválida');
}

// central perfil → role do Simples Manutenção
function mapRole(perfil) {
  switch ((perfil || '').toLowerCase()) {
    case 'master':
    case 'superadmin':
      return 'master';
    case 'admin':
    case 'administrador':
    case 'administradora':
    case 'gestor':
    case 'sindico':
    case 'síndico':
      return 'administrador';
    case 'supervisor':
      return 'supervisor';
    default:
      return 'funcionario';
  }
}

/** Upsert read-only do usuário pelos claims da central. O id local É o sub da central. */
function provisionarUsuario(c) {
  const role = mapRole(c.perfil);
  const email = (c.email || '').toLowerCase().trim();
  const nome = c.nome || email || 'Usuário';
  const agora = Date.now();

  let row = stmtFindById.get(c.sub);
  if (!row && email) {
    const porEmail = stmtFindByEmail.get(email);
    if (porEmail) {
      // vincula o id central ao usuário existente por email (id é TEXT)
      db.prepare('UPDATE usuarios SET id=?, nome=?, email=?, login=?, role=?, bloqueado=0, atualizado_em=? WHERE id=?')
        .run(c.sub, nome, email, email, role, agora, porEmail.id);
      row = stmtFindById.get(c.sub);
    }
  }

  if (row) {
    db.prepare('UPDATE usuarios SET nome=?, email=?, login=?, role=?, bloqueado=0, atualizado_em=? WHERE id=?')
      .run(nome, email, email || row.login, role, agora, c.sub);
  } else {
    stmtInsertUser.run({
      id: c.sub,
      nome,
      login: email || c.sub,
      email: email || null,
      senha: '!sso!',
      role,
      cargo: null,
      adminId: null,
      supervisorId: null,
      administradorId: null,
      bloqueado: 0,
      plano: null,
      cadastradoEm: agora,
    });
  }
  return rowToUsuario(stmtFindById.get(c.sub));
}

// POST /sso { token } → { ok, usuario, token }
router.post('/', async (req, res) => {
  const token = String((req.body && req.body.token) || '');
  if (!token) return res.status(400).json({ error: 'Token ausente' });
  try {
    const claims = await verificarSso(token);
    const usuario = provisionarUsuario(claims);
    const { senha: _, ...safe } = usuario;
    res.json({ ok: true, usuario: safe, token: usuario.id });
  } catch (err) {
    console.error('[SSO] falha:', (err && err.message) || err);
    res.status(401).json({ error: 'SSO inválido' });
  }
});

module.exports = router;
