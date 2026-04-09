// ── Bloco disponível para montar formulário ───────────────────────────────
export interface BlocoDisponivel {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  categoria: 'basico' | 'avaliacao' | 'comunicacao' | 'operacional' | 'tempo' | 'veiculo' | 'documentos' | 'ordem_servico';
  temDropdown?: boolean;
}

// ── Bloco já adicionado ao formulário de uma função ───────────────────────
export interface BlocoSelecionado {
  uid: string;
  tipo: string;
  label?: string;
  obrigatorio: boolean;
  opcoes?: string[];
}

// ── Função de manutenção criada pelo gestor ───────────────────────────────
export interface FuncaoManutencao {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  blocos: BlocoSelecionado[];
  qrTipo: 'publico' | 'privado' | 'chave' | 'nenhum';
  qrChave?: string;
  criadoPor: string;
  criadoEm: number;
  ativo: boolean;
}

// ── Chamado criado pelo gestor ou funcionário ─────────────────────────────
export interface ChamadoManutencao {
  id: string;
  numero: number;        // sequencial 1-9999
  protocolo: string;
  funcaoId: string;
  funcaoNome: string;
  funcaoIcone: string;
  funcaoCor: string;
  responsavel: string;        // nome para exibição
  responsavelId: string;      // userId do responsável
  responsavelCargo?: string;  // cargo do funcionário
  status: 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';
  horarioInicial: number;
  horarioFinal?: number;
  tempoTotal?: number;
  respostas: Record<string, any>;
  criadoPor: string;
  criadoPorNome: string;
  criadoPorRole: string;
  criadoEm: number;
  observacoes?: string;
  localizacao?: { lat: number; lng: number; endereco?: string };
  adminId?: string;
  supervisorId?: string;
  osTitulo?: string;
  osNumero?: string;
}

// ── Dados de orçamento embutido no chamado ────────────────────────────────
export interface OrcamentoData {
  _tipo: 'orcamento';
  itens?: Array<{ descricao: string; qtd: string; unitario: string }>;
  numeroOrcamento?: string;
  empresaNome?: string;
  empresaDoc?: string;
  empresaTelefone?: string;
  empresaEmail?: string;
  empresaEndereco?: string;
  clienteNome?: string;
  clienteDoc?: string;
  clienteTelefone?: string;
  clienteEndereco?: string;
  formaPagamento?: string;
  parcelas?: string;
  previsaoHoras?: string;
  previsaoDias?: string;
  previsaoMeses?: string;
  dataInicio?: string;
  validade?: string;
  observacoes?: string;
}

// ── Dados de contrato embutido no chamado ─────────────────────────────────
export interface ContratoData {
  _tipo: 'contrato_servico';
  contratanteNome?: string;
  contratanteDoc?: string;
  contratadoNome?: string;
  contratadoDoc?: string;
  objetoDescricao?: string;
  valor?: string;
  prazoInicio?: string;
  prazoFim?: string;
}

// ── Dados de recibo embutido no chamado ───────────────────────────────────
export interface ReciboData {
  _tipo?: string;
  nomeContratante?: string;
  docContratante?: string;
  nomePrestador?: string;
  docPrestador?: string;
  descricaoServico?: string;
  formaPagamento?: string;
  valorRecebido?: string;
  local?: string;
  data?: string;
  numeroRecibo?: string;
}
