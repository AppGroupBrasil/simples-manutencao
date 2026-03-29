import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';



const WPP_NUMERO = '5511933284364';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginStr, setLoginStr] = useState('');
  const [senha, setSenha]       = useState('');
  const [erro, setErro]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [dicaLoginVisivel, setDicaLoginVisivel] = useState(false);
  const [dicaSenhaVisivel, setDicaSenhaVisivel] = useState(false);
  const dicaRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(loginStr, senha);
      const redirect = sessionStorage.getItem('sm_redirect');
      sessionStorage.removeItem('sm_redirect');
      navigate(redirect || '/manutencao');
    } catch (err: any) {
      setErro(err.message || 'Login ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const abrirCadastro = () => navigate('/cadastro');

  const abrirSuporte = () => {
    const texto = 'Olá! Preciso de ajuda com o Simples Manutenção.';
    window.open(`https://wa.me/${WPP_NUMERO}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FFD600 0%, #FF8F00 100%)',
      padding: 16,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 28,
        padding: '40px 32px 32px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logos/logo.png" alt="Simples Manutenção" style={{ height: 108, objectFit: 'contain', marginBottom: 10, filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)' }} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0D0D0D', letterSpacing: '-0.5px' }}>
            Simples Manutenção
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#71717a' }}>
            Sua manutenção do seu jeito.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Login"
              value={loginStr}
              onChange={e => setLoginStr(e.target.value.toLowerCase().replace(/\s/g, ''))}
              required
              autoComplete="username"
              style={{
                width: '100%', padding: '15px 46px 15px 18px',
                border: '2px solid #e4e4e7', borderRadius: 14,
                fontSize: 15, outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', color: '#0D0D0D',
              }}
            />
            {/* Interrogação */}
            <button
              type="button"
              onClick={() => setDicaLoginVisivel(v => !v)}
              onBlur={() => setTimeout(() => setDicaLoginVisivel(false), 150)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                width: 22, height: 22, borderRadius: '50%',
                background: '#e4e4e7', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 900, color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ?
            </button>
            {/* Balão */}
            {dicaLoginVisivel && (
              <div ref={dicaRef} style={{
                position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                background: '#0D0D0D', color: '#fff',
                fontSize: 12, fontWeight: 600, lineHeight: 1.5,
                padding: '10px 14px', borderRadius: 10,
                whiteSpace: 'nowrap', zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                Seu login é o seu nome sem acentos ou espaços.
                {/* Seta do balão */}
                <div style={{
                  position: 'absolute', top: -6, right: 18,
                  width: 12, height: 12,
                  background: '#0D0D0D',
                  transform: 'rotate(45deg)',
                  borderRadius: 2,
                }} />
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%', padding: '15px 46px 15px 18px',
                border: '2px solid #e4e4e7', borderRadius: 14,
                fontSize: 15, outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', color: '#0D0D0D',
              }}
            />
            <button
              type="button"
              onClick={() => setDicaSenhaVisivel(v => !v)}
              onBlur={() => setTimeout(() => setDicaSenhaVisivel(false), 150)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                width: 22, height: 22, borderRadius: '50%',
                background: '#e4e4e7', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 900, color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ?
            </button>
            {dicaSenhaVisivel && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                background: '#0D0D0D', color: '#fff',
                fontSize: 12, fontWeight: 600, lineHeight: 1.5,
                padding: '10px 14px', borderRadius: 10,
                whiteSpace: 'nowrap', zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                Sua senha é numérica com 6 dígitos.
                <div style={{
                  position: 'absolute', top: -6, right: 18,
                  width: 12, height: 12,
                  background: '#0D0D0D',
                  transform: 'rotate(45deg)',
                  borderRadius: 2,
                }} />
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', marginTop: -6 }}>
            <button
              type="button"
              onClick={() => window.open(`https://wa.me/${WPP_NUMERO}?text=${encodeURIComponent('Olá! Esqueci minha senha do Simples Manutenção, pode me ajudar?')}`, '_blank')}
              style={{ background: 'none', border: 'none', fontSize: 13, color: '#FF8F00', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Esqueceu a senha?
            </button>
          </div>

          {erro && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: 10, padding: '10px 14px',
              color: '#b91c1c', fontSize: 13, fontWeight: 600,
            }}>
              ⚠️ {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px', marginTop: 4,
              background: 'linear-gradient(135deg, #FFD600, #FF8F00)',
              border: 'none', borderRadius: 14,
              fontSize: 16, fontWeight: 900, color: '#0D0D0D',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(255,183,0,0.4)',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e4e4e7' }} />
          <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#e4e4e7' }} />
        </div>

        {/* Botão cadastro */}
        <button
          onClick={abrirCadastro}
          style={{
            width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, #FFD600, #FF8F00)', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 900, color: '#0D0D0D',
            cursor: 'pointer', letterSpacing: '0.3px',
            boxShadow: '0 4px 20px rgba(255,183,0,0.4)',
          }}
        >
          CADASTRE-SE<br />EXPERIMENTE GRÁTIS!
        </button>

        {/* Botão suporte WhatsApp */}
        <button
          onClick={abrirSuporte}
          style={{
            width: '100%', marginTop: 12, padding: '14px',
            background: '#25D366', border: 'none', borderRadius: 14,
            fontSize: 14, fontWeight: 800, color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Suporte via WhatsApp
        </button>

        {/* Botão conheça o sistema */}
        <a
          href="https://simplesmanutencao.com.br"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', marginTop: 12, padding: '14px',
            background: 'linear-gradient(135deg, #FFD600, #FF8F00)',
            border: 'none', borderRadius: 14,
            fontSize: 14, fontWeight: 800, color: '#0D0D0D',
            cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box',
            boxShadow: '0 4px 20px rgba(255,183,0,0.4)',
          }}
        >
          <span style={{ fontSize: 18 }}>🔍</span> Conheça o sistema
        </a>

      </div>
    </div>
  );
};

export default LoginPage;
