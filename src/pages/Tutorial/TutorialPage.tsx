import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import s from './TutorialPage.module.css';

/* ── helpers ── */
const Step: React.FC<{ n: number; title: string; desc: string }> = ({ n, title, desc }) => (
  <div className={s.step}>
    <span className={s.stepNum}>{n}</span>
    <div className={s.stepContent}>
      <p className={s.stepTitle}>{title}</p>
      <p className={s.stepDesc}>{desc}</p>
    </div>
  </div>
);

const Tip: React.FC<{ children: string }> = ({ children }) => (
  <div className={s.tip}>
    <span className={s.tipIcon}>💡</span>
    <p className={s.tipText}>{children}</p>
  </div>
);

/* ── DADOS DAS SEÇÕES ── */
const sections = [
  {
    id: 'criar-funcao',
    icon: '🛠️',
    bg: 'linear-gradient(135deg, #FFD600, #FF8F00)',
    title: 'Criar uma Função de Manutenção',
    steps: [
      { title: 'Abra o app e faça login', desc: 'Use seu e-mail e senha cadastrados. Você será direcionado à tela principal.' },
      { title: 'Toque em "+ Personalizar"', desc: 'É o botão amarelo no topo da tela. Ele abre o assistente de criação.' },
      { title: 'Escolha o nome da função', desc: 'Selecione uma sugestão (Ex: Elétrica, Hidráulica, Pintura) ou digite um nome personalizado.' },
      { title: 'Escolha ícone e cor', desc: 'Selecione um emoji e uma das 12 cores disponíveis para identificar a função.' },
      { title: 'Monte o formulário', desc: 'Escolha os campos que o formulário terá: texto, fotos, checklist, assinatura, GPS, orçamento, etc.' },
      { title: 'Configure opções de dropdown', desc: 'Se adicionou campos de seleção, defina as opções (ex: setores, tipos de equipamento).' },
      { title: 'Revise e salve', desc: 'Confira o resumo e toque em "Salvar". A função aparecerá como um novo tile na tela principal.' },
    ],
    tip: 'Você pode criar quantas funções quiser. Cada uma gera um botão na tela inicial com o ícone e cor que você escolheu.',
  },
  {
    id: 'abrir-os',
    icon: '📋',
    bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    title: 'Abrir uma Ordem de Serviço (O.S.)',
    steps: [
      { title: 'Na tela principal, toque na função desejada', desc: 'Exemplo: toque em "Elétrica" para abrir o formulário de chamado elétrico.' },
      { title: 'Preencha os campos do formulário', desc: 'Cada campo aparece na ordem que foi configurada — título, descrição, fotos, local, etc.' },
      { title: 'Tire fotos (se houver campo de foto)', desc: 'Toque no ícone da câmera para fotografar ou selecionar da galeria.' },
      { title: 'Use o microfone para ditar', desc: 'Nos campos de texto, toque no 🎙️ para falar ao invés de digitar.' },
      { title: 'Toque em "Enviar"', desc: 'O sistema gera automaticamente um número de protocolo e registra a data/hora.' },
    ],
    tip: 'O tempo é contado automaticamente do momento que você abriu o formulário até o envio. Isso aparece no relatório.',
  },
  {
    id: 'manutencao-livre',
    icon: '⚡',
    bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    title: 'Manutenção Livre (Chamado Rápido)',
    steps: [
      { title: 'Toque no tile "Manutenção Livre"', desc: 'É o tile com o ícone de raio — formulário rápido sem configuração prévia.' },
      { title: 'Preencha o título e a descrição', desc: 'Descreva o que precisa ser feito. Use o microfone para agilizar.' },
      { title: 'Adicione fotos se necessário', desc: 'Toque na câmera para registrar o problema visualmente.' },
      { title: 'Envie', desc: 'O chamado é salvo com protocolo e fica disponível no painel de enviados.' },
    ],
    tip: 'Use a Manutenção Livre para chamados urgentes ou quando não há uma função específica criada.',
  },
  {
    id: 'cadastrar-usuarios',
    icon: '👥',
    bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    title: 'Cadastrar Usuários e Definir Funções',
    steps: [
      { title: 'Acesse a aba de Engrenagem (⚙️) na tela principal', desc: 'Ela fica no canto superior. Abre as configurações.' },
      { title: 'Toque em "Usuários"', desc: 'Será exibida a lista de usuários cadastrados.' },
      { title: 'Toque em "+ Novo Usuário"', desc: 'Preencha: nome, e-mail, senha e selecione o perfil.' },
      { title: 'Escolha o perfil do usuário', desc: 'Master — acesso total · Admin — gerencia equipe · Supervisor — vê sua equipe · Funcionário — vê só os próprios chamados.' },
      { title: 'Salve', desc: 'O usuário poderá fazer login e usar o sistema de acordo com o perfil definido.' },
    ],
    tip: 'Funcionários só veem e editam os próprios chamados. Supervisores veem os da equipe. Apenas Master e Admin veem tudo.',
  },
  {
    id: 'pin-protecao',
    icon: '🔒',
    bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
    title: 'Configurar Senha PIN de Proteção',
    steps: [
      { title: 'Acesse Configurações (⚙️)', desc: 'Na tela principal, toque na engrenagem.' },
      { title: 'Encontre a opção "PIN de Proteção"', desc: 'Ative o switch para habilitar a proteção por PIN.' },
      { title: 'Digite um PIN de 4 dígitos', desc: 'Escolha uma senha numérica que será pedida para ações sensíveis.' },
      { title: 'Confirme', desc: 'Agora, toda vez que alguém tentar editar ou excluir um chamado, o sistema vai pedir o PIN.' },
    ],
    tip: 'O PIN impede que funcionários apaguem ou alterem chamados sem autorização. Só quem sabe o PIN consegue.',
  },
  {
    id: 'painel-enviados',
    icon: '📊',
    bg: 'linear-gradient(135deg, #22c55e, #16a34a)',
    title: 'Ver e Gerenciar Chamados Enviados',
    steps: [
      { title: 'Na tela principal, toque em "Enviados"', desc: 'O painel exibe todos os chamados com filtros por status.' },
      { title: 'Use os filtros', desc: 'Filtre por: Todos, Abertos, Em Andamento, Concluídos ou Cancelados. Cada aba mostra a quantidade.' },
      { title: 'Busque por texto', desc: 'A barra de busca procura em todos os campos — nome, protocolo, descrição, responsável.' },
      { title: 'Toque em um chamado para expandir', desc: 'Veja todos os detalhes: respostas, fotos, assinaturas, timeline.' },
      { title: 'Ações disponíveis', desc: 'Compartilhar via WhatsApp · Imprimir relatório · Editar · Excluir (exige PIN se configurado).' },
    ],
    tip: 'Ao compartilhar, o sistema gera um link com QR Code que qualquer pessoa pode abrir sem precisar de login.',
  },
  {
    id: 'checklist',
    icon: '✅',
    bg: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    title: 'Criar e Preencher Checklists',
    steps: [
      { title: 'Toque no tile "Checklist" na tela principal', desc: 'Abre a área de gerenciamento de checklists.' },
      { title: 'Crie um novo checklist', desc: 'Defina um título e adicione os itens que precisam ser verificados.' },
      { title: 'Compartilhe via link ou QR Code', desc: 'Gere um link para que funcionários preencham o checklist pelo celular.' },
      { title: 'O funcionário abre o link e marca os itens', desc: 'Cada item pode ser marcado como OK, com observações e fotos.' },
      { title: 'Acompanhe os resultados', desc: 'Veja quem preencheu, quando, e quais itens ficaram pendentes.' },
    ],
    tip: 'Checklists são ótimos para inspeções diárias, rondas de segurança e rotinas de limpeza.',
  },
  {
    id: 'os-publica',
    icon: '📄',
    bg: 'linear-gradient(135deg, #ec4899, #db2777)',
    title: 'Gerar Ordem de Serviço para Cliente',
    steps: [
      { title: 'Toque no tile "O.S." na tela principal', desc: 'Abre os modelos de Ordem de Serviço disponíveis.' },
      { title: 'Escolha o modelo', desc: 'Assistência Técnica, Geral, Preventiva, Corretiva, Instalação ou Vistoria.' },
      { title: 'Preencha os dados', desc: 'Dados da empresa, do cliente, descrição do serviço, itens, valores, etc.' },
      { title: 'Toque em "Compartilhar"', desc: 'Defina quais campos o cliente pode editar e gere o link.' },
      { title: 'Envie para o cliente', desc: 'Por WhatsApp ou copie o link. O cliente preenche, assina digitalmente e você recebe os dados.' },
    ],
    tip: 'A O.S. pública permite que o cliente assine digitalmente no celular, sem papel.',
  },
  {
    id: 'maquinas',
    icon: '🏭',
    bg: 'linear-gradient(135deg, #64748b, #475569)',
    title: 'Cadastro de Máquinas e Equipamentos',
    steps: [
      { title: 'Acesse o tile "Máquinas" na tela principal', desc: 'Abre o cadastro de equipamentos.' },
      { title: 'Toque em "+ Novo"', desc: 'Preencha: nome do equipamento, código, setor, localização, modelo e marca.' },
      { title: 'Salve', desc: 'O equipamento recebe um número automático e fica disponível para consulta.' },
      { title: 'Vincule aos chamados', desc: 'Ao criar um chamado, selecione a máquina. O histórico fica registrado.' },
      { title: 'Consulte o histórico', desc: 'Na aba "Histórico", veja todas as manutenções feitas naquele equipamento — datas, técnicos e custos.' },
    ],
    tip: 'O histórico de máquinas ajuda a identificar equipamentos problemáticos e planejar manutenções preventivas.',
  },
  {
    id: 'qrcode',
    icon: '📱',
    bg: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    title: 'Usar QR Codes',
    steps: [
      { title: 'Cada chamado gera um QR Code automaticamente', desc: 'Ele aparece na tela do chamado e nos relatórios impressos.' },
      { title: 'Compartilhe o QR Code', desc: 'Imprima ou envie por WhatsApp. Qualquer pessoa pode escanear.' },
      { title: 'Ao escanear, o chamado abre no navegador', desc: 'Mostra os detalhes do chamado — status, responsável, fotos, datas — sem precisar de login.' },
    ],
    tip: 'Cole QR Codes em equipamentos para que qualquer pessoa possa ver o último chamado feito naquela máquina.',
  },
  {
    id: 'personalizar',
    icon: '🎨',
    bg: 'linear-gradient(135deg, #a855f7, #9333ea)',
    title: 'Personalizar a Aparência',
    steps: [
      { title: 'Acesse Configurações (⚙️)', desc: 'Na tela principal, toque na engrenagem.' },
      { title: 'Escolha o layout dos tiles', desc: '6 estilos: Simples, Glass, Bento, Lista, Dock ou Dashboard.' },
      { title: 'Escolha o tema de cores', desc: '8 temas: Original, Oceano, Aurora, Fire, Emerald, Obsidian, Sunrise.' },
      { title: 'Adicione seu logo', desc: 'Faça upload do logo da sua empresa para personalizar o cabeçalho.' },
    ],
    tip: 'O layout e tema são salvos no dispositivo. Cada funcionário pode ter sua própria personalização.',
  },
];

