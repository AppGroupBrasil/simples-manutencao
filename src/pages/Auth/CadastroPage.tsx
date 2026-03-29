import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CadastroPage: React.FC = () => {
  const { registrar } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome]               = useState('');
  const [email, setEmail]             = useState('');
  const [senha, setSenha]             = useState('');
  const [confirmar, setConfirmar]     = useState('');
  const [erro, setErro]               = useState('');
  const [loading, setLoading]         = useState(false);
  const [planos, setPlanos]           = useState(false);

  const TRIAL_API = 'https://api.simplesmanutencao.com.br';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email.includes('@'))    { setErro('Informe um e-mail válido.'); return; }
    if (!/^\d{6}$/.test(senha)) { setErro('A senha deve ter exatamente 6 dígitos numéricos.'); return; }
    if (senha !== confirmar)     { setErro('As senhas não conferem.'); return; }
    setLoading(true);
    try {
      // Verifica se o IP já usou o período de teste
      try {
        const resp = await fetch(`${TRIAL_API}/trial/check`, { method: 'POST' });
        if (resp.ok) {
          const data = await resp.json();
          if (!data.permitido) {
            setErro('Você já utilizou o período de teste gratuito. Entre em contato com o suporte para contratar um plano.');
            setLoading(false);
            return;
          }
        }
      } catch {
        // API indisponível — permite o cadastro normalmente
      }

      await registrar({ nome: nome.trim(), email: email.trim(), senha });

      // Registra o IP após cadastro bem-sucedido
      try {
        await fetch(`${TRIAL_API}/trial/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
      } catch {
        // Falha silenciosa — não impede o usuário de usar o sistema
      }

      navigate('/manutencao');
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {/* Modal Planos */}
    {planos && (
      <div onClick={() => setPlanos(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
        <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:28, padding:'32px 28px', width:'100%', maxWidth:440, boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>

          <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:900, color:'#0D0D0D', textAlign:'center' }}>Nossos Planos</h2>
          <p style={{ margin:'0 0 24px', fontSize:13, color:'#71717a', textAlign:'center' }}>Escolha o plano ideal para sua empresa</p>

          {/* Individual */}
          <div style={{ border:'2px solid #e4e4e7', borderRadius:16, padding:'20px', marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:16, fontWeight:900, color:'#0D0D0D' }}>👤 Individual</span>
              <span style={{ fontSize:22, fontWeight:900, color:'#FF8F00' }}>R$ 99<span style={{ fontSize:13, fontWeight:600, color:'#9ca3af' }}>/mês</span></span>
            </div>
            <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.5 }}>Ideal para uso pessoal ou autônomos. Acesso completo para 1 usuário.</p>
          </div>

          {/* Empresa */}
          <div style={{ border:'2px solid #e4e4e7', borderRadius:16, padding:'20px', marginBottom:12 }}>
<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:16, fontWeight:900, color:'#0D0D0D' }}>🏢 Empresa</span>
              <span style={{ fontSize:22, fontWeight:900, color:'#FF8F00' }}>R$ 199<span style={{ fontSize:13, fontWeight:600, color:'#9ca3af' }}>/mês</span></span>
            </div>
            <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.5 }}>Até 5 usuários incluídos. Perfeito para pequenas e médias equipes.</p>
          </div>

          {/* Adicional */}
          <div style={{ border:'2px solid #e4e4e7', borderRadius:16, padding:'20px', marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:16, fontWeight:900, color:'#0D0D0D' }}>👥 Usuário Adicional</span>
              <span style={{ fontSize:22, fontWeight:900, color:'#FF8F00' }}>R$ 25<span style={{ fontSize:13, fontWeight:600, color:'#9ca3af' }}>/mês</span></span>
            </div>
            <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.5 }}>Para equipes acima de 5 usuários, cada usuário extra custa R$ 25/mês.</p>
          </div>

          <p style={{ textAlign:'center', margin:'0 0 20px', fontSize:13, color:'#6b7280' }}>
            Quer saber mais? Acesse{' '}
            <a href="https://www.simplesmanutencao.com.br" target="_blank" rel="noreferrer" style={{ color:'#FF8F00', fontWeight:800, textDecoration:'none' }}>
              www.simplesmanutencao.com.br
            </a>
          </p>

          <button
            onClick={() => setPlanos(false)}
            style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:14, fontSize:15, fontWeight:900, color:'#0D0D0D', cursor:'pointer', boxShadow:'0 4px 20px rgba(255,183,0,0.4)' }}
          >
            Fechar
          </button>
        </div>
      </div>
    )}

    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #FFD600 0%, #FF8F00 100%)',
      padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 28,
        padding: '40px 32px 32px', width: '100%', maxWidth: 400,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logos/logo.png" alt="Simples Manutenção" style={{ height: 72, objectFit: 'contain', marginBottom: 10, filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)' }} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0D0D0D', letterSpacing: '-0.5px' }}>
            Criar conta
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#71717a' }}>
            Sua manutenção do seu jeito.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nome */}
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            style={{
              width: '100%', padding: '15px 18px',
              border: '2px solid #e4e4e7', borderRadius: 14,
              fontSize: 15, outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', color: '#0D0D0D',
            }}
          />

          {/* E-mail (usado como login do administrador) */}
          <div>
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '15px 18px',
                border: '2px solid #e4e4e7', borderRadius: 14,
                fontSize: 15, outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', color: '#0D0D0D',
              }}
            />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#71717a', paddingLeft: 4 }}>
              Seu e-mail será usado para fazer login.
            </p>
          </div>

          {/* Senha */}
          <input
            type="password"
            placeholder="Senha (6 dígitos)"
            value={senha}
            onChange={e => setSenha(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            inputMode="numeric"
            style={{
              width: '100%', padding: '15px 18px',
              border: '2px solid #e4e4e7', borderRadius: 14,
              fontSize: 15, outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', color: '#0D0D0D',
            }}
          />

          {/* Confirmar senha */}
          <input
            type="password"
            placeholder="Confirme a senha"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            inputMode="numeric"
            style={{
              width: '100%', padding: '15px 18px',
              border: '2px solid #e4e4e7', borderRadius: 14,
              fontSize: 15, outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', color: '#0D0D0D',
            }}
          />

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
            {loading ? 'Criando conta...' : 'Criar minha conta'}
          </button>
        </form>

        {/* Botão planos */}
        <button
          type="button"
          onClick={() => setPlanos(true)}
          style={{ width:'100%', marginTop:16, padding:'14px', background:'#0D0D0D', border:'none', borderRadius:14, fontSize:14, fontWeight:800, color:'#FFD600', cursor:'pointer', letterSpacing:'0.3px' }}
        >
          Conheça nossos planos
        </button>

        {/* Link voltar */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#71717a' }}>
          Já tem uma conta?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#FF8F00', fontWeight: 800, cursor: 'pointer', fontSize: 13, padding: 0 }}
          >
            Entrar
          </button>
        </p>

      </div>
    </div>
    </>
  );
};

export default CadastroPage;
