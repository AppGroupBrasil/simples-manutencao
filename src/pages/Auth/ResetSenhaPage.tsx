import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiResetPassword } from '../../utils/api';

const ResetSenhaPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') || '';
    setToken(t);
    if (!t) setErro('Link inválido. Solicite novamente a recuperação de senha.');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (senha !== senha2) { setErro('As senhas não conferem.'); return; }
    setLoading(true);
    try {
      await apiResetPassword(token, senha);
      setOk(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setErro(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#1a1a1a,#0d0d0d)',
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ margin: 0, color: '#FF8F00', fontSize: 24, fontWeight: 900 }}>🔑 Redefinir Senha</h2>
        <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>Crie uma nova senha para sua conta.</p>

        {ok ? (
          <div style={{ marginTop: 24, padding: 16, background: '#e8f5e9', borderRadius: 10, color: '#2e7d32', fontWeight: 600 }}>
            ✅ Senha alterada com sucesso! Redirecionando para o login…
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 }}>Nova senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              disabled={!token || loading}
              autoComplete="new-password"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginTop: 14, marginBottom: 6 }}>Confirmar senha</label>
            <input
              type="password"
              value={senha2}
              onChange={e => setSenha2(e.target.value)}
              disabled={!token || loading}
              autoComplete="new-password"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }}
            />

            {erro && (
              <div style={{ marginTop: 14, padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 8, fontSize: 14 }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={!token || loading}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '14px 0',
                background: 'linear-gradient(135deg,#FFD600,#FF8F00)',
                color: '#0D0D0D',
                border: 'none',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 15,
                cursor: token && !loading ? 'pointer' : 'not-allowed',
                opacity: token && !loading ? 1 : 0.6,
              }}
            >
              {loading ? 'Salvando…' : 'Redefinir senha'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ marginTop: 12, width: '100%', padding: '10px 0', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetSenhaPage;
