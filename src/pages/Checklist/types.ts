// ── Problema reportado em um item ────────────────────────────────────────
export interface ProblemaItem {
  descricao: string;
  fotos: string[];   // base64 das imagens (comprimidas)
  audio?: string;    // chave do localStorage para áudio
  registradoEm: number;
}

// ── Item individual do checklist ──────────────────────────────────────────
export interface ItemChecklist {
  id: string;
  texto: string;
  status: 'pendente' | 'concluido' | 'problema';
  problema?: ProblemaItem;
}

// ── Checklist completo ────────────────────────────────────────────────────
export interface Checklist {
  id: string;
  protocolo: string;           // CHK-YYYYMMDD-XXXX
  tipo: 'livre' | 'admin';
  titulo: string;
  itens: ItemChecklist[];
  criadoPor: string;
  criadoPorNome: string;
  responsavelId?: string;      // funcionário atribuído (tipo admin)
  responsavelNome?: string;
  status: 'ativo' | 'em_andamento' | 'concluido';
  criadoEm: number;
  concluidoEm?: number;
  horarioInicial?: number;
  horarioFinal?: number;
  tempoTotal?: number;
  localizacao?: { lat: number; lng: number; endereco?: string };
  adminId?: string;
  supervisorId?: string;
}
