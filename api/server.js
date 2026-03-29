const express = require('express');
const fs      = require('fs');
const path    = require('path');
const cors    = require('cors');

const app        = express();
const PORT       = process.env.PORT       || 3001;
const API_KEY    = process.env.API_KEY    || 'simples-api-key-2024';
const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || '7', 10);
const DATA_FILE  = process.env.DATA_FILE  || '/data/trial-ips.json';

app.use(express.json());
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

// ── helpers ────────────────────────────────────────────────
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

// ── POST /trial/check ──────────────────────────────────────
// Verifica se o IP pode se cadastrar (não usou trial ainda)
app.post('/trial/check', (req, res) => {
  const ip   = getIP(req);
  const data = loadData();
  const record = data.ips.find(r => r.ip === ip);

  if (!record) {
    return res.json({ permitido: true });
  }

  if (record.bloqueado) {
    return res.json({ permitido: false, motivo: 'bloqueado' });
  }

  const expirado = (Date.now() - record.registradoEm) > trialMs();
  if (expirado) {
    return res.json({ permitido: false, motivo: 'trial_expirado' });
  }

  return res.json({ permitido: true, trialAtivo: true });
});

// ── POST /trial/register ───────────────────────────────────
// Registra o IP após cadastro bem-sucedido
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

  data.ips.push({
    ip,
    emails:       email ? [email] : [],
    registradoEm: Date.now(),
    bloqueado:    false,
  });
  saveData(data);
  res.json({ ok: true });
});

// ── GET /trial/list ────────────────────────────────────────
// Lista todos os IPs registrados (requer chave)
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

// ── DELETE /trial/unblock ──────────────────────────────────
// Remove o IP da lista (reset completo do trial)
app.delete('/trial/unblock', requireKey, (req, res) => {
  const ip   = req.body?.ip;
  const data = loadData();

  if (!data.ips.find(r => r.ip === ip)) {
    return res.status(404).json({ error: 'IP não encontrado' });
  }

  data.ips = data.ips.filter(r => r.ip !== ip);
  saveData(data);
  res.json({ ok: true });
});

// ── POST /trial/block ──────────────────────────────────────
// Bloqueia um IP manualmente
app.post('/trial/block', requireKey, (req, res) => {
  const ip   = req.body?.ip;
  const data = loadData();
  const rec  = data.ips.find(r => r.ip === ip);

  if (rec) {
    rec.bloqueado = true;
  } else {
    data.ips.push({ ip, emails: [], registradoEm: Date.now(), bloqueado: true });
  }

  saveData(data);
  res.json({ ok: true });
});

// ── GET /health ────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, trialDias: TRIAL_DAYS }));

app.listen(PORT, () => console.log(`✅ Trial API rodando na porta ${PORT}`));
