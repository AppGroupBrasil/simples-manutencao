import React, { useState } from 'react';
import { X, Camera, Check, Pencil } from 'lucide-react';
import type { ProblemaItem } from './types';
import MicButton    from '../../components/MicButton';
import EditorImagem from '../../components/EditorImagem';
import styles from './ReportarProblema.module.css';

interface Props {
  itemTexto: string;
  onSalvar: (problema: ProblemaItem) => void;
  onCancelar: () => void;
}

const ReportarProblema: React.FC<Props> = ({ itemTexto, onSalvar, onCancelar }) => {
  const [descricao, setDescricao] = useState('');
  const [fotos, setFotos]         = useState<string[]>([]);
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  const comprimirFoto = (file: File): Promise<string> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const MAX = 800;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width  = img.width  * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = ev.target!.result as string;
      };
      reader.readAsDataURL(file);
    });

  const adicionarFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const comprimidas = await Promise.all(files.map(comprimirFoto));
    setFotos(prev => [...prev, ...comprimidas]);
    e.target.value = '';
  };

  const salvarEdicao = (imagemEditada: string) => {
    if (editandoIdx === null) return;
    setFotos(prev => prev.map((f, i) => i === editandoIdx ? imagemEditada : f));
    setEditandoIdx(null);
  };

  const handleSalvar = () => {
    onSalvar({ descricao, fotos, registradoEm: Date.now() });
  };

  return (
    <>
      {/* Lightbox foto */}
      {fotoAmpliada && (
        <div
          onClick={() => setFotoAmpliada(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, cursor:'zoom-out' }}
        >
          <img src={fotoAmpliada} alt="foto ampliada"
            style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:12, boxShadow:'0 0 60px rgba(0,0,0,0.8)' }} />
          <button onClick={() => setFotoAmpliada(null)}
            style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}>
            <X size={22} />
          </button>
        </div>
      )}

      {/* Editor de imagem (sobrepõe tudo) */}
      {editandoIdx !== null && (
        <EditorImagem
          imagemSrc={fotos[editandoIdx]}
          onSalvar={salvarEdicao}
          onCancelar={() => setEditandoIdx(null)}
        />
      )}

      <div className={styles.overlay}>
        <div className={styles.modal}>

          <div className={styles.header}>
            <div className={styles.headerTitulo}>
              <span className={styles.alerta}>⚠️</span>
              <div>
                <h2>Reportar Problema</h2>
                <p className={styles.itemTexto}>{itemTexto}</p>
              </div>
            </div>
            <button className={styles.fechar} onClick={onCancelar}><X size={22} /></button>
          </div>

          <div className={styles.corpo}>

            {/* Descrição */}
            <div className={styles.secao}>
              <div className={styles.secaoLabelRow}>
                <label className={styles.secaoLabel}>📝 Descrição do problema</label>
                <MicButton onResult={texto => setDescricao(prev => prev ? prev + ' ' + texto : texto)} />
              </div>
              <textarea
                className={styles.textarea}
                placeholder="Descreva o que foi encontrado... ou clique em Falar 🎙️"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                rows={4}
              />
            </div>

            {/* Fotos */}
            <div className={styles.secao}>
              <label className={styles.secaoLabel}>📷 Fotos — toque em ✏️ para anotar</label>
              <div className={styles.fotosGrid}>
                {fotos.map((f, i) => (
                  <div key={i} className={styles.fotoItem}>
                    <img src={f} alt={`foto ${i+1}`} className={styles.fotoImg}
                      onClick={() => setFotoAmpliada(f)} style={{ cursor:'zoom-in' }} />

                    {/* Botão de editar (anotações) */}
                    <button
                      className={styles.fotoEditar}
                      onClick={() => setEditandoIdx(i)}
                      title="Anotar / marcar problema na foto"
                    >
                      <Pencil size={12} />
                    </button>

                    {/* Botão de remover */}
                    <button
                      className={styles.fotoRemover}
                      onClick={() => setFotos(p => p.filter((_,j) => j !== i))}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <label className={styles.fotoAdd}>
                  <Camera size={24} />
                  <span>Adicionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={adicionarFotos}
                    style={{ display:'none' }}
                  />
                </label>
              </div>
            </div>

          </div>

          <div className={styles.rodape}>
            <button className={styles.btnCancelar} onClick={onCancelar}>Cancelar</button>
            <button className={styles.btnSalvar} onClick={handleSalvar}>
              <Check size={18} /> Salvar Problema
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportarProblema;
