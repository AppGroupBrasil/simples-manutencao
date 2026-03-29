import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Tutorial.module.css';

// ── Checklist de primeiros passos ───────────────────────────
const PASSOS = [
  {
    id: 'funcao',
    emoji: '🔧',
    titulo: 'Crie sua primeira função',
    desc: 'Crie uma função de manutenção personalizada',
    link: '/manutencao',
    detectar: () => {
      try {
        return JSON.parse(localStorage.getItem('manutencao_funcoes_v2') || '[]').length > 0;
      } catch { return false; }
    },
  },
  {
    id: 'funcionario',
    emoji: '👤',
    titulo: 'Cadastre um funcionário',
    desc: 'Adicione sua equipe ao sistema',
    link: '/usuarios',
    detectar: () => {
      try {
        return JSON.parse(localStorage.getItem('sm_usuarios_v2') || '[]')
          .some((u: any) => u.role === 'funcionario');
      } catch { return false; }
    },
  },
  {
    id: 'chamado',
    emoji: '📋',
    titulo: 'Abra seu primeiro chamado',
    desc: 'Crie e atribua um chamado à sua equipe',
    link: '/manutencao',
    detectar: () => {
      try {
        return JSON.parse(localStorage.getItem('manutencao_chamados_v2') || '[]').length > 0;
      } catch { return false; }
    },
  },
  {
    id: 'checklist',
    emoji: '✅',
    titulo: 'Crie um checklist',
    desc: 'Experimente o sistema de checklists',
    link: '/checklist',
    detectar: () => {
      try {
        return JSON.parse(localStorage.getItem('sm_checklists_v2') || '[]').length > 0;
      } catch { return false; }
    },
  },
];

// ── Funções do sistema com timeline visual ──────────────────
interface PassoTimeline {
  local: string;
  acao: string;
  dica?: string;
}

interface FaseTimeline {
  emoji: string;
  titulo: string;
  passos: PassoTimeline[];
}

interface FuncaoGuia {
  id: string;
  emoji: string;
  cor: string;
  nome: string;
  descricao: string;
  fases: FaseTimeline[];
}

