export interface Documento {
  id: string;
  titulo: string;
  descricao?: string;
  nomeArquivo: string;
  tipoArquivo: string;      // MIME type
  tamanho: number;           // bytes
  base64: string;            // conteúdo do arquivo em base64
  criadoPor: string;         // userId
  criadoPorNome: string;
  criadoEm: number;          // timestamp
}
