import type { BlocoDisponivel } from './types';

// ── Blocos disponíveis para montar o formulário ───────────────────────────
export const BLOCOS_DISPONIVEIS: BlocoDisponivel[] = [
  // Básico
  { id: 'titulo',       nome: 'Título',             icone: '📝', descricao: 'Campo de texto curto',                          categoria: 'basico' },
  { id: 'subtitulo',    nome: 'Sub-título',          icone: '📄', descricao: 'Texto curto secundário',                       categoria: 'basico' },
  { id: 'texto',        nome: 'Texto',               icone: '📃', descricao: 'Campo de texto livre',                         categoria: 'basico' },
  { id: 'descricao',    nome: 'Descrição',           icone: '📋', descricao: 'Texto longo e detalhado',                      categoria: 'basico' },
  { id: 'galeria',      nome: 'Galeria de Fotos',    icone: '🖼️', descricao: 'Upload de múltiplas imagens',                  categoria: 'basico' },
  { id: 'antes_depois', nome: 'Antes e Depois',      icone: '🔄', descricao: 'Dois campos de foto lado a lado',              categoria: 'basico' },
  { id: 'checklist',    nome: 'Checklist',           icone: '✅', descricao: 'Lista de itens marcáveis',                    categoria: 'basico' },
  { id: 'assinatura',   nome: 'Assinatura Digital',  icone: '✍️', descricao: 'Campo de assinatura com dedo ou mouse',       categoria: 'basico' },
  { id: 'edicao_imagem', nome: 'Edição de Imagem',    icone: '🖊️', descricao: 'Tirar foto e marcar detalhes com seta, círculo, texto', categoria: 'basico' },
  { id: 'status',       nome: 'Status',              icone: '🔵', descricao: 'Seleção de status colorido',                  categoria: 'basico' },
  { id: 'prioridade',   nome: 'Prioridade',          icone: '⚠️', descricao: 'Baixa / Média / Alta / Urgente',              categoria: 'basico' },

  // Avaliação
  { id: 'avaliacao_estrela', nome: 'Avaliação Estrela (1-5)', icone: '⭐', descricao: 'Avaliação com estrelas de 1 a 5',     categoria: 'avaliacao' },
  { id: 'avaliacao_escala',  nome: 'Avaliação Escala (0-10)', icone: '📊', descricao: 'Escala numérica de 0 a 10',          categoria: 'avaliacao' },
  { id: 'satisfacao',        nome: 'Pesquisa de Satisfação',  icone: '😊', descricao: 'Formulário de satisfação do serviço', categoria: 'avaliacao' },

  // Comunicação
  { id: 'perguntas',    nome: 'Perguntas e Respostas', icone: '💬', descricao: 'Campo de perguntas e respostas',            categoria: 'comunicacao' },
  { id: 'avisos',       nome: 'Avisos',                icone: '🔔', descricao: 'Texto de aviso em destaque',               categoria: 'comunicacao' },
  { id: 'comunicados',  nome: 'Comunicados',           icone: '📢', descricao: 'Mensagem informativa destacada',            categoria: 'comunicacao' },
  { id: 'feedback',     nome: 'Feedback',              icone: '💡', descricao: 'Campo aberto de retorno do usuário',        categoria: 'comunicacao' },
  { id: 'documentos',   nome: 'Documentos',            icone: '📁', descricao: 'Upload e download de documentos via QR Code', categoria: 'comunicacao' },

  // Operacional
  { id: 'urgencias',       nome: 'Reportar Urgências',     icone: '🚨', descricao: 'Campo especial com alerta de urgência', categoria: 'operacional' },
  { id: 'agendar',         nome: 'Agendar Serviço Extra',  icone: '📅', descricao: 'Data e hora de agendamento',           categoria: 'operacional' },
  { id: 'controle_ponto',  nome: 'Controle de Ponto',      icone: '🕐', descricao: 'Hora de entrada e saída',             categoria: 'operacional' },
  { id: 'sla',             nome: 'SLA — Tempo de Resposta',icone: '⏰', descricao: 'Define prazo máximo do chamado',       categoria: 'operacional' },
  { id: 'ocorrencia',      nome: 'Informar Ocorrência',    icone: '📸', descricao: 'Campo de ocorrência com detalhes',    categoria: 'operacional' },
  { id: 'problema',        nome: 'Problema de Manutenção', icone: '🔧', descricao: 'Descrição específica do problema',     categoria: 'operacional' },
  { id: 'localizacao',     nome: 'Localização GPS',        icone: '📍', descricao: 'Captura GPS e mostra endereço no mapa', categoria: 'operacional' },
  { id: 'servicos_valores', nome: 'Serviços e Valores',   icone: '💰', descricao: 'Tabela de serviços com quantidade, descrição e preço', categoria: 'operacional' },

  // Tempo
  { id: 'horario_inicial', nome: 'Horário Inicial',        icone: '▶️', descricao: 'Marca o início — preenchido automaticamente ao abrir o chamado',     categoria: 'tempo' },
  { id: 'horario_final',   nome: 'Horário Final',          icone: '⏹️', descricao: 'Marca o fim — preenchido automaticamente ao finalizar',              categoria: 'tempo' },
  { id: 'tempo_total',     nome: 'Tempo Total Percorrido', icone: '⏱️', descricao: 'Calculado automaticamente: Horário Final − Horário Inicial',          categoria: 'tempo' },
  { id: 'vencimento',      nome: 'Agenda de Vencimentos',  icone: '📅', descricao: 'Data de vencimento + até 5 lembretes por e-mail e no sistema — painel mostra dias restantes ou atraso', categoria: 'tempo' },

  // Veículo
  { id: 'kilometragem', nome: 'Kilometragem',     icone: '🛣️', descricao: 'Campo numérico com histórico de km',           categoria: 'veiculo' },
  { id: 'placa',        nome: 'Placa',            icone: '🚗', descricao: 'Campo + dropdown configurável pelo gestor',    categoria: 'veiculo', temDropdown: true },
  { id: 'modelo',       nome: 'Modelo',           icone: '🚙', descricao: 'Campo + dropdown configurável pelo gestor',    categoria: 'veiculo', temDropdown: true },
  { id: 'cor_veiculo',  nome: 'Cor do Veículo',   icone: '🎨', descricao: 'Campo + dropdown configurável pelo gestor',    categoria: 'veiculo', temDropdown: true },
  { id: 'tipo_veiculo', nome: 'Tipo de Veículo',  icone: '🚛', descricao: 'Campo + dropdown configurável pelo gestor',    categoria: 'veiculo', temDropdown: true },

  // Documentos
  { id: 'upload_documento', nome: 'Upload de Documento',  icone: '📎', descricao: 'Anexar arquivos PDF, imagens ou documentos',        categoria: 'documentos' },
  { id: 'orcamento',        nome: 'Orçamento',            icone: '💲', descricao: 'Anexar proposta de orçamento do serviço',           categoria: 'documentos' },
  { id: 'recibo',            nome: 'Recibo',              icone: '🧾', descricao: 'Recibo com dados do contratante, prestador, serviço e valor', categoria: 'documentos' },
  { id: 'recibo_simples',    nome: 'Recibo Modelo Simples', icone: '📃', descricao: 'Recibo clássico de prestação de serviço com declaração de pagamento', categoria: 'documentos' },
  { id: 'contrato_servico',  nome: 'Contrato de Serviço',    icone: '📄', descricao: 'Contrato completo de prestação de serviços de manutenção com cláusulas editáveis', categoria: 'documentos' },
];