const FUNCOES_GUIA: FuncaoGuia[] = [
  {
    id: 'personalizar',
    emoji: '➕',
    cor: '#FF8F00',
    nome: 'Personalizar Manutenção',
    descricao: 'Crie funções sob medida para o seu negócio',
    fases: [
      {
        emoji: '⚙️',
        titulo: 'CONFIGURAÇÃO',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique no botão "PERSONALIZAR MANUTENÇÃO" (ícone +)' },
          { local: 'Wizard — Passo 1', acao: 'Escolha um nome, ícone e cor para a função' },
          { local: 'Wizard — Passo 2', acao: 'Selecione os blocos desejados (título, descrição, fotos, prioridade, assinatura, etc.)' },
          { local: 'Wizard — Passo 3', acao: 'Revise os campos e clique em "Salvar"' },
        ],
      },
      {
        emoji: '▶️',
        titulo: 'USO',
        passos: [
          { local: 'Aba Chamados', acao: 'O card da nova função aparecerá na lista' },
          { local: 'Card da função', acao: 'Use "Editar" para alterar, "Ver" para pré-visualizar, ou 🗑 para excluir' },
        ],
      },
    ],
  },
  {
    id: 'manutencao_livre',
    emoji: '📋',
    cor: '#0D0D0D',
    nome: 'Manutenção Livre',
    descricao: 'Registro rápido sem função pré-configurada',
    fases: [
      {
        emoji: '▶️',
        titulo: 'USO',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique no card "Manutenção Livre"' },
          { local: 'Formulário', acao: 'Clique em "+ Registrar" e descreva cada item com fotos', dica: 'Use para ocorrências avulsas e urgentes' },
          { local: 'Formulário', acao: 'Adicione mais itens com "+ Adicionar item" se necessário' },
          { local: 'Formulário', acao: 'Clique em "Enviar" para registrar o chamado' },
        ],
      },
      {
        emoji: '📊',
        titulo: 'RESULTADO',
        passos: [
          { local: 'Aba Enviados', acao: 'O chamado aparecerá na lista com status "Aberto"' },
        ],
      },
    ],
  },
  {
    id: 'checklist',
    emoji: '✅',
    cor: '#1565C0',
    nome: 'Checklist',
    descricao: 'Listas de verificação para inspeções e auditorias',
    fases: [
      {
        emoji: '▶️',
        titulo: 'CRIAR',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique no card "Checklist"' },
          { local: 'Página Checklists', acao: 'Clique em "+ Novo Checklist" e dê um título' },
          { local: 'Checklist', acao: 'Adicione os itens de verificação um a um' },
        ],
      },
      {
        emoji: '✏️',
        titulo: 'PREENCHER',
        passos: [
          { local: 'Checklist', acao: 'Marque cada item como ✅ Concluído ou ⚠️ Com problema' },
          { local: 'Item com problema', acao: 'Adicione foto e descrição para itens com problema' },
        ],
      },
      {
        emoji: '📊',
        titulo: 'RESULTADO',
        passos: [
          { local: 'Checklist', acao: 'Use 📄 para gerar PDF ou 📤 para compartilhar no WhatsApp' },
          { local: 'Admin', acao: 'Administradores podem atribuir checklists para funcionários', dica: 'O funcionário receberá a tarefa em "Meus Chamados"' },
        ],
      },
    ],
  },
  {
    id: 'ordem_servico',
    emoji: '📋',
    cor: '#0D47A1',
    nome: 'Ordem de Serviço',
    descricao: 'Formulário completo com todos os campos técnicos',
    fases: [
      {
        emoji: '▶️',
        titulo: 'ABRIR',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique no card "Ordem de Serviço"' },
          { local: 'Formulário OS', acao: 'Preencha: Cliente, Contato, Endereço, Equipamento, Marca/Modelo, Nº de Série' },
        ],
      },
      {
        emoji: '✏️',
        titulo: 'PREENCHER',
        passos: [
          { local: 'Descrição', acao: 'Descreva o problema e o diagnóstico técnico', dica: 'Use o 🎙️ para ditar por voz' },
          { local: 'Serviço', acao: 'Registre serviço realizado, peças, valor e forma de pagamento' },
          { local: 'Fotos', acao: 'Adicione fotos antes/depois do serviço' },
          { local: 'Timer', acao: 'O timer automático registra o tempo de atendimento' },
        ],
      },
      {
        emoji: '📊',
        titulo: 'RESULTADO',
        passos: [
          { local: 'Aba Enviados', acao: 'Clique no ícone 📄 para gerar PDF ou compartilhar por WhatsApp' },
        ],
      },
    ],
  },
  {
    id: 'funcionarios',
    emoji: '👥',
    cor: '#2E7D32',
    nome: 'Funcionários',
    descricao: 'Gerencie sua equipe e defina permissões',
    fases: [
      {
        emoji: '⚙️',
        titulo: 'CADASTRAR',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique no card "Funcionários" (ou acesse pelo menu lateral)' },
          { local: 'Página Funcionários', acao: 'Clique em "+ Novo Funcionário"' },
          { local: 'Cadastro', acao: 'Informe Nome, Cargo e E-mail' },
          { local: 'Credenciais', acao: 'Copie o login e senha gerados e envie ao funcionário', dica: 'A senha é numérica com 6 dígitos' },
        ],
      },
      {
        emoji: '▶️',
        titulo: 'USO',
        passos: [
          { local: 'Aba Chamados', acao: 'Ao clicar em uma função, escolha o responsável na lista' },
          { local: 'Aba Enviados', acao: 'Acompanhe os chamados por funcionário e status' },
        ],
      },
    ],
  },
  {
    id: 'qrcodes',
    emoji: '📱',
    cor: '#6A1B9A',
    nome: 'QR Codes',
    descricao: 'Acesso rápido a formulários por QR Code',
    fases: [
      {
        emoji: '⚙️',
        titulo: 'CONFIGURAR',
        passos: [
          { local: 'Aba Gerenciar', acao: 'Clique no card "QR Codes"' },
          { local: 'Página QR Codes', acao: 'Selecione a função desejada → o QR Code é gerado automaticamente' },
          { local: 'QR Code', acao: 'Imprima e cole no local desejado (equipamento, porta, painel)' },
        ],
      },
      {
        emoji: '▶️',
        titulo: 'USO',
        passos: [
          { local: 'No local', acao: 'Funcionário ou cliente escaneia o QR Code com o celular' },
          { local: 'Celular', acao: 'O formulário correspondente abre automaticamente no navegador' },
        ],
      },
    ],
  },
  {
    id: 'atribuir_chamado',
    emoji: '🔧',
    cor: '#E65100',
    nome: 'Atribuir Chamado',
    descricao: 'Como atribuir um chamado a um funcionário',
    fases: [
      {
        emoji: '▶️',
        titulo: 'ATRIBUIR',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique no card da função desejada (ex: "Elétrica", "Hidráulica")' },
          { local: 'Modal Atribuir', acao: 'Selecione o funcionário responsável na lista' },
          { local: 'Modal Atribuir', acao: 'Adicione observações se necessário', dica: 'Use o 🎙️ para ditar por voz' },
          { local: 'Modal Atribuir', acao: 'Clique em "Criar e Atribuir"' },
        ],
      },
      {
        emoji: '📊',
        titulo: 'RESULTADO',
        passos: [
          { local: 'Meus Chamados', acao: 'O funcionário recebe o chamado na sua lista' },
          { local: 'Aba Enviados', acao: 'Acompanhe o status: Aberto → Em andamento → Concluído' },
        ],
      },
    ],
  },
  {
    id: 'aba_enviados',
    emoji: '📊',
    cor: '#00695C',
    nome: 'Aba Enviados',
    descricao: 'Acompanhe todos os chamados da equipe',
    fases: [
      {
        emoji: '▶️',
        titulo: 'NAVEGAR',
        passos: [
          { local: 'Barra superior', acao: 'Toque na aba "Enviados"' },
          { local: 'Filtros', acao: 'Use os filtros: Abertos, Em Andamento, Concluídos' },
          { local: 'Busca', acao: 'Busque por tipo, responsável, status ou data' },
        ],
      },
      {
        emoji: '✏️',
        titulo: 'AÇÕES',
        passos: [
          { local: 'Chamado', acao: 'Clique para expandir e ver todos os detalhes' },
          { local: 'Botões', acao: 'Use: ▶ Iniciar, ✅ Concluir, 📄 PDF, 📤 Compartilhar, 🔁 Reutilizar' },
        ],
      },
    ],
  },
  {
    id: 'aba_gerenciar',
    emoji: '⚙️',
    cor: '#37474F',
    nome: 'Aba Gerenciar',
    descricao: 'Configure e gerencie suas funções',
    fases: [
      {
        emoji: '▶️',
        titulo: 'NAVEGAR',
        passos: [
          { local: 'Barra superior', acao: 'Toque na aba "Gerenciar"' },
          { local: 'Aba Gerenciar', acao: 'Clique em "PERSONALIZAR MANUTENÇÃO" para criar novas funções' },
        ],
      },
      {
        emoji: '✏️',
        titulo: 'GERENCIAR',
        passos: [
          { local: 'Cards', acao: 'Use "Editar" para alterar configurações ou "Ver" para pré-visualizar' },
          { local: 'QR Codes', acao: 'Acesse o card "QR Codes" para gerenciar' },
          { local: 'Card', acao: 'Use 🗑 para excluir funções desnecessárias' },
        ],
      },
    ],
  },
  {
    id: 'recibo',
    emoji: '🧾',
    cor: '#4E342E',
    nome: 'Recibo',
    descricao: 'Gere recibos profissionais dos serviços',
    fases: [
      {
        emoji: '⚙️',
        titulo: 'CONFIGURAÇÃO',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique em "PERSONALIZAR MANUTENÇÃO"' },
          { local: 'Wizard — Nome', acao: 'Dê um nome (ex: "Recibo") e escolha ícone/cor' },
          { local: 'Wizard — Blocos', acao: 'Na seção "Documentos", marque o bloco "Recibo"', dica: 'Ou "Recibo Modelo Simples" para a versão resumida' },
          { local: 'Wizard — Revisar', acao: 'Revise os campos e clique em "Salvar"' },
        ],
      },
      {
        emoji: '▶️',
        titulo: 'USO',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique no card da função criada' },
          { local: 'Formulário', acao: 'Preencha: Contratante, CPF/CNPJ, Valor, Pagamento, Descrição', dica: 'O valor por extenso é gerado automaticamente' },
        ],
      },
      {
        emoji: '📊',
        titulo: 'RESULTADO',
        passos: [
          { local: 'Aba Enviados', acao: 'Clique no ícone 🧾 no card do chamado para gerar o recibo em PDF A4' },
        ],
      },
    ],
  },
  {
    id: 'contrato',
    emoji: '📄',
    cor: '#1E3A5F',
    nome: 'Contrato de Serviço',
    descricao: 'Contrato completo com 10 cláusulas editáveis',
    fases: [
      {
        emoji: '⚙️',
        titulo: 'CONFIGURAÇÃO',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique em "PERSONALIZAR MANUTENÇÃO"' },
          { local: 'Wizard — Nome', acao: 'Dê um nome (ex: "Contrato") e escolha ícone/cor' },
          { local: 'Wizard — Blocos', acao: 'Na seção "Documentos", marque "Contrato de Serviço"' },
          { local: 'Wizard — Revisar', acao: 'Revise os campos e clique em "Salvar"' },
        ],
      },
      {
        emoji: '▶️',
        titulo: 'USO',
        passos: [
          { local: 'Aba Chamados', acao: 'Clique no card da função criada' },
          { local: 'Formulário', acao: 'Preencha dados do Contratante e Contratado (Nome, CPF/CNPJ, Endereço, E-mail, Telefone)' },
          { local: 'Cláusulas', acao: 'Ajuste as 10 cláusulas (Objeto, Obrigações, Prazo, Valor, Rescisão, Penalidades, Foro, etc.)' },
        ],
      },
      {
        emoji: '📊',
        titulo: 'RESULTADO',
        passos: [
          { local: 'Aba Enviados', acao: 'Clique no ícone 📄 no card do chamado para gerar o contrato em PDF A4' },
        ],
      },
    ],
  },
  {
    id: 'documentos',
    emoji: '📁',
    cor: '#1B5E20',
    nome: 'Documentos',
    descricao: 'Envie e gerencie documentos compartilhados',
    fases: [
      {
        emoji: '▶️',
        titulo: 'ENVIAR',
        passos: [
          { local: 'Menu lateral', acao: 'Clique em "Documentos"' },
          { local: 'Página Documentos', acao: 'Clique em "+ Novo Documento"' },
          { local: 'Upload', acao: 'Escolha o arquivo, dê título e descrição, clique em "Enviar"' },
        ],
      },
      {
        emoji: '📊',
        titulo: 'RESULTADO',
        passos: [
          { local: 'Documentos', acao: 'Cada documento gera um link único para compartilhar' },
          { local: 'Documentos', acao: 'Visualize, baixe ou exclua a qualquer momento na lista' },
        ],
      },
    ],
  },
];

