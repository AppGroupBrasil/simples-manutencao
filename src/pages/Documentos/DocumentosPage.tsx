import React, { useState, useMemo, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Search, FileText, Plus, Download, Trash2, QrCode, X, Copy, Check, Printer, FileUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Documento } from './types';
import styles from './Documentos.module.css';

const DOCS_KEY = 'sm_documentos_v1';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function carregar(): Documento[] {
  try {
    const v = localStorage.getItem(DOCS_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}
function salvar(docs: Documento[]) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

function gerarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconeArquivo(tipo: string): string {
  if (tipo.startsWith('image/')) return '🖼️';
  if (tipo === 'application/pdf') return '📄';
  if (tipo.includes('word') || tipo.includes('document')) return '📝';
  if (tipo.includes('spreadsheet') || tipo.includes('excel')) return '📊';
  if (tipo.includes('presentation') || tipo.includes('powerpoint')) return '📽️';
  return '📎';
}

const DocumentosPage: React.FC = () => {
  const { usuario } = useAuth();
  const role = usuario?.role || 'funcionario';
  const podeGerenciar = role === 'master' || role === 'administrador' || role === 'supervisor';

  const [docs, setDocs] = useState<Documento[]>(carregar);
  const [busca, setBusca] = useState('');
  const [modalAbrir, setModalAbrir] = useState(false);
  const [qrDoc, setQrDoc] = useState<Documento | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Formulário novo documento
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoBase64, setArquivoBase64] = useState('');
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase();
    return docs
      .filter(d => !t || d.titulo.toLowerCase().includes(t) || d.nomeArquivo.toLowerCase().includes(t))
      .sort((a, b) => b.criadoEm - a.criadoEm);
  }, [docs, busca]);

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert('Arquivo muito grande. Máximo: 10 MB');
      return;
    }
    setArquivo(file);
    const reader = new FileReader();
    reader.onload = () => {
      setArquivoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const abrirModal = () => {
    setTitulo('');
    setDescricao('');
    setArquivo(null);
    setArquivoBase64('');
    setModalAbrir(true);
  };

  const salvarDocumento = () => {
    if (!titulo.trim() || !arquivo || !arquivoBase64) return;
    setSalvando(true);
    const novo: Documento = {
      id: gerarId(),
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      nomeArquivo: arquivo.name,
      tipoArquivo: arquivo.type,
      tamanho: arquivo.size,
      base64: arquivoBase64,
      criadoPor: usuario?.id || '',
      criadoPorNome: usuario?.nome || '',
      criadoEm: Date.now(),
    };
    const atualizado = [...docs, novo];
    salvar(atualizado);
    setDocs(atualizado);
    setModalAbrir(false);
    setSalvando(false);
  };

  const excluir = (id: string) => {
    if (!confirm('Excluir este documento?')) return;
    const atualizado = docs.filter(d => d.id !== id);
    salvar(atualizado);
    setDocs(atualizado);
  };

  const baixar = (doc: Documento) => {
    const a = document.createElement('a');
    a.href = doc.base64;
    a.download = doc.nomeArquivo;
    a.click();
  };

  const gerarUrl = (doc: Documento) => `${globalThis.location.origin}/documento/${doc.id}`;

  const copiarUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const imprimirQR = () => {
    if (!qrDoc || !qrRef.current) return;
    const dataUrl = qrRef.current.toDataURL('image/png');
    const url = gerarUrl(qrDoc);
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>QR Code — ${qrDoc.titulo}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:210mm; min-height:297mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { font-family:'Segoe UI',system-ui,sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#fff; }
  .qr { width:250px; height:250px; }
  h1 { margin-top:30px; font-size:28px; color:#0D0D0D; }
  p { margin-top:12px; font-size:14px; color:#666; max-width:400px; text-align:center; }
  .url { margin-top:20px; font-size:11px; color:#999; word-break:break-all; }
</style></head><body>
  <img class="qr" src="${dataUrl}" alt="QR Code" />
  <h1>${qrDoc.titulo}</h1>
  <p>Escaneie o QR Code para baixar o documento</p>
  <div class="url">${url}</div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const w = globalThis.open(blobUrl, '_blank');
    if (w) {
      w.onload = () => { w.print(); URL.revokeObjectURL(blobUrl); };
    }
  };

  return (
    <div className={styles.pagina}>
      {/* Cabeçalho */}
      <div className={styles.cabecalho}>
        <div className={styles.cabecalhoIcone}><FileText size={24} /></div>
        <div className={styles.cabecalhoTexto}>
          <h1>Documentos</h1>
          <p>Envie documentos e gere QR Codes para download</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.barraBusca}>
          <Search size={16} color="#999" />
          <input
            type="text"
            placeholder="Buscar documento..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        {podeGerenciar && (
          <button className={styles.btnNovo} onClick={abrirModal}>
            <Plus size={18} /> Novo Documento
          </button>
        )}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className={styles.vazio}>
          <FileText size={48} />
          <p>{busca ? 'Nenhum documento encontrado' : 'Nenhum documento enviado ainda'}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtrados.map(doc => (
            <div key={doc.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcone}>
                  <span style={{ fontSize: 22 }}>{iconeArquivo(doc.tipoArquivo)}</span>
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitulo}>{doc.titulo}</h3>
                  <div className={styles.cardArquivo}>{doc.nomeArquivo}</div>
                </div>
              </div>

              {doc.descricao && (
                <div className={styles.cardDescricao}>{doc.descricao}</div>
              )}

              <div className={styles.cardMeta}>
                <span>{formatarTamanho(doc.tamanho)}</span>
                <span>•</span>
                <span>{new Date(doc.criadoEm).toLocaleDateString('pt-BR')}</span>
                <span>•</span>
                <span>{doc.criadoPorNome}</span>
              </div>

              <div className={styles.cardAcoes}>
                <button className={`${styles.btnAcao} ${styles.btnQR}`} onClick={() => setQrDoc(doc)}>
                  <QrCode size={14} /> QR Code
                </button>
                <button className={`${styles.btnAcao} ${styles.btnDownload}`} onClick={() => baixar(doc)}>
                  <Download size={14} /> Baixar
                </button>
                {podeGerenciar && (
                  <button className={`${styles.btnAcao} ${styles.btnExcluir}`} onClick={() => excluir(doc.id)}>
                    <Trash2 size={14} /> Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Novo Documento ── */}
      {modalAbrir && (
        <div className={styles.overlay} onClick={() => setModalAbrir(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitulo}><FileUp size={22} /> Novo Documento</h2>

            <div className={styles.campo}>
              <label htmlFor="doc-titulo">Título *</label>
              <input id="doc-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Manual de Procedimentos" />
            </div>

            <div className={styles.campo}>
              <label htmlFor="doc-descricao">Descrição (opcional)</label>
              <textarea id="doc-descricao" rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Breve descrição do documento..." />
            </div>

            <div className={styles.campo}>
              <label>Arquivo *</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                style={{ display: 'none' }}
                onChange={e => handleFileChange(e.target.files?.[0] || null)}
              />
              <div
                className={`${styles.dropzone} ${arquivo ? styles.dropzoneAtivo : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {arquivo ? (
                  <div className={styles.dropzoneArquivo}>
                    <span style={{ fontSize: 24 }}>{iconeArquivo(arquivo.type)}</span>
                    <span>{arquivo.name} ({formatarTamanho(arquivo.size)})</span>
                  </div>
                ) : (
                  <>
                    <FileUp size={28} style={{ marginBottom: 6 }} />
                    <p style={{ fontWeight: 700, fontSize: 14 }}>Clique para selecionar arquivo</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>PDF, Word, Excel, PowerPoint, Imagens — máx. 10 MB</p>
                  </>
                )}
              </div>
            </div>

            <div className={styles.modalAcoes}>
              <button className={styles.btnCancelar} onClick={() => setModalAbrir(false)}>Cancelar</button>
              <button className={styles.btnSalvar} disabled={!titulo.trim() || !arquivo || salvando} onClick={salvarDocumento}>
                <Check size={16} /> {salvando ? 'Salvando...' : 'Enviar Documento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: QR Code ── */}
      {qrDoc && (
        <div className={styles.overlay} onClick={() => setQrDoc(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setQrDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={20} /></button>
            </div>
            <div className={styles.qrModal}>
              <h2>{qrDoc.titulo}</h2>
              <p>Escaneie para baixar o documento</p>
              <QRCodeCanvas
                ref={qrRef}
                value={gerarUrl(qrDoc)}
                size={200}
                level="H"
                className={styles.qrCanvas}
              />
              <div className={styles.qrUrl}>{gerarUrl(qrDoc)}</div>
              <div className={styles.qrAcoes}>
                <button className={`${styles.qrBtn} ${styles.qrBtnCopiar}`} onClick={() => copiarUrl(gerarUrl(qrDoc))}>
                  {copiado ? <Check size={14} /> : <Copy size={14} />}
                  {copiado ? 'Copiado!' : 'Copiar Link'}
                </button>
                <button className={`${styles.qrBtn} ${styles.qrBtnImprimir}`} onClick={imprimirQR}>
                  <Printer size={14} /> Imprimir
                </button>
                <button className={`${styles.qrBtn} ${styles.qrBtnDownload}`} onClick={() => baixar(qrDoc)}>
                  <Download size={14} /> Baixar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosPage;
