import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../../utils/api';

const API_URL = 'https://api.simplesmanutencao.com.br';
const SESSION_KEY = 'sm_session_v2';

// Recebe ?token=<JWT da central>, troca por sessão local e entra direto.
const SsoPage: React.FC = () => {
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setErro(true); return; }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/sso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data.usuario) throw new Error(data.error || 'SSO inválido');
        setToken(data.token);
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.usuario));
        window.location.replace('/manutencao');
      } catch {
        setErro(true);
      }
    })();
  }, []);

  if (erro) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'system-ui' }}>
        <p>Não foi possível entrar pelo login único.</p>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#FFD600', cursor: 'pointer' }}>Ir para o login</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #eee', borderTop: '3px solid #FFD600', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
};

export default SsoPage;
