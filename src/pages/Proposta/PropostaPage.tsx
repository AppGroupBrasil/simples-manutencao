import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, ArrowRight, Zap, Shield,
  Smartphone, BarChart3, Users, Clock, Star, FileText,
} from 'lucide-react';

/* ─── dados ─────────────────────────────────────────────── */
const PLANOS = [
  {
    nome: 'Individual',
    preco: 'R$ 99',
    periodo: '/mês',
    descricao: 'Ideal para uso pessoal ou autônomos.',
    detalhe: 'Acesso completo para 1 usuário.',
    destaque: false,
    cor: 'linear-gradient(135deg,#FFD600,#FF8F00)',
    corIcone: '#0D0D0D',
    items: ['1 usuário incluído','Chamados ilimitados','Checklists ilimitados','Relatórios em PDF','Acesso mobile (Android/iOS)','Suporte via WhatsApp'],
  },
  {
    nome: 'Empresa',
    preco: 'R$ 199',
    periodo: '/mês',
    descricao: 'Perfeito para pequenas e médias equipes.',
    detalhe: 'Até 5 usuários incluídos.',
    destaque: true,
    cor: 'linear-gradient(135deg,#0ea5e9,#0369a1)',
    corIcone: '#fff',
    items: ['Até 5 usuários incluídos','Chamados ilimitados','Checklists ilimitados','Relatórios em PDF','Acesso mobile (Android/iOS)','Painel de gestão completo','Suporte prioritário via WhatsApp'],
  },
  {
    nome: 'Usuário Adicional',
    preco: 'R$ 25',
    periodo: '/mês por usuário',
    descricao: 'Para equipes acima de 5 usuários.',
    detalhe: 'Cada usuário extra custa R$ 25/mês.',
    destaque: false,
    cor: 'linear-gradient(135deg,#a855f7,#7c3aed)',
    corIcone: '#fff',
    items: ['Adicione quantos precisar','Mesmo acesso do plano Empresa','Cobrado por usuário ativo','Ative e desative quando quiser'],
  },
];

const DIFERENCIAIS = [
  { icone: <Zap size={22} color="#FFD600" />, titulo: 'Implantação imediata', desc: 'Acesso em minutos, sem instalação. Funciona direto no navegador ou como app.' },
  { icone: <Smartphone size={22} color="#FFD600" />, titulo: '100% mobile', desc: 'Android e iOS nativos com Capacitor. Sua equipe usa no celular, em campo.' },
  { icone: <Shield size={22} color="#FFD600" />, titulo: 'Dados protegidos', desc: 'Segurança e sigilo em conformidade com a LGPD. Seus dados são seus.' },
  { icone: <BarChart3 size={22} color="#FFD600" />, titulo: 'Relatórios automáticos', desc: 'PDF completo de cada chamado com fotos, tempo e histórico de ações.' },
  { icone: <Clock size={22} color="#FFD600" />, titulo: 'Disponível 24/7', desc: 'Sistema online o tempo todo. Sem interrupções, sem surpresas.' },
  { icone: <Users size={22} color="#FFD600" />, titulo: 'Suporte humanizado', desc: 'Atendimento real pelo WhatsApp em horário comercial, sem bots.' },
];