export const CATEGORIAS_BLOCOS: { id: string; label: string; cor: string }[] = [
  { id: 'basico',       label: '📝 Básico',        cor: '#1a73e8' },
  { id: 'avaliacao',    label: '⭐ Avaliação',      cor: '#f57c00' },
  { id: 'comunicacao',  label: '💬 Comunicação',    cor: '#7b1fa2' },
  { id: 'operacional',  label: '⚙️ Operacional',   cor: '#00897b' },
  { id: 'tempo',        label: '⏱️ Tempo',          cor: '#d32f2f' },
  { id: 'veiculo',      label: '🚗 Veículo',        cor: '#455a64' },
  { id: 'documentos',   label: '📄 Documentos',     cor: '#5d4037' },
];

// ── Sugestões de nome para a função ──────────────────────────────────────
export const NOMES_SUGESTOES = [
  { nome: 'Manutenção',  icone: '🔧' },
  { nome: 'Vistoria',    icone: '🔍' },
  { nome: 'Ocorrência',  icone: '⚠️' },
  { nome: 'Problema',    icone: '🛠️' },
  { nome: 'Inspeção',    icone: '📋' },
  { nome: 'Emergência',  icone: '🚨' },
  { nome: 'Revisão',     icone: '🔩' },
  { nome: 'Chamado',     icone: '📞' },
];

// ── Emojis disponíveis para ícone ─────────────────────────────────────────
export const EMOJIS_DISPONIVEIS = [
  '🔧','🔍','⚠️','🛠️','📋','🚨','🔩','💧','⚡','🌡️',
  '🔒','📦','🏗️','🪣','🔌','🛁','🚿','🪟','🚪','🧰',
  '🔦','📢','📝','✅','🔔','🎯','📌','🏷️','🔑','⚙️',
  '🚗','🚛','🏭','🏢','🧱','🪚','🗜️','📐','📏','🔭',
];

// ── Cores disponíveis para o tile ─────────────────────────────────────────
export const CORES_DISPONIVEIS = [
  '#FFD600', '#FF8F00', '#FF6D00', '#D50000',
  '#C51162', '#AA00FF', '#2962FF', '#0091EA',
  '#00BFA5', '#00C853', '#37474F', '#212121',
];

// ── Rótulo de perfis ──────────────────────────────────────────────────────
export const ROLE_LABEL: Record<string, string> = {
  master:        '👑 Master',
  administrador: 'Administrador',
  supervisor:    'Supervisor',
  funcionario:   'Funcionário / Cliente / Morador',
};