// ── Componente ──────────────────────────────────────────────
export default function TutorialWidget() {
  const { usuario } = useAuth();
  const location    = useLocation();
  const navigate    = useNavigate();
  const [aberto, setAberto]       = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  const paginasPublicas = ['/', '/login', '/cadastro', '/contrato', '/proposta'];
  if (!usuario || paginasPublicas.includes(location.pathname)) return null;
  if (usuario.role === 'funcionario') return null;

  const passosComStatus = PASSOS.map(p => ({ ...p, concluido: p.detectar() }));
  const totalConcluidos = passosComStatus.filter(p => p.concluido).length;
  const todosFeitos     = totalConcluidos === PASSOS.length;
  const pct             = Math.round((totalConcluidos / PASSOS.length) * 100);

  function irPara(link: string) {
    setAberto(false);
    navigate(link);
  }

  return (
    <>
      {/* Botão flutuante ? */}
      <button
        className={styles.btnAjuda}
        onClick={() => setAberto(true)}
        title="Ajuda e tutorial"
        aria-label="Abrir tutorial"
      >
        ?
      </button>

      {/* Painel */}
      {aberto && (
        <div className={styles.overlay} onClick={() => setAberto(false)}>
          <div className={styles.painel} onClick={e => e.stopPropagation()}>

            {/* Cabeçalho */}
            <div className={styles.painelHeader}>
              <h2 className={styles.painelTitulo}>📚 Guia do Sistema</h2>
              <button className={styles.btnFechar} onClick={() => setAberto(false)}>✕</button>
            </div>

            {/* ── Checklist primeiros passos (só admin) ── */}
            {usuario.role === 'administrador' && (
              <div className={styles.secao}>
                <p className={styles.secaoTitulo}>🚀 Primeiros passos</p>

                {todosFeitos ? (
                  <div className={styles.badgeCompleto}>
                    ✅ Configuração completa! Sistema pronto para uso.
                  </div>
                ) : (
                  <>
                    <div className={styles.progressoLabel}>
                      <span>{totalConcluidos} de {PASSOS.length} concluídos</span>
                      <span>{pct}%</span>
                    </div>
                    <div className={styles.progressoWrap}>
                      <div className={styles.progressoBarra} style={{ width: `${pct}%` }} />
                    </div>
                  </>
                )}

                {passosComStatus.map(p => (
                  <div
                    key={p.id}
                    className={`${styles.passo} ${p.concluido ? styles.passoConcluido : ''}`}
                    onClick={() => !p.concluido && irPara(p.link)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && !p.concluido && irPara(p.link)}
                  >
                    <span className={styles.passoEmoji}>{p.emoji}</span>
                    <div className={styles.passoInfo}>
                      <p className={styles.passoTitulo}>{p.titulo}</p>
                      <p className={styles.passoDesc}>{p.desc}</p>
                    </div>
                    <div className={`${styles.passoCheck} ${p.concluido ? styles.passoCheckFeito : ''}`}>
                      {p.concluido ? '✓' : '→'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Funções do sistema (timeline visual) ── */}
            <div className={styles.secao}>
              <p className={styles.secaoTitulo}>📖 Funções — Toque para ver o caminho completo</p>

              {FUNCOES_GUIA.map(f => {
                const isOpen = expandido === f.id;
                return (
                  <div key={f.id} style={{ marginBottom: 8 }}>
                    {/* Card da função */}
                    <button
                      onClick={() => setExpandido(isOpen ? null : f.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: isOpen ? '14px 14px 0 0' : 14,
                        border: `2px solid ${isOpen ? f.cor : 'var(--cor-borda, #e4e4e7)'}`,
                        background: isOpen ? `${f.cor}10` : 'var(--cor-superficie, #fff)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: f.cor, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 20, flexShrink: 0,
                        color: '#fff',
                      }}>
                        {f.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cor-texto, #0D0D0D)', margin: 0 }}>{f.nome}</div>
                        <div style={{ fontSize: 11, color: '#71717a', margin: 0 }}>{f.descricao}</div>
                      </div>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: isOpen ? f.cor : 'var(--cor-borda, #e4e4e7)',
                        color: isOpen ? '#fff' : '#71717a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 900, flexShrink: 0,
                        transition: 'transform 0.2s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}>
                        ▼
                      </div>
                    </button>

                    {/* Timeline expandida */}
                    {isOpen && (
                      <div style={{
                        border: `2px solid ${f.cor}`,
                        borderTop: 'none',
                        borderRadius: '0 0 14px 14px',
                        padding: '14px 14px 10px',
                        background: 'var(--cor-superficie, #fff)',
                      }}>
                        {f.fases.map((fase, fi) => {
                          const startNum = f.fases.slice(0, fi).reduce((s, prev) => s + prev.passos.length, 0);
                          return (
                            <div key={fi} style={{ marginBottom: fi < f.fases.length - 1 ? 6 : 0 }}>
                              {/* Cabeçalho da fase */}
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 9, fontWeight: 900, textTransform: 'uppercase' as const,
                                letterSpacing: 1, padding: '3px 10px', borderRadius: 20,
                                background: fase.titulo === 'RESULTADO' ? '#dcfce7' : `${f.cor}18`,
                                color: fase.titulo === 'RESULTADO' ? '#15803d' : f.cor,
                                marginBottom: 8,
                              }}>
                                {fase.emoji} {fase.titulo}
                              </div>

                              {/* Passos da timeline */}
                              {fase.passos.map((p, pi) => {
                                const num = startNum + pi + 1;
                                const isLastInPhase = pi === fase.passos.length - 1;
                                const isLastPhase = fi === f.fases.length - 1;
                                const isAbsoluteLast = isLastInPhase && isLastPhase;
                                const showLine = !isAbsoluteLast;
                                const dashed = isLastInPhase && !isLastPhase;

                                return (
                                  <div key={pi} style={{ display: 'flex', gap: 10 }}>
                                    {/* Coluna do ponto + conector */}
                                    <div style={{
                                      display: 'flex', flexDirection: 'column',
                                      alignItems: 'center', width: 26, flexShrink: 0,
                                    }}>
                                      <div style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: f.cor, color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 900,
                                      }}>
                                        {num}
                                      </div>
                                      {showLine && (
                                        <div style={{
                                          width: 0, flex: 1, minHeight: 10,
                                          borderLeft: `2px ${dashed ? 'dashed' : 'solid'} ${f.cor}30`,
                                        }} />
                                      )}
                                    </div>

                                    {/* Coluna do conteúdo */}
                                    <div style={{ flex: 1, paddingBottom: isAbsoluteLast ? 4 : 8 }}>
                                      <div style={{
                                        display: 'inline-flex', fontSize: 9, fontWeight: 800,
                                        padding: '1px 7px', borderRadius: 5,
                                        background: `${f.cor}12`, color: f.cor,
                                        letterSpacing: 0.3, marginBottom: 3,
                                      }}>
                                        📍 {p.local}
                                      </div>
                                      <div style={{
                                        fontSize: 12.5, fontWeight: 600,
                                        color: 'var(--cor-texto, #0D0D0D)', lineHeight: 1.45,
                                      }}>
                                        {p.acao}
                                      </div>
                                      {p.dica && (
                                        <div style={{
                                          fontSize: 11, color: '#71717a',
                                          lineHeight: 1.4, marginTop: 2,
                                        }}>
                                          💡 {p.dica}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
