const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'https://api.simplesmanutencao.com.br';

const TOKEN_KEY = 'sm_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers ? (opts.headers as Record<string, string>) : {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na API');
  return data;
}

// ── Auth ───────────────────────────────────────────────────
export async function apiLogin(login: string, senha: string) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, senha }),
  });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiRegister(nome: string, email: string, senha: string) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha }),
  });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiForgotPassword(email: string) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(token: string, novaSenha: string) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, novaSenha }),
  });
}

export async function apiCreateUser(dados: { nome: string; cargo?: string; senha: string; role?: string }) {
  return apiFetch('/auth/create-user', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function apiDeleteUser(id: string) {
  return apiFetch(`/auth/user/${id}`, { method: 'DELETE' });
}

export async function apiListUsers() {
  return apiFetch('/auth/users');
}

// ── Sync ───────────────────────────────────────────────────
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

export async function syncUpload(): Promise<boolean> {
  if (!getToken()) return false;
  try {
    const dados: Record<string, string> = {};
    for (const key of SYNC_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) dados[key] = val;
    }
    if (Object.keys(dados).length === 0) return true;
    await apiFetch('/sync/upload', {
      method: 'POST',
      body: JSON.stringify({ dados }),
    });
    localStorage.setItem('sm_last_sync', String(Date.now()));
    return true;
  } catch (err) {
    console.warn('[Sync] Upload falhou:', err);
    return false;
  }
}

export async function syncDownload(): Promise<boolean> {
  if (!getToken()) return false;
  try {
    const { dados } = await apiFetch('/sync/download');
    if (!dados) return true;
    for (const [key, val] of Object.entries(dados)) {
      if (typeof val === 'string') {
        localStorage.setItem(key, val);
      }
    }
    localStorage.setItem('sm_last_sync', String(Date.now()));
    return true;
  } catch (err) {
    console.warn('[Sync] Download falhou:', err);
    return false;
  }
}

// Auto-sync: upload every 60 seconds if logged in
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync() {
  if (syncInterval) return;
  syncInterval = setInterval(() => {
    if (getToken()) syncUpload();
  }, 60_000);
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