/* ── COMPONENTE PRINCIPAL ── */
const TutorialPage: React.FC = () => (
  <div className={s.wrapper}>
    {/* HEADER */}
    <header className={s.header}>
      <div className={s.headerInner}>
        <Link to="/" className={s.backLink}>
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
        <h1 className={s.headerTitle}>Como usar o Simples Manutenção</h1>
        <p className={s.headerSub}>Passo a passo rápido de cada função do sistema</p>
      </div>
    </header>

    {/* NAV RÁPIDA */}
    <div className={s.quickNav}>
      <div className={s.quickNavInner}>
        {sections.map(sec => (
          <a key={sec.id} href={`#${sec.id}`} className={s.quickNavBtn}>
            {sec.icon} {sec.title.replace(/^.*? /, '').slice(0, 22)}
          </a>
        ))}
      </div>
    </div>

    {/* CONTEÚDO */}
    <div className={s.content}>
      {sections.map(sec => (
        <div key={sec.id} className={s.section}>
          <span id={sec.id} className={s.sectionAnchor} />
          <div className={s.sectionHeader}>
            <div className={s.sectionIcon} style={{ background: sec.bg }}>{sec.icon}</div>
            <h2 className={s.sectionTitle}>{sec.title}</h2>
          </div>
          <div className={s.steps}>
            {sec.steps.map((st, i) => (
              <Step key={i} n={i + 1} title={st.title} desc={st.desc} />
            ))}
          </div>
          {sec.tip && <Tip>{sec.tip}</Tip>}
        </div>
      ))}

      {/* CTA */}
      <div className={s.ctaBox}>
        <h3 className={s.ctaTitle}>Pronto para começar?</h3>
        <p className={s.ctaSub}>Crie sua conta gratuita e configure seu primeiro chamado em menos de 2 minutos.</p>
        <Link to="/cadastro" className={s.ctaBtn}>
          Criar conta grátis <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  </div>
);

export default TutorialPage;
