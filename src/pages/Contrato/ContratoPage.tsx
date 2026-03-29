import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Printer, Share2, CheckCircle2 } from 'lucide-react';

const PLANOS = [
  { label: 'Individual — R$ 99/mês', valor: 'R$ 99,00 (noventa e nove reais)', usuarios: '1 usuário', vencimento: '10' },
  { label: 'Empresa — R$ 199/mês', valor: 'R$ 199,00 (cento e noventa e nove reais)', usuarios: 'até 5 usuários', vencimento: '10' },
];

interface Contratante {
  razaoSocial: string;
  cnpjCpf: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  representante: string;
  cpfRepresentante: string;
  email: string;
  telefone: string;
  local: string;
  data: string;
}

const campo = (
  label: string,
  value: string,
  onChange: (v: string) => void,
  placeholder = '',
  width = '100%',
) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </label>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '10px 14px', border: '2px solid #e4e4e7', borderRadius: 10,
        fontSize: 14, fontFamily: 'inherit', color: '#18181b', outline: 'none',
        background: '#fafafa', width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => (e.target.style.borderColor = '#FFD600')}
      onBlur={e => (e.target.style.borderColor = '#e4e4e7')}
    />
  </div>
);

const ContratoPage: React.FC = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [planoIdx, setPlanoIdx] = useState(1);
  const [usuariosAdicionais, setUsuariosAdicionais] = useState(0);
  const plano = PLANOS[planoIdx];

  const valorBase = planoIdx === 0 ? 99 : 199;
  const valorAdicionais = planoIdx === 1 ? usuariosAdicionais * 25 : 0;
  const valorTotal = valorBase + valorAdicionais;
  const totalPorExtenso = valorTotal === 99 ? 'noventa e nove reais'
    : valorTotal === 199 ? 'cento e noventa e nove reais'
    : `${valorTotal} reais`;
  const totalFormatado = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const [c, setC] = useState<Contratante>({
    razaoSocial: '', cnpjCpf: '', endereco: '', bairro: '',
    cidade: '', uf: 'SP', cep: '', representante: '',
    cpfRepresentante: '', email: '', telefone: '',
    local: 'São Paulo', data: '',
  });
  const set = (k: keyof Contratante) => (v: string) => setC(prev => ({ ...prev, [k]: v }));

  const handlePrint = () => window.print();

  const handleShare = () => {
    const texto = `Contrato Simples Manutenção — ${plano.label}\nAcesse: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: 'Contrato Simples Manutenção', text: texto, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  const hoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          input { border: none !important; background: transparent !important; padding: 0 !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f4f4f5', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

        {/* Header */}
        <div className="no-print" style={{ background: '#fff', borderBottom: '1px solid #e4e4e7', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{ background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
              <ChevronLeft size={16} /> Voltar
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#18181b' }}>Contrato de Prestação de Serviços</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#18181b' }}>
              <Share2 size={15} /> Compartilhar
            </button>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0D0D0D', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#FFD600' }}>
              <Printer size={15} /> Imprimir
            </button>
          </div>
        </div>

        {/* Seletor de plano */}
        <div className="no-print" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 0' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#71717a', marginBottom: 10 }}>Selecione o plano:</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {PLANOS.map((p, i) => (
              <button key={i} onClick={() => setPlanoIdx(i)} style={{
                padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                border: planoIdx === i ? '2px solid #FFD600' : '2px solid #e4e4e7',
                background: planoIdx === i ? '#fffbeb' : '#fff',
                color: planoIdx === i ? '#0D0D0D' : '#71717a',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {planoIdx === i && <CheckCircle2 size={15} color="#FF8F00" />}
                {p.label}
              </button>
            ))}
          </div>

          {/* Usuários adicionais — só no plano Empresa */}
          {planoIdx === 1 && (
            <div style={{ marginTop: 20, padding: '20px 24px', background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#18181b', margin: 0 }}>
                  Usuários adicionais <span style={{ color: '#a1a1aa', fontWeight: 500 }}>(opcional — acima de 5 usuários)</span>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setUsuariosAdicionais(v => Math.max(0, v - 1))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '2px solid #e4e4e7', background: '#f4f4f5', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#18181b' }}
                  >−</button>
                  <span style={{ fontSize: 20, fontWeight: 900, minWidth: 32, textAlign: 'center', color: '#0D0D0D' }}>{usuariosAdicionais}</span>
                  <button
                    onClick={() => setUsuariosAdicionais(v => v + 1)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '2px solid #FFD600', background: '#fffbeb', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D0D0D' }}
                  >+</button>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#52525b' }}>
                  <span>Plano Empresa: <strong style={{ color: '#18181b' }}>R$ 199,00</strong></span>
                  <span>+ {usuariosAdicionais} usuário{usuariosAdicionais !== 1 ? 's' : ''} × R$ 25,00: <strong style={{ color: '#18181b' }}>R$ {valorAdicionais.toFixed(2).replace('.', ',')}</strong></span>
                  <span style={{ padding: '2px 12px', background: '#0D0D0D', color: '#FFD600', borderRadius: 8, fontWeight: 900, fontSize: 14 }}>
                    Total: {totalFormatado}/mês
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contrato */}
        <div ref={printRef} className="print-area" style={{ maxWidth: 860, margin: '24px auto', background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', padding: '56px 64px', color: '#18181b' }}>

          {/* Título */}
          <div style={{ textAlign: 'center', marginBottom: 40, borderBottom: '2px solid #0D0D0D', paddingBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>APP GROUP LTDA - ME</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.5px', color: '#0D0D0D' }}>
              CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SOFTWARE (SaaS)
            </h1>
            <div style={{ display: 'inline-block', background: '#fffbeb', border: '1px solid #FFD600', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: '#0D0D0D' }}>
              Plano selecionado: {plano.label}
              {planoIdx === 1 && usuariosAdicionais > 0 && (
                <span style={{ marginLeft: 8, color: '#FF8F00' }}>
                  + {usuariosAdicionais} usuário{usuariosAdicionais !== 1 ? 's' : ''} adicional{usuariosAdicionais !== 1 ? 'is' : ''} — Total: {totalFormatado}/mês
                </span>
              )}
            </div>
          </div>

          {/* CONTRATADA */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={tituloSecao}>CONTRATADA</h2>
            <div style={blocoInfo}>
              <InfoRow label="Razão Social" valor="APP GROUP LTDA - ME" />
              <InfoRow label="Nome Fantasia" valor="APP GROUP" />
              <InfoRow label="CNPJ" valor="51.797.070/0001-53" />
              <InfoRow label="Endereço" valor="Av. Paulista, 1106, Sala 01 — Bela Vista, São Paulo/SP — CEP 01310-914" />
              <InfoRow label="CNAE" valor="Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet" />
              <InfoRow label="Data de Fundação" valor="14/08/2023" />
            </div>
          </div>

          {/* CONTRATANTE */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={tituloSecao}>CONTRATANTE</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {campo('Razão Social / Nome Completo', c.razaoSocial, set('razaoSocial'), 'Digite aqui...')}
                {campo('CNPJ / CPF', c.cnpjCpf, set('cnpjCpf'), '00.000.000/0000-00')}
              </div>
              {campo('Endereço', c.endereco, set('endereco'), 'Rua, número, complemento')}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: 16 }}>
                {campo('Bairro', c.bairro, set('bairro'), 'Bairro')}
                {campo('Cidade', c.cidade, set('cidade'), 'Cidade')}
                {campo('UF', c.uf, set('uf'), 'SP')}
                {campo('CEP', c.cep, set('cep'), '00000-000')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {campo('Representante Legal', c.representante, set('representante'), 'Nome completo')}
                {campo('CPF do Representante', c.cpfRepresentante, set('cpfRepresentante'), '000.000.000-00')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {campo('E-mail', c.email, set('email'), 'email@empresa.com.br')}
                {campo('Telefone', c.telefone, set('telefone'), '(00) 00000-0000')}
              </div>
            </div>
          </div>

          {/* Cláusulas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <Clausula numero="1ª" titulo="DO OBJETO">
              O presente contrato tem por objeto a prestação de serviços de software na modalidade SaaS (Software as a Service), denominado <strong>Simples Manutenção</strong>, sistema de manutenção predial e gestão de serviços, disponibilizado pela CONTRATADA à CONTRATANTE por meio da internet (<strong>www.simplesmanutencao.com.br</strong>).
            </Clausula>

            <Clausula numero="2ª" titulo="DO PLANO E VALOR">
              A CONTRATANTE adere ao plano de <strong>{plano.usuarios}</strong>, pelo valor mensal de{' '}
              {planoIdx === 1 && usuariosAdicionais > 0 ? (
                <>
                  <strong>R$ 199,00</strong> referente ao plano Empresa, acrescido de{' '}
                  <strong>R$ {valorAdicionais.toFixed(2).replace('.', ',')} </strong>
                  ({usuariosAdicionais} usuário{usuariosAdicionais !== 1 ? 's' : ''} adicional{usuariosAdicionais !== 1 ? 'is' : ''} × R$ 25,00), totalizando{' '}
                  <strong>{totalFormatado} ({totalPorExtenso})</strong> por mês,
                </>
              ) : (
                <strong>{plano.valor}</strong>
              )}{' '}
              com vencimento todo dia <strong>{plano.vencimento}</strong> de cada mês.
            </Clausula>

            <Clausula numero="3ª" titulo="DA VIGÊNCIA">
              O presente contrato terá vigência de 12 (doze) meses, contados a partir da data de assinatura, renovando-se automaticamente por igual período, salvo manifestação contrária de qualquer das partes com antecedência mínima de 30 (trinta) dias.
            </Clausula>

            <Clausula numero="4ª" titulo="DOS SERVIÇOS INCLUSOS">
              A CONTRATADA disponibilizará à CONTRATANTE acesso completo ao sistema <strong>Simples Manutenção</strong>, incluindo todos os módulos disponíveis: Ordens de Serviço, Checklists de Manutenção, Quadro de Atividades, Roteiros de Execução, Tarefas Agendadas, Escalas de Trabalho, Vencimentos e Alertas, Relatórios, entre outros. Inclui suporte via WhatsApp e atualizações contínuas da plataforma.
            </Clausula>

            <Clausula numero="5ª" titulo="DAS OBRIGAÇÕES DA CONTRATADA">
              <ol type="a" style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Manter o sistema disponível 24 horas por dia, 7 dias por semana, exceto durante manutenções programadas;</li>
                <li>Garantir a segurança e sigilo dos dados da CONTRATANTE conforme a LGPD (Lei nº 13.709/2018);</li>
                <li>Fornecer suporte técnico via WhatsApp em horário comercial;</li>
                <li>Realizar atualizações e melhorias contínuas sem custo adicional;</li>
                <li>Desenvolver funções ou parâmetros personalizados sem custo adicional, conforme viabilidade técnica.</li>
              </ol>
            </Clausula>

            <Clausula numero="6ª" titulo="DAS OBRIGAÇÕES DA CONTRATANTE">
              <ol type="a" style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Efetuar o pagamento mensal na data estipulada;</li>
                <li>Utilizar o sistema de acordo com as boas práticas e termos de uso;</li>
                <li>Manter seus dados cadastrais atualizados;</li>
                <li>Não compartilhar credenciais de acesso com terceiros não autorizados.</li>
              </ol>
            </Clausula>

            <Clausula numero="7ª" titulo="DO CANCELAMENTO">
              Qualquer das partes poderá solicitar o cancelamento do contrato mediante comunicação por escrito com antecedência mínima de 30 (trinta) dias. Em caso de inadimplência superior a 30 dias, a CONTRATADA reserva-se o direito de suspender o acesso ao sistema.
            </Clausula>

            <Clausula numero="8ª" titulo="DA PROPRIEDADE INTELECTUAL">
              O software <strong>Simples Manutenção</strong> é de propriedade exclusiva da CONTRATADA. A CONTRATANTE adquire apenas o direito de uso durante a vigência deste contrato, sendo vedada qualquer reprodução, modificação ou redistribuição do sistema.
            </Clausula>

            <Clausula numero="9ª" titulo="DO FORO">
              As partes elegem o foro da Comarca de São Paulo/SP para dirimir quaisquer questões oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.
            </Clausula>

          </div>

          {/* Local e Data */}
          <div style={{ marginTop: 48, marginBottom: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {campo('Local', c.local, set('local'), 'São Paulo')}
              {campo('Data', c.data, set('data'), hoje)}
            </div>
          </div>

          {/* Assinaturas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '2px solid #0D0D0D', paddingTop: 12, marginTop: 48 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 14 }}>APP GROUP LTDA - ME</p>
                <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>CNPJ: 51.797.070/0001-53</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#71717a' }}>CONTRATADA</p>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '2px solid #0D0D0D', paddingTop: 12, marginTop: 48 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 14 }}>
                  {c.razaoSocial || '___________________________'}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>
                  CNPJ/CPF: {c.cnpjCpf || '_______________'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#71717a' }}>CONTRATANTE</p>
              </div>
            </div>
          </div>

        </div>

        <div style={{ height: 64 }} />
      </div>
    </>
  );
};

/* ── Helpers ── */

const tituloSecao: React.CSSProperties = {
  fontSize: 13, fontWeight: 900, color: '#0D0D0D',
  textTransform: 'uppercase', letterSpacing: '1.5px',
  borderLeft: '4px solid #FFD600', paddingLeft: 12,
  margin: '0 0 16px',
};

const blocoInfo: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
  background: '#f9f9f9', borderRadius: 12, padding: '20px 24px',
  border: '1px solid #e4e4e7',
};

const InfoRow: React.FC<{ label: string; valor: string }> = ({ label, valor }) => (
  <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
    <span style={{ fontWeight: 700, color: '#52525b', minWidth: 140, flexShrink: 0 }}>{label}:</span>
    <span style={{ color: '#18181b' }}>{valor}</span>
  </div>
);

const Clausula: React.FC<{ numero: string; titulo: string; children: React.ReactNode }> = ({ numero, titulo, children }) => (
  <div>
    <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0D0D0D', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      CLÁUSULA {numero} — {titulo}
    </h3>
    <div style={{ fontSize: 14, color: '#3f3f46', lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default ContratoPage;
