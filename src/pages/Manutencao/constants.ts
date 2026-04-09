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
  // Ordem de Serviço
  { id: 'ordem_servico',            nome: 'O.S Geral',                 icone: '📋', descricao: 'Ordem de serviço padrão com dados do serviço, responsável e prazo',                     categoria: 'ordem_servico' },
  { id: 'os_assistencia_tecnica',   nome: 'O.S Assistência Técnica',   icone: '🛠️', descricao: 'Ordem de serviço para assistência técnica com diagnóstico e reparo',                     categoria: 'ordem_servico' },
  { id: 'os_manutencao_corretiva',  nome: 'O.S Manutenção Corretiva',  icone: '🔧', descricao: 'Ordem de serviço para correção de falhas e reparos emergenciais',                         categoria: 'ordem_servico' },
  { id: 'os_manutencao_preventiva', nome: 'O.S Manutenção Preventiva', icone: '🔩', descricao: 'Ordem de serviço para manutenções programadas e preventivas',                              categoria: 'ordem_servico' },
  { id: 'os_instalacao',            nome: 'O.S Instalação',            icone: '⚡', descricao: 'Ordem de serviço para instalação de equipamentos ou sistemas',                            categoria: 'ordem_servico' },
  { id: 'os_vistoria',              nome: 'O.S Vistoria',              icone: '🔍', descricao: 'Ordem de serviço para inspeção e vistoria técnica',                                       categoria: 'ordem_servico' },
];

