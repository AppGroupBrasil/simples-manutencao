import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Camera, Plus, Trash2, Check, Pencil, AlertCircle, RotateCcw } from 'lucide-react';
import MicButton from '../../components/MicButton';
import EditorImagem from '../../components/EditorImagem';
import type { ChamadoManutencao } from './types';
import styles from './FormChamadoLivre.module.css';

const RASCUNHO_KEY = 'sm_livre_rascunho';
const CONTADOR_KEY = 'sm_contador_chamados';

function gerarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function gerarProtocolo() {
  const now = new Date();
  const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  return `CHM-${d}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}
function proximoNumero(): number {
  const atual = Number(localStorage.getItem(CONTADOR_KEY) || '0');
  const prox  = atual >= 9999 ? 1 : atual + 1;
  localStorage.setItem(CONTADOR_KEY, String(prox));
  return prox;
}

export interface ItemLivre {
  id: string;
  descricao: string;
  fotos: string[];
}

const itemVazio = (): ItemLivre => ({ id: gerarId(), descricao: '', fotos: [] });

interface Props {
  usuarioId: string;
  usuarioNome: string;
  usuarioRole: string;
  adminId?: string;
  supervisorId?: string;
  onEnviar: (chamado: ChamadoManutencao) => void;
  onCancelar: () => void;
}

const FormChamadoLivre: React.FC<Props> = ({
  usuarioId, usuarioNome, usuarioRole, adminId, supervisorId, onEnviar, onCancelar,
}) => {
  const horarioInicial = useRef(Date.now());
  const [itens, setItens] = useState<ItemLivre[]>([itemVazio()]);
  const [editando, setEditando] = useState<{ itemId: string; fotoIdx: number } | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [mostrarRestaurar, setMostrarRestaurar] = useState(false);
  const [infoRascunho, setInfoRascunho] = useState({ nItens: 0, nFotos: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [geoLocal, setGeoLocal] = useState<{ lat: number; lng: number; endereco?: string } | null>(null);

  // Captura localização ao abrir o formulário
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc: { lat: number; lng: number; endereco?: string } = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json&accept-language=pt-BR`);
          const j = await r.json();
          if (j.display_name) loc.endereco = j.display_name;
        } catch { /* sem endereço */ }
        setGeoLocal(loc);
      },
      () => { /* permissão negada */ },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Verifica rascunho ao abrir
  useEffect(() => {
    const raw = localStorage.getItem(RASCUNHO_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.itens?.length) {
        const nFotos = draft.itens.reduce((acc: number, i: ItemLivre) => acc + i.fotos.length, 0);
        setInfoRascunho({ nItens: draft.itens.length, nFotos });
        setMostrarRestaurar(true);
      }
    } catch { /* rascunho inválido */ }
  }, []);

  const restaurar = () => {
    const raw = localStorage.getItem(RASCUNHO_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.itens) setItens(draft.itens);
      if (draft.horarioInicial) horarioInicial.current = draft.horarioInicial;
    } catch { /* ignora */ }
    setMostrarRestaurar(false);
  };

  const descartar = () => {
    localStorage.removeItem(RASCUNHO_KEY);
    setMostrarRestaurar(false);
  };

  // Auto-save com debounce de 1s
  const salvarRascunho = useCallback((itensAtuais: ItemLivre[]) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(RASCUNHO_KEY, JSON.stringify({
        itens: itensAtuais,
        horarioInicial: horarioInicial.current,
        salvoEm: Date.now(),
      }));
    }, 1000);
  }, []);

  const updateItens = (fn: (prev: ItemLivre[]) => ItemLivre[]) => {
    setItens(prev => {
      const next = fn(prev);
      salvarRascunho(next);
      return next;
    });
  };

  // Compressão de foto
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

  const adicionarFotos = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const compressed = await Promise.all(files.map(comprimirFoto));
    updateItens(prev => prev.map(item =>
      item.id === itemId ? { ...item, fotos: [...item.fotos, ...compressed] } : item
    ));
    e.target.value = '';
  };

  const salvarEdicaoFoto = (imagem: string) => {
    if (!editando) return;
    updateItens(prev => prev.map(item =>
      item.id === editando.itemId
        ? { ...item, fotos: item.fotos.map((f, i) => i === editando.fotoIdx ? imagem : f) }
        : item
    ));
    setEditando(null);
  };

  const handleEnviar = () => {
    const validos = itens.filter(i => i.descricao.trim() || i.fotos.length > 0);
    if (validos.length === 0) {
      alert('Adicione pelo menos uma descrição ou foto antes de salvar.');
      return;
    }
    const agora = Date.now();
    const chamado: ChamadoManutencao = {
      id: gerarId(),
      numero: proximoNumero(),
      protocolo: gerarProtocolo(),
      funcaoId: 'livre',
      funcaoNome: 'Manutenção Livre',
      funcaoIcone: '📋',
      funcaoCor: '#6366f1',
      responsavel: usuarioNome,
      responsavelId: usuarioId,
      status: 'concluido',
      horarioInicial: horarioInicial.current,
      horarioFinal: agora,
      tempoTotal: agora - horarioInicial.current,
      respostas: { itens: validos },
      criadoPor: usuarioId,
      criadoPorNome: usuarioNome,
      criadoPorRole: usuarioRole,
      criadoEm: agora,
      adminId,
      supervisorId,
      ...(geoLocal ? { localizacao: geoLocal } : {}),
    };
    localStorage.removeItem(RASCUNHO_KEY);
    onEnviar(chamado);
  };

  const handleCancelar = () => {
    const temConteudo = itens.some(i => i.descricao || i.fotos.length > 0);
    if (temConteudo) {
      if (confirm('Deseja manter o rascunho para continuar depois?')) {
        clearTimeout(debounceRef.current);
        localStorage.setItem(RASCUNHO_KEY, JSON.stringify({
          itens,
          horarioInicial: horarioInicial.current,
          salvoEm: Date.now(),
        }));
      } else {
        localStorage.removeItem(RASCUNHO_KEY);
      }
    }
    onCancelar();
  };

  const fotoEditando = editando
    ? itens.find(i => i.id === editando.itemId)?.fotos[editando.fotoIdx]
    : undefined;

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

      {fotoEditando && (
        <EditorImagem
          imagemSrc={fotoEditando}
          onSalvar={salvarEdicaoFoto}
          onCancelar={() => setEditando(null)}
        />
      )}

      <div className={styles.overlay}>
        <div className={styles.modal}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitulo}>
              <span className={styles.headerIcone}>📋</span>
              <div>
                <h2>Manutenção Livre</h2>
                <p className={styles.headerSub}>Registre fotos e descrições livremente</p>
              </div>
            </div>
            <button className={styles.fechar} onClick={handleCancelar}><X size={22} /></button>
          </div>

          {/* Banner rascunho */}
          {mostrarRestaurar && (
            <div className={styles.bannerRascunho}>
              <AlertCircle size={17} style={{ flexShrink:0 }} />
              <span>
                Rascunho encontrado — <strong>{infoRascunho.nItens} item(s)</strong> e{' '}
                <strong>{infoRascunho.nFotos} foto(s)</strong>
              </span>
              <button className={styles.btnRestaurar} onClick={restaurar}>
                <RotateCcw size={13} /> Restaurar
              </button>
              <button className={styles.btnDescartar} onClick={descartar} title="Descartar rascunho">
                <X size={13} />
              </button>
            </div>
          )}

          {/* Corpo */}
          <div className={styles.corpo}>
            {itens.map((item, idx) => (
              <div key={item.id} className={styles.itemCard}>

                <div className={styles.itemHeader}>
                  <span className={styles.itemNumero}>Item {idx + 1}</span>
                  {itens.length > 1 && (
                    <button
                      className={styles.btnRemoverItem}
                      onClick={() => updateItens(prev => prev.filter(i => i.id !== item.id))}
                      title="Remover item"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Fotos */}
                <div className={styles.fotosGrid}>
                  {item.fotos.map((f, fi) => (
                    <div key={fi} className={styles.fotoItem}>
                      <img src={f} alt={`foto ${fi+1}`} className={styles.fotoImg}
                      onClick={() => setFotoAmpliada(f)} style={{ cursor:'zoom-in' }} />
                      <button
                        className={styles.fotoEditar}
                        onClick={() => setEditando({ itemId: item.id, fotoIdx: fi })}
                        title="Anotar / editar foto"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        className={styles.fotoRemover}
                        onClick={() => updateItens(prev => prev.map(i =>
                          i.id === item.id ? { ...i, fotos: i.fotos.filter((_,j) => j !== fi) } : i
                        ))}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <label className={styles.fotoAdd}>
                    <Camera size={22} />
                    <span>Foto</span>
                    <input
                      type="file" accept="image/*" multiple
                      onChange={e => adicionarFotos(item.id, e)}
                      style={{ display:'none' }}
                    />
                  </label>
                </div>

                {/* Descrição */}
                <div className={styles.descricaoWrap}>
                  <div className={styles.descricaoLabelRow}>
                    <label className={styles.descricaoLabel}>Descrição</label>
                    <MicButton
                      onResult={texto => updateItens(prev => prev.map(i =>
                        i.id === item.id
                          ? { ...i, descricao: (i.descricao ? i.descricao + ' ' : '') + texto }
                          : i
                      ))}
                    />
                  </div>
                  <textarea
                    className={styles.textarea}
                    placeholder="Descreva o que foi feito... ou use o microfone 🎙️"
                    value={item.descricao}
                    onChange={e => updateItens(prev => prev.map(i =>
                      i.id === item.id ? { ...i, descricao: e.target.value } : i
                    ))}
                    rows={3}
                  />
                </div>

              </div>
            ))}

            {/* Adicionar item */}
            <button className={styles.btnAdicionarItem} onClick={() => updateItens(prev => [...prev, itemVazio()])}>
              <Plus size={18} /> Adicionar outro item
            </button>
          </div>

          {/* Rodapé */}
          <div className={styles.rodape}>
            <button className={styles.btnCancelar} onClick={handleCancelar}>Cancelar</button>
            <button className={styles.btnSalvar} onClick={handleEnviar}>
              <Check size={18} /> Salvar Manutenção
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default FormChamadoLivre;
