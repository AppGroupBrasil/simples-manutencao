import React, { useMemo } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';
import type { Documento } from './types';
import styles from './Documentos.module.css';

const DOCS_KEY = 'sm_documentos_v1';

function carregar(): Documento[] {
  try {
    const v = localStorage.getItem(DOCS_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  docId: string;
}

const DocumentoDownloadPage: React.FC<Props> = ({ docId }) => {
  const doc = useMemo(() => {
    return carregar().find(d => d.id === docId) || null;
  }, [docId]);

  const baixar = () => {
    if (!doc) return;
    const a = document.createElement('a');
    a.href = doc.base64;
    a.download = doc.nomeArquivo;
    a.click();
  };

  if (!doc) {
    return (
      <div className={styles.downloadPage}>
        <div className={styles.downloadCard}>
          <div className={styles.downloadIcone} style={{ background: '#fee2e2' }}>
            <AlertCircle size={32} color="#dc2626" />
          </div>
          <h1 className={styles.downloadTitulo}>Documento não encontrado</h1>
          <p className={styles.downloadMeta}>O documento pode ter sido removido ou o link está incorreto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.downloadPage}>
      <div className={styles.downloadCard}>
        <div className={styles.downloadIcone}>
          <FileText size={32} />
        </div>
        <h1 className={styles.downloadTitulo}>{doc.titulo}</h1>
        <p className={styles.downloadArquivo}>{doc.nomeArquivo}</p>
        <p className={styles.downloadMeta}>
          {formatarTamanho(doc.tamanho)} • {new Date(doc.criadoEm).toLocaleDateString('pt-BR')}
        </p>

        {doc.descricao && (
          <div className={styles.downloadDescricao}>{doc.descricao}</div>
        )}

        <button className={styles.btnBaixar} onClick={baixar}>
          <Download size={20} /> Baixar Documento
        </button>

        <div className={styles.downloadRodape}>
          <img src="/logos/logo.png" alt="Logo" style={{ height: 16, objectFit: 'contain', filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)' }} />
          Simples Manutenção
        </div>
      </div>
    </div>
  );
};

export default DocumentoDownloadPage;