export const CATEGORIAS_BLOCOS: { id: string; label: string; cor: string }[] = [
  { id: 'basico',       label: '📝 Básico',        cor: '#1a73e8' },
  { id: 'avaliacao',    label: '⭐ Avaliação',      cor: '#f57c00' },
  { id: 'comunicacao',  label: '💬 Comunicação',    cor: '#7b1fa2' },
  { id: 'operacional',  label: '⚙️ Operacional',   cor: '#00897b' },
  { id: 'tempo',        label: '⏱️ Tempo',          cor: '#d32f2f' },
  { id: 'veiculo',      label: '🚗 Veículo',        cor: '#455a64' },
  { id: 'documentos',     label: '📄 Documentos',       cor: '#5d4037' },
  { id: 'ordem_servico', label: '📋 Ordem de Serviço', cor: '#e65100' },
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

// ── Definição de campos por modelo O.S (compartilhamento) ─────────────────
export interface OSCampoShare {
  key: string;
  label: string;
  tipo?: 'text' | 'textarea' | 'date' | 'datetime-local' | 'time' | 'number' | 'select' | 'signature';
  opcoes?: string[];
  placeholder?: string;
  grupo?: string;
}

export interface OSModeloShare {
  titulo: string;
  subtitulo: string;
  prefixo: string;
  contadorKey: string;
  cor: string;
  icone: string;
  campos: OSCampoShare[];
}

export const OS_MODELOS_SHARE: Record<string, OSModeloShare> = {
  os_assistencia_tecnica: {
    titulo: 'ORDEM DE SERVIÇO', subtitulo: 'ASSISTÊNCIA TÉCNICA', prefixo: 'OSAT',
    contadorKey: 'sm_contador_os_at_pub', cor: '#b45309', icone: '🛠️',
    campos: [
      { key: 'maquinaNome', label: 'Nome da Máquina', placeholder: 'Nome...', grupo: '🖥️ Máquina / Equipamento' },
      { key: 'maquinaCodigo', label: 'Código / Patrimônio', placeholder: 'Código...', grupo: '🖥️ Máquina / Equipamento' },
      { key: 'maquinaModelo', label: 'Modelo', placeholder: 'Modelo...', grupo: '🖥️ Máquina / Equipamento' },
      { key: 'maquinaMarca', label: 'Marca', placeholder: 'Marca...', grupo: '🖥️ Máquina / Equipamento' },
      { key: 'maquinaLocalizacao', label: 'Localização', placeholder: 'Localização...', grupo: '🖥️ Máquina / Equipamento' },
      { key: 'tecnicoNome', label: 'Nome do Técnico', placeholder: 'Técnico...', grupo: '👷 Técnico' },
      { key: 'tecnicoDescricao', label: 'Descrição do Problema', tipo: 'textarea', placeholder: 'Descreva...', grupo: '👷 Técnico' },
      { key: 'avaliacaoTerceirizada', label: 'Parecer / Laudo', tipo: 'textarea', placeholder: 'Parecer...', grupo: '📋 Avaliação' },
      { key: 'prestadoraNome', label: 'Prestadora', placeholder: 'Razão Social', grupo: '🏢 Prestadora' },
      { key: 'prestadoraCnpj', label: 'CNPJ', placeholder: 'CNPJ...', grupo: '🏢 Prestadora' },
      { key: 'prestadoraEmail', label: 'E-mail', placeholder: 'email@...', grupo: '🏢 Prestadora' },
      { key: 'prestadoraWhatsapp', label: 'WhatsApp', placeholder: '(00) 00000-0000', grupo: '🏢 Prestadora' },
      { key: 'prazoData', label: 'Data Limite', tipo: 'date', grupo: '📅 Prazo' },
      { key: 'prazoObs', label: 'Observação do Prazo', placeholder: 'Obs...', grupo: '📅 Prazo' },
      { key: 'gestorNome', label: 'Gestor', placeholder: 'Gestor...', grupo: '✅ Gestor' },
      { key: 'gestorCargo', label: 'Cargo', placeholder: 'Cargo...', grupo: '✅ Gestor' },
      { key: 'valorServico', label: 'Valor do Serviço (R$)', tipo: 'number', placeholder: '0,00', grupo: '💰 Valor' },
      { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Aguardando', 'Em andamento', 'Aguardando peça', 'Concluído', 'Cancelado'], grupo: '📊 Status' },
      { key: 'prioridade', label: 'Prioridade', tipo: 'select', opcoes: ['Baixa', 'Média', 'Alta', 'Urgente'], grupo: '📊 Status' },
      { key: 'assinaturaGestor', label: 'Assinatura do Gestor', tipo: 'signature', grupo: '✍️ Assinaturas' },
      { key: 'assinaturaTecnico', label: 'Assinatura do Técnico', tipo: 'signature', grupo: '✍️ Assinaturas' },
    ],
  },
  ordem_servico: {
    titulo: 'ORDEM DE SERVIÇO', subtitulo: 'GERAL', prefixo: 'OSG',
    contadorKey: 'sm_contador_os_geral_pub', cor: '#2563eb', icone: '📋',
    campos: [
      { key: 'solicitanteNome', label: 'Nome do Solicitante', placeholder: 'Nome...', grupo: '👤 Solicitante' },
      { key: 'solicitanteSetor', label: 'Setor / Unidade', placeholder: 'Setor...', grupo: '👤 Solicitante' },
      { key: 'solicitanteTelefone', label: 'Telefone / Ramal', placeholder: '(00) 00000-0000', grupo: '👤 Solicitante' },
      { key: 'descricao', label: 'Descrição do Serviço', tipo: 'textarea', placeholder: 'Descreva...', grupo: '📝 Descrição' },
      { key: 'local', label: 'Bloco / Área', placeholder: 'Bloco A...', grupo: '📍 Local' },
      { key: 'andar', label: 'Andar / Pavimento', placeholder: 'Térreo...', grupo: '📍 Local' },
      { key: 'responsavelNome', label: 'Responsável', placeholder: 'Nome...', grupo: '👷 Responsável' },
      { key: 'responsavelCargo', label: 'Cargo / Função', placeholder: 'Cargo...', grupo: '👷 Responsável' },
      { key: 'prazoData', label: 'Data Prevista', tipo: 'date', grupo: '📅 Prazo' },
      { key: 'prazoObs', label: 'Observação', placeholder: 'Dias úteis...', grupo: '📅 Prazo' },
      { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Aberta', 'Em andamento', 'Concluída', 'Cancelada'], grupo: '📊 Status' },
      { key: 'prioridade', label: 'Prioridade', tipo: 'select', opcoes: ['Baixa', 'Média', 'Alta', 'Urgente'], grupo: '📊 Status' },
      { key: 'observacoes', label: 'Observações', tipo: 'textarea', placeholder: 'Observações...', grupo: '📎 Observações' },
    ],
  },
  os_manutencao_corretiva: {
    titulo: 'ORDEM DE SERVIÇO', subtitulo: 'MANUTENÇÃO CORRETIVA', prefixo: 'OSMC',
    contadorKey: 'sm_contador_os_mc_pub', cor: '#dc2626', icone: '🔧',
    campos: [
      { key: 'equipNome', label: 'Nome do Equipamento', placeholder: 'Equipamento...', grupo: '🖥️ Equipamento' },
      { key: 'equipCodigo', label: 'Código / Patrimônio', placeholder: 'EQ-001', grupo: '🖥️ Equipamento' },
      { key: 'equipLocal', label: 'Localização', placeholder: 'Bloco A...', grupo: '🖥️ Equipamento' },
      { key: 'defeito', label: 'Defeito Reportado', tipo: 'textarea', placeholder: 'Descreva o defeito...', grupo: '⚠️ Defeito' },
      { key: 'dataParada', label: 'Data / Hora da Parada', tipo: 'datetime-local', grupo: '⚠️ Defeito' },
      { key: 'causa', label: 'Diagnóstico / Causa', tipo: 'textarea', placeholder: 'Causa...', grupo: '🔍 Diagnóstico' },
      { key: 'acaoCorretiva', label: 'Ação Corretiva', tipo: 'textarea', placeholder: 'O que foi feito...', grupo: '🛠️ Ação Corretiva' },
      { key: 'pecas', label: 'Peças e Materiais', tipo: 'textarea', placeholder: 'Peças...', grupo: '🛒 Peças' },
      { key: 'tecnicoNome', label: 'Técnico', placeholder: 'Nome...', grupo: '👷 Técnico' },
      { key: 'tecnicoEmpresa', label: 'Empresa', placeholder: 'Empresa...', grupo: '👷 Técnico' },
      { key: 'tempoInicio', label: 'Início', tipo: 'datetime-local', grupo: '⏱️ Tempo' },
      { key: 'tempoFim', label: 'Fim', tipo: 'datetime-local', grupo: '⏱️ Tempo' },
      { key: 'tempoTotal', label: 'Total (horas)', placeholder: 'Ex: 2h30', grupo: '⏱️ Tempo' },
      { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Aguardando', 'Em execução', 'Aguardando peça', 'Concluído', 'Reincidente'], grupo: '📊 Status' },
      { key: 'prioridade', label: 'Prioridade', tipo: 'select', opcoes: ['Baixa', 'Média', 'Alta', 'Urgente'], grupo: '📊 Status' },
    ],
  },
  os_manutencao_preventiva: {
    titulo: 'ORDEM DE SERVIÇO', subtitulo: 'MANUTENÇÃO PREVENTIVA', prefixo: 'OSMP',
    contadorKey: 'sm_contador_os_mp_pub', cor: '#16a34a', icone: '🔄',
    campos: [
      { key: 'equipNome', label: 'Equipamento', placeholder: 'Equipamento...', grupo: '🖥️ Equipamento' },
      { key: 'equipCodigo', label: 'Código', placeholder: 'EQ-001', grupo: '🖥️ Equipamento' },
      { key: 'equipLocal', label: 'Localização', placeholder: 'Bloco...', grupo: '🖥️ Equipamento' },
      { key: 'equipMarca', label: 'Marca / Modelo', placeholder: 'Marca...', grupo: '🖥️ Equipamento' },
      { key: 'tipoManutencao', label: 'Tipo de Manutenção', tipo: 'select', opcoes: ['Lubrificação', 'Limpeza', 'Calibração', 'Inspeção visual', 'Troca de peça', 'Teste funcional', 'Ajuste', 'Outro'], grupo: '📋 Tipo' },
      { key: 'frequencia', label: 'Frequência', tipo: 'select', opcoes: ['Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'], grupo: '🔁 Frequência' },
      { key: 'proximaData', label: 'Próxima Manutenção', tipo: 'date', grupo: '🔁 Frequência' },
      { key: 'tecnicoNome', label: 'Técnico', placeholder: 'Técnico...', grupo: '👷 Técnico' },
      { key: 'tecnicoEmpresa', label: 'Empresa', placeholder: 'Empresa...', grupo: '👷 Técnico' },
      { key: 'observacoes', label: 'Observações', tipo: 'textarea', placeholder: 'Observações...', grupo: '📝 Observações' },
      { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Programada', 'Em execução', 'Concluída', 'Adiada'], grupo: '📊 Status' },
    ],
  },
  os_instalacao: {
    titulo: 'ORDEM DE SERVIÇO', subtitulo: 'INSTALAÇÃO', prefixo: 'OSIN',
    contadorKey: 'sm_contador_os_inst_pub', cor: '#0891b2', icone: '📦',
    campos: [
      { key: 'itemNome', label: 'Nome / Descrição', placeholder: 'Ar condicionado...', grupo: '📦 Item a Instalar' },
      { key: 'itemModelo', label: 'Marca / Modelo', placeholder: 'Samsung...', grupo: '📦 Item a Instalar' },
      { key: 'itemSerie', label: 'Nº de Série', placeholder: 'SN-000...', grupo: '📦 Item a Instalar' },
      { key: 'itemQtd', label: 'Quantidade', tipo: 'number', placeholder: '1', grupo: '📦 Item a Instalar' },
      { key: 'localBloco', label: 'Bloco / Área', placeholder: 'Bloco A...', grupo: '📍 Local' },
      { key: 'localAndar', label: 'Andar / Pavimento', placeholder: 'Térreo...', grupo: '📍 Local' },
      { key: 'localDetalhe', label: 'Detalhes da Instalação', tipo: 'textarea', placeholder: 'Ponto exato...', grupo: '📍 Local' },
      { key: 'requisitos', label: 'Requisitos Técnicos', tipo: 'textarea', placeholder: 'Ponto elétrico...', grupo: '⚡ Requisitos' },
      { key: 'instaladorNome', label: 'Instalador', placeholder: 'Nome...', grupo: '👷 Instalador' },
      { key: 'instaladorEmpresa', label: 'Empresa', placeholder: 'Empresa...', grupo: '👷 Instalador' },
      { key: 'instaladorTelefone', label: 'Telefone', placeholder: '(00) 00000-0000', grupo: '👷 Instalador' },
      { key: 'dataInstalacao', label: 'Data Programada', tipo: 'date', grupo: '📅 Data' },
      { key: 'horaInstalacao', label: 'Horário Previsto', tipo: 'time', grupo: '📅 Data' },
      { key: 'testeFuncionamento', label: 'Teste de Funcionamento', tipo: 'select', opcoes: ['Sim, OK', 'Com ressalvas', 'Não funcional'], grupo: '✅ Teste' },
      { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Programada', 'Em instalação', 'Instalado', 'Cancelada'], grupo: '📊 Status' },
    ],
  },
  os_vistoria: {
    titulo: 'ORDEM DE SERVIÇO', subtitulo: 'VISTORIA', prefixo: 'OSVI',
    contadorKey: 'sm_contador_os_vist_pub', cor: '#7c3aed', icone: '🔍',
    campos: [
      { key: 'tipoVistoria', label: 'Tipo de Vistoria', tipo: 'select', opcoes: ['Entrada', 'Saída', 'Periódica', 'Segurança', 'Estrutural', 'Elétrica', 'Hidráulica'], grupo: '📋 Tipo' },
      { key: 'localBloco', label: 'Bloco / Área', placeholder: 'Bloco A...', grupo: '📍 Local' },
      { key: 'localResponsavel', label: 'Responsável pela Unidade', placeholder: 'Nome...', grupo: '📍 Local' },
      { key: 'parecer', label: 'Parecer Geral', tipo: 'textarea', placeholder: 'Parecer...', grupo: '📝 Parecer' },
      { key: 'resultado', label: 'Resultado', tipo: 'select', opcoes: ['Aprovado', 'Aprovado c/ ressalvas', 'Reprovado'], grupo: '📊 Resultado' },
      { key: 'vistoriadorNome', label: 'Vistoriador', placeholder: 'Nome...', grupo: '👷 Vistoriador' },
      { key: 'vistoriadorRegistro', label: 'CREA / Registro', placeholder: 'CREA...', grupo: '👷 Vistoriador' },
      { key: 'dataVistoria', label: 'Data da Vistoria', tipo: 'date', grupo: '📅 Data' },
    ],
  },
};