/* ─── componente ─────────────────────────────────────────── */
const PropostaPage: React.FC = () => {
  const navigate = useNavigate();
  const hoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color: '#18181b', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #27272a', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{ background: '#27272a', border: 'none', borderRadius: 8, color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: 13, fontWeight: 600 }}>
            <ChevronLeft size={15} /> Voltar
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}><img src="/logos/logo.png" alt="Logo" style={{ height: 22, objectFit: 'contain', filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)' }} /> Simples <strong style={{ color: '#FFD600' }}>Manutenção</strong></span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/contrato')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', border: '1px solid #3f3f46', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#a1a1aa' }}>
            <FileText size={14} /> Ver contrato
          </button>
          <button onClick={() => navigate('/cadastro')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#FFD600,#FF8F00)', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer', color: '#0D0D0D' }}>
            Contratar agora <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* ── CAPA ── */}
      <section style={{ background: '#0D0D0D', padding: '80px 32px 96px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,214,0,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,214,0,0.12)', color: '#FFD600', border: '1px solid rgba(255,214,0,0.25)', borderRadius: 99, padding: '6px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 28 }}>
            <Zap size={12} /> Proposta Comercial — {hoje}
          </div>
          <h1 style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 900, color: '#fff', margin: '0 0 20px', letterSpacing: '-2px', lineHeight: 1.1 }}>
            Simplifique sua manutenção.<br />
            <span style={{ color: '#FFD600' }}>Contrate hoje.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#a1a1aa', margin: '0 0 40px', lineHeight: 1.7, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
            Um sistema completo de gestão de manutenção predial para a sua equipe — sem instalação, sem complicação, acessível de qualquer dispositivo.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/cadastro')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 32px', background: 'linear-gradient(135deg,#FFD600,#FF8F00)', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: 'pointer', color: '#0D0D0D', boxShadow: '0 8px 32px rgba(255,183,0,0.35)' }}>
              Começar agora <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/contrato')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 32px', background: 'transparent', border: '2px solid #3f3f46', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
              Ver contrato
            </button>
          </div>
        </div>
      </section>

      {/* ── SOBRE A EMPRESA ── */}
      <section style={{ background: '#18181b', padding: '72px 32px', borderBottom: '1px solid #27272a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>Sobre a empresa</p>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-1px' }}>APP GROUP LTDA - ME</h2>
            <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.8, margin: 0 }}>
              Empresa especializada em desenvolvimento de software SaaS para gestão operacional. Fundada em 2023, em São Paulo, com foco em soluções simples e eficientes para equipes de manutenção.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'CNPJ', valor: '51.797.070/0001-53' },
              { label: 'Fundação', valor: '14/08/2023' },
              { label: 'Cidade', valor: 'São Paulo — SP' },
              { label: 'Segmento', valor: 'Software SaaS' },
            ].map(({ label, valor }) => (
              <div key={label} style={{ background: '#0D0D0D', borderRadius: 12, padding: '16px 18px', border: '1px solid #27272a' }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#52525b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 14, color: '#d4d4d8', fontWeight: 600 }}>{valor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── O PROBLEMA ── */}
      <section style={{ background: '#0D0D0D', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>O problema</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-1px' }}>
            Manutenção desorganizada custa caro
          </h2>
          <p style={{ fontSize: 16, color: '#71717a', margin: '0 auto 56px', maxWidth: 600, lineHeight: 1.8 }}>
            Planilhas, papel, ligações e mensagens avulsas no WhatsApp geram retrabalho, falhas no histórico e perda de controle sobre a equipe.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              { emoji: '📋', text: 'Chamados perdidos sem registro' },
              { emoji: '⏱️', text: 'Sem controle de tempo por serviço' },
              { emoji: '📂', text: 'Histórico difícil de consultar' },
              { emoji: '👥', text: 'Equipe sem visibilidade das tarefas' },
            ].map(({ emoji, text }) => (
              <div key={text} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
                <p style={{ margin: 0, fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A SOLUÇÃO ── */}
      <section style={{ background: 'linear-gradient(135deg,#FFD600 0%,#FF8F00 100%)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(13,13,13,0.6)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>A solução</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0D0D0D', margin: '0 0 16px', letterSpacing: '-1px' }}>
            Simples Manutenção resolve isso tudo
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(13,13,13,0.75)', margin: '0 auto 52px', maxWidth: 560, lineHeight: 1.8 }}>
            Um sistema completo, acessível no celular e no computador, para registrar, acompanhar e concluir manutenções com eficiência.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {[
              { emoji: '✅', titulo: 'Chamados organizados', desc: 'Registro completo com foto, descrição, responsável e status em tempo real.' },
              { emoji: '📱', titulo: 'App mobile', desc: 'Android e iOS. Sua equipe usa no celular, em campo, sem precisar de computador.' },
              { emoji: '📊', titulo: 'Relatórios PDF', desc: 'Gere e compartilhe relatórios de chamados com um toque.' },
              { emoji: '🔔', titulo: 'Notificações', desc: 'Alertas automáticos de abertura, andamento e conclusão para toda a equipe.' },
            ].map(({ emoji, titulo, desc }) => (
              <div key={titulo} style={{ background: 'rgba(13,13,13,0.1)', borderRadius: 16, padding: '28px 20px', textAlign: 'left', border: '1px solid rgba(13,13,13,0.12)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{emoji}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0D0D0D', margin: '0 0 8px' }}>{titulo}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(13,13,13,0.7)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAIS ── */}
      <section style={{ background: '#18181b', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>Por que escolher</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-1px' }}>Nossos diferenciais</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {DIFERENCIAIS.map(({ icone, titulo, desc }) => (
              <div key={titulo} style={{ display: 'flex', gap: 16, background: '#0D0D0D', borderRadius: 16, padding: '24px 20px', border: '1px solid #27272a' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,214,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icone}</div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{titulo}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section style={{ background: '#0D0D0D', padding: '80px 32px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>Investimento</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-1px' }}>Planos e preços</h2>
            <p style={{ fontSize: 16, color: '#71717a', margin: 0 }}>Sem taxa de adesão. Cancele quando quiser.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {PLANOS.map((plano) => (
              <div key={plano.nome} style={{ background: '#18181b', border: plano.destaque ? '2px solid #FFD600' : '1px solid #27272a', borderRadius: 24, padding: '32px 28px', position: 'relative', boxShadow: plano.destaque ? '0 0 48px rgba(255,214,0,0.1)' : 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plano.destaque && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#FFD600', color: '#0D0D0D', borderRadius: 99, padding: '4px 16px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>⭐ Mais popular</div>
                )}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: plano.cor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} color={plano.corIcone} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{plano.nome}</h3>
                <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>{plano.descricao}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>{plano.preco}</span>
                  <span style={{ fontSize: 13, color: '#71717a' }}>{plano.periodo}</span>
                </div>
                <p style={{ fontSize: 13, color: '#a1a1aa', margin: 0 }}>{plano.detalhe}</p>
                <button onClick={() => navigate('/cadastro')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: plano.destaque ? 'linear-gradient(135deg,#FFD600,#FF8F00)' : '#27272a', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', color: plano.destaque ? '#0D0D0D' : '#fff', margin: '8px 0' }}>
                  Contratar <ArrowRight size={15} />
                </button>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plano.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#d4d4d8' }}>
                      <CheckCircle2 size={14} color="#FFD600" style={{ flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section style={{ background: '#18181b', padding: '80px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={22} fill="#FFD600" color="#FFD600" />)}
          </div>
          <blockquote style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontStyle: 'italic', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            "Organizar nossa equipe de manutenção ficou muito mais simples. Tudo em um lugar só, no celular mesmo."
          </blockquote>
          <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>— Gestor de Manutenção, Condomínio Residencial</p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background: 'linear-gradient(135deg,#0D0D0D 0%,#1a1a1a 100%)', padding: '96px 32px', textAlign: 'center', borderTop: '1px solid #27272a' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <img src="/logos/logo.png" alt="Simples Manutenção" style={{ height: 64, objectFit: 'contain', marginBottom: 20, filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)' }} />
          <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-1px' }}>
            Pronto para começar?
          </h2>
          <p style={{ fontSize: 17, color: '#71717a', margin: '0 0 40px', lineHeight: 1.8 }}>
            Sem taxa de adesão, sem instalação. Acesse agora e experimente grátis.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <button onClick={() => navigate('/cadastro')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 36px', background: 'linear-gradient(135deg,#FFD600,#FF8F00)', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: 'pointer', color: '#0D0D0D', boxShadow: '0 8px 32px rgba(255,183,0,0.3)' }}>
              Criar conta grátis <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/contrato')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 36px', background: 'transparent', border: '2px solid #3f3f46', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
              <FileText size={16} /> Ver contrato
            </button>
          </div>
          <p style={{ color: '#52525b', fontSize: 13 }}>
            Dúvidas?{' '}
            <a href="https://wa.me/5511933284364" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>
              Fale pelo WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* ── RODAPÉ ── */}
      <footer style={{ background: '#0D0D0D', borderTop: '1px solid #27272a', padding: '28px 32px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#52525b' }}>
          © {new Date().getFullYear()} APP GROUP LTDA - ME · CNPJ 51.797.070/0001-53 · Av. Paulista, 1106 — São Paulo/SP
        </p>
      </footer>

    </div>
  );
};

export default PropostaPage;
