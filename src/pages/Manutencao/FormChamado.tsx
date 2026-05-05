import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, CheckCircle2, Clock, Camera, Star, Edit3, Save, Trash2, FileDown, Plus, Eye, EyeOff, RotateCcw } from 'lucide-react';
import EditorImagem from '../../components/EditorImagem';
import type { FuncaoManutencao, ChamadoManutencao, BlocoSelecionado } from './types';
import { BLOCOS_DISPONIVEIS, OS_MODELOS_SHARE } from './constants';
import MicButton from '../../components/MicButton';
import styles from './FormChamado.module.css';

/* ── Componente de Compartilhamento + Config de Campos Editáveis ── */
const _osShareOpen: Record<string, boolean> = {};
const _osShareEditaveis: Record<string, Record<string, boolean>> = {};

/* Helper para salvar dados da OS no localStorage e retornar um ID curto */
const _saveOSDataForShare = (modelo: string, dados: Record<string, unknown>, campos: { key: string }[]): string => {
  const clean: Record<string, string> = {};
  for (const c of campos) {
    const v = dados[c.key];
    if (v && typeof v === 'string') clean[c.key] = v;
  }
  if (dados.numero && typeof dados.numero === 'string') clean.numero = dados.numero;
  if (Object.keys(clean).length === 0) return '';
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  try {
    // Cleanup old share entries (older than 24h) to prevent localStorage bloat
    const cutoff = Date.now() - 86400000;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith('sm_os_share_')) {
        try {
          const entry = JSON.parse(localStorage.getItem(k) || '');
          if (entry?.ts && entry.ts < cutoff) localStorage.removeItem(k);
        } catch { localStorage.removeItem(k!); }
      }
    }
    localStorage.setItem(`sm_os_share_${id}`, JSON.stringify({ modelo, dados: clean, ts: Date.now() }));
  } catch { return ''; }
  return id;
};

const OSShareSection: React.FC<{
  modelo: string;
  secTitleFn: (icon: string, txt: string) => React.ReactNode;
  osData?: Record<string, unknown>;
}> = ({ modelo, secTitleFn, osData }) => {
  const lsKey = `sm_os_share_config_${modelo}`;
  const modeloDef = OS_MODELOS_SHARE[modelo];
  const campos = modeloDef?.campos || [];
  const [configAberto, setConfigAberto] = React.useState(() => !!_osShareOpen[modelo]);
  const [editaveis, setEditaveisRaw] = React.useState<Record<string, boolean>>(() => {
    if (_osShareEditaveis[modelo]) return _osShareEditaveis[modelo];
    try { return JSON.parse(localStorage.getItem(lsKey) || '{}'); } catch { return {}; }
  });
  const setEditaveis = React.useCallback((fn: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    setEditaveisRaw(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      _osShareEditaveis[modelo] = next;
      return next;
    });
  }, [modelo]);
  const [salvo, setSalvo] = React.useState(false);

  const toggleConfig = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfigAberto(prev => {
      const next = !prev;
      _osShareOpen[modelo] = next;
      return next;
    });
  }, [modelo]);

  const salvarConfig = () => {
    localStorage.setItem(lsKey, JSON.stringify(editaveis));
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };
  const toggleAll = (v: boolean) => {
    const novo: Record<string, boolean> = {};
    for (const c of campos) novo[c.key] = v;
    setEditaveis(novo);
  };
  const qtdEditaveis = campos.filter(c => editaveis[c.key]).length;

  const editKeys = campos.filter(c => editaveis[c.key]).map(c => c.key);
  const configParam = editKeys.length > 0 ? btoa(editKeys.join(',')) : '';

  const [shareId, setShareId] = React.useState('');
  const lastShareRef = React.useRef('');
  React.useEffect(() => {
    if (!osData) return;
    // Only regenerate share ID when data actually changes
    const snapshot = JSON.stringify(osData);
    if (snapshot === lastShareRef.current) return;
    lastShareRef.current = snapshot;
    // Remove previous share entry to avoid filling localStorage
    if (shareId) {
      try { localStorage.removeItem(`sm_os_share_${shareId}`); } catch { /* ok */ }
    }
    const id = _saveOSDataForShare(modelo, osData, campos);
    if (id) setShareId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo, osData]);

  const linkPublico = shareId
    ? globalThis.location.origin + '/os-publica/' + modelo + '?id=' + shareId
    : globalThis.location.origin + '/os-publica/' + modelo;

  const copiar = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    navigator.clipboard.writeText(linkPublico).then(() => {
      btn.textContent = '✅ Copiado!';
      btn.style.background = '#16a34a';
      setTimeout(() => { btn.textContent = '📋 Copiar'; btn.style.background = '#2563eb'; }, 2000);
    }).catch(() => {});
  };

  const grupos = campos.reduce<Record<string, typeof campos>>((acc, c) => {
    const g = c.grupo || 'Outros';
    if (!acc[g]) acc[g] = [];
    acc[g].push(c);
    return acc;
  }, {});

  return (
    <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #86efac' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        {secTitleFn('🔗', 'Compartilhar Ordem de Serviço')}
        <button type="button" onClick={toggleConfig}
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background: configAberto ? '#f59e0b' : '#f3f4f6', border:'1.5px solid ' + (configAberto ? '#d97706' : '#d1d5db'), borderRadius:8, fontSize:11, fontWeight:700, color: configAberto ? '#fff' : '#4b5563', cursor:'pointer' }}>
          ⚙️ {configAberto ? 'Fechar' : 'Configurar'}
          {qtdEditaveis > 0 && <span style={{ background:'#2563eb', color:'#fff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, marginLeft:2 }}>{qtdEditaveis}</span>}
        </button>
      </div>

      {configAberto && (
        <div style={{ background:'#fffbeb', borderRadius:8, padding:12, border:'1.5px solid #fde68a', marginBottom:10 }}>
          <div style={{ fontSize:10, fontWeight:900, color:'#92400e', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>
            📋 Campos editáveis no compartilhamento
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            <button type="button" onClick={e => { e.stopPropagation(); toggleAll(true); }} style={{ padding:'3px 10px', background:'#dcfce7', border:'1px solid #86efac', borderRadius:6, fontSize:10, fontWeight:700, color:'#15803d', cursor:'pointer' }}>✅ Marcar Todos</button>
            <button type="button" onClick={e => { e.stopPropagation(); toggleAll(false); }} style={{ padding:'3px 10px', background:'#fee2e2', border:'1px solid #fecaca', borderRadius:6, fontSize:10, fontWeight:700, color:'#dc2626', cursor:'pointer' }}>❌ Desmarcar Todos</button>
          </div>
          <div style={{ maxHeight:260, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
            {Object.entries(grupos).map(([grupo, grpCampos]) => (
              <div key={grupo}>
                <div style={{ fontSize:9, fontWeight:900, color:'#6b7280', textTransform:'uppercase', marginBottom:3, marginTop:4 }}>{grupo}</div>
                {grpCampos.map(c => (
                  <label key={c.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 8px', background: editaveis[c.key] ? '#dcfce7' : '#fff', borderRadius:6, cursor:'pointer', border:'1px solid ' + (editaveis[c.key] ? '#86efac' : '#e5e7eb'), marginBottom:2 }}>
                    <input type="checkbox" checked={!!editaveis[c.key]} onChange={() => setEditaveis(prev => ({ ...prev, [c.key]: !prev[c.key] }))} style={{ accentColor:'#16a34a' }} />
                    <span style={{ fontSize:11, fontWeight:600, color: editaveis[c.key] ? '#15803d' : '#6b7280' }}>{c.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <button type="button" onClick={e => { e.stopPropagation(); salvarConfig(); }}
            style={{ marginTop:10, width:'100%', padding:'8px 0', background: salvo ? '#16a34a' : '#2563eb', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>
            {salvo ? '✅ Configuração Salva!' : '💾 Salvar Configuração para este Modelo'}
          </button>
        </div>
      )}

      <div style={{ fontSize:11, color:'#6b7280', marginBottom:8 }}>
        Compartilhe este link para preencher a O.S. {qtdEditaveis > 0 ? `Somente ${qtdEditaveis} campo(s) serão editáveis.` : 'Todos os campos estarão editáveis.'}
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input readOnly value={linkPublico} onClick={e => (e.target as HTMLInputElement).select()}
          className={styles.campoInput}
          style={{ flex:1, fontFamily:'monospace', fontSize:10, fontWeight:700, color:'#15803d', background:'#dcfce7', border:'2px solid #86efac' }} />
        <button type="button" onClick={copiar}
          style={{ padding:'8px 16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
          📋 Copiar
        </button>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <a href={linkPublico} target="_blank" rel="noopener noreferrer"
          style={{ flex:1, textAlign:'center', padding:'8px 0', background:'#d97706', color:'#fff', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none' }}>
          🔗 Abrir Formulário
        </a>
        <a href={`https://wa.me/?text=${encodeURIComponent('📋 Preencha a Ordem de Serviço:\n' + linkPublico)}`} target="_blank" rel="noopener noreferrer"
          style={{ flex:1, textAlign:'center', padding:'8px 0', background:'#16a34a', color:'#fff', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none' }}>
          💬 Enviar via WhatsApp
        </a>
      </div>
    </div>
  );
};

/* ── Mini-modal de cadastro inline (module level → estável entre re-renders) ── */
const ConfigDropdown: React.FC<{
  lsKey: string;
  campos: { key: string; label: string; placeholder: string }[];
  onSelect: (item: Record<string, string>) => void;
  currentValue?: string;
}> = ({ lsKey, campos, onSelect, currentValue }) => {
  const [aberto, setAberto] = React.useState(false);
  const [adicionando, setAdicionando] = React.useState(false);
  const [novo, setNovo] = React.useState<Record<string, string>>({});
  const [lista, setLista] = React.useState<Record<string, string>[]>(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) || '[]'); } catch { return []; }
  });

  const salvar = () => {
    if (!novo[campos[0].key]?.trim()) return;
    const updated = [...lista, { ...novo }];
    localStorage.setItem(lsKey, JSON.stringify(updated));
    setLista(updated);
    setNovo({});
    setAdicionando(false);
  };
  const remover = (idx: number) => {
    const updated = lista.filter((_, i) => i !== idx);
    localStorage.setItem(lsKey, JSON.stringify(updated));
    setLista(updated);
  };

  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
      <button type="button" onClick={e => { e.stopPropagation(); setAberto(!aberto); }} title="Cadastrar / Selecionar"
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, padding:2, opacity:0.7, display:'flex', alignItems:'center' }}>
        ⚙️
      </button>
      {aberto && (
        <div style={{ position:'absolute', top:'100%', right:0, zIndex:100, background:'#fff', border:'2px solid #d97706', borderRadius:12, padding:12, minWidth:280, boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:900, color:'#92400e', textTransform:'uppercase' }}>📋 Cadastrados</span>
            <button type="button" onClick={() => setAberto(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✕</button>
          </div>
          {lista.length === 0 && <div style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic', marginBottom:8 }}>Nenhum cadastrado ainda.</div>}
          {lista.map((item, idx) => (
            <div key={idx} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, padding:'5px 8px', background: currentValue === item[campos[0].key] ? '#fef3c7' : '#f8fafc', borderRadius:8, border:'1px solid #e5e7eb', cursor:'pointer' }}
              onClick={() => { onSelect(item); setAberto(false); }}>
              <div style={{ flex:1, fontSize:11, fontWeight:600, color:'#374151' }}>
                {campos.map(c => item[c.key]).filter(Boolean).join(' · ')}
              </div>
              <button type="button" onClick={e => { e.stopPropagation();
                const novoValor = prompt('Editar ' + campos[0].label + ':', item[campos[0].key]);
                if (!novoValor || !novoValor.trim() || novoValor.trim() === item[campos[0].key]) return;
                const updated = lista.map((it, i) => i === idx ? { ...it, [campos[0].key]: novoValor.trim() } : it);
                localStorage.setItem(lsKey, JSON.stringify(updated));
                setLista(updated);
              }}
                style={{ background:'#dbeafe', border:'none', borderRadius:4, color:'#1d4ed8', fontSize:10, fontWeight:900, cursor:'pointer', padding:'2px 6px' }}>✏️</button>
              <button type="button" onClick={e => { e.stopPropagation(); remover(idx); }}
                style={{ background:'#fee2e2', border:'none', borderRadius:4, color:'#dc2626', fontSize:10, fontWeight:900, cursor:'pointer', padding:'2px 6px' }}>✕</button>
            </div>
          ))}
          {!adicionando ? (
            <button type="button" onClick={() => setAdicionando(true)}
              style={{ marginTop:6, width:'100%', padding:'6px 0', background:'#fffbeb', border:'1.5px dashed #d97706', borderRadius:8, color:'#92400e', fontWeight:700, fontSize:11, cursor:'pointer' }}>
              + Cadastrar novo
            </button>
          ) : (
            <div style={{ marginTop:8, background:'#fffbeb', borderRadius:8, padding:8, border:'1.5px solid #fde68a' }}>
              {campos.map(c => (
                <div key={c.key} style={{ marginBottom:4 }}>
                  <label style={{ fontSize:9, fontWeight:700, color:'#92400e' }}>{c.label}</label>
                  <input style={{ width:'100%', padding:'6px 8px', border:'1.5px solid #e5e7eb', borderRadius:6, fontSize:11, fontFamily:'inherit' }} placeholder={c.placeholder} value={novo[c.key] || ''} onChange={e => setNovo({ ...novo, [c.key]: e.target.value })} />
                </div>
              ))}
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <button type="button" onClick={salvar} style={{ flex:1, padding:'5px 0', background:'#16a34a', border:'none', borderRadius:6, color:'#fff', fontWeight:700, fontSize:11, cursor:'pointer' }}>✓ Salvar</button>
                <button type="button" onClick={() => { setAdicionando(false); setNovo({}); }} style={{ flex:1, padding:'5px 0', background:'#e5e7eb', border:'none', borderRadius:6, color:'#6b7280', fontWeight:700, fontSize:11, cursor:'pointer' }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface Props {
  funcao: FuncaoManutencao;
  usuarioId: string;
  usuarioNome: string;
  usuarioRole: string;
  adminId?: string;
  supervisorId?: string;
  chamadoId?: string;
  onEnviar: (chamado: ChamadoManutencao) => void;
  onCancelar: () => void;
  statusAoEnviar?: 'aberto' | 'concluido';
  osNumeroExibir?: string;
  osOcultos?: string[];
  onToggleBloco?: (uid: string) => void;
  onRestaurarOS?: () => void;
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function gerarProtocolo() {
  const now  = new Date();
  const data = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CHM-${data}-${rand}`;
}

function formatarTempo(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
  return `${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
}

function formatarHora(ts: number) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const extenso = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    if (n < 20) return unidades[n];
    if (n < 100) {
      const d = Math.floor(n / 10), u = n % 10;
      return dezenas[d] + (u ? ' e ' + unidades[u] : '');
    }
    if (n < 1000) {
      const c = Math.floor(n / 100), r = n % 100;
      return centenas[c] + (r ? ' e ' + extenso(r) : '');
    }
    if (n < 1000000) {
      const mil = Math.floor(n / 1000), r = n % 1000;
      const milStr = mil === 1 ? 'mil' : extenso(mil) + ' mil';
      if (!r) return milStr;
      return milStr + (r < 100 ? ' e ' : ' ') + extenso(r);
    }
    const mi = Math.floor(n / 1000000), r = n % 1000000;
    const miStr = mi === 1 ? 'um milhão' : extenso(mi) + ' milhões';
    if (!r) return miStr;
    return miStr + (r < 1000 ? ' e ' : ' ') + extenso(r);
  };

  const inteiro = Math.floor(valor);
  const cents = Math.round((valor - inteiro) * 100);
  let resultado = '';
  if (inteiro > 0) resultado = extenso(inteiro) + (inteiro === 1 ? ' real' : ' reais');
  if (cents > 0) {
    if (inteiro > 0) resultado += ' e ';
    resultado += extenso(cents) + (cents === 1 ? ' centavo' : ' centavos');
  }
  return resultado;
}

// ── Componente separado para Edição de Imagem (precisa de useState) ──────
const BlocoEdicaoImagem: React.FC<{
  bloco: BlocoSelecionado;
  def: { icone: string; nome: string };
  val: unknown;
  setResposta: (uid: string, v: unknown) => void;
}> = ({ bloco, def, val, setResposta }) => {
  const imgEditada = val as string | null | undefined;
  const [editandoImg, setEditandoImg] = useState(false);
  const [fotoOriginal, setFotoOriginal] = useState<string | null>(null);

  const handleFotoEdicao = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFotoOriginal(reader.result as string);
      setEditandoImg(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.campo}>
      <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
      {imgEditada ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <img src={imgEditada} alt="Imagem editada" style={{ width:'100%', borderRadius:12, border:'2px solid #e4e4e7' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" onClick={() => { setFotoOriginal(imgEditada); setEditandoImg(true); }} style={{ flex:1, padding:'10px', background:'#1a73e8', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Edit3 size={16} /> Editar novamente
            </button>
            <button type="button" onClick={() => setResposta(bloco.uid, null)} style={{ padding:'10px 16px', background:'#dc2626', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.galeriaArea} style={{ position:'relative' }}>
          <Camera size={36} />
          <span>Tire uma foto para marcar detalhes</span>
          <input type="file" accept="image/*" className={styles.galeriaInput} onChange={handleFotoEdicao} />
        </div>
      )}
      {editandoImg && fotoOriginal && (
        <EditorImagem
          imagemSrc={fotoOriginal}
          onSalvar={(imgFinal) => { setResposta(bloco.uid, imgFinal); setEditandoImg(false); setFotoOriginal(null); }}
          onCancelar={() => { setEditandoImg(false); setFotoOriginal(null); }}
        />
      )}
    </div>
  );
};

// ── Componente de Assinatura Digital (canvas com toque/mouse) ─────────
const BlocoAssinatura: React.FC<{
  bloco: BlocoSelecionado;
  def: { icone: string; nome: string };
  val: unknown;
  setResposta: (uid: string, v: unknown) => void;
}> = ({ bloco, def, val, setResposta }) => {
  const assinatura = val as string | null | undefined;
  const [assinando, setAssinando] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const ultimo = useRef({ x: 0, y: 0 });

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const iniciar = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    desenhando.current = true;
    ultimo.current = getPos(e);
  }, [getPos]);

  const mover = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!desenhando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ultimo.current = pos;
  }, [getPos]);

  const parar = useCallback(() => { desenhando.current = false; }, []);

  const limpar = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const confirmar = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setResposta(bloco.uid, dataUrl);
    setAssinando(false);
  }, [bloco.uid, setResposta]);

  return (
    <div className={styles.campo}>
      <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
      {(() => {
        if (assinatura) return (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <img src={assinatura} alt="Assinatura" style={{ width:'100%', height:120, objectFit:'contain', background:'#fafafa', border:'2px solid #e4e4e7', borderRadius:14 }} />
          <button type="button" onClick={() => setResposta(bloco.uid, null)} style={{ padding:'10px', background:'#dc2626', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <Trash2 size={16} /> Limpar assinatura
          </button>
        </div>
        );
        if (assinando) return (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ position:'relative', width:'100%', background:'#fafafa', border:'2px solid #4338ca', borderRadius:14, overflow:'hidden' }}>
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              style={{ width:'100%', height:160, touchAction:'none', cursor:'crosshair' }}
              onMouseDown={iniciar}
              onMouseMove={mover}
              onMouseUp={parar}
              onMouseLeave={parar}
              onTouchStart={iniciar}
              onTouchMove={mover}
              onTouchEnd={parar}
            />
            <span style={{ position:'absolute', bottom:8, left:0, right:0, textAlign:'center', fontSize:11, color:'#aaa', pointerEvents:'none' }}>Assine acima com o dedo ou mouse</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" onClick={limpar} style={{ flex:1, padding:'10px', background:'#f3f4f6', color:'#374151', border:'2px solid #e4e4e7', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Limpar
            </button>
            <button type="button" onClick={() => setAssinando(false)} style={{ flex:1, padding:'10px', background:'#f3f4f6', color:'#374151', border:'2px solid #e4e4e7', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Cancelar
            </button>
            <button type="button" onClick={confirmar} style={{ flex:2, padding:'10px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              ✓ Confirmar
            </button>
          </div>
        </div>
        );
        return (
        <button type="button" className={styles.assinaturaArea} onClick={() => setAssinando(true)}>
          ✍️ Toque aqui para assinar
        </button>
        );
      })()}
    </div>
  );
};

// ── Assinatura inline para recibo ─────────────────────────────────────
const AssinaturaInline: React.FC<{
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}> = ({ label, value, onChange }) => {
  const [assinando, setAssinando] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const ultimo = useRef({ x: 0, y: 0 });

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const iniciar = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    desenhando.current = true;
    ultimo.current = getPos(e);
  }, [getPos]);

  const mover = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!desenhando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ultimo.current = pos;
  }, [getPos]);

  const parar = useCallback(() => { desenhando.current = false; }, []);

  const limpar = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const confirmar = useCallback(() => {
    if (!canvasRef.current) return;
    onChange(canvasRef.current.toDataURL('image/png'));
    setAssinando(false);
  }, [onChange]);

  return (
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#6b7280', marginBottom:4, textAlign:'center' }}>{label}</div>
      {(() => {
        if (value) return (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <img src={value} alt={label} style={{ width:'100%', height:80, objectFit:'contain', background:'#fafafa', border:'1.5px solid #e4e4e7', borderRadius:10 }} />
          <button type="button" onClick={() => onChange(null)} style={{ padding:'6px', background:'#dc2626', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:11, cursor:'pointer' }}>
            ✕ Limpar
          </button>
        </div>
        );
        if (assinando) return (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <div style={{ position:'relative', width:'100%', background:'#fafafa', border:'2px solid #4338ca', borderRadius:10, overflow:'hidden' }}>
            <canvas ref={canvasRef} width={400} height={140}
              style={{ width:'100%', height:100, touchAction:'none', cursor:'crosshair' }}
              onMouseDown={iniciar} onMouseMove={mover} onMouseUp={parar} onMouseLeave={parar}
              onTouchStart={iniciar} onTouchMove={mover} onTouchEnd={parar}
            />
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <button type="button" onClick={limpar} style={{ flex:1, padding:'6px', background:'#f3f4f6', color:'#374151', border:'1.5px solid #e4e4e7', borderRadius:8, fontWeight:700, fontSize:11, cursor:'pointer' }}>Limpar</button>
            <button type="button" onClick={() => setAssinando(false)} style={{ flex:1, padding:'6px', background:'#f3f4f6', color:'#374151', border:'1.5px solid #e4e4e7', borderRadius:8, fontWeight:700, fontSize:11, cursor:'pointer' }}>Cancelar</button>
            <button type="button" onClick={confirmar} style={{ flex:2, padding:'6px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:11, cursor:'pointer' }}>✓ OK</button>
          </div>
        </div>
        );
        return (
        <button type="button" onClick={() => setAssinando(true)} style={{ height:70, border:'2px dashed #c7d2fe', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'#fafbff', fontSize:12, color:'#6b7280', fontWeight:600 }}>
          ✍️ Toque para assinar
        </button>
        );
      })()}
    </div>
  );
};

const FormChamado: React.FC<Props> = ({
  funcao, usuarioId, usuarioNome, usuarioRole,
  adminId, supervisorId, chamadoId, onEnviar, onCancelar,
  statusAoEnviar, osNumeroExibir, osOcultos, onToggleBloco, onRestaurarOS
}) => {
  const RASCUNHO_KEY = chamadoId ? `sm_rascunho_${chamadoId}` : '';
  const rascunhoSalvo = RASCUNHO_KEY ? (() => { try { const v = localStorage.getItem(RASCUNHO_KEY); return v ? JSON.parse(v) : null; } catch { return null; } })() : null;

  const [responsavel, setResponsavel] = useState(rascunhoSalvo?.responsavel || usuarioNome);
  const [respostas, setRespostas] = useState<Record<string, any>>(rascunhoSalvo?.respostas || {});
  const [horarioInicial] = useState(rascunhoSalvo?.horarioInicial || Date.now());
  const [agora, setAgora] = useState(Date.now());
  const [locGPS, setLocGPS] = useState<Record<string, { carregando: boolean; erro: string }>>({});
  const [geoLocal, setGeoLocal] = useState<{ lat: number; lng: number; endereco?: string } | null>(rascunhoSalvo?.geoLocal || null);
  const [rascunhoSalvoMsg, setRascunhoSalvoMsg] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [historicoFiltro, setHistoricoFiltro] = useState('');
  const [relDataDe, setRelDataDe] = useState('');
  const [relDataAte, setRelDataAte] = useState('');

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
      () => { /* permissão negada — ok */ },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const setResposta = (uid: string, valor: any) => {
    setRespostas(prev => ({ ...prev, [uid]: valor }));
  };

  const salvarRascunho = () => {
    if (!RASCUNHO_KEY) return;
    const rascunho = { responsavel, respostas, horarioInicial, geoLocal };
    localStorage.setItem(RASCUNHO_KEY, JSON.stringify(rascunho));
    setRascunhoSalvoMsg(true);
    setTimeout(() => setRascunhoSalvoMsg(false), 2000);
  };

  const cancelarComRascunho = () => {
    if (RASCUNHO_KEY) {
      const rascunho = { responsavel, respostas, horarioInicial, geoLocal };
      localStorage.setItem(RASCUNHO_KEY, JSON.stringify(rascunho));
    }
    onCancelar();
  };

  const gerarPDF = () => {
    const logo = localStorage.getItem('sm_logo_empresa') || '';
    const agora2 = Date.now();
    const fmtHora = (ts: number) => new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

    let camposHTML = '';
    funcao.blocos.forEach(bloco => {
      const def = BLOCOS_DISPONIVEIS.find(d => d.id === bloco.tipo);
      if (!def) return;
      const v = respostas[bloco.uid];
      if (v === '' || v === null || v === undefined) return;
      const label = bloco.label || def.nome;

      // Serviços e Valores
      if (bloco.tipo === 'servicos_valores' && typeof v === 'object' && v !== null && 'itens' in v) {
        const sv = v as { mostrarPrecos: boolean; itens: { qtd: number; descricao: string; preco: number }[] };
        const itensValidos = sv.itens.filter((it: any) => it.descricao);
        if (itensValidos.length === 0) return;
        const total = itensValidos.reduce((s: number, it: any) => s + (it.qtd||0)*(it.preco||0), 0);
        camposHTML += `<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#0D47A1;margin-bottom:8px">💰 ${label}</div>`;
        camposHTML += `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#0D47A1;color:#fff"><th style="padding:8px 10px;text-align:left">Qtd</th><th style="padding:8px 10px;text-align:left">Descrição</th>`;
        if (sv.mostrarPrecos) camposHTML += `<th style="padding:8px 10px;text-align:right">Preço Un.</th><th style="padding:8px 10px;text-align:right">Subtotal</th>`;
        camposHTML += `</tr></thead><tbody>`;
        itensValidos.forEach((it: any) => {
          camposHTML += `<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:8px 10px">${it.qtd || 1}</td><td style="padding:8px 10px">${it.descricao}</td>`;
          if (sv.mostrarPrecos) camposHTML += `<td style="padding:8px 10px;text-align:right">${(it.preco||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td><td style="padding:8px 10px;text-align:right;font-weight:700">${((it.qtd||0)*(it.preco||0)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>`;
          camposHTML += `</tr>`;
        });
        if (sv.mostrarPrecos) camposHTML += `<tr style="background:#f0f4ff;font-weight:900"><td colspan="3" style="padding:10px;text-align:right">TOTAL</td><td style="padding:10px;text-align:right;font-size:15px;color:#0D47A1">${total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td></tr>`;
        camposHTML += `</tbody></table></div>`;
        return;
      }

      // Assinatura
      if (typeof v === 'string' && v.startsWith('data:image') && (bloco.uid.includes('ass') || bloco.tipo === 'assinatura')) {
        camposHTML += `<div style="margin-bottom:14px;text-align:center"><div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;margin-bottom:6px">${label}</div><img src="${v}" style="max-width:200px;height:80px;object-fit:contain" /><div style="border-top:2px solid #1a1a1a;width:200px;margin:4px auto 0"></div></div>`;
        return;
      }
      // Foto única
      if (typeof v === 'string' && v.startsWith('data:image')) {
        camposHTML += `<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;margin-bottom:6px">${label}</div><img src="${v}" style="max-width:260px;border-radius:8px;border:1px solid #e5e7eb" /></div>`;
        return;
      }
      // Galeria
      if (Array.isArray(v) && v.some((x: any) => typeof x === 'string' && x.startsWith('data:image'))) {
        camposHTML += `<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;margin-bottom:6px">${label}</div><div style="display:flex;flex-wrap:wrap;gap:8px">`;
        v.forEach((x: any) => { if (typeof x === 'string' && x.startsWith('data:image')) camposHTML += `<img src="${x}" style="width:120px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb" />`; });
        camposHTML += `</div></div>`;
        return;
      }
      // Antes/Depois
      if (typeof v === 'object' && v !== null && ('antes' in v || 'depois' in v)) {
        const ad = v as { antes?: string; depois?: string };
        camposHTML += `<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;margin-bottom:6px">${label}</div><div style="display:flex;gap:10px">`;
        if (ad.antes) camposHTML += `<div style="text-align:center"><img src="${ad.antes}" style="width:140px;height:105px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb" /><div style="font-size:10px;font-weight:800;color:#dc2626;margin-top:4px">ANTES</div></div>`;
        if (ad.depois) camposHTML += `<div style="text-align:center"><img src="${ad.depois}" style="width:140px;height:105px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb" /><div style="font-size:10px;font-weight:800;color:#16a34a;margin-top:4px">DEPOIS</div></div>`;
        camposHTML += `</div></div>`;
        return;
      }
      // Checklist
      if (typeof v === 'object' && v !== null && 'itens' in v && 'marcados' in v) {
        const cl = v as { itens: string[]; marcados: number[] };
        camposHTML += `<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;margin-bottom:4px">${label}</div>`;
        cl.itens.forEach((item: string, i: number) => { camposHTML += `<div style="padding:2px 0;font-size:13px">${cl.marcados.includes(i) ? '✅' : '⬜'} ${item}</div>`; });
        camposHTML += `</div>`;
        return;
      }
      // Estrelas
      if (typeof v === 'number' && bloco.tipo === 'avaliacao_estrela') {
        camposHTML += `<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;margin-bottom:4px">${label}</div><div style="font-size:16px">${'★'.repeat(v)}${'☆'.repeat(5-v)} (${v}/5)</div></div>`;
        return;
      }
      // ── Ordem de Serviço (blocos com _tipo) ──
      if (typeof v === 'object' && v !== null && '_tipo' in v) {
        const osData = v as Record<string, unknown>;
        const tipoOS = String(osData._tipo || '');
        const modeloDef = OS_MODELOS_SHARE[tipoOS];
        const corOS = modeloDef?.cor || '#0D47A1';
        const tituloOS = modeloDef ? `${modeloDef.icone} ${modeloDef.titulo} — ${modeloDef.subtitulo}` : label;

        camposHTML += `<div style="margin-bottom:20px;border:2px solid ${corOS};border-radius:12px;overflow:hidden">`;
        camposHTML += `<div style="background:${corOS};color:#fff;padding:12px 16px;text-align:center">`;
        camposHTML += `<div style="font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px">${tituloOS}</div>`;
        if (osData.numero) camposHTML += `<div style="font-size:11px;opacity:0.85;margin-top:4px;font-family:monospace;font-weight:700">Nº ${String(osData.numero)}</div>`;
        camposHTML += `</div><div style="padding:14px 16px">`;

        if (modeloDef) {
          // Agrupar campos por grupo
          const grupos: Record<string, typeof modeloDef.campos> = {};
          for (const c of modeloDef.campos) {
            const g = c.grupo || 'Outros';
            if (!grupos[g]) grupos[g] = [];
            grupos[g].push(c);
          }
          for (const [grupo, grpCampos] of Object.entries(grupos)) {
            const temValor = grpCampos.some(c => osData[c.key]);
            if (!temValor) continue;
            camposHTML += `<div style="margin-bottom:12px"><div style="font-size:9px;font-weight:900;color:${corOS};text-transform:uppercase;letter-spacing:0.5px;border-bottom:1.5px solid ${corOS}33;padding-bottom:3px;margin-bottom:6px">${grupo}</div>`;
            camposHTML += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px">`;
            for (const c of grpCampos) {
              const val = osData[c.key];
              if (!val) continue;
              // Skip signature fields — they're rendered in the dedicated section below
              if (c.tipo === 'signature' || (typeof val === 'string' && (val as string).startsWith('data:image'))) continue;
              camposHTML += `<div style="margin-bottom:4px"><div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase">${c.label}</div><div style="font-size:13px;font-weight:600;color:#111">${String(val)}</div></div>`;
            }
            camposHTML += `</div></div>`;
          }
          // Materiais (os_assistencia_tecnica)
          const materiais = osData.materiais as Array<{descricao:string;qtd:string;preco:string;cotadoEm:string}> | undefined;
          if (Array.isArray(materiais) && materiais.length > 0) {
            const totalMat = materiais.reduce((a, m) => a + (Number.parseFloat(m.qtd||'0') * Number.parseFloat(m.preco||'0')), 0);
            camposHTML += `<div style="margin-bottom:12px"><div style="font-size:9px;font-weight:900;color:${corOS};text-transform:uppercase;border-bottom:1.5px solid ${corOS}33;padding-bottom:3px;margin-bottom:6px">🛒 Materiais</div>`;
            camposHTML += `<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:${corOS}15"><th style="padding:5px 8px;text-align:left;font-size:10px;font-weight:800;color:${corOS}">Descrição</th><th style="padding:5px 8px;text-align:center;font-size:10px;font-weight:800;color:${corOS}">Qtd</th><th style="padding:5px 8px;text-align:right;font-size:10px;font-weight:800;color:${corOS}">Preço</th></tr></thead><tbody>`;
            for (const m of materiais) {
              if (!m.descricao) continue;
              camposHTML += `<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:5px 8px">${m.descricao}</td><td style="padding:5px 8px;text-align:center">${m.qtd||1}</td><td style="padding:5px 8px;text-align:right">R$ ${Number.parseFloat(m.preco||'0').toFixed(2)}</td></tr>`;
            }
            camposHTML += `</tbody></table>`;
            if (totalMat > 0) camposHTML += `<div style="text-align:right;font-weight:800;font-size:13px;margin-top:4px;color:${corOS}">Total Materiais: R$ ${totalMat.toFixed(2)}</div>`;
            camposHTML += `</div>`;
          }
          // Valor total
          const valorServico = Number.parseFloat(String(osData.valorServico || '0'));
          const totalMat2 = Array.isArray(materiais) ? materiais.reduce((a, m) => a + (Number.parseFloat(m.qtd||'0') * Number.parseFloat(m.preco||'0')), 0) : 0;
          const valorTotal = valorServico + totalMat2;
          if (valorTotal > 0) {
            camposHTML += `<div style="background:${corOS}10;border-radius:8px;padding:10px 14px;text-align:right;margin-bottom:12px"><span style="font-size:10px;font-weight:800;color:#6b7280;text-transform:uppercase">Valor Total </span><span style="font-size:18px;font-weight:900;color:${corOS}">R$ ${valorTotal.toFixed(2)}</span></div>`;
          }
        } else {
          // Fallback: listar campos genéricos
          for (const [key, val] of Object.entries(osData)) {
            if (key.startsWith('_') || key === 'numero' || key === 'assinatura' || !val) continue;
            if (typeof val === 'string' && val.startsWith('data:image')) {
              camposHTML += `<div style="margin-bottom:8px;text-align:center"><div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:4px">${key}</div><img src="${val}" style="max-width:200px;height:70px;object-fit:contain" /></div>`;
            } else {
              camposHTML += `<div style="margin-bottom:4px"><div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase">${key}</div><div style="font-size:13px;font-weight:600;color:#111">${typeof val === 'object' ? JSON.stringify(val) : String(val)}</div></div>`;
            }
          }
        }

        // Assinaturas
        const assinaturas = Object.entries(osData).filter(([k, val]) => k.startsWith('assinatura') && typeof val === 'string' && (val as string).startsWith('data:image'));
        if (assinaturas.length > 0) {
          camposHTML += `<div style="display:flex;gap:24px;justify-content:center;margin-top:12px;padding-top:12px;border-top:1.5px solid #e5e7eb">`;
          for (const [key, val] of assinaturas) {
            const asLabel = key.replace('assinatura', '').replace(/([A-Z])/g, ' $1').trim() || 'Assinatura';
            camposHTML += `<div style="text-align:center"><img src="${String(val)}" style="max-width:160px;height:60px;object-fit:contain" /><div style="border-top:2px solid #1a1a1a;width:140px;margin:4px auto 0"></div><div style="font-size:9px;font-weight:800;color:#6b7280;text-transform:uppercase;margin-top:2px">${asLabel}</div></div>`;
          }
          camposHTML += `</div>`;
        }

        camposHTML += `</div></div>`;
        return;
      }
      // Texto / outros
      const txt = typeof v === 'object' ? JSON.stringify(v) : String(v);
      if (txt && txt !== '{}') {
        camposHTML += `<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;margin-bottom:2px">${label}</div><div style="font-size:13px;font-weight:600;color:#111">${txt}</div></div>`;
      }
    });

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>OS — ${funcao.nome}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;padding:0}.page{max-width:800px;margin:0 auto;padding:28px 32px}
    .topo{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0D47A1;padding-bottom:16px;margin-bottom:20px}.topo-logo img{max-height:56px;max-width:180px;object-fit:contain}
    .topo-titulo{text-align:right}.topo-titulo h1{font-size:20px;font-weight:900;color:#0D47A1;text-transform:uppercase;letter-spacing:1px}.topo-titulo .sub{font-size:12px;color:#6b7280;font-weight:600;margin-top:2px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}.info-item{background:#fafbfc;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px}
    .info-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:3px}.info-valor{font-size:14px;font-weight:700;color:#111}
    .secao{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#0D47A1;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin:18px 0 12px}
    @media print{body{padding:0}.page{padding:16px 20px}.no-print{display:none!important}}</style></head><body><div class="page">
    <div class="topo"><div class="topo-logo">${logo ? `<img src="${logo}" alt="Logo" />` : ''}</div><div class="topo-titulo"><h1>${funcao.icone} ${funcao.nome}</h1><div class="sub">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div></div></div>
    <div class="info-grid"><div class="info-item"><div class="info-label">Responsável</div><div class="info-valor">${responsavel || '—'}</div></div><div class="info-item"><div class="info-label">Início</div><div class="info-valor">${fmtHora(horarioInicial)}</div></div><div class="info-item"><div class="info-label">Tempo Decorrido</div><div class="info-valor">${formatarTempo(agora2 - horarioInicial)}</div></div><div class="info-item"><div class="info-label">Usuário</div><div class="info-valor">${usuarioNome}</div></div></div>
    <div class="secao">📋 Campos do Formulário</div>${camposHTML}
    <div style="text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:24px">Documento gerado pelo sistema Simples Manutenção</div>
    </div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const enviar = () => {
    if (!responsavel.trim()) return;
    // Validar campos obrigatórios
    const faltando = funcao.blocos.filter(b => {
      if (!b.obrigatorio) return false;
      const v = respostas[b.uid];
      if (v === undefined || v === null || v === '') return true;
      if (typeof v === 'string' && !v.trim()) return true;
      return false;
    });
    if (faltando.length > 0) {
      const nomes = faltando.map(b => b.label || BLOCOS_DISPONIVEIS.find(d => d.id === b.tipo)?.nome || b.tipo).join(', ');
      alert(`Preencha os campos obrigatórios: ${nomes}`);
      return;
    }
    try {
      const agora2 = Date.now();
      const chamado: ChamadoManutencao = {
        id: gerarId(),
        numero: 0,
        protocolo: gerarProtocolo(),
        funcaoId: funcao.id,
        funcaoNome: funcao.nome,
        funcaoIcone: funcao.icone,
        funcaoCor: funcao.cor,
        responsavel: responsavel.trim(),
        responsavelId: usuarioId,
        status: statusAoEnviar || 'concluido',
        horarioInicial,
        horarioFinal: agora2,
        tempoTotal: agora2 - horarioInicial,
        respostas,
        criadoPor: usuarioId,
        criadoPorNome: usuarioNome,
        criadoPorRole: usuarioRole,
        criadoEm: horarioInicial,
        adminId,
        supervisorId,
        ...(geoLocal ? { localizacao: geoLocal } : {}),
      };
      if (RASCUNHO_KEY) localStorage.removeItem(RASCUNHO_KEY);
      onEnviar(chamado);
    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Erro ao enviar o formulário. Tente novamente.');
    }
  };

  // ── Render de cada bloco ─────────────────────────────────────────────────

  const renderBloco = (bloco: BlocoSelecionado) => {
    const def = BLOCOS_DISPONIVEIS.find(d => d.id === bloco.tipo);
    if (!def) return null;
    const val = respostas[bloco.uid];

    switch (bloco.tipo) {

      case 'titulo':
      case 'subtitulo':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <input
              className={styles.campoInput}
              placeholder={`Digite ${def.nome.toLowerCase()}...`}
              value={val || ''}
              onChange={e => setResposta(bloco.uid, e.target.value)}
            />
          </div>
        );

      case 'texto':
      case 'descricao':
      case 'feedback':
      case 'perguntas':
      case 'ocorrencia':
      case 'problema':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <div className={styles.campoLabelRow}>
              <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
              <MicButton onResult={texto => setResposta(bloco.uid, (val || '') + (val ? ' ' : '') + texto)} />
            </div>
            <textarea
              className={styles.campoInput}
              rows={4}
              placeholder="Digite aqui... ou clique em Falar 🎙️"
              value={val || ''}
              onChange={e => setResposta(bloco.uid, e.target.value)}
            />
          </div>
        );

      case 'status':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.statusOpcoes}>
              {[
                { v: 'Aberta',       c: '#455a64' },
                { v: 'Em Execução', c: '#e65100' },
                { v: 'Finalizado',   c: '#2e7d32' },
                { v: 'Reaberta',     c: '#7b1fa2' },
              ].map(s => (
                <button
                  key={s.v}
                  className={`${styles.statusOpcao} ${val === s.v ? styles.statusOpcaoAtivo : ''}`}
                  style={val === s.v ? { background: s.c, color: '#fff', borderColor: s.c } : {}}
                  onClick={() => setResposta(bloco.uid, s.v)}
                >{s.v}</button>
              ))}
            </div>
          </div>
        );

      case 'prioridade':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.prioridadeOpcoes}>
              {[
                { v: 'Baixa', c: '#2e7d32' },
                { v: 'Média', c: '#f57c00' },
                { v: 'Alta', c: '#d84315' },
                { v: 'Urgente', c: '#b71c1c' },
              ].map(p => (
                <button
                  key={p.v}
                  className={`${styles.prioridade} ${val === p.v ? styles.prioridadeAtivo : ''}`}
                  style={val === p.v ? { background: p.c, color: '#fff', borderColor: p.c } : { borderColor: p.c, color: p.c }}
                  onClick={() => setResposta(bloco.uid, p.v)}
                >{p.v}</button>
              ))}
            </div>
          </div>
        );

      case 'avaliacao_estrela':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.estrelasRow}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  className={`${styles.estrelaBotao} ${(val || 0) >= n ? styles.estrelaBotaoAtivo : ''}`}
                  onClick={() => setResposta(bloco.uid, n)}
                >
                  <Star size={32} fill={(val || 0) >= n ? '#FFD600' : 'none'} color={(val || 0) >= n ? '#FFD600' : '#9ca3af'} />
                </button>
              ))}
              {val > 0 && <span className={styles.estrelasValor}>{val}/5</span>}
            </div>
          </div>
        );

      case 'avaliacao_escala':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.escalaRow}>
              {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  className={`${styles.escalaBotao} ${val === n ? styles.escalaBotaoAtivo : ''}`}
                  onClick={() => setResposta(bloco.uid, n)}
                >{n}</button>
              ))}
            </div>
          </div>
        );

      case 'satisfacao':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.satisfacaoRow}>
              {[
                { v: 'Muito insatisfeito', e: '😞' },
                { v: 'Insatisfeito', e: '😕' },
                { v: 'Neutro', e: '😐' },
                { v: 'Satisfeito', e: '😊' },
                { v: 'Muito satisfeito', e: '😄' },
              ].map(s => (
                <button
                  key={s.v}
                  className={`${styles.satisfacaoOpcao} ${val === s.v ? styles.satisfacaoAtivo : ''}`}
                  onClick={() => setResposta(bloco.uid, s.v)}
                  title={s.v}
                >
                  <span className={styles.satisfacaoEmoji}>{s.e}</span>
                  <span className={styles.satisfacaoLabel}>{s.v}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'checklist': {
        const itens: string[] = val?.itens || ['Item 1', 'Item 2', 'Item 3'];
        const marcados: number[] = val?.marcados || [];
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.checklistLista}>
              {itens.map((item, i) => (
                <button
                  key={item + '-' + i}
                  className={`${styles.checklistItem} ${marcados.includes(i) ? styles.checklistItemMarcado : ''}`}
                  onClick={() => {
                    const novos = marcados.includes(i) ? marcados.filter(m => m !== i) : [...marcados, i];
                    setResposta(bloco.uid, { itens, marcados: novos });
                  }}
                >
                  <span className={styles.checkboxIcone}>{marcados.includes(i) ? '✅' : '⬜'}</span>
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        );
      }

      case 'galeria': {
        const fotos = (val as string[] | undefined) || [];
        const handleFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = Array.from(e.target.files || []);
          if (!files.length) return;
          const promises = files.map(f => new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
          }));
          Promise.all(promises).then(novas => setResposta(bloco.uid, [...fotos, ...novas]));
          e.target.value = '';
        };
        const removerFoto = (idx: number) => setResposta(bloco.uid, fotos.filter((_, i) => i !== idx));
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            {fotos.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                {fotos.map((foto, i) => (
                  <div key={foto.slice(0, 50) + '-' + i} style={{ position:'relative', width:80, height:80 }}>
                    <img src={foto} alt={`foto ${i+1}`} style={{ width:80, height:80, objectFit:'cover', borderRadius:10, border:'2px solid #e4e4e7' }} />
                    <button type="button" onClick={() => removerFoto(i)} style={{ position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:'50%', background:'#dc2626', color:'#fff', border:'none', fontSize:12, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.galeriaArea}>
              <Camera size={36} />
              <span>{fotos.length > 0 ? 'Adicionar mais fotos' : 'Toque para adicionar fotos'}</span>
              <input type="file" accept="image/*" multiple className={styles.galeriaInput} onChange={handleFotos} />
            </div>
          </div>
        );
      }

      case 'edicao_imagem':
        return (
          <BlocoEdicaoImagem
            key={bloco.uid}
            bloco={bloco}
            def={def}
            val={val}
            setResposta={setResposta}
          />
        );

      case 'antes_depois': {
        const ad = (val as { antes?: string; depois?: string } | undefined) || {};
        const handleAD = (campo: 'antes' | 'depois') => (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => setResposta(bloco.uid, { ...ad, [campo]: reader.result as string });
          reader.readAsDataURL(file);
        };
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.antesDepoisRow}>
              <div className={styles.antesDepoisItem}>
                {ad.antes ? (
                  <div style={{ position:'relative', width:'100%' }}>
                    <img src={ad.antes} alt="Antes" style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover', borderRadius:10, border:'2px solid #fca5a5' }} />
                    <button type="button" onClick={() => setResposta(bloco.uid, { ...ad, antes: undefined })} style={{ position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:'50%', background:'#dc2626', color:'#fff', border:'none', fontSize:12, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                ) : (
                  <>
                    <Camera size={28} />
                    <span>📷 Antes</span>
                    <input type="file" accept="image/*" className={styles.galeriaInput} onChange={handleAD('antes')} />
                  </>
                )}
                <span style={{ fontSize:12, fontWeight:800, color:'#dc2626', textAlign:'center' }}>ANTES</span>
              </div>
              <div className={styles.antesDepoisItem}>
                {ad.depois ? (
                  <div style={{ position:'relative', width:'100%' }}>
                    <img src={ad.depois} alt="Depois" style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover', borderRadius:10, border:'2px solid #86efac' }} />
                    <button type="button" onClick={() => setResposta(bloco.uid, { ...ad, depois: undefined })} style={{ position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:'50%', background:'#dc2626', color:'#fff', border:'none', fontSize:12, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                ) : (
                  <>
                    <Camera size={28} />
                    <span>📷 Depois</span>
                    <input type="file" accept="image/*" className={styles.galeriaInput} onChange={handleAD('depois')} />
                  </>
                )}
                <span style={{ fontSize:12, fontWeight:800, color:'#16a34a', textAlign:'center' }}>DEPOIS</span>
              </div>
            </div>
          </div>
        );
      }

      case 'horario_inicial':
        return (
          <div key={bloco.uid} className={`${styles.campo} ${styles.campoTempo}`}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.tempoValor}>
              <Play size={18} color="#2e7d32" />
              <span className={styles.tempoHora}>{formatarHora(horarioInicial)}</span>
            </div>
            <p className={styles.tempoDesc}>Preenchido automaticamente ao abrir o chamado</p>
          </div>
        );

      case 'horario_final':
        return (
          <div key={bloco.uid} className={`${styles.campo} ${styles.campoTempo}`}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.tempoValor}>
              <CheckCircle2 size={18} color="#d32f2f" />
              <span className={styles.tempoHora}>Será marcado ao enviar</span>
            </div>
            <p className={styles.tempoDesc}>Preenchido automaticamente ao finalizar</p>
          </div>
        );

      case 'tempo_total':
        return (
          <div key={bloco.uid} className={`${styles.campo} ${styles.campoTempo}`}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div className={styles.tempoValorTimer}>
              <Clock size={20} />
              <span className={styles.tempoTimer}>{formatarTempo(agora - horarioInicial)}</span>
            </div>
            <p className={styles.tempoDesc}>Calculado automaticamente: Horário Final − Horário Inicial</p>
          </div>
        );

      case 'kilometragem':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <input
              className={styles.campoInput}
              type="number"
              placeholder="Digite a kilometragem atual..."
              value={val || ''}
              onChange={e => setResposta(bloco.uid, e.target.value)}
              min={0}
            />
          </div>
        );

      case 'placa':
      case 'modelo':
      case 'cor_veiculo':
      case 'tipo_veiculo':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            {bloco.opcoes && bloco.opcoes.length > 0 ? (
              <select
                className={styles.campoInput}
                value={val || ''}
                onChange={e => setResposta(bloco.uid, e.target.value)}
              >
                <option value="">Selecione...</option>
                {bloco.opcoes.map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
            ) : (
              <input
                className={styles.campoInput}
                placeholder={`Digite ${def.nome.toLowerCase()}...`}
                value={val || ''}
                onChange={e => setResposta(bloco.uid, e.target.value)}
              />
            )}
          </div>
        );

      case 'localizacao': {
        type LocData = { lat: number; lng: number; endereco?: string; timestamp?: number };
        const loc = val as LocData | null | undefined;
        const gps = locGPS[bloco.uid] || { carregando: false, erro: '' };

        const capturarLocalizacao = () => {
          if (!navigator.geolocation) {
            setLocGPS(prev => ({ ...prev, [bloco.uid]: { carregando: false, erro: 'GPS não disponível neste dispositivo.' } }));
            return;
          }
          setLocGPS(prev => ({ ...prev, [bloco.uid]: { carregando: true, erro: '' } }));
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              let endereco = '';
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                  { headers: { 'Accept-Language': 'pt-BR' } }
                );
                const data = await res.json();
                endereco = data.display_name || '';
              } catch { /* sem endereço */ }
              setResposta(bloco.uid, { lat, lng, endereco, timestamp: Date.now() });
              setLocGPS(prev => ({ ...prev, [bloco.uid]: { carregando: false, erro: '' } }));
            },
            (err) => {
              const msg = err.code === 1
                ? 'Permissão negada. Autorize o GPS no navegador.'
                : 'Não foi possível obter a localização.';
              setLocGPS(prev => ({ ...prev, [bloco.uid]: { carregando: false, erro: msg } }));
            },
            { enableHighAccuracy: true, timeout: 15000 }
          );
        };

        const mapsUrl = loc ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}` : '';

        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>

            {loc ? (
              <div style={{ border: '2px solid #00897b', borderRadius: 12, overflow: 'hidden', background: '#f0fdfa' }}>
                <iframe
                  title="Localização"
                  width="100%"
                  height="180"
                  style={{ border: 'none', display: 'block' }}
                  src={`https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=16&output=embed`}
                  loading="lazy"
                />
                <div style={{ padding: '10px 14px' }}>
                  {loc.endereco && (
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                      📮 {loc.endereco}
                    </p>
                  )}
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>
                    🌐 {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                    {loc.timestamp ? ` · ${new Date(loc.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, textAlign: 'center', padding: '8px',
                        background: '#00897b', color: '#fff', borderRadius: 8,
                        fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      }}
                    >
                      🗺️ Abrir no Maps
                    </a>
                    <button
                      type="button"
                      onClick={() => setResposta(bloco.uid, null)}
                      style={{
                        padding: '8px 14px', borderRadius: 8,
                        background: '#fee2e2', color: '#b91c1c',
                        border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      }}
                    >
                      🔄 Recapturar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={capturarLocalizacao}
                disabled={gps.carregando}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: gps.carregando ? '#e4e4e7' : 'linear-gradient(135deg,#00897b,#00695c)',
                  color: gps.carregando ? '#71717a' : '#fff',
                  border: 'none', cursor: gps.carregando ? 'not-allowed' : 'pointer',
                  fontSize: 15, fontWeight: 700,
                }}
              >
                {gps.carregando ? '⏳ Obtendo localização...' : '📍 Capturar minha localização'}
              </button>
            )}

            {gps.erro && (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>
                ⚠️ {gps.erro}
              </p>
            )}
          </div>
        );
      }

      case 'agendar':
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <input
              className={styles.campoInput}
              type="datetime-local"
              value={val || ''}
              onChange={e => setResposta(bloco.uid, e.target.value)}
            />
          </div>
        );

      case 'assinatura':
        return (
          <BlocoAssinatura key={bloco.uid} bloco={bloco} def={def} val={val} setResposta={setResposta} />
        );

      case 'vencimento': {
        const venc = val || { dataVencimento: '', lembretes: [] as number[], realizado: false };
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const diasRestam = venc.dataVencimento
          ? Math.ceil((new Date(venc.dataVencimento).setHours(0,0,0,0) - hoje.getTime()) / 86400000)
          : null;

        const toggleLembrete = (dias: number) => {
          const lista: number[] = venc.lembretes || [];
          let novo: number[];
          if (lista.includes(dias)) novo = lista.filter(d => d !== dias);
          else if (lista.length < 5) novo = [...lista, dias].sort((a, b) => b - a);
          else novo = lista;
          setResposta(bloco.uid, { ...venc, lembretes: novo });
        };

        return (
          <div key={bloco.uid} className={`${styles.campo} ${styles.campoVencimento}`}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>

            {/* Status dias restantes */}
            {diasRestam !== null && (
              <div className={styles.vencimentoStatus}
                style={{ background: (() => {
                  if (venc.realizado) return '#e8f5e9';
                  if (diasRestam < 0) return '#ffebee';
                  if (diasRestam <= 7) return '#fff3e0';
                  return '#e8f5e9';
                })() }}
              >
                {(() => {
                  if (venc.realizado) return <span style={{ color: '#2e7d32', fontWeight: 800 }}>✅ Marcado como realizado</span>;
                  if (diasRestam < 0) return <span style={{ color: '#c62828', fontWeight: 800 }}>⚠️ Vencido há {Math.abs(diasRestam)} dia{Math.abs(diasRestam) === 1 ? '' : 's'}</span>;
                  if (diasRestam === 0) return <span style={{ color: '#e65100', fontWeight: 800 }}>🔴 Vence hoje!</span>;
                  return <span style={{ color: '#2e7d32', fontWeight: 800 }}>✅ Faltam {diasRestam} dia{diasRestam === 1 ? '' : 's'}</span>;
                })()}
              </div>
            )}

            {/* Data de vencimento */}
            <div className={styles.vencimentoGroup}>
              <span className={styles.vencimentoLabel}>📆 Data de vencimento</span>
              <input
                className={styles.campoInput}
                type="date"
                value={venc.dataVencimento || ''}
                onChange={e => setResposta(bloco.uid, { ...venc, dataVencimento: e.target.value })}
              />
            </div>

            {/* Lembretes — até 5 */}
            <div className={styles.vencimentoGroup}>
              <span className={styles.vencimentoLabel}>🔔 Quero ser lembrado (máx. 5 datas):</span>
              <div className={styles.lembretesGrid}>
                {[1,3,5,7,10,15,20,30,45,60].map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`${styles.lembreteBtn} ${(venc.lembretes || []).includes(d) ? styles.lembreteBtnAtivo : ''}`}
                    onClick={() => toggleLembrete(d)}
                    disabled={!(venc.lembretes || []).includes(d) && (venc.lembretes || []).length >= 5}
                  >
                    {d}d antes
                  </button>
                ))}
              </div>
              {(venc.lembretes?.length || 0) > 0 && (
                <p className={styles.lembretesInfo}>
                  📧 Lembretes em: {(venc.lembretes as number[]).map(d => `${d} dias antes`).join(', ')}
                </p>
              )}
            </div>

            {/* Marcar como realizado */}
            <button
              type="button"
              className={`${styles.btnRealizado} ${venc.realizado ? styles.btnRealizadoAtivo : ''}`}
              onClick={() => setResposta(bloco.uid, { ...venc, realizado: !venc.realizado })}
            >
              {venc.realizado ? '✅ Realizado' : '⬜ Marcar como realizado'}
            </button>
          </div>
        );
      }

      case 'servicos_valores': {
        const sv = (val as { mostrarPrecos: boolean; itens: { qtd: number; descricao: string; preco: number }[] } | undefined) || { mostrarPrecos: true, itens: [{ qtd: 1, descricao: '', preco: 0 }] };
        const updateSV = (next: typeof sv) => setResposta(bloco.uid, next);
        const addItem = () => updateSV({ ...sv, itens: [...sv.itens, { qtd: 1, descricao: '', preco: 0 }] });
        const removeItem = (i: number) => { const itens = sv.itens.filter((_: any, idx: number) => idx !== i); updateSV({ ...sv, itens: itens.length ? itens : [{ qtd: 1, descricao: '', preco: 0 }] }); };
        const updateItem = (i: number, field: string, value: any) => { const itens = [...sv.itens]; (itens[i] as any)[field] = value; updateSV({ ...sv, itens }); };
        const total = sv.itens.reduce((s: number, it: any) => s + (it.qtd || 0) * (it.preco || 0), 0);
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>

            {/* Toggle preços */}
            <div className={styles.svToggleRow}>
              <span className={styles.svToggleLabel}>Mostrar preços</span>
              <button
                type="button"
                className={`${styles.svToggle} ${sv.mostrarPrecos ? styles.svToggleAtivo : ''}`}
                onClick={() => updateSV({ ...sv, mostrarPrecos: !sv.mostrarPrecos })}
              >
                <span className={styles.svToggleDot} />
              </button>
            </div>

            {/* Tabela */}
            <div className={styles.svTabela}>
              <div className={styles.svHeader}>
                <span className={styles.svColQtd}>Qtd</span>
                <span className={styles.svColDesc}>Descrição</span>
                {sv.mostrarPrecos && <span className={styles.svColPreco}>Preço Un.</span>}
                {sv.mostrarPrecos && <span className={styles.svColTotal}>Subtotal</span>}
                <span className={styles.svColAcao}></span>
              </div>
              {sv.itens.map((item: any, i: number) => (
                <div key={item.descricao + '-' + i} className={styles.svRow}>
                  <input
                    type="number"
                    min={1}
                    className={`${styles.campoInput} ${styles.svInputQtd}`}
                    value={item.qtd || ''}
                    onChange={e => updateItem(i, 'qtd', Number.parseInt(e.target.value, 10) || 0)}
                    placeholder="1"
                  />
                  <input
                    className={`${styles.campoInput} ${styles.svInputDesc}`}
                    value={item.descricao}
                    onChange={e => updateItem(i, 'descricao', e.target.value)}
                    placeholder="Descrição do serviço..."
                  />
                  {sv.mostrarPrecos && (
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className={`${styles.campoInput} ${styles.svInputPreco}`}
                      value={item.preco || ''}
                      onChange={e => updateItem(i, 'preco', Number.parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                    />
                  )}
                  {sv.mostrarPrecos && (
                    <span className={styles.svSubtotal}>
                      {((item.qtd || 0) * (item.preco || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                  <button type="button" className={styles.svBtnRemove} onClick={() => removeItem(i)} title="Remover">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar item */}
            <button type="button" className={styles.svBtnAdd} onClick={addItem}>
              <Plus size={16} /> Adicionar serviço
            </button>

            {/* Total */}
            {sv.mostrarPrecos && (
              <div className={styles.svTotalRow}>
                <span>TOTAL</span>
                <span className={styles.svTotalValor}>
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
          </div>
        );
      }

      case 'recibo': {
        const rc = val || {};
        const updateRC = (field: string, v: unknown) => setResposta(bloco.uid, { ...rc, [field]: v });
        const valorNum = Number.parseFloat(rc.valorRecebido || '0');
        // Auto-gerar número do recibo se não existir
        if (!rc.numeroRecibo) {
          const contador = Number.parseInt(localStorage.getItem('sm_contador_recibos') || '0', 10) + 1;
          localStorage.setItem('sm_contador_recibos', String(contador));
          const hoje = new Date();
          const num = `REC-${hoje.getFullYear()}${String(hoje.getMonth()+1).padStart(2,'0')}${String(hoje.getDate()).padStart(2,'0')}-${String(contador).padStart(4,'0')}`;
          setTimeout(() => updateRC('numeroRecibo', num), 0);
        }
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #c7d2fe', borderRadius:14, overflow:'hidden', marginTop:8 }}>

              {/* Header recibo */}
              <div style={{ background:'#0D47A1', color:'#fff', padding:'12px 16px', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1 }}>🧾 Recibo de Prestação de Serviço</div>
                <div style={{ fontSize:11, opacity:0.9, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {rc.numeroRecibo || '...'}</div>
              </div>

              <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12 }}>

                {/* NÚMERO DO RECIBO */}
                <div>
                  <label htmlFor="rc-numero" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}># Número do Recibo</label>
                  <input id="rc-numero" className={styles.campoInput} placeholder="REC-00000001" value={rc.numeroRecibo || ''} onChange={e => updateRC('numeroRecibo', e.target.value)} style={{ fontFamily:'monospace', fontWeight:700 }} />
                </div>

                {/* CONTRATANTE */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#0D47A1', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>👤 Contratante</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <label htmlFor="rc-pagador-nome" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Nome Completo</label>
                      <input id="rc-pagador-nome" className={styles.campoInput} placeholder="Nome do contratante..." value={rc.nomeContratante || ''} onChange={e => updateRC('nomeContratante', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="rc-pagador-doc" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>CPF / CNPJ</label>
                      <input id="rc-pagador-doc" className={styles.campoInput} placeholder="000.000.000-00" value={rc.docContratante || ''} onChange={e => updateRC('docContratante', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* PRESTADOR */}
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#16a34a', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>🛠️ Prestador de Serviço</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <label htmlFor="rc-prestador-nome" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Nome Completo</label>
                      <input id="rc-prestador-nome" className={styles.campoInput} placeholder="Nome do prestador..." value={rc.nomePrestador || ''} onChange={e => updateRC('nomePrestador', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="rc-prestador-doc" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>CPF / CNPJ</label>
                      <input id="rc-prestador-doc" className={styles.campoInput} placeholder="000.000.000-00" value={rc.docPrestador || ''} onChange={e => updateRC('docPrestador', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* DESCRIÇÃO */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <label htmlFor="rc-descricao" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5 }}>📋 Descrição do Serviço Executado</label>
                    <MicButton onResult={texto => updateRC('descricaoServico', (rc.descricaoServico || '') + (rc.descricaoServico ? ' ' : '') + texto)} />
                  </div>
                  <textarea id="rc-descricao" className={styles.campoInput} rows={3} placeholder="Descreva detalhadamente o serviço prestado... ou clique em 🎙️" value={rc.descricaoServico || ''} onChange={e => updateRC('descricaoServico', e.target.value)} />
                </div>

                {/* VALOR */}
                <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:12, padding:'12px 16px', textAlign:'center' }}>
                  <label htmlFor="rc-valor" style={{ fontSize:10, fontWeight:900, color:'#16a34a', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>💰 Valor Recebido (R$)</label>
                  <input id="rc-valor" className={styles.campoInput} type="number" min={0} step={0.01} placeholder="0,00" value={rc.valorRecebido || ''} onChange={e => updateRC('valorRecebido', e.target.value)} style={{ fontSize:22, fontWeight:900, fontFamily:'monospace', textAlign:'center', border:'2px solid #86efac' }} />
                  {valorNum > 0 && (
                    <>
                      <div style={{ fontSize:13, fontWeight:700, color:'#16a34a', marginTop:6 }}>
                        {valorNum.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
                      </div>
                      <div style={{ fontSize:11, fontWeight:600, color:'#4b5563', marginTop:4, fontStyle:'italic' }}>
                        ({valorPorExtenso(valorNum)})
                      </div>
                    </>
                  )}
                </div>

                {/* LOCAL E DATA */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label htmlFor="rc-local" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}>📍 Local</label>
                    <input id="rc-local" className={styles.campoInput} placeholder="Cidade / Local do serviço..." value={rc.local || ''} onChange={e => updateRC('local', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="rc-data" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}>📅 Data</label>
                    <input id="rc-data" className={styles.campoInput} type="date" value={rc.data || new Date().toISOString().split('T')[0]} onChange={e => updateRC('data', e.target.value)} />
                  </div>
                </div>

                {/* ASSINATURAS DIGITAIS */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinaturas Digitais</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline
                      label="Prestador de Serviço"
                      value={rc.assinaturaPrestador || null}
                      onChange={v => updateRC('assinaturaPrestador', v)}
                    />
                    <AssinaturaInline
                      label="Contratante"
                      value={rc.assinaturaContratante || null}
                      onChange={v => updateRC('assinaturaContratante', v)}
                    />
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      }

      case 'recibo_simples': {
        const rs = val || {};
        const updateRS = (field: string, v: unknown) => setResposta(bloco.uid, { ...rs, [field]: v });
        const valorNumS = Number.parseFloat(rs.valorRecebido || '0');
        // Auto-gerar número
        if (!rs.numeroRecibo) {
          const cont = Number.parseInt(localStorage.getItem('sm_contador_recibos_simples') || '0', 10) + 1;
          localStorage.setItem('sm_contador_recibos_simples', String(cont));
          const h = new Date();
          const num = `REC-${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}-${String(cont).padStart(4,'0')}`;
          setTimeout(() => updateRS('numeroRecibo', num), 0);
        }
        if (!rs._tipo) setTimeout(() => updateRS('_tipo', 'recibo_simples'), 0);
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #374151', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>

              {/* Header */}
              <div style={{ background:'#1a1a2e', color:'#fff', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>RECIBO DE PRESTAÇÃO DE SERVIÇO</div>
                <div style={{ fontSize:11, opacity:0.85, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {rs.numeroRecibo || '...'}</div>
              </div>

              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

                {/* NÚMERO DO RECIBO */}
                <div>
                  <label htmlFor="rs-numero" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}># Número do Recibo</label>
                  <input id="rs-numero" className={styles.campoInput} placeholder="REC-00000001" value={rs.numeroRecibo || ''} onChange={e => updateRS('numeroRecibo', e.target.value)} style={{ fontFamily:'monospace', fontWeight:700 }} />
                </div>

                {/* Declaração */}
                <div style={{ fontSize:13, color:'#374151', lineHeight:1.6, padding:'0 4px' }}>
                  Declaro, para os devidos fins, que recebi de:
                </div>

                {/* PAGADOR (contratante) */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <label htmlFor="rs-nome" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Nome</label>
                      <input id="rs-nome" className={styles.campoInput} placeholder="Nome completo..." value={rs.nomeContratante || ''} onChange={e => updateRS('nomeContratante', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="rs-doc" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>CPF / CNPJ</label>
                      <input id="rs-doc" className={styles.campoInput} placeholder="000.000.000-00" value={rs.docContratante || ''} onChange={e => updateRS('docContratante', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* VALOR */}
                <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:12, padding:'12px 16px', textAlign:'center' }}>
                  <div style={{ fontSize:13, color:'#374151', marginBottom:8 }}>A importância de:</div>
                  <input className={styles.campoInput} type="number" min={0} step={0.01} placeholder="0,00" value={rs.valorRecebido || ''} onChange={e => updateRS('valorRecebido', e.target.value)} style={{ fontSize:22, fontWeight:900, fontFamily:'monospace', textAlign:'center', border:'2px solid #86efac' }} />
                  {valorNumS > 0 && (
                    <>
                      <div style={{ fontSize:14, fontWeight:700, color:'#16a34a', marginTop:6 }}>
                        {valorNumS.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
                      </div>
                      <div style={{ fontSize:11, fontWeight:600, color:'#4b5563', marginTop:4, fontStyle:'italic' }}>
                        ({valorPorExtenso(valorNumS)})
                      </div>
                    </>
                  )}
                </div>

                {/* Texto intermediário */}
                <div style={{ fontSize:13, color:'#374151', lineHeight:1.6, padding:'0 4px' }}>
                  Referente à prestação de serviço de manutenção descrita abaixo:
                </div>

                {/* DESCRIÇÃO DO SERVIÇO */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <label htmlFor="rs-descricao" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5 }}>📋 Descrição do serviço</label>
                    <MicButton onResult={texto => updateRS('descricaoServico', (rs.descricaoServico || '') + (rs.descricaoServico ? ' ' : '') + texto)} />
                  </div>
                  <textarea id="rs-descricao" className={styles.campoInput} rows={4} placeholder="Descreva detalhadamente o serviço prestado... ou clique em 🎙️" value={rs.descricaoServico || ''} onChange={e => updateRS('descricaoServico', e.target.value)} />
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div>
                  <label htmlFor="rs-forma-pagamento" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}>💳 Forma de pagamento</label>
                  <select id="rs-forma-pagamento" className={styles.campoInput} value={rs.formaPagamento || ''} onChange={e => updateRS('formaPagamento', e.target.value)} style={{ fontWeight:700 }}>
                    <option value="">Selecione...</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* Declaração de recebimento */}
                <div style={{ fontSize:13, color:'#374151', lineHeight:1.6, padding:'8px 12px', background:'#fffbeb', border:'1.5px solid #fcd34d', borderRadius:10, textAlign:'center', fontWeight:600 }}>
                  Declaro que o valor acima foi recebido integralmente.
                </div>

                {/* LOCAL E DATA */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label htmlFor="rs-local" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}>📍 Local e Data</label>
                    <input id="rs-local" className={styles.campoInput} placeholder="Cidade / Local..." value={rs.local || ''} onChange={e => updateRS('local', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="rs-data" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}>📅 Data</label>
                    <input id="rs-data" className={styles.campoInput} type="date" value={rs.data || new Date().toISOString().split('T')[0]} onChange={e => updateRS('data', e.target.value)} />
                  </div>
                </div>

                {/* PRESTADOR */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#0D47A1', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>🛠️ Prestador de Serviço</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <label htmlFor="rs-prestador-nome" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Nome do prestador</label>
                      <input id="rs-prestador-nome" className={styles.campoInput} placeholder="Nome do prestador..." value={rs.nomePrestador || ''} onChange={e => updateRS('nomePrestador', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="rs-prestador-doc" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>CPF / CNPJ</label>
                      <input id="rs-prestador-doc" className={styles.campoInput} placeholder="000.000.000-00" value={rs.docPrestador || ''} onChange={e => updateRS('docPrestador', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ASSINATURA DIGITAL DO PRESTADOR */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinatura do Prestador</div>
                  <AssinaturaInline
                    label="Assinatura do Prestador"
                    value={rs.assinaturaPrestador || null}
                    onChange={v => updateRS('assinaturaPrestador', v)}
                  />
                </div>

                {/* OBSERVAÇÕES */}
                <div style={{ background:'#fffbeb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fcd34d' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#92400e', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>📌 Observações</div>
                  <div style={{ fontSize:11, color:'#92400e', lineHeight:1.5 }}>
                    • Este recibo é válido como comprovante de pagamento conforme legislação brasileira.<br/>
                    • Recomenda-se manter uma via para ambas as partes.
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }

      case 'contrato_servico': {
        const ct = val || {};
        const updateCT = (field: string, v: unknown) => setResposta(bloco.uid, { ...ct, [field]: v });
        const valorCT = Number.parseFloat(ct.valor || '0');
        if (!ct._tipo) setTimeout(() => updateCT('_tipo', 'contrato_servico'), 0);
        const secTitle = (icon: string, txt: string) => (
          <div style={{ fontSize:11, fontWeight:900, color:'#0D47A1', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'2px solid #e5e7eb', paddingBottom:4, marginBottom:8 }}>{icon} {txt}</div>
        );
        const fieldLbl = (txt: string) => (
          <label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>{txt}</label>
        );
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #1e3a5f', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>

              {/* Header */}
              <div style={{ background:'#1e3a5f', color:'#fff', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
                <div style={{ fontSize:11, opacity:0.85, marginTop:2 }}>DE MANUTENÇÃO</div>
              </div>

              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

                <div style={{ fontSize:13, color:'#374151', lineHeight:1.6, fontStyle:'italic' }}>
                  Pelo presente instrumento particular, de um lado:
                </div>

                {/* CONTRATANTE */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  {secTitle('👤', 'Contratante')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fieldLbl('Nome / Razão Social')}<input className={styles.campoInput} placeholder="Nome do contratante..." value={ct.contratanteNome || ''} onChange={e => updateCT('contratanteNome', e.target.value)} /></div>
                    <div>{fieldLbl('CPF / CNPJ')}<input className={styles.campoInput} placeholder="000.000.000-00" value={ct.contratanteDoc || ''} onChange={e => updateCT('contratanteDoc', e.target.value)} /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8, marginTop:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>{fieldLbl('Endereço')}<div style={{ flex:1 }}><input className={styles.campoInput} placeholder="Endereço completo..." value={ct.contratanteEndereco || ''} onChange={e => updateCT('contratanteEndereco', e.target.value)} /></div></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                    <div>{fieldLbl('E-mail')}<input className={styles.campoInput} type="email" placeholder="email@exemplo.com" value={ct.contratanteEmail || ''} onChange={e => updateCT('contratanteEmail', e.target.value)} /></div>
                    <div>{fieldLbl('Telefone')}<input className={styles.campoInput} placeholder="(00) 00000-0000" value={ct.contratanteTelefone || ''} onChange={e => updateCT('contratanteTelefone', e.target.value)} /></div>
                  </div>
                </div>

                <div style={{ fontSize:13, color:'#374151', fontStyle:'italic' }}>E, de outro lado:</div>

                {/* CONTRATADO */}
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bbf7d0' }}>
                  {secTitle('🛠️', 'Contratado')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fieldLbl('Nome / Razão Social')}<input className={styles.campoInput} placeholder="Nome do contratado..." value={ct.contratadoNome || ''} onChange={e => updateCT('contratadoNome', e.target.value)} /></div>
                    <div>{fieldLbl('CPF / CNPJ')}<input className={styles.campoInput} placeholder="000.000.000-00" value={ct.contratadoDoc || ''} onChange={e => updateCT('contratadoDoc', e.target.value)} /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8, marginTop:8 }}>
                    <div>{fieldLbl('Endereço')}<input className={styles.campoInput} placeholder="Endereço completo..." value={ct.contratadoEndereco || ''} onChange={e => updateCT('contratadoEndereco', e.target.value)} /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                    <div>{fieldLbl('E-mail')}<input className={styles.campoInput} type="email" placeholder="email@exemplo.com" value={ct.contratadoEmail || ''} onChange={e => updateCT('contratadoEmail', e.target.value)} /></div>
                    <div>{fieldLbl('Telefone')}<input className={styles.campoInput} placeholder="(00) 00000-0000" value={ct.contratadoTelefone || ''} onChange={e => updateCT('contratadoTelefone', e.target.value)} /></div>
                  </div>
                </div>

                <div style={{ fontSize:12, color:'#374151', lineHeight:1.6, padding:'8px 10px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8 }}>
                  Têm entre si justo e contratado o presente <strong>Contrato de Prestação de Serviços de Manutenção</strong>, que se regerá pelas disposições do Código Civil Brasileiro (Lei nº 10.406/2002) e demais normas aplicáveis.
                </div>

                {/* CLÁUSULA 1 – DO OBJETO */}
                <div>{secTitle('📋', 'Cláusula 1 – Do Objeto')}
                  <div style={{ fontSize:12, color:'#374151', lineHeight:1.5, marginBottom:8 }}>O presente contrato tem por objeto a prestação de serviços de manutenção preventiva e/ou corretiva:</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fieldLbl('Descrição dos equipamentos/serviços')}
                    <MicButton onResult={t => updateCT('objetoDescricao', (ct.objetoDescricao || '') + (ct.objetoDescricao ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={3} placeholder="Descreva os equipamentos e serviços..." value={ct.objetoDescricao || ''} onChange={e => updateCT('objetoDescricao', e.target.value)} />
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      {fieldLbl('Local da prestação dos serviços')}
                      <MicButton onResult={t => updateCT('objetoLocal', (ct.objetoLocal || '') + (ct.objetoLocal ? ' ' : '') + t)} />
                    </div>
                    <textarea className={styles.campoInput} rows={2} placeholder="Local onde os serviços serão prestados..." value={ct.objetoLocal || ''} onChange={e => updateCT('objetoLocal', e.target.value)} />
                  </div>
                </div>

                {/* CLÁUSULA 2 – OBRIGAÇÕES DO CONTRATADO */}
                <div>{secTitle('📌', 'Cláusula 2 – Obrigações do Contratado')}
                  <div style={{ fontSize:12, color:'#374151', lineHeight:1.6 }}>
                    I – Executar os serviços com zelo, qualidade e dentro das normas técnicas;<br/>
                    II – Utilizar mão de obra qualificada;<br/>
                    III – Cumprir os prazos acordados;<br/>
                    IV – Responsabilizar-se por danos causados por culpa ou dolo;<br/>
                    V – Fornecer relatório técnico dos serviços realizados.
                  </div>
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      {fieldLbl('Obrigações adicionais (opcional)')}
                      <MicButton onResult={t => updateCT('obrigacoesContratado', (ct.obrigacoesContratado || '') + (ct.obrigacoesContratado ? ' ' : '') + t)} />
                    </div>
                    <textarea className={styles.campoInput} rows={2} placeholder="Adicione obrigações extras..." value={ct.obrigacoesContratado || ''} onChange={e => updateCT('obrigacoesContratado', e.target.value)} />
                  </div>
                </div>

                {/* CLÁUSULA 3 – OBRIGAÇÕES DO CONTRATANTE */}
                <div>{secTitle('📌', 'Cláusula 3 – Obrigações do Contratante')}
                  <div style={{ fontSize:12, color:'#374151', lineHeight:1.6 }}>
                    I – Fornecer acesso aos equipamentos e instalações;<br/>
                    II – Efetuar o pagamento conforme estipulado;<br/>
                    III – Informar condições especiais de operação;<br/>
                    IV – Disponibilizar ambiente adequado para execução.
                  </div>
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      {fieldLbl('Obrigações adicionais (opcional)')}
                      <MicButton onResult={t => updateCT('obrigacoesContratante', (ct.obrigacoesContratante || '') + (ct.obrigacoesContratante ? ' ' : '') + t)} />
                    </div>
                    <textarea className={styles.campoInput} rows={2} placeholder="Adicione obrigações extras..." value={ct.obrigacoesContratante || ''} onChange={e => updateCT('obrigacoesContratante', e.target.value)} />
                  </div>
                </div>

                {/* CLÁUSULA 4 – DO PRAZO */}
                <div>{secTitle('📅', 'Cláusula 4 – Do Prazo')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    <div>{fieldLbl('Vigência (meses)')}<input className={styles.campoInput} type="number" min={1} placeholder="12" value={ct.prazoMeses || ''} onChange={e => updateCT('prazoMeses', e.target.value)} /></div>
                    <div>{fieldLbl('Data início')}<input className={styles.campoInput} type="date" value={ct.prazoInicio || ''} onChange={e => updateCT('prazoInicio', e.target.value)} /></div>
                    <div>{fieldLbl('Data término')}<input className={styles.campoInput} type="date" value={ct.prazoFim || ''} onChange={e => updateCT('prazoFim', e.target.value)} /></div>
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>Podendo ser renovado mediante acordo entre as partes.</div>
                </div>

                {/* CLÁUSULA 5 – VALOR E PAGAMENTO */}
                <div>{secTitle('💰', 'Cláusula 5 – Do Valor e Forma de Pagamento')}
                  <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:10, padding:'10px 14px', textAlign:'center', marginBottom:8 }}>
                    {fieldLbl('Valor dos serviços (R$)')}
                    <input className={styles.campoInput} type="number" min={0} step={0.01} placeholder="0,00" value={ct.valor || ''} onChange={e => updateCT('valor', e.target.value)} style={{ fontSize:20, fontWeight:900, fontFamily:'monospace', textAlign:'center', border:'2px solid #86efac' }} />
                    {valorCT > 0 && (
                      <div style={{ fontSize:11, fontWeight:600, color:'#4b5563', marginTop:4, fontStyle:'italic' }}>({valorPorExtenso(valorCT)})</div>
                    )}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      {fieldLbl('Forma de pagamento')}
                      <select className={styles.campoInput} value={ct.formaPagamento || ''} onChange={e => updateCT('formaPagamento', e.target.value)} style={{ fontWeight:700 }}>
                        <option value="">Selecione...</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Transferência Bancária">Transferência Bancária</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>{fieldLbl('Data(s) de pagamento')}<input className={styles.campoInput} placeholder="Ex: todo dia 10" value={ct.dataPagamento || ''} onChange={e => updateCT('dataPagamento', e.target.value)} /></div>
                  </div>
                </div>

                {/* CLÁUSULA 6 – DA RESCISÃO */}
                <div>{secTitle('⚠️', 'Cláusula 6 – Da Rescisão')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8 }}>
                    <div>{fieldLbl('Aviso prévio (dias)')}<input className={styles.campoInput} type="number" min={1} placeholder="30" value={ct.avisoPrevio || ''} onChange={e => updateCT('avisoPrevio', e.target.value)} /></div>
                  </div>
                  <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>Em caso de descumprimento contratual, a parte prejudicada poderá rescindir imediatamente.</div>
                </div>

                {/* CLÁUSULA 7 – DAS PENALIDADES */}
                <div>{secTitle('⚖️', 'Cláusula 7 – Das Penalidades')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fieldLbl('Multa (R$)')}<input className={styles.campoInput} type="number" min={0} step={0.01} placeholder="0,00" value={ct.multa || ''} onChange={e => updateCT('multa', e.target.value)} /></div>
                    <div>{fieldLbl('Ou % do valor')}<input className={styles.campoInput} type="number" min={0} max={100} placeholder="10" value={ct.multaPorcentagem || ''} onChange={e => updateCT('multaPorcentagem', e.target.value)} /></div>
                  </div>
                </div>

                {/* CLÁUSULA 8 – fixa */}
                <div>{secTitle('👷', 'Cláusula 8 – Da Responsabilidade Trabalhista')}
                  <div style={{ fontSize:12, color:'#374151', lineHeight:1.6 }}>O presente contrato não gera vínculo empregatício entre as partes, sendo o CONTRATADO o único responsável por encargos trabalhistas, previdenciários e fiscais.</div>
                </div>

                {/* CLÁUSULA 9 – DO FORO */}
                <div>{secTitle('🏛️', 'Cláusula 9 – Do Foro')}
                  <div>{fieldLbl('Comarca')}<input className={styles.campoInput} placeholder="Cidade / Comarca..." value={ct.foro || ''} onChange={e => updateCT('foro', e.target.value)} /></div>
                </div>

                {/* CLÁUSULA 10 – fixa */}
                <div>{secTitle('📝', 'Cláusula 10 – Disposições Gerais')}
                  <div style={{ fontSize:12, color:'#374151', lineHeight:1.6, marginBottom:8 }}>Este contrato obriga as partes e seus sucessores, sendo vedada a cessão sem prévia autorização por escrito.</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fieldLbl('Disposições adicionais (opcional)')}
                    <MicButton onResult={t => updateCT('disposicoesAdicionais', (ct.disposicoesAdicionais || '') + (ct.disposicoesAdicionais ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={2} placeholder="Cláusulas adicionais..." value={ct.disposicoesAdicionais || ''} onChange={e => updateCT('disposicoesAdicionais', e.target.value)} />
                </div>

                {/* LOCAL E DATA */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>{fieldLbl('📍 Local')}<input className={styles.campoInput} placeholder="Cidade..." value={ct.local || ''} onChange={e => updateCT('local', e.target.value)} /></div>
                  <div>{fieldLbl('📅 Data')}<input className={styles.campoInput} type="date" value={ct.data || new Date().toISOString().split('T')[0]} onChange={e => updateCT('data', e.target.value)} /></div>
                </div>

                {/* ASSINATURAS */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinaturas</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline label="Contratante" value={ct.assinaturaContratante || null} onChange={v => updateCT('assinaturaContratante', v)} />
                    <AssinaturaInline label="Contratado" value={ct.assinaturaContratado || null} onChange={v => updateCT('assinaturaContratado', v)} />
                  </div>
                </div>

                {/* TESTEMUNHAS */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>👥 Testemunhas</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                    <div>{fieldLbl('Testemunha 1 – Nome')}<input className={styles.campoInput} placeholder="Nome completo..." value={ct.testemunha1Nome || ''} onChange={e => updateCT('testemunha1Nome', e.target.value)} /></div>
                    <div>{fieldLbl('Testemunha 1 – CPF')}<input className={styles.campoInput} placeholder="000.000.000-00" value={ct.testemunha1Doc || ''} onChange={e => updateCT('testemunha1Doc', e.target.value)} /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fieldLbl('Testemunha 2 – Nome')}<input className={styles.campoInput} placeholder="Nome completo..." value={ct.testemunha2Nome || ''} onChange={e => updateCT('testemunha2Nome', e.target.value)} /></div>
                    <div>{fieldLbl('Testemunha 2 – CPF')}<input className={styles.campoInput} placeholder="000.000.000-00" value={ct.testemunha2Doc || ''} onChange={e => updateCT('testemunha2Doc', e.target.value)} /></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }

      case 'os_assistencia_tecnica': {
        const os = val || {};
        const updateOS = (field: string, v: unknown) => setResposta(bloco.uid, { ...os, [field]: v });
        if (!os._tipo) setTimeout(() => updateOS('_tipo', 'os_assistencia_tecnica'), 0);
        if (!os.numero) {
          const cont = Number.parseInt(localStorage.getItem('sm_contador_os_at') || '0', 10) + 1;
          localStorage.setItem('sm_contador_os_at', String(cont));
          const h = new Date();
          const num = `OSAT-${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}-${String(cont).padStart(4,'0')}`;
          setTimeout(() => updateOS('numero', num), 0);
        }
        const itensMat: Array<{ descricao: string; qtd: string; preco: string; cotadoEm: string }> = os.materiais || [];
        const addMat = () => updateOS('materiais', [...itensMat, { descricao: '', qtd: '1', preco: '', cotadoEm: '' }]);
        const updateMat = (idx: number, field: string, v: string) => {
          const novo = [...itensMat];
          novo[idx] = { ...novo[idx], [field]: v };
          updateOS('materiais', novo);
        };
        const removeMat = (idx: number) => updateOS('materiais', itensMat.filter((_, i) => i !== idx));
        const totalMat = itensMat.reduce((acc, it) => acc + (Number.parseFloat(it.qtd || '0') * Number.parseFloat(it.preco || '0')), 0);
        const valorServico = Number.parseFloat(os.valorServico || '0');
        const valorTotal = totalMat + valorServico;

        // ── Cadastro reutilizável (localStorage) ──
        type CadTecnico    = { nome: string };
        type CadGestor     = { nome: string; cargo: string };
        type CadPrestadora = { nome: string; cnpj: string; email: string; whatsapp: string };
        type CadMaquina    = { nome: string; codigo: string; numero: string; setor?: string; modelo?: string; marca?: string; localizacao?: string };

        const LS_TECNICOS    = 'sm_cad_tecnicos';
        const LS_GESTORES    = 'sm_cad_gestores';
        const LS_PRESTADORAS = 'sm_cad_prestadoras';
        const LS_MAQUINAS    = 'sm_cad_maquinas';
        const LS_TIPOS_MANUT = 'sm_cad_tipos_manutencao';

        const secTitle = (icon: string, txt: string) => (
          <div style={{ fontSize:11, fontWeight:900, color:'#b45309', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'2px solid #fde68a', paddingBottom:4, marginBottom:8 }}>{icon} {txt}</div>
        );
        const fieldLbl = (txt: string) => (
          <label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>{txt}</label>
        );

        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #d97706', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>

              {/* Header */}
              <div style={{ background:'linear-gradient(135deg,#d97706,#92400e)', color:'#fff', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>🛠️ ORDEM DE SERVIÇO</div>
                <div style={{ fontSize:12, opacity:0.9, marginTop:2 }}>ASSISTÊNCIA TÉCNICA</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {os.numero || '...'}</div>
              </div>

              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

                {/* DICA DE USO DOS DROPDOWNS */}
                <div style={{ background:'#eff6ff', borderRadius:10, padding:'12px 16px', border:'1.5px solid #93c5fd', display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:20, lineHeight:1 }}>💡</span>
                  <p style={{ margin:0, fontSize:13, color:'#1e40af', lineHeight:1.5 }}>
                    Para salvar os dados dos elementos em dropdown, preencha o campo primeiro. Logo em seguida vai aparecer o botão de salvar.
                  </p>
                </div>

                {/* TIPO DE MANUTENÇÃO */}
                <div style={{ background:'#fef3c7', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fbbf24' }}>
                  {secTitle('🔧', 'Tipo de Manutenção')}
                  {(() => {
                    let tipos: string[] = [];
                    try { tipos = JSON.parse(localStorage.getItem(LS_TIPOS_MANUT) || '[]'); } catch { /* ok */ }
                    return (
                      <>
                        <div style={{ display:'flex', gap:6, alignItems:'end' }}>
                          <div style={{ flex:1 }}>{fieldLbl('Selecionar Tipo')}
                            <select
                              className={styles.campoInput}
                              value={os.tipoManutencao || ''}
                              onChange={e => {
                                const sel = e.target.value;
                                if (sel === '__novo__') {
                                  setResposta(bloco.uid, { ...os, tipoManutencao: '' });
                                } else {
                                  setResposta(bloco.uid, { ...os, tipoManutencao: sel });
                                }
                              }}
                              style={{ fontWeight: 700 }}
                            >
                              <option value="">Selecione o tipo...</option>
                              {tipos.map((t, i) => (
                                <option key={i} value={t}>{t}</option>
                              ))}
                              <option value="__novo__">+ Cadastrar novo tipo</option>
                            </select>
                          </div>
                          {os.tipoManutencao && tipos.includes(os.tipoManutencao) && (
                            <>
                              <button type="button" title="Editar tipo cadastrado" onClick={() => {
                                const novoNome = prompt('Editar nome do tipo:', os.tipoManutencao);
                                if (!novoNome || !novoNome.trim() || novoNome.trim() === os.tipoManutencao) return;
                                if (tipos.includes(novoNome.trim())) { alert('Tipo "' + novoNome.trim() + '" já existe!'); return; }
                                let current: string[] = [];
                                try { current = JSON.parse(localStorage.getItem(LS_TIPOS_MANUT) || '[]'); } catch { /* ok */ }
                                const updated = current.map(t => t === os.tipoManutencao ? novoNome.trim() : t);
                                localStorage.setItem(LS_TIPOS_MANUT, JSON.stringify(updated));
                                setResposta(bloco.uid, { ...os, tipoManutencao: novoNome.trim() });
                              }} style={{ height:36, width:36, background:'#dbeafe', border:'1.5px solid #93c5fd', borderRadius:8, color:'#1d4ed8', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
                              <button type="button" title="Excluir tipo cadastrado" onClick={() => {
                                if (!confirm('Excluir "' + os.tipoManutencao + '" da lista de tipos?')) return;
                                let current: string[] = [];
                                try { current = JSON.parse(localStorage.getItem(LS_TIPOS_MANUT) || '[]'); } catch { /* ok */ }
                                const updated = current.filter(t => t !== os.tipoManutencao);
                                localStorage.setItem(LS_TIPOS_MANUT, JSON.stringify(updated));
                                setResposta(bloco.uid, { ...os, tipoManutencao: '' });
                              }} style={{ height:36, width:36, background:'#fee2e2', border:'1.5px solid #fca5a5', borderRadius:8, color:'#dc2626', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>🗑️</button>
                            </>
                          )}
                        </div>
                        <div style={{ marginTop:8 }}>{fieldLbl('Nome do Tipo')}<input className={styles.campoInput} placeholder="Ex: Preventiva, Corretiva, Preditiva..." value={os.tipoManutencao || ''} onChange={e => updateOS('tipoManutencao', e.target.value)} /></div>
                        {os.tipoManutencao && !tipos.includes(os.tipoManutencao) && (
                          <button type="button" onClick={() => {
                            const nome = (os.tipoManutencao || '').trim();
                            if (!nome) return;
                            let current: string[] = [];
                            try { current = JSON.parse(localStorage.getItem(LS_TIPOS_MANUT) || '[]'); } catch { /* ok */ }
                            if (current.includes(nome)) { alert('Tipo "' + nome + '" já existe!'); return; }
                            current.push(nome);
                            localStorage.setItem(LS_TIPOS_MANUT, JSON.stringify(current));
                            setResposta(bloco.uid, { ...os, tipoManutencao: nome });
                            alert('✅ Tipo "' + nome + '" salvo com sucesso!');
                          }}
                            style={{ marginTop:6, padding:'6px 14px', background:'#fef3c7', border:'1.5px solid #fbbf24', borderRadius:8, color:'#92400e', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                            💾 Salvar este tipo para uso futuro
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 1 — MÁQUINA / EQUIPAMENTO */}
                <div style={{ background:'#fffbeb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fde68a' }}>
                  {secTitle('🖥️', '1 — Máquina / Equipamento')}

                  {/* Botões: Selecionar / Cadastrar Nova */}
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _maqModalAberto: true, _maqModalAba: 'selecionar' })}
                      style={{ flex:1, padding:'10px 14px', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', border:'none', borderRadius:10, fontSize:13, fontWeight:900, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      🔍 Selecionar Máquina
                    </button>
                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _maqModalAberto: true, _maqModalAba: 'cadastrar' })}
                      style={{ flex:1, padding:'10px 14px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:10, fontSize:13, fontWeight:900, color:'#0D0D0D', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      ➕ Cadastrar Nova
                    </button>
                  </div>

                  {/* Badge da máquina selecionada */}
                  {os._cadMaqSucesso && (
                    <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', marginBottom:10, border:'1.5px solid #86efac', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, fontWeight:800, color:'#16a34a' }}>{os._cadMaqSucesso}</span>
                      <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _cadMaqSucesso: '' })} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#9ca3af' }}>✕</button>
                    </div>
                  )}
                  {os.maquinaNumero ? (
                    <div style={{ background:'#eff6ff', borderRadius:10, padding:'10px 14px', marginBottom:10, border:'1.5px solid #bfdbfe' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:900, color:'#16a34a' }}>✅ Selecionada:</span>
                        <span style={{ background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:6, fontFamily:'monospace' }}>Nº {os.maquinaNumero}</span>
                        <span style={{ fontSize:14, fontWeight:700, color:'#1e40af' }}>{os.maquinaNome}</span>
                        <button type="button" onClick={() => setResposta(bloco.uid, { ...os, maquinaNome:'', maquinaCodigo:'', maquinaNumero:'', maquinaSetor:'', maquinaModelo:'', maquinaMarca:'', maquinaLocalizacao:'' })}
                          style={{ marginLeft:'auto', background:'#fee2e2', border:'1.5px solid #fca5a5', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:800, color:'#dc2626', cursor:'pointer' }}>✕ Limpar</button>
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8, fontSize:11, color:'#6b7280' }}>
                        {os.maquinaCodigo && <span style={{ fontFamily:'monospace' }}>Cód: {os.maquinaCodigo}</span>}
                        {os.maquinaSetor && <span>🏢 {os.maquinaSetor}</span>}
                        {os.maquinaModelo && <span>� {os.maquinaModelo}</span>}
                        {os.maquinaMarca && <span>📝 {os.maquinaMarca}</span>}
                        {os.maquinaLocalizacao && <span>📍 {os.maquinaLocalizacao}</span>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'14px', marginBottom:10, border:'1.5px dashed #d1d5db', textAlign:'center' }}>
                      <span style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma máquina selecionada — use os botões acima</span>
                    </div>
                  )}

                  {/* ══ MODAL SELECIONAR / CADASTRAR MÁQUINA ══ */}
                  {os._maqModalAberto && (() => {
                    let maqs: CadMaquina[] = [];
                    try { maqs = JSON.parse(localStorage.getItem(LS_MAQUINAS) || '[]'); } catch { /* ok */ }
                    const aba = os._maqModalAba || 'selecionar';
                    const fecharModal = () => setResposta(bloco.uid, { ...os, _maqModalAberto: false, _buscaMaquina: '' });

                    // ── Filtro computado fora do JSX para evitar problemas de closure ──
                    const qBusca = (os._buscaMaquina || '').toLowerCase().trim();
                    const maqsFiltradas = qBusca
                      ? maqs.filter(m =>
                          m.nome.toLowerCase().includes(qBusca) ||
                          m.codigo.toLowerCase().includes(qBusca) ||
                          m.numero.includes(qBusca) ||
                          (m.setor || '').toLowerCase().includes(qBusca) ||
                          (m.modelo || '').toLowerCase().includes(qBusca) ||
                          (m.marca || '').toLowerCase().includes(qBusca) ||
                          (m.localizacao || '').toLowerCase().includes(qBusca)
                        )
                      : maqs;

                    return (
                      <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
                        onClick={fecharModal}>
                        <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:560, maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,0.3)', overflow:'hidden' }}
                          onClick={e => e.stopPropagation()}>

                          {/* Header */}
                          <div style={{ background:'linear-gradient(135deg,#FFD600,#FF8F00)', padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                            <div>
                              <div style={{ fontSize:18, fontWeight:900, color:'#0D0D0D' }}>🖥️ Máquinas</div>
                              <div style={{ fontSize:11, color:'#0D0D0D', opacity:0.7 }}>{maqs.length} cadastrada{maqs.length !== 1 ? 's' : ''}</div>
                            </div>
                            <button type="button" onClick={fecharModal}
                              style={{ background:'rgba(0,0,0,0.15)', border:'none', borderRadius:'50%', width:32, height:32, fontSize:18, cursor:'pointer', color:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                          </div>

                          {/* Tabs */}
                          <div style={{ display:'flex', borderBottom:'2px solid #e5e7eb', flexShrink:0 }}>
                            {([['selecionar', '🔍 Selecionar'], ['cadastrar', '➕ Cadastrar Nova']] as const).map(([key, label]) => (
                              <button key={key} type="button" onClick={() => setResposta(bloco.uid, { ...os, _maqModalAba: key })}
                                style={{ flex:1, padding:'11px 0', fontSize:13, fontWeight:800, border:'none', cursor:'pointer', background: aba === key ? '#fffbeb' : '#fff', color: aba === key ? '#b45309' : '#9ca3af', borderBottom: aba === key ? '3px solid #f59e0b' : '3px solid transparent' }}>
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Body */}
                          <div style={{ padding:20, overflowY:'auto', flex:1 }}>

                            {/* ═══ ABA SELECIONAR ═══ */}
                            {aba === 'selecionar' && (
                              <>
                                <div style={{ position:'relative', marginBottom:12 }}>
                                  <input
                                    className={styles.campoInput}
                                    placeholder="🔍 Buscar por nome, código, Nº ou setor..."
                                    value={os._buscaMaquina ?? ''}
                                    onChange={e => {
                                      const novoVal = e.target.value;
                                      setResposta(bloco.uid, { ...os, _buscaMaquina: novoVal });
                                    }}
                                    autoFocus
                                    style={{ fontWeight:700, fontSize:14, padding:'12px 40px 12px 14px' }}
                                  />
                                  {os._buscaMaquina && (
                                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _buscaMaquina: '' })}
                                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9ca3af' }}>✕</button>
                                  )}
                                </div>

                                {maqs.length === 0 ? (
                                  <div style={{ textAlign:'center', padding:'32px 16px' }}>
                                    <div style={{ fontSize:40, marginBottom:12 }}>🖥️</div>
                                    <div style={{ fontSize:14, fontWeight:700, color:'#6b7280', marginBottom:6 }}>Nenhuma máquina cadastrada</div>
                                    <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>Cadastre uma máquina na aba "➕ Cadastrar Nova"</div>
                                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _maqModalAba: 'cadastrar' })}
                                      style={{ padding:'10px 20px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:10, fontSize:13, fontWeight:900, color:'#0D0D0D', cursor:'pointer' }}>
                                      ➕ Cadastrar Agora
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div style={{ fontSize:11, fontWeight:800, color:'#6b7280', marginBottom:8 }}>
                                      {qBusca ? `${maqsFiltradas.length} resultado${maqsFiltradas.length !== 1 ? 's' : ''}` : `${maqs.length} máquina${maqs.length !== 1 ? 's' : ''}`}
                                    </div>
                                    {maqsFiltradas.length === 0 ? (
                                      <div style={{ textAlign:'center', padding:'24px 16px', color:'#9ca3af', fontSize:13 }}>
                                        Nenhuma máquina encontrada para &quot;{os._buscaMaquina}&quot;
                                      </div>
                                    ) : (
                                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                        {maqsFiltradas.map(m => {
                                          const selecionada = os.maquinaNumero === m.numero;
                                          return (
                                            <div key={m.numero}
                                              onClick={() => {
                                                setResposta(bloco.uid, { ...os, maquinaNome: m.nome, maquinaCodigo: m.codigo, maquinaNumero: m.numero, maquinaSetor: m.setor || '', maquinaModelo: m.modelo || '', maquinaMarca: m.marca || '', maquinaLocalizacao: m.localizacao || '', _maqModalAberto: false, _buscaMaquina: '' });
                                              }}
                                              style={{
                                                padding:'12px 14px', cursor:'pointer', borderRadius:12,
                                                border: selecionada ? '2px solid #3b82f6' : '1.5px solid #e5e7eb',
                                                background: selecionada ? '#eff6ff' : '#f9fafb',
                                                transition:'all 0.15s',
                                              }}
                                              onMouseEnter={e => { if (!selecionada) e.currentTarget.style.background = '#fef9c3'; }}
                                              onMouseLeave={e => { if (!selecionada) e.currentTarget.style.background = '#f9fafb'; }}
                                            >
                                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                                <span style={{ background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:900, padding:'2px 8px', borderRadius:6, fontFamily:'monospace', flexShrink:0 }}>Nº {m.numero}</span>
                                                <span style={{ fontWeight:800, fontSize:14, color:'#0D0D0D' }}>{m.nome}</span>
                                                {selecionada && <span style={{ fontSize:10, fontWeight:900, color:'#3b82f6', background:'#dbeafe', padding:'2px 8px', borderRadius:6, marginLeft:'auto' }}>ATUAL</span>}
                                              </div>
                                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                <div style={{ display:'flex', flexWrap:'wrap', gap:6, fontSize:11, color:'#6b7280', flex:1 }}>
                                                  {m.codigo && <span style={{ fontFamily:'monospace' }}>Cód: {m.codigo}</span>}
                                                  {m.setor && <span>🏢 {m.setor}</span>}
                                                  {m.modelo && <span>📦 {m.modelo}</span>}
                                                  {m.marca && <span>📝 {m.marca}</span>}
                                                  {m.localizacao && <span>📍 {m.localizacao}</span>}
                                                </div>
                                                <button type="button" title="Editar" onClick={e => { e.stopPropagation();
                                                  const novoNome = prompt('Nome:', m.nome);
                                                  if (!novoNome?.trim()) return;
                                                  const novoCodigo = prompt('Código:', m.codigo || '');
                                                  const novoSetor = prompt('Setor:', m.setor || '');
                                                  const novoLocal = prompt('Localização:', m.localizacao || '');
                                                  const novoModelo = prompt('Operador:', m.modelo || '');
                                                  const novoMarca = prompt('Descrição:', m.marca || '');
                                                  const maqsAtual: CadMaquina[] = JSON.parse(localStorage.getItem(LS_MAQUINAS) || '[]');
                                                  const updated = maqsAtual.map(x => x.numero === m.numero ? { ...x, nome: novoNome.trim(), codigo: novoCodigo?.trim() || x.codigo, setor: novoSetor?.trim() || x.setor, localizacao: novoLocal?.trim() || x.localizacao, modelo: novoModelo?.trim() || x.modelo, marca: novoMarca?.trim() || x.marca } : x);
                                                  localStorage.setItem(LS_MAQUINAS, JSON.stringify(updated));
                                                  setResposta(bloco.uid, { ...os, _maqReload: Date.now() });
                                                }} style={{ background:'#dbeafe', border:'none', borderRadius:6, color:'#1d4ed8', fontSize:12, fontWeight:900, cursor:'pointer', padding:'4px 8px', flexShrink:0 }}>✏️</button>
                                                <button type="button" title="Excluir" onClick={e => { e.stopPropagation();
                                                  if (!confirm(`Excluir máquina "${m.nome}"?`)) return;
                                                  const maqsAtual: CadMaquina[] = JSON.parse(localStorage.getItem(LS_MAQUINAS) || '[]');
                                                  const updated = maqsAtual.filter(x => x.numero !== m.numero);
                                                  localStorage.setItem(LS_MAQUINAS, JSON.stringify(updated));
                                                  if (os.maquinaNumero === m.numero) setResposta(bloco.uid, { ...os, maquinaNome:'', maquinaCodigo:'', maquinaNumero:'', _maqReload: Date.now() });
                                                  else setResposta(bloco.uid, { ...os, _maqReload: Date.now() });
                                                }} style={{ background:'#fee2e2', border:'none', borderRadius:6, color:'#dc2626', fontSize:12, fontWeight:900, cursor:'pointer', padding:'4px 8px', flexShrink:0 }}>🗑️</button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </>
                                )}
                              </>
                            )}

                            {/* ═══ ABA CADASTRAR ═══ */}
                            {aba === 'cadastrar' && (
                              <div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                  <div>{fieldLbl('Nome *')}<input className={styles.campoInput} placeholder="Ex: Compressor, Elevador..." value={os._cadNome || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadNome: e.target.value })} autoFocus /></div>
                                  <div>{fieldLbl('Código / Patrimônio')}<input className={styles.campoInput} placeholder="Ex: EQ-0042" value={os._cadCodigo || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadCodigo: e.target.value })} /></div>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                                  <div>{fieldLbl('Setor')}<input className={styles.campoInput} placeholder="Ex: Produção..." value={os._cadSetor || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadSetor: e.target.value })} /></div>
                                  <div>{fieldLbl('Localização')}<input className={styles.campoInput} placeholder="Ex: Bloco A, 2º andar" value={os._cadLocal || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadLocal: e.target.value })} /></div>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                                  <div>{fieldLbl('Operador')}<input className={styles.campoInput} placeholder="Ex: João Silva" value={os._cadModelo || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadModelo: e.target.value })} /></div>
                                  <div>{fieldLbl('Descrição')}<input className={styles.campoInput} placeholder="Ex: Ar-condicionado sala 3" value={os._cadMarca || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadMarca: e.target.value })} /></div>
                                </div>
                                <div style={{ background:'#eff6ff', borderRadius:8, padding:'8px 12px', marginTop:10, border:'1px solid #bfdbfe' }}>
                                  <span style={{ fontSize:11, color:'#1e40af' }}>🔢 O número de 5 dígitos será gerado automaticamente.</span>
                                </div>
                                {os._cadMaqErro && (
                                  <div style={{ background:'#fef2f2', borderRadius:8, padding:'8px 12px', marginTop:8, border:'1px solid #fca5a5', display:'flex', alignItems:'center', gap:6 }}>
                                    <span style={{ fontSize:12, fontWeight:700, color:'#dc2626' }}>⚠️ {os._cadMaqErro}</span>
                                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _cadMaqErro: '' })} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#9ca3af' }}>✕</button>
                                  </div>
                                )}
                                <button type="button" onClick={() => {
                                  const nome = (os._cadNome || '').trim();
                                  if (!nome) { setResposta(bloco.uid, { ...os, _cadMaqErro: 'Informe o nome da máquina.' }); return; }
                                  // Ler lista FRESCA do localStorage (evita closure stale)
                                  let maqsAtual: CadMaquina[] = [];
                                  try { maqsAtual = JSON.parse(localStorage.getItem(LS_MAQUINAS) || '[]'); } catch { /* ok */ }
                                  if (maqsAtual.some(m => m.nome.toLowerCase() === nome.toLowerCase())) { setResposta(bloco.uid, { ...os, _cadMaqErro: `Máquina "${nome}" já existe!` }); return; }
                                  try {
                                    const contAtual = Number(localStorage.getItem('sm_contador_maquinas') || '0');
                                    const prox = contAtual + 1;
                                    const num = String(prox).padStart(5, '0');
                                    const nova: CadMaquina = { nome, codigo: (os._cadCodigo || '').trim(), numero: num, setor: (os._cadSetor || '').trim() || undefined, modelo: (os._cadModelo || '').trim() || undefined, marca: (os._cadMarca || '').trim() || undefined, localizacao: (os._cadLocal || '').trim() || undefined };
                                    const novaLista = [...maqsAtual, nova];
                                    localStorage.setItem(LS_MAQUINAS, JSON.stringify(novaLista));
                                    localStorage.setItem('sm_contador_maquinas', String(prox));
                                    setResposta(bloco.uid, { ...os, maquinaNome: nova.nome, maquinaCodigo: nova.codigo, maquinaNumero: nova.numero, maquinaSetor: nova.setor || '', maquinaModelo: nova.modelo || '', maquinaMarca: nova.marca || '', maquinaLocalizacao: nova.localizacao || '', _maqModalAberto: false, _buscaMaquina: '', _cadNome:'', _cadCodigo:'', _cadSetor:'', _cadLocal:'', _cadModelo:'', _cadMarca:'', _cadMaqErro:'', _cadMaqSucesso: `✅ "${nova.nome}" cadastrada! Nº ${num}` });
                                  } catch {
                                    setResposta(bloco.uid, { ...os, _cadMaqErro: 'Erro ao salvar. Verifique o armazenamento do navegador.' });
                                  }
                                }}
                                  style={{ marginTop:14, width:'100%', padding:'12px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:10, fontSize:14, fontWeight:900, color:'#0D0D0D', cursor:'pointer', boxShadow:'0 4px 16px rgba(255,183,0,0.35)' }}>
                                  💾 Cadastrar e Selecionar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2 — CHAMADO / TÉCNICO */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  {secTitle('👷', '2 — Técnico do Chamado')}
                  {(() => {
                    let tecnicos: CadTecnico[] = [];
                    try { tecnicos = JSON.parse(localStorage.getItem(LS_TECNICOS) || '[]'); } catch { /* ok */ }
                    return (
                      <>
                        <div style={{ display:'flex', gap:6, alignItems:'end' }}>
                          <div style={{ flex:1 }}>{fieldLbl('Selecionar Técnico')}
                            <select
                              className={styles.campoInput}
                              value={os.tecnicoNome || ''}
                              onChange={e => {
                                const sel = e.target.value;
                                if (sel === '__novo__') {
                                  setResposta(bloco.uid, { ...os, tecnicoNome: '' });
                                } else if (sel) {
                                  setResposta(bloco.uid, { ...os, tecnicoNome: sel });
                                } else {
                                  setResposta(bloco.uid, { ...os, tecnicoNome: '' });
                                }
                              }}
                              style={{ fontWeight: 700 }}
                            >
                              <option value="">Selecione um técnico...</option>
                              {tecnicos.map((t, i) => (
                                <option key={i} value={t.nome}>{t.nome}</option>
                              ))}
                              <option value="__novo__">+ Cadastrar novo técnico</option>
                            </select>
                          </div>
                          {os.tecnicoNome && tecnicos.some(t => t.nome === os.tecnicoNome) && (
                            <>
                              <button type="button" title="Editar técnico cadastrado" onClick={() => {
                                const novoNome = prompt('Editar nome do técnico:', os.tecnicoNome);
                                if (!novoNome || !novoNome.trim() || novoNome.trim() === os.tecnicoNome) return;
                                if (tecnicos.some(t => t.nome === novoNome.trim())) { alert('Técnico "' + novoNome.trim() + '" já existe!'); return; }
                                let current: CadTecnico[] = [];
                                try { current = JSON.parse(localStorage.getItem(LS_TECNICOS) || '[]'); } catch { /* ok */ }
                                const updated = current.map(t => t.nome === os.tecnicoNome ? { ...t, nome: novoNome.trim() } : t);
                                localStorage.setItem(LS_TECNICOS, JSON.stringify(updated));
                                setResposta(bloco.uid, { ...os, tecnicoNome: novoNome.trim() });
                              }} style={{ height:36, width:36, background:'#dbeafe', border:'1.5px solid #93c5fd', borderRadius:8, color:'#1d4ed8', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
                              <button type="button" title="Excluir técnico cadastrado" onClick={() => {
                                if (!confirm('Excluir "' + os.tecnicoNome + '" da lista de técnicos?')) return;
                                let current: CadTecnico[] = [];
                                try { current = JSON.parse(localStorage.getItem(LS_TECNICOS) || '[]'); } catch { /* ok */ }
                                const updated = current.filter(t => t.nome !== os.tecnicoNome);
                                localStorage.setItem(LS_TECNICOS, JSON.stringify(updated));
                                setResposta(bloco.uid, { ...os, tecnicoNome: '' });
                              }} style={{ height:36, width:36, background:'#fee2e2', border:'1.5px solid #fca5a5', borderRadius:8, color:'#dc2626', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>🗑️</button>
                            </>
                          )}
                        </div>
                        <div style={{ marginTop:8 }}>{fieldLbl('Nome do Técnico')}<input className={styles.campoInput} placeholder="Nome do técnico responsável..." value={os.tecnicoNome || ''} onChange={e => updateOS('tecnicoNome', e.target.value)} /></div>
                        {os.tecnicoNome && !tecnicos.some(t => t.nome === os.tecnicoNome) && (
                          <button type="button" onClick={() => {
                            if (!os.tecnicoNome?.trim()) return;
                            const updated = [...tecnicos, { nome: os.tecnicoNome.trim() }];
                            localStorage.setItem(LS_TECNICOS, JSON.stringify(updated));
                            setResposta(bloco.uid, { ...os, tecnicoNome: os.tecnicoNome.trim() });
                            alert('✅ Técnico "' + os.tecnicoNome.trim() + '" salvo com sucesso!');
                          }}
                            style={{ marginTop:6, padding:'6px 14px', background:'#dbeafe', border:'1.5px solid #93c5fd', borderRadius:8, color:'#1d4ed8', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                            💾 Salvar este técnico para uso futuro
                          </button>
                        )}
                      </>
                    );
                  })()}
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      {fieldLbl('Descrição do Problema / Serviço')}
                      <MicButton onResult={t => updateOS('tecnicoDescricao', (os.tecnicoDescricao || '') + (os.tecnicoDescricao ? ' ' : '') + t)} />
                    </div>
                    <textarea className={styles.campoInput} rows={3} placeholder="Descreva o problema encontrado e o serviço a ser executado..." value={os.tecnicoDescricao || ''} onChange={e => updateOS('tecnicoDescricao', e.target.value)} />
                  </div>
                </div>

                {/* 3 — AVALIAÇÃO TÉCNICA TERCEIRIZADA */}
                <div style={{ background:'#fef3c7', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fde68a' }}>
                  {secTitle('📋', '3 — Avaliação de Técnico Terceirizado')}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fieldLbl('Parecer / Laudo Técnico')}
                    <MicButton onResult={t => updateOS('avaliacaoTerceirizada', (os.avaliacaoTerceirizada || '') + (os.avaliacaoTerceirizada ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={3} placeholder="Diagnóstico e parecer do técnico terceirizado..." value={os.avaliacaoTerceirizada || ''} onChange={e => updateOS('avaliacaoTerceirizada', e.target.value)} />
                </div>

                {/* 4 — COMPRA DE MATERIAL */}
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bbf7d0' }}>
                  {secTitle('🛒', '4 — Compra de Material')}
                  <div style={{ marginBottom:10 }}>
                    {fieldLbl('Necessita compra de material?')}
                    <div style={{ display:'flex', gap:8, marginTop:4 }}>
                      {['Sim', 'Não'].map(opt => (
                        <button key={opt} type="button" onClick={() => updateOS('compraMaterial', opt)}
                          style={{ padding:'6px 18px', borderRadius:8, fontWeight:700, fontSize:13, border: os.compraMaterial === opt ? '2px solid #16a34a' : '2px solid #d1d5db', background: os.compraMaterial === opt ? '#dcfce7' : '#fff', color: os.compraMaterial === opt ? '#15803d' : '#6b7280', cursor:'pointer' }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {os.compraMaterial === 'Sim' && (
                    <>
                      <div style={{ fontSize:10, fontWeight:700, color:'#4b5563', marginBottom:6 }}>Itens de Material</div>
                      {itensMat.map((it, idx) => (
                        <div key={idx} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr 30px', gap:6, marginBottom:6, alignItems:'end' }}>
                          <div>{fieldLbl('Descrição')}<input className={styles.campoInput} placeholder="Material..." value={it.descricao} onChange={e => updateMat(idx, 'descricao', e.target.value)} /></div>
                          <div>{fieldLbl('Qtd')}<input className={styles.campoInput} type="number" min={1} value={it.qtd} onChange={e => updateMat(idx, 'qtd', e.target.value)} /></div>
                          <div>{fieldLbl('Preço (R$)')}<input className={styles.campoInput} type="number" min={0} step={0.01} value={it.preco} onChange={e => updateMat(idx, 'preco', e.target.value)} /></div>
                          <div>{fieldLbl('Onde foi cotado')}<input className={styles.campoInput} placeholder="Loja / fornecedor..." value={it.cotadoEm} onChange={e => updateMat(idx, 'cotadoEm', e.target.value)} /></div>
                          <button type="button" onClick={() => removeMat(idx)} style={{ background:'#fee2e2', border:'none', borderRadius:6, color:'#dc2626', fontWeight:900, cursor:'pointer', height:32 }}>✕</button>
                        </div>
                      ))}
                      <button type="button" onClick={addMat} style={{ background:'#dcfce7', border:'1.5px dashed #16a34a', borderRadius:8, padding:'6px 14px', color:'#15803d', fontWeight:700, fontSize:12, cursor:'pointer', width:'100%' }}>+ Adicionar Material</button>
                      {totalMat > 0 && (
                        <div style={{ textAlign:'right', fontWeight:900, fontSize:13, color:'#15803d', marginTop:6 }}>Total Materiais: R$ {totalMat.toFixed(2)}</div>
                      )}
                    </>
                  )}
                </div>

                {/* 5 — PRESTADORA DE SERVIÇO */}
                <div style={{ background:'#faf5ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e9d5ff' }}>
                  {secTitle('🏢', '5 — Prestadora de Serviço')}

                  {/* Botões: Selecionar / Cadastrar Nova */}
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _prestModalAberto: true, _prestModalAba: 'selecionar' })}
                      style={{ flex:1, padding:'10px 14px', background:'linear-gradient(135deg,#a855f7,#7c3aed)', border:'none', borderRadius:10, fontSize:13, fontWeight:900, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      🔍 Selecionar Prestadora
                    </button>
                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _prestModalAberto: true, _prestModalAba: 'cadastrar' })}
                      style={{ flex:1, padding:'10px 14px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:10, fontSize:13, fontWeight:900, color:'#0D0D0D', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      ➕ Cadastrar Nova
                    </button>
                  </div>

                  {/* Toast de sucesso */}
                  {os._cadPrestSucesso && (
                    <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', marginBottom:10, border:'1.5px solid #86efac', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:12, fontWeight:800, color:'#16a34a' }}>{os._cadPrestSucesso}</span>
                      <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _cadPrestSucesso: '' })} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#9ca3af' }}>✕</button>
                    </div>
                  )}

                  {/* Badge da prestadora selecionada */}
                  {os.prestadoraNome ? (
                    <div style={{ background:'#faf5ff', borderRadius:10, padding:'10px 14px', marginBottom:10, border:'1.5px solid #e9d5ff' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:900, color:'#16a34a' }}>✅ Selecionada:</span>
                        <span style={{ fontSize:14, fontWeight:700, color:'#7c3aed' }}>{os.prestadoraNome}</span>
                        <button type="button" onClick={() => setResposta(bloco.uid, { ...os, prestadoraNome:'', prestadoraCnpj:'', prestadoraEmail:'', prestadoraWhatsapp:'' })}
                          style={{ marginLeft:'auto', background:'#fee2e2', border:'1.5px solid #fca5a5', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:800, color:'#dc2626', cursor:'pointer' }}>✕ Limpar</button>
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8, fontSize:11, color:'#6b7280' }}>
                        {os.prestadoraCnpj && <span style={{ fontFamily:'monospace' }}>CNPJ: {os.prestadoraCnpj}</span>}
                        {os.prestadoraEmail && <span>📧 {os.prestadoraEmail}</span>}
                        {os.prestadoraWhatsapp && <span>📱 {os.prestadoraWhatsapp}</span>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background:'#f9fafb', borderRadius:10, padding:'14px', marginBottom:10, border:'1.5px dashed #d1d5db', textAlign:'center' }}>
                      <span style={{ fontSize:12, color:'#9ca3af' }}>Nenhuma prestadora selecionada — use os botões acima</span>
                    </div>
                  )}

                  {/* ══ MODAL SELECIONAR / CADASTRAR PRESTADORA ══ */}
                  {os._prestModalAberto && (() => {
                    let prests: CadPrestadora[] = [];
                    try { prests = JSON.parse(localStorage.getItem(LS_PRESTADORAS) || '[]'); } catch { /* ok */ }
                    const aba = os._prestModalAba || 'selecionar';
                    const fecharModal = () => setResposta(bloco.uid, { ...os, _prestModalAberto: false, _buscaPrestadora: '' });

                    return (
                      <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
                        onClick={fecharModal}>
                        <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:560, maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,0.3)', overflow:'hidden' }}
                          onClick={e => e.stopPropagation()}>

                          {/* Header */}
                          <div style={{ background:'linear-gradient(135deg,#a855f7,#7c3aed)', padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                            <div>
                              <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>🏢 Prestadoras</div>
                              <div style={{ fontSize:11, color:'#fff', opacity:0.7 }}>{prests.length} cadastrada{prests.length !== 1 ? 's' : ''}</div>
                            </div>
                            <button type="button" onClick={fecharModal}
                              style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:32, height:32, fontSize:18, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                          </div>

                          {/* Tabs */}
                          <div style={{ display:'flex', borderBottom:'2px solid #e5e7eb', flexShrink:0 }}>
                            {([['selecionar', '🔍 Selecionar'], ['cadastrar', '➕ Cadastrar Nova']] as const).map(([key, label]) => (
                              <button key={key} type="button" onClick={() => setResposta(bloco.uid, { ...os, _prestModalAba: key })}
                                style={{ flex:1, padding:'11px 0', fontSize:13, fontWeight:800, border:'none', cursor:'pointer', background: aba === key ? '#faf5ff' : '#fff', color: aba === key ? '#7c3aed' : '#9ca3af', borderBottom: aba === key ? '3px solid #a855f7' : '3px solid transparent' }}>
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Body */}
                          <div style={{ padding:20, overflowY:'auto', flex:1 }}>

                            {/* ═══ ABA SELECIONAR ═══ */}
                            {aba === 'selecionar' && (
                              <>
                                <div style={{ position:'relative', marginBottom:12 }}>
                                  <input
                                    className={styles.campoInput}
                                    placeholder="🔍 Buscar por nome, CNPJ..."
                                    value={os._buscaPrestadora ?? ''}
                                    onChange={e => setResposta(bloco.uid, { ...os, _buscaPrestadora: e.target.value })}
                                    autoFocus
                                    style={{ fontWeight:700, fontSize:14, padding:'12px 40px 12px 14px' }}
                                  />
                                  {os._buscaPrestadora && (
                                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _buscaPrestadora: '' })}
                                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9ca3af' }}>✕</button>
                                  )}
                                </div>

                                {prests.length === 0 ? (
                                  <div style={{ textAlign:'center', padding:'32px 16px' }}>
                                    <div style={{ fontSize:40, marginBottom:12 }}>🏢</div>
                                    <div style={{ fontSize:14, fontWeight:700, color:'#6b7280', marginBottom:6 }}>Nenhuma prestadora cadastrada</div>
                                    <div style={{ fontSize:12, color:'#9ca3af', marginBottom:16 }}>Cadastre uma prestadora na aba "➕ Cadastrar Nova"</div>
                                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _prestModalAba: 'cadastrar' })}
                                      style={{ padding:'10px 20px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:10, fontSize:13, fontWeight:900, color:'#0D0D0D', cursor:'pointer' }}>
                                      ➕ Cadastrar Agora
                                    </button>
                                  </div>
                                ) : (() => {
                                  const q = (os._buscaPrestadora || '').toLowerCase().trim();
                                  const filtradas = q
                                    ? prests.filter(p => p.nome.toLowerCase().includes(q) || (p.cnpj || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q))
                                    : prests;
                                  return (
                                    <>
                                      <div style={{ fontSize:11, fontWeight:800, color:'#6b7280', marginBottom:8 }}>
                                        {q ? `${filtradas.length} resultado${filtradas.length !== 1 ? 's' : ''}` : `${prests.length} prestadora${prests.length !== 1 ? 's' : ''}`}
                                      </div>
                                      {filtradas.length === 0 ? (
                                        <div style={{ textAlign:'center', padding:'24px 16px', color:'#9ca3af', fontSize:13 }}>
                                          Nenhuma prestadora encontrada para &quot;{os._buscaPrestadora}&quot;
                                        </div>
                                      ) : (
                                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                          {filtradas.map(p => {
                                            const selecionada = os.prestadoraNome === p.nome;
                                            return (
                                              <div key={p.nome}
                                                onClick={() => {
                                                  setResposta(bloco.uid, { ...os, prestadoraNome: p.nome, prestadoraCnpj: p.cnpj || '', prestadoraEmail: p.email || '', prestadoraWhatsapp: p.whatsapp || '', _prestModalAberto: false, _buscaPrestadora: '' });
                                                }}
                                                style={{
                                                  padding:'12px 14px', cursor:'pointer', borderRadius:12,
                                                  border: selecionada ? '2px solid #a855f7' : '1.5px solid #e5e7eb',
                                                  background: selecionada ? '#faf5ff' : '#f9fafb',
                                                  transition:'all 0.15s',
                                                }}
                                                onMouseEnter={e => { if (!selecionada) e.currentTarget.style.background = '#faf5ff'; }}
                                                onMouseLeave={e => { if (!selecionada) e.currentTarget.style.background = '#f9fafb'; }}
                                              >
                                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                                  <span style={{ fontWeight:800, fontSize:14, color:'#0D0D0D', flex:1 }}>{p.nome}</span>
                                                  {selecionada && <span style={{ fontSize:10, fontWeight:900, color:'#7c3aed', background:'#f3e8ff', padding:'2px 8px', borderRadius:6 }}>ATUAL</span>}
                                                  <button type="button" title="Editar prestadora" onClick={e => {
                                                    e.stopPropagation();
                                                    const novoNome = prompt('Editar nome da prestadora:', p.nome);
                                                    if (!novoNome || !novoNome.trim() || novoNome.trim() === p.nome) return;
                                                    let current: CadPrestadora[] = [];
                                                    try { current = JSON.parse(localStorage.getItem(LS_PRESTADORAS) || '[]'); } catch { /* ok */ }
                                                    if (current.some(x => x.nome.toLowerCase() === novoNome.trim().toLowerCase() && x.nome !== p.nome)) { alert('Prestadora "' + novoNome.trim() + '" já existe!'); return; }
                                                    const updated = current.map(x => x.nome === p.nome ? { ...x, nome: novoNome.trim() } : x);
                                                    localStorage.setItem(LS_PRESTADORAS, JSON.stringify(updated));
                                                    if (os.prestadoraNome === p.nome) { setResposta(bloco.uid, { ...os, prestadoraNome: novoNome.trim() }); }
                                                    else { setResposta(bloco.uid, { ...os }); }
                                                  }} style={{ background:'#dbeafe', border:'1.5px solid #93c5fd', borderRadius:6, width:26, height:26, color:'#1d4ed8', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✏️</button>
                                                  <button type="button" title="Excluir prestadora" onClick={e => {
                                                    e.stopPropagation();
                                                    if (!confirm('Excluir "' + p.nome + '" da lista de prestadoras?')) return;
                                                    let current: CadPrestadora[] = [];
                                                    try { current = JSON.parse(localStorage.getItem(LS_PRESTADORAS) || '[]'); } catch { /* ok */ }
                                                    const updated = current.filter(x => x.nome !== p.nome);
                                                    localStorage.setItem(LS_PRESTADORAS, JSON.stringify(updated));
                                                    if (os.prestadoraNome === p.nome) { setResposta(bloco.uid, { ...os, prestadoraNome:'', prestadoraCnpj:'', prestadoraEmail:'', prestadoraWhatsapp:'' }); }
                                                    else { setResposta(bloco.uid, { ...os }); }
                                                  }} style={{ background:'#fee2e2', border:'1.5px solid #fca5a5', borderRadius:6, width:26, height:26, color:'#dc2626', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>🗑️</button>
                                                </div>
                                                <div style={{ display:'flex', flexWrap:'wrap', gap:6, fontSize:11, color:'#6b7280' }}>
                                                  {p.cnpj && <span style={{ fontFamily:'monospace' }}>CNPJ: {p.cnpj}</span>}
                                                  {p.email && <span>📧 {p.email}</span>}
                                                  {p.whatsapp && <span>📱 {p.whatsapp}</span>}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            )}

                            {/* ═══ ABA CADASTRAR ═══ */}
                            {aba === 'cadastrar' && (
                              <div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                  <div>{fieldLbl('Nome / Razão Social *')}<input className={styles.campoInput} placeholder="Nome da empresa..." value={os._cadPrestNome || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadPrestNome: e.target.value })} autoFocus /></div>
                                  <div>{fieldLbl('CNPJ')}<input className={styles.campoInput} placeholder="00.000.000/0000-00" value={os._cadPrestCnpj || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadPrestCnpj: e.target.value })} /></div>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                                  <div>{fieldLbl('E-mail')}<input className={styles.campoInput} type="email" placeholder="contato@empresa.com" value={os._cadPrestEmail || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadPrestEmail: e.target.value })} /></div>
                                  <div>{fieldLbl('WhatsApp')}<input className={styles.campoInput} placeholder="(00) 00000-0000" value={os._cadPrestWhatsapp || ''} onChange={e => setResposta(bloco.uid, { ...os, _cadPrestWhatsapp: e.target.value })} /></div>
                                </div>
                                {os._cadPrestErro && (
                                  <div style={{ background:'#fef2f2', borderRadius:8, padding:'8px 12px', marginTop:8, border:'1px solid #fca5a5', display:'flex', alignItems:'center', gap:6 }}>
                                    <span style={{ fontSize:12, fontWeight:700, color:'#dc2626' }}>⚠️ {os._cadPrestErro}</span>
                                    <button type="button" onClick={() => setResposta(bloco.uid, { ...os, _cadPrestErro: '' })} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#9ca3af' }}>✕</button>
                                  </div>
                                )}
                                <button type="button" onClick={() => {
                                  const nome = (os._cadPrestNome || '').trim();
                                  if (!nome) { setResposta(bloco.uid, { ...os, _cadPrestErro: 'Informe o nome da prestadora.' }); return; }
                                  let prestsAtual: CadPrestadora[] = [];
                                  try { prestsAtual = JSON.parse(localStorage.getItem(LS_PRESTADORAS) || '[]'); } catch { /* ok */ }
                                  if (prestsAtual.some(p => p.nome.toLowerCase() === nome.toLowerCase())) { setResposta(bloco.uid, { ...os, _cadPrestErro: `Prestadora "${nome}" já existe!` }); return; }
                                  try {
                                    const nova: CadPrestadora = { nome, cnpj: (os._cadPrestCnpj || '').trim(), email: (os._cadPrestEmail || '').trim(), whatsapp: (os._cadPrestWhatsapp || '').trim() };
                                    const novaLista = [...prestsAtual, nova];
                                    localStorage.setItem(LS_PRESTADORAS, JSON.stringify(novaLista));
                                    setResposta(bloco.uid, { ...os, prestadoraNome: nova.nome, prestadoraCnpj: nova.cnpj, prestadoraEmail: nova.email, prestadoraWhatsapp: nova.whatsapp, _prestModalAberto: false, _buscaPrestadora: '', _cadPrestNome:'', _cadPrestCnpj:'', _cadPrestEmail:'', _cadPrestWhatsapp:'', _cadPrestErro:'', _cadPrestSucesso: `✅ "${nova.nome}" cadastrada com sucesso!` });
                                  } catch {
                                    setResposta(bloco.uid, { ...os, _cadPrestErro: 'Erro ao salvar. Verifique o armazenamento do navegador.' });
                                  }
                                }}
                                  style={{ marginTop:14, width:'100%', padding:'12px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:10, fontSize:14, fontWeight:900, color:'#0D0D0D', cursor:'pointer', boxShadow:'0 4px 16px rgba(255,183,0,0.35)' }}>
                                  💾 Cadastrar e Selecionar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 6 — PRAZO */}
                <div style={{ background:'#fff7ed', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fed7aa' }}>
                  {secTitle('📅', '6 — Prazo para Conclusão')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fieldLbl('Data Limite')}<input className={styles.campoInput} type="date" value={os.prazoData || ''} onChange={e => updateOS('prazoData', e.target.value)} /></div>
                    <div>{fieldLbl('Observação do Prazo')}<input className={styles.campoInput} placeholder="Ex: dias úteis, urgente..." value={os.prazoObs || ''} onChange={e => updateOS('prazoObs', e.target.value)} /></div>
                  </div>
                </div>

                {/* 7 — GESTOR VALIDADOR */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  {secTitle('✅', '7 — Gestor que Valida a O.S')}
                  {(() => {
                    let gestores: CadGestor[] = [];
                    try { gestores = JSON.parse(localStorage.getItem(LS_GESTORES) || '[]'); } catch { /* ok */ }
                    return (
                      <>
                        <div style={{ display:'flex', gap:6, alignItems:'end' }}>
                          <div style={{ flex:1 }}>{fieldLbl('Selecionar Gestor')}
                            <select
                              className={styles.campoInput}
                              value={os.gestorNome || ''}
                              onChange={e => {
                                const sel = e.target.value;
                                if (sel === '__novo__') {
                                  setResposta(bloco.uid, { ...os, gestorNome: '', gestorCargo: '' });
                                } else if (sel) {
                                  const g = gestores.find(g => g.nome === sel);
                                  if (g) { setResposta(bloco.uid, { ...os, gestorNome: g.nome, gestorCargo: g.cargo || '' }); }
                                } else {
                                  setResposta(bloco.uid, { ...os, gestorNome: '', gestorCargo: '' });
                                }
                              }}
                              style={{ fontWeight: 700 }}
                            >
                              <option value="">Selecione um gestor...</option>
                              {gestores.map((g, i) => (
                                <option key={i} value={g.nome}>{g.nome}{g.cargo ? ` — ${g.cargo}` : ''}</option>
                              ))}
                              <option value="__novo__">+ Cadastrar novo gestor</option>
                            </select>
                          </div>
                          {os.gestorNome && gestores.some(g => g.nome === os.gestorNome) && (
                            <>
                              <button type="button" title="Editar gestor cadastrado" onClick={() => {
                                const novoNome = prompt('Editar nome do gestor:', os.gestorNome);
                                if (!novoNome || !novoNome.trim() || novoNome.trim() === os.gestorNome) return;
                                if (gestores.some(g => g.nome === novoNome.trim())) { alert('Gestor "' + novoNome.trim() + '" já existe!'); return; }
                                let current: CadGestor[] = [];
                                try { current = JSON.parse(localStorage.getItem(LS_GESTORES) || '[]'); } catch { /* ok */ }
                                const updated = current.map(g => g.nome === os.gestorNome ? { ...g, nome: novoNome.trim() } : g);
                                localStorage.setItem(LS_GESTORES, JSON.stringify(updated));
                                setResposta(bloco.uid, { ...os, gestorNome: novoNome.trim() });
                              }} style={{ height:36, width:36, background:'#dbeafe', border:'1.5px solid #93c5fd', borderRadius:8, color:'#1d4ed8', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
                              <button type="button" title="Excluir gestor cadastrado" onClick={() => {
                                if (!confirm('Excluir "' + os.gestorNome + '" da lista de gestores?')) return;
                                let current: CadGestor[] = [];
                                try { current = JSON.parse(localStorage.getItem(LS_GESTORES) || '[]'); } catch { /* ok */ }
                                const updated = current.filter(g => g.nome !== os.gestorNome);
                                localStorage.setItem(LS_GESTORES, JSON.stringify(updated));
                                setResposta(bloco.uid, { ...os, gestorNome: '', gestorCargo: '' });
                              }} style={{ height:36, width:36, background:'#fee2e2', border:'1.5px solid #fca5a5', borderRadius:8, color:'#dc2626', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>🗑️</button>
                            </>
                          )}
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                          <div>{fieldLbl('Nome do Gestor')}<input className={styles.campoInput} placeholder="Nome completo..." value={os.gestorNome || ''} onChange={e => updateOS('gestorNome', e.target.value)} /></div>
                          <div>{fieldLbl('Cargo')}<input className={styles.campoInput} placeholder="Ex: Gerente, Supervisor..." value={os.gestorCargo || ''} onChange={e => updateOS('gestorCargo', e.target.value)} /></div>
                        </div>
                        {os.gestorNome && !gestores.some(g => g.nome === os.gestorNome) && (
                          <button type="button" onClick={() => {
                            if (!os.gestorNome?.trim()) return;
                            const updated = [...gestores, { nome: os.gestorNome.trim(), cargo: os.gestorCargo?.trim() || '' }];
                            localStorage.setItem(LS_GESTORES, JSON.stringify(updated));
                            setResposta(bloco.uid, { ...os, gestorNome: os.gestorNome.trim() });
                            alert('✅ Gestor "' + os.gestorNome.trim() + '" salvo com sucesso!');
                          }}
                            style={{ marginTop:6, padding:'6px 14px', background:'#dcfce7', border:'1.5px solid #86efac', borderRadius:8, color:'#15803d', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                            💾 Salvar este gestor para uso futuro
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* 8 — VALOR TOTAL */}
                <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
                  {secTitle('💰', '8 — Valor do Serviço')}
                  {fieldLbl('Valor do Serviço (R$)')}
                  <input className={styles.campoInput} type="number" min={0} step={0.01} placeholder="0,00" value={os.valorServico || ''} onChange={e => updateOS('valorServico', e.target.value)} style={{ fontSize:20, fontWeight:900, fontFamily:'monospace', textAlign:'center', border:'2px solid #86efac' }} />
                  {valorTotal > 0 && (
                    <div style={{ marginTop:8, fontSize:14, fontWeight:900, color:'#15803d' }}>
                      💰 Valor Total (Serviço + Material): R$ {valorTotal.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* 9 — STATUS E PRIORIDADE */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                    {fieldLbl('Status')}
                    <select className={styles.campoInput} value={os.status || ''} onChange={e => updateOS('status', e.target.value)} style={{ fontWeight:700 }}>
                      <option value="">Selecione...</option>
                      <option value="Aguardando">⏳ Aguardando</option>
                      <option value="Em andamento">🔄 Em andamento</option>
                      <option value="Aguardando peça">📦 Aguardando peça</option>
                      <option value="Concluído">✅ Concluído</option>
                      <option value="Cancelado">❌ Cancelado</option>
                    </select>
                  </div>
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                    {fieldLbl('Prioridade')}
                    <select className={styles.campoInput} value={os.prioridade || ''} onChange={e => updateOS('prioridade', e.target.value)} style={{ fontWeight:700 }}>
                      <option value="">Selecione...</option>
                      <option value="Baixa">🟢 Baixa</option>
                      <option value="Média">🟡 Média</option>
                      <option value="Alta">🟠 Alta</option>
                      <option value="Urgente">🔴 Urgente</option>
                    </select>
                  </div>
                </div>

                {/* ASSINATURA DO GESTOR */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinatura de Validação</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline label="Gestor" value={os.assinaturaGestor || null} onChange={v => updateOS('assinaturaGestor', v)} />
                    <AssinaturaInline label="Técnico" value={os.assinaturaTecnico || null} onChange={v => updateOS('assinaturaTecnico', v)} />
                  </div>
                </div>

                {/* 10 — COMPARTILHAR POR E-MAIL */}
                {(() => {
                  const LS_EMAILS = 'sm_cad_emails_os';
                  const modeloCampos = OS_MODELOS_SHARE['os_assistencia_tecnica']?.campos || [];
                  const sid = _saveOSDataForShare('os_assistencia_tecnica', os, modeloCampos);
                  const linkEditar = globalThis.location.origin + '/os-publica/os_assistencia_tecnica' + (sid ? '?id=' + sid : '');
                  const resumoOS = () => {
                    const linhas = [`O.S Assistência Técnica — Nº ${os.numero || '...'}`, ''];
                    if (os.maquinaNome) linhas.push(`Máquina: ${os.maquinaNumero ? `Nº ${os.maquinaNumero} — ` : ''}${os.maquinaNome} (${os.maquinaCodigo || '-'})`);
                    if (os.maquinaSetor) linhas.push(`Setor: ${os.maquinaSetor}`);
                    if (os.tecnicoNome) linhas.push(`Técnico: ${os.tecnicoNome}`);
                    if (os.tecnicoDescricao) linhas.push(`Descrição: ${os.tecnicoDescricao}`);
                    if (os.prestadoraNome) linhas.push(`Prestadora: ${os.prestadoraNome} — CNPJ: ${os.prestadoraCnpj || '-'}`);
                    if (os.prazoData) linhas.push(`Prazo: ${os.prazoData}`);
                    if (os.gestorNome) linhas.push(`Gestor: ${os.gestorNome} (${os.gestorCargo || '-'})`);
                    if (os.status) linhas.push(`Status: ${os.status}`);
                    if (os.prioridade) linhas.push(`Prioridade: ${os.prioridade}`);
                    const vt = (Number.parseFloat(os.valorServico || '0') + itensMat.reduce((a: number, i: {qtd:string;preco:string}) => a + Number.parseFloat(i.qtd||'0')*Number.parseFloat(i.preco||'0'), 0));
                    if (vt > 0) linhas.push(`Valor Total: R$ ${vt.toFixed(2)}`);
                    linhas.push('', '✏️ Editar O.S:', linkEditar);
                    return linhas.join('\n');
                  };
                  return (
                    <div style={{ background:'#eff6ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bfdbfe' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        {secTitle('📧', '10 — Enviar por E-mail')}
                        <ConfigDropdown
                          lsKey={LS_EMAILS}
                          campos={[
                            { key:'nome', label:'Nome', placeholder:'Nome do destinatário...' },
                            { key:'email', label:'E-mail', placeholder:'email@exemplo.com' },
                          ]}
                          currentValue={os.enviarEmail}
                          onSelect={(item) => updateOS('enviarEmail', item.email)}
                        />
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'end' }}>
                        <div style={{ flex:1 }}>
                          {fieldLbl('E-mail do destinatário')}
                          <input className={styles.campoInput} type="email" placeholder="email@exemplo.com" value={os.enviarEmail || ''} onChange={e => updateOS('enviarEmail', e.target.value)} />
                        </div>
                        <a
                          href={os.enviarEmail ? `mailto:${encodeURIComponent(os.enviarEmail)}?subject=${encodeURIComponent(`O.S Assistência Técnica — Nº ${os.numero || ''}`)}&body=${encodeURIComponent(resumoOS())}` : '#'}
                          onClick={e => { if (!os.enviarEmail) e.preventDefault(); }}
                          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background: os.enviarEmail ? '#2563eb' : '#9ca3af', color:'#fff', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none', whiteSpace:'nowrap', height:36, cursor: os.enviarEmail ? 'pointer' : 'not-allowed' }}>
                          📧 Enviar
                        </a>
                      </div>
                    </div>
                  );
                })()}

                {/* 11 — COMPARTILHAR POR WHATSAPP */}
                {(() => {
                  const LS_WHATSAPP = 'sm_cad_whatsapp_os';
                  const modeloCamposWA = OS_MODELOS_SHARE['os_assistencia_tecnica']?.campos || [];
                  const sidWA = _saveOSDataForShare('os_assistencia_tecnica', os, modeloCamposWA);
                  const linkEditarWA = globalThis.location.origin + '/os-publica/os_assistencia_tecnica' + (sidWA ? '?id=' + sidWA : '');
                  const resumoWA = () => {
                    const linhas = [`*O.S Assistência Técnica — Nº ${os.numero || '...'}*`, ''];
                    if (os.maquinaNome) linhas.push(`*Máquina:* ${os.maquinaNumero ? `Nº ${os.maquinaNumero} — ` : ''}${os.maquinaNome} (${os.maquinaCodigo || '-'})`);
                    if (os.maquinaSetor) linhas.push(`*Setor:* ${os.maquinaSetor}`);
                    if (os.tecnicoNome) linhas.push(`*Técnico:* ${os.tecnicoNome}`);
                    if (os.tecnicoDescricao) linhas.push(`*Descrição:* ${os.tecnicoDescricao}`);
                    if (os.prestadoraNome) linhas.push(`*Prestadora:* ${os.prestadoraNome} — CNPJ: ${os.prestadoraCnpj || '-'}`);
                    if (os.prazoData) linhas.push(`*Prazo:* ${os.prazoData}`);
                    if (os.gestorNome) linhas.push(`*Gestor:* ${os.gestorNome} (${os.gestorCargo || '-'})`);
                    if (os.status) linhas.push(`*Status:* ${os.status}`);
                    if (os.prioridade) linhas.push(`*Prioridade:* ${os.prioridade}`);
                    const vt = (Number.parseFloat(os.valorServico || '0') + itensMat.reduce((a: number, i: {qtd:string;preco:string}) => a + Number.parseFloat(i.qtd||'0')*Number.parseFloat(i.preco||'0'), 0));
                    if (vt > 0) linhas.push(`*Valor Total:* R$ ${vt.toFixed(2)}`);
                    linhas.push('', '✏️ *Editar O.S:*', linkEditarWA);
                    return linhas.join('\n');
                  };
                  const foneNum = (os.enviarWhatsapp || '').replace(/\D/g, '');
                  const fone55 = foneNum.length > 0 && !foneNum.startsWith('55') ? '55' + foneNum : foneNum;
                  return (
                    <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bbf7d0' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        {secTitle('💬', '11 — Enviar por WhatsApp')}
                        <ConfigDropdown
                          lsKey={LS_WHATSAPP}
                          campos={[
                            { key:'nome', label:'Nome', placeholder:'Nome do contato...' },
                            { key:'telefone', label:'WhatsApp', placeholder:'(00) 00000-0000' },
                          ]}
                          currentValue={os.enviarWhatsapp}
                          onSelect={(item) => updateOS('enviarWhatsapp', item.telefone)}
                        />
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'end' }}>
                        <div style={{ flex:1 }}>
                          {fieldLbl('Número do WhatsApp')}
                          <input className={styles.campoInput} placeholder="(00) 00000-0000" value={os.enviarWhatsapp || ''} onChange={e => updateOS('enviarWhatsapp', e.target.value)} />
                        </div>
                        <a
                          href={fone55 ? `https://wa.me/${fone55}?text=${encodeURIComponent(resumoWA())}` : '#'}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => { if (!fone55) e.preventDefault(); }}
                          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background: fone55 ? '#16a34a' : '#9ca3af', color:'#fff', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none', whiteSpace:'nowrap', height:36, cursor: fone55 ? 'pointer' : 'not-allowed' }}>
                          💬 Enviar
                        </a>
                      </div>
                    </div>
                  );
                })()}

                {/* 12 — COMPARTILHAR + CONFIG */}
                <OSShareSection modelo="os_assistencia_tecnica" secTitleFn={secTitle} osData={os} />

              </div>
            </div>
          </div>
        );
      }

      /* ═══════════════════════════════════════════════════════════════
         O.S GERAL
         ═══════════════════════════════════════════════════════════════ */
      case 'ordem_servico': {
        const os = val || {};
        const updateOS = (field: string, v: unknown) => setResposta(bloco.uid, { ...os, [field]: v });
        if (!os._tipo) setTimeout(() => updateOS('_tipo', 'ordem_servico'), 0);
        if (!os.numero) {
          const cont = Number.parseInt(localStorage.getItem('sm_contador_os_geral') || '0', 10) + 1;
          localStorage.setItem('sm_contador_os_geral', String(cont));
          const h = new Date();
          setTimeout(() => updateOS('numero', `OSG-${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}-${String(cont).padStart(4,'0')}`), 0);
        }
        const secT = (icon: string, txt: string) => (<div style={{ fontSize:11, fontWeight:900, color:'#1e40af', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'2px solid #bfdbfe', paddingBottom:4, marginBottom:8 }}>{icon} {txt}</div>);
        const fLbl = (txt: string) => (<label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>{txt}</label>);
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #2563eb', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>
              <div style={{ background:'linear-gradient(135deg,#2563eb,#1e40af)', color:'#fff', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>📋 ORDEM DE SERVIÇO</div>
                <div style={{ fontSize:12, opacity:0.9, marginTop:2 }}>GERAL</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {os.numero || '...'}</div>
              </div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
                {/* 1 — Solicitante */}
                <div style={{ background:'#eff6ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bfdbfe' }}>
                  {secT('👤', '1 — Solicitante')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome')}<input className={styles.campoInput} placeholder="Nome do solicitante..." value={os.solicitanteNome || ''} onChange={e => updateOS('solicitanteNome', e.target.value)} /></div>
                    <div>{fLbl('Setor / Unidade')}<input className={styles.campoInput} placeholder="Setor..." value={os.solicitanteSetor || ''} onChange={e => updateOS('solicitanteSetor', e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop:8 }}>{fLbl('Telefone / Ramal')}<input className={styles.campoInput} placeholder="(00) 00000-0000" value={os.solicitanteTelefone || ''} onChange={e => updateOS('solicitanteTelefone', e.target.value)} /></div>
                </div>
                {/* 2 — Descrição */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                  {secT('📝', '2 — Descrição do Serviço')}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fLbl('Descreva o serviço solicitado')}
                    <MicButton onResult={t => updateOS('descricao', (os.descricao || '') + (os.descricao ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={4} placeholder="Descreva detalhadamente..." value={os.descricao || ''} onChange={e => updateOS('descricao', e.target.value)} />
                </div>
                {/* 3 — Local */}
                <div style={{ background:'#fefce8', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fef08a' }}>
                  {secT('📍', '3 — Local')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Bloco / Área')}<input className={styles.campoInput} placeholder="Bloco A, Sala 3..." value={os.local || ''} onChange={e => updateOS('local', e.target.value)} /></div>
                    <div>{fLbl('Andar / Pavimento')}<input className={styles.campoInput} placeholder="Térreo, 2º andar..." value={os.andar || ''} onChange={e => updateOS('andar', e.target.value)} /></div>
                  </div>
                </div>
                {/* 4 — Responsável */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  {secT('👷', '4 — Responsável pela Execução')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome')}<input className={styles.campoInput} placeholder="Responsável..." value={os.responsavelNome || ''} onChange={e => updateOS('responsavelNome', e.target.value)} /></div>
                    <div>{fLbl('Cargo / Função')}<input className={styles.campoInput} placeholder="Técnico, Encarregado..." value={os.responsavelCargo || ''} onChange={e => updateOS('responsavelCargo', e.target.value)} /></div>
                  </div>
                </div>
                {/* 5 — Prazo */}
                <div style={{ background:'#fff7ed', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fed7aa' }}>
                  {secT('📅', '5 — Prazo')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Data Prevista')}<input className={styles.campoInput} type="date" value={os.prazoData || ''} onChange={e => updateOS('prazoData', e.target.value)} /></div>
                    <div>{fLbl('Observação')}<input className={styles.campoInput} placeholder="Dias úteis..." value={os.prazoObs || ''} onChange={e => updateOS('prazoObs', e.target.value)} /></div>
                  </div>
                </div>
                {/* 6 — Status / Prioridade */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                    {fLbl('Status')}
                    <select className={styles.campoInput} value={os.status || ''} onChange={e => updateOS('status', e.target.value)} style={{ fontWeight:700 }}>
                      <option value="">Selecione...</option>
                      <option value="Aberta">📂 Aberta</option>
                      <option value="Em andamento">🔄 Em andamento</option>
                      <option value="Concluída">✅ Concluída</option>
                      <option value="Cancelada">❌ Cancelada</option>
                    </select>
                  </div>
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                    {fLbl('Prioridade')}
                    <select className={styles.campoInput} value={os.prioridade || ''} onChange={e => updateOS('prioridade', e.target.value)} style={{ fontWeight:700 }}>
                      <option value="">Selecione...</option>
                      <option value="Baixa">🟢 Baixa</option>
                      <option value="Média">🟡 Média</option>
                      <option value="Alta">🟠 Alta</option>
                      <option value="Urgente">🔴 Urgente</option>
                    </select>
                  </div>
                </div>
                {/* 7 — Observações */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                  {secT('📎', '7 — Observações')}
                  <textarea className={styles.campoInput} rows={2} placeholder="Observações adicionais..." value={os.observacoes || ''} onChange={e => updateOS('observacoes', e.target.value)} />
                </div>
                {/* Assinaturas */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinaturas</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline label="Solicitante" value={os.assinaturaSolicitante || null} onChange={v => updateOS('assinaturaSolicitante', v)} />
                    <AssinaturaInline label="Responsável" value={os.assinaturaResponsavel || null} onChange={v => updateOS('assinaturaResponsavel', v)} />
                  </div>
                </div>
                <OSShareSection modelo="ordem_servico" secTitleFn={secT} osData={os} />
              </div>
            </div>
          </div>
        );
      }

      /* ═══════════════════════════════════════════════════════════════
         O.S MANUTENÇÃO CORRETIVA
         ═══════════════════════════════════════════════════════════════ */
      case 'os_manutencao_corretiva': {
        const os = val || {};
        const updateOS = (field: string, v: unknown) => setResposta(bloco.uid, { ...os, [field]: v });
        if (!os._tipo) setTimeout(() => updateOS('_tipo', 'os_manutencao_corretiva'), 0);
        if (!os.numero) {
          const cont = Number.parseInt(localStorage.getItem('sm_contador_os_mc') || '0', 10) + 1;
          localStorage.setItem('sm_contador_os_mc', String(cont));
          const h = new Date();
          setTimeout(() => updateOS('numero', `OSMC-${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}-${String(cont).padStart(4,'0')}`), 0);
        }
        const secT = (icon: string, txt: string) => (<div style={{ fontSize:11, fontWeight:900, color:'#dc2626', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'2px solid #fecaca', paddingBottom:4, marginBottom:8 }}>{icon} {txt}</div>);
        const fLbl = (txt: string) => (<label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>{txt}</label>);
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #dc2626', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>
              <div style={{ background:'linear-gradient(135deg,#dc2626,#991b1b)', color:'#fff', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>🔧 ORDEM DE SERVIÇO</div>
                <div style={{ fontSize:12, opacity:0.9, marginTop:2 }}>MANUTENÇÃO CORRETIVA</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {os.numero || '...'}</div>
              </div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
                {/* 1 — Equipamento */}
                <div style={{ background:'#fef2f2', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fecaca' }}>
                  {secT('🖥️', '1 — Equipamento com Defeito')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome do Equipamento')}<input className={styles.campoInput} placeholder="Ex: Bomba d\'água..." value={os.equipNome || ''} onChange={e => updateOS('equipNome', e.target.value)} /></div>
                    <div>{fLbl('Código / Patrimônio')}<input className={styles.campoInput} placeholder="EQ-001" value={os.equipCodigo || ''} onChange={e => updateOS('equipCodigo', e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop:8 }}>
                    {fLbl('Localização do Equipamento')}
                    <input className={styles.campoInput} placeholder="Bloco A, Subsolo..." value={os.equipLocal || ''} onChange={e => updateOS('equipLocal', e.target.value)} />
                  </div>
                </div>
                {/* 2 — Defeito reportado */}
                <div style={{ background:'#fff7ed', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fed7aa' }}>
                  {secT('⚠️', '2 — Defeito Reportado')}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fLbl('Descrição do defeito / falha')}
                    <MicButton onResult={t => updateOS('defeito', (os.defeito || '') + (os.defeito ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={3} placeholder="Descreva o defeito encontrado..." value={os.defeito || ''} onChange={e => updateOS('defeito', e.target.value)} />
                  <div style={{ marginTop:8 }}>
                    {fLbl('Data / Hora da Parada')}
                    <input className={styles.campoInput} type="datetime-local" value={os.dataParada || ''} onChange={e => updateOS('dataParada', e.target.value)} />
                  </div>
                </div>
                {/* 3 — Causa */}
                <div style={{ background:'#fef3c7', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fde68a' }}>
                  {secT('🔍', '3 — Diagnóstico / Causa')}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fLbl('Causa raiz identificada')}
                    <MicButton onResult={t => updateOS('causa', (os.causa || '') + (os.causa ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={3} placeholder="Causa identificada..." value={os.causa || ''} onChange={e => updateOS('causa', e.target.value)} />
                </div>
                {/* 4 — Ação corretiva */}
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bbf7d0' }}>
                  {secT('🛠️', '4 — Ação Corretiva Realizada')}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fLbl('Serviço executado')}
                    <MicButton onResult={t => updateOS('acaoCorretiva', (os.acaoCorretiva || '') + (os.acaoCorretiva ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={3} placeholder="O que foi feito para corrigir..." value={os.acaoCorretiva || ''} onChange={e => updateOS('acaoCorretiva', e.target.value)} />
                </div>
                {/* 5 — Peças / Materiais */}
                <div style={{ background:'#faf5ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e9d5ff' }}>
                  {secT('🛒', '5 — Peças e Materiais Utilizados')}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fLbl('Liste as peças/materiais')}
                    <MicButton onResult={t => updateOS('pecas', (os.pecas || '') + (os.pecas ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={2} placeholder="Peça X, Material Y..." value={os.pecas || ''} onChange={e => updateOS('pecas', e.target.value)} />
                </div>
                {/* 6 — Técnico */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  {secT('👷', '6 — Técnico Responsável')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome')}<input className={styles.campoInput} placeholder="Nome do técnico..." value={os.tecnicoNome || ''} onChange={e => updateOS('tecnicoNome', e.target.value)} /></div>
                    <div>{fLbl('Empresa')}<input className={styles.campoInput} placeholder="Empresa / Próprio..." value={os.tecnicoEmpresa || ''} onChange={e => updateOS('tecnicoEmpresa', e.target.value)} /></div>
                  </div>
                </div>
                {/* 7 — Tempo */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                  {secT('⏱️', '7 — Tempo de Execução')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    <div>{fLbl('Início')}<input className={styles.campoInput} type="datetime-local" value={os.tempoInicio || ''} onChange={e => updateOS('tempoInicio', e.target.value)} /></div>
                    <div>{fLbl('Fim')}<input className={styles.campoInput} type="datetime-local" value={os.tempoFim || ''} onChange={e => updateOS('tempoFim', e.target.value)} /></div>
                    <div>{fLbl('Total (horas)')}<input className={styles.campoInput} placeholder="Ex: 2h30" value={os.tempoTotal || ''} onChange={e => updateOS('tempoTotal', e.target.value)} /></div>
                  </div>
                </div>
                {/* 8 — Status / Prioridade */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                    {fLbl('Status')}
                    <select className={styles.campoInput} value={os.status || ''} onChange={e => updateOS('status', e.target.value)} style={{ fontWeight:700 }}>
                      <option value="">Selecione...</option>
                      <option value="Aguardando">⏳ Aguardando</option>
                      <option value="Em execução">🔄 Em execução</option>
                      <option value="Aguardando peça">📦 Aguardando peça</option>
                      <option value="Concluído">✅ Concluído</option>
                      <option value="Reincidente">🔁 Reincidente</option>
                    </select>
                  </div>
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                    {fLbl('Prioridade')}
                    <select className={styles.campoInput} value={os.prioridade || ''} onChange={e => updateOS('prioridade', e.target.value)} style={{ fontWeight:700 }}>
                      <option value="">Selecione...</option>
                      <option value="Baixa">🟢 Baixa</option>
                      <option value="Média">🟡 Média</option>
                      <option value="Alta">🟠 Alta</option>
                      <option value="Urgente">🔴 Urgente</option>
                    </select>
                  </div>
                </div>
                {/* Assinaturas */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinaturas</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline label="Técnico" value={os.assinaturaTecnico || null} onChange={v => updateOS('assinaturaTecnico', v)} />
                    <AssinaturaInline label="Aprovador" value={os.assinaturaAprovador || null} onChange={v => updateOS('assinaturaAprovador', v)} />
                  </div>
                </div>
                <OSShareSection modelo="os_manutencao_corretiva" secTitleFn={secT} osData={os} />
              </div>
            </div>
          </div>
        );
      }

      /* ═══════════════════════════════════════════════════════════════
         O.S MANUTENÇÃO PREVENTIVA
         ═══════════════════════════════════════════════════════════════ */
      case 'os_manutencao_preventiva': {
        const os = val || {};
        const updateOS = (field: string, v: unknown) => setResposta(bloco.uid, { ...os, [field]: v });
        if (!os._tipo) setTimeout(() => updateOS('_tipo', 'os_manutencao_preventiva'), 0);
        if (!os.numero) {
          const cont = Number.parseInt(localStorage.getItem('sm_contador_os_mp') || '0', 10) + 1;
          localStorage.setItem('sm_contador_os_mp', String(cont));
          const h = new Date();
          setTimeout(() => updateOS('numero', `OSMP-${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}-${String(cont).padStart(4,'0')}`), 0);
        }
        // Itens do checklist preventivo
        const itensCheck: Array<{ item: string; ok: string; obs: string }> = os.checklistItens || [];
        const addCheck = () => updateOS('checklistItens', [...itensCheck, { item: '', ok: '', obs: '' }]);
        const updateCheck = (idx: number, field: string, v: string) => { const novo = [...itensCheck]; novo[idx] = { ...novo[idx], [field]: v }; updateOS('checklistItens', novo); };
        const removeCheck = (idx: number) => updateOS('checklistItens', itensCheck.filter((_, i) => i !== idx));

        const secT = (icon: string, txt: string) => (<div style={{ fontSize:11, fontWeight:900, color:'#16a34a', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'2px solid #bbf7d0', paddingBottom:4, marginBottom:8 }}>{icon} {txt}</div>);
        const fLbl = (txt: string) => (<label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>{txt}</label>);
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #16a34a', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>
              <div style={{ background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>🔄 ORDEM DE SERVIÇO</div>
                <div style={{ fontSize:12, opacity:0.9, marginTop:2 }}>MANUTENÇÃO PREVENTIVA</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {os.numero || '...'}</div>
              </div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
                {/* 1 — Equipamento */}
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bbf7d0' }}>
                  {secT('🖥️', '1 — Equipamento')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome')}<input className={styles.campoInput} placeholder="Equipamento..." value={os.equipNome || ''} onChange={e => updateOS('equipNome', e.target.value)} /></div>
                    <div>{fLbl('Código')}<input className={styles.campoInput} placeholder="EQ-001" value={os.equipCodigo || ''} onChange={e => updateOS('equipCodigo', e.target.value)} /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                    <div>{fLbl('Localização')}<input className={styles.campoInput} placeholder="Bloco, Andar..." value={os.equipLocal || ''} onChange={e => updateOS('equipLocal', e.target.value)} /></div>
                    <div>{fLbl('Marca / Modelo')}<input className={styles.campoInput} placeholder="Marca..." value={os.equipMarca || ''} onChange={e => updateOS('equipMarca', e.target.value)} /></div>
                  </div>
                </div>
                {/* 2 — Tipo de Manutenção */}
                <div style={{ background:'#eff6ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bfdbfe' }}>
                  {secT('📋', '2 — Tipo de Manutenção Preventiva')}
                  {fLbl('Selecione o tipo')}
                  <select className={styles.campoInput} value={os.tipoManutencao || ''} onChange={e => updateOS('tipoManutencao', e.target.value)} style={{ fontWeight:700 }}>
                    <option value="">Selecione...</option>
                    <option value="Lubrificação">🛢️ Lubrificação</option>
                    <option value="Limpeza">🧹 Limpeza Técnica</option>
                    <option value="Calibração">📐 Calibração</option>
                    <option value="Inspeção visual">👁️ Inspeção Visual</option>
                    <option value="Troca de peça">🔩 Troca de Peça Programada</option>
                    <option value="Teste funcional">⚡ Teste Funcional</option>
                    <option value="Ajuste">🔧 Ajuste / Regulagem</option>
                    <option value="Outro">📝 Outro</option>
                  </select>
                </div>
                {/* 3 — Checklist de Itens */}
                <div style={{ background:'#fefce8', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fef08a' }}>
                  {secT('✅', '3 — Checklist de Verificação')}
                  {itensCheck.map((it, idx) => (
                    <div key={`ckp-${idx}`} style={{ display:'grid', gridTemplateColumns:'2fr 80px 2fr 30px', gap:6, marginBottom:6, alignItems:'end' }}>
                      <div>{fLbl('Item')}<input className={styles.campoInput} placeholder="Verificar..." value={it.item} onChange={e => updateCheck(idx, 'item', e.target.value)} /></div>
                      <div>{fLbl('OK?')}
                        <select className={styles.campoInput} value={it.ok} onChange={e => updateCheck(idx, 'ok', e.target.value)} style={{ fontWeight:700 }}>
                          <option value="">-</option>
                          <option value="OK">✅ OK</option>
                          <option value="NOK">❌ NOK</option>
                          <option value="NA">➖ N/A</option>
                        </select>
                      </div>
                      <div>{fLbl('Obs')}<input className={styles.campoInput} placeholder="Obs..." value={it.obs} onChange={e => updateCheck(idx, 'obs', e.target.value)} /></div>
                      <button type="button" onClick={() => removeCheck(idx)} style={{ background:'#fee2e2', border:'none', borderRadius:6, color:'#dc2626', fontWeight:900, cursor:'pointer', height:32 }}>✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addCheck} style={{ background:'#dcfce7', border:'1.5px dashed #16a34a', borderRadius:8, padding:'6px 14px', color:'#15803d', fontWeight:700, fontSize:12, cursor:'pointer', width:'100%' }}>+ Adicionar Item</button>
                </div>
                {/* 4 — Frequência */}
                <div style={{ background:'#faf5ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e9d5ff' }}>
                  {secT('🔁', '4 — Frequência / Periodicidade')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      {fLbl('Frequência')}
                      <select className={styles.campoInput} value={os.frequencia || ''} onChange={e => updateOS('frequencia', e.target.value)} style={{ fontWeight:700 }}>
                        <option value="">Selecione...</option>
                        <option value="Diária">Diária</option>
                        <option value="Semanal">Semanal</option>
                        <option value="Quinzenal">Quinzenal</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                    <div>{fLbl('Próxima Manutenção')}<input className={styles.campoInput} type="date" value={os.proximaData || ''} onChange={e => updateOS('proximaData', e.target.value)} /></div>
                  </div>
                </div>
                {/* 5 — Técnico */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  {secT('👷', '5 — Técnico Responsável')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome')}<input className={styles.campoInput} placeholder="Técnico..." value={os.tecnicoNome || ''} onChange={e => updateOS('tecnicoNome', e.target.value)} /></div>
                    <div>{fLbl('Empresa')}<input className={styles.campoInput} placeholder="Empresa..." value={os.tecnicoEmpresa || ''} onChange={e => updateOS('tecnicoEmpresa', e.target.value)} /></div>
                  </div>
                </div>
                {/* 6 — Observações */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                  {secT('📝', '6 — Observações')}
                  <textarea className={styles.campoInput} rows={2} placeholder="Observações..." value={os.observacoes || ''} onChange={e => updateOS('observacoes', e.target.value)} />
                </div>
                {/* Status */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                  {fLbl('Status')}
                  <select className={styles.campoInput} value={os.status || ''} onChange={e => updateOS('status', e.target.value)} style={{ fontWeight:700 }}>
                    <option value="">Selecione...</option>
                    <option value="Programada">📅 Programada</option>
                    <option value="Em execução">🔄 Em execução</option>
                    <option value="Concluída">✅ Concluída</option>
                    <option value="Adiada">⏸️ Adiada</option>
                  </select>
                </div>
                {/* Assinaturas */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinaturas</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline label="Técnico" value={os.assinaturaTecnico || null} onChange={v => updateOS('assinaturaTecnico', v)} />
                    <AssinaturaInline label="Supervisor" value={os.assinaturaSupervisor || null} onChange={v => updateOS('assinaturaSupervisor', v)} />
                  </div>
                </div>
                <OSShareSection modelo="os_manutencao_preventiva" secTitleFn={secT} osData={os} />
              </div>
            </div>
          </div>
        );
      }

      /* ═══════════════════════════════════════════════════════════════
         O.S INSTALAÇÃO
         ═══════════════════════════════════════════════════════════════ */
      case 'os_instalacao': {
        const os = val || {};
        const updateOS = (field: string, v: unknown) => setResposta(bloco.uid, { ...os, [field]: v });
        if (!os._tipo) setTimeout(() => updateOS('_tipo', 'os_instalacao'), 0);
        if (!os.numero) {
          const cont = Number.parseInt(localStorage.getItem('sm_contador_os_inst') || '0', 10) + 1;
          localStorage.setItem('sm_contador_os_inst', String(cont));
          const h = new Date();
          setTimeout(() => updateOS('numero', `OSIN-${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}-${String(cont).padStart(4,'0')}`), 0);
        }
        const secT = (icon: string, txt: string) => (<div style={{ fontSize:11, fontWeight:900, color:'#0891b2', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'2px solid #a5f3fc', paddingBottom:4, marginBottom:8 }}>{icon} {txt}</div>);
        const fLbl = (txt: string) => (<label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>{txt}</label>);
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #0891b2', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>
              <div style={{ background:'linear-gradient(135deg,#0891b2,#0e7490)', color:'#fff', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>📦 ORDEM DE SERVIÇO</div>
                <div style={{ fontSize:12, opacity:0.9, marginTop:2 }}>INSTALAÇÃO</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {os.numero || '...'}</div>
              </div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
                {/* 1 — O que será instalado */}
                <div style={{ background:'#ecfeff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #a5f3fc' }}>
                  {secT('📦', '1 — Equipamento / Material a Instalar')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome / Descrição')}<input className={styles.campoInput} placeholder="Ex: Ar condicionado..." value={os.itemNome || ''} onChange={e => updateOS('itemNome', e.target.value)} /></div>
                    <div>{fLbl('Marca / Modelo')}<input className={styles.campoInput} placeholder="Samsung, LG..." value={os.itemModelo || ''} onChange={e => updateOS('itemModelo', e.target.value)} /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                    <div>{fLbl('Nº de Série')}<input className={styles.campoInput} placeholder="SN-000..." value={os.itemSerie || ''} onChange={e => updateOS('itemSerie', e.target.value)} /></div>
                    <div>{fLbl('Quantidade')}<input className={styles.campoInput} type="number" min={1} placeholder="1" value={os.itemQtd || ''} onChange={e => updateOS('itemQtd', e.target.value)} /></div>
                  </div>
                </div>
                {/* 2 — Local de Instalação */}
                <div style={{ background:'#fefce8', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fef08a' }}>
                  {secT('📍', '2 — Local de Instalação')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Bloco / Área')}<input className={styles.campoInput} placeholder="Bloco A, Sala 3..." value={os.localBloco || ''} onChange={e => updateOS('localBloco', e.target.value)} /></div>
                    <div>{fLbl('Andar / Pavimento')}<input className={styles.campoInput} placeholder="Térreo..." value={os.localAndar || ''} onChange={e => updateOS('localAndar', e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop:8 }}>
                    {fLbl('Detalhes do ponto de instalação')}
                    <textarea className={styles.campoInput} rows={2} placeholder="Descreva o ponto exato..." value={os.localDetalhe || ''} onChange={e => updateOS('localDetalhe', e.target.value)} />
                  </div>
                </div>
                {/* 3 — Requisitos */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  {secT('⚡', '3 — Requisitos Técnicos')}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fLbl('Infraestrutura necessária (elétrica, hidráulica, etc.)')}
                    <MicButton onResult={t => updateOS('requisitos', (os.requisitos || '') + (os.requisitos ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={2} placeholder="Ponto elétrico 220V, tubulação..." value={os.requisitos || ''} onChange={e => updateOS('requisitos', e.target.value)} />
                </div>
                {/* 4 — Responsável */}
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bbf7d0' }}>
                  {secT('👷', '4 — Instalador / Responsável')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome')}<input className={styles.campoInput} placeholder="Instalador..." value={os.instaladorNome || ''} onChange={e => updateOS('instaladorNome', e.target.value)} /></div>
                    <div>{fLbl('Empresa')}<input className={styles.campoInput} placeholder="Empresa..." value={os.instaladorEmpresa || ''} onChange={e => updateOS('instaladorEmpresa', e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop:8 }}>{fLbl('Telefone')}<input className={styles.campoInput} placeholder="(00) 00000-0000" value={os.instaladorTelefone || ''} onChange={e => updateOS('instaladorTelefone', e.target.value)} /></div>
                </div>
                {/* 5 — Data */}
                <div style={{ background:'#fff7ed', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fed7aa' }}>
                  {secT('📅', '5 — Data da Instalação')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Data Programada')}<input className={styles.campoInput} type="date" value={os.dataInstalacao || ''} onChange={e => updateOS('dataInstalacao', e.target.value)} /></div>
                    <div>{fLbl('Horário Previsto')}<input className={styles.campoInput} type="time" value={os.horaInstalacao || ''} onChange={e => updateOS('horaInstalacao', e.target.value)} /></div>
                  </div>
                </div>
                {/* 6 — Teste de Funcionamento */}
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bbf7d0' }}>
                  {secT('✅', '6 — Teste de Funcionamento')}
                  {fLbl('Equipamento testado e funcionando?')}
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    {['Sim, OK', 'Com ressalvas', 'Não funcional'].map(opt => (
                      <button key={opt} type="button" onClick={() => updateOS('testeFuncionamento', opt)}
                        style={{ padding:'6px 14px', borderRadius:8, fontWeight:700, fontSize:12, border: os.testeFuncionamento === opt ? '2px solid #16a34a' : '2px solid #d1d5db', background: os.testeFuncionamento === opt ? '#dcfce7' : '#fff', color: os.testeFuncionamento === opt ? '#15803d' : '#6b7280', cursor:'pointer' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {os.testeFuncionamento === 'Com ressalvas' && (
                    <div style={{ marginTop:8 }}>
                      {fLbl('Descreva as ressalvas')}
                      <textarea className={styles.campoInput} rows={2} placeholder="Ressalvas..." value={os.testeRessalvas || ''} onChange={e => updateOS('testeRessalvas', e.target.value)} />
                    </div>
                  )}
                </div>
                {/* Status */}
                <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e2e8f0' }}>
                  {fLbl('Status')}
                  <select className={styles.campoInput} value={os.status || ''} onChange={e => updateOS('status', e.target.value)} style={{ fontWeight:700 }}>
                    <option value="">Selecione...</option>
                    <option value="Programada">📅 Programada</option>
                    <option value="Em instalação">🔄 Em instalação</option>
                    <option value="Instalado">✅ Instalado</option>
                    <option value="Cancelada">❌ Cancelada</option>
                  </select>
                </div>
                {/* Assinaturas */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinaturas</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline label="Instalador" value={os.assinaturaInstalador || null} onChange={v => updateOS('assinaturaInstalador', v)} />
                    <AssinaturaInline label="Responsável" value={os.assinaturaResponsavel || null} onChange={v => updateOS('assinaturaResponsavel', v)} />
                  </div>
                </div>
                <OSShareSection modelo="os_instalacao" secTitleFn={secT} osData={os} />
              </div>
            </div>
          </div>
        );
      }

      /* ═══════════════════════════════════════════════════════════════
         O.S VISTORIA
         ═══════════════════════════════════════════════════════════════ */
      case 'os_vistoria': {
        const os = val || {};
        const updateOS = (field: string, v: unknown) => setResposta(bloco.uid, { ...os, [field]: v });
        if (!os._tipo) setTimeout(() => updateOS('_tipo', 'os_vistoria'), 0);
        if (!os.numero) {
          const cont = Number.parseInt(localStorage.getItem('sm_contador_os_vist') || '0', 10) + 1;
          localStorage.setItem('sm_contador_os_vist', String(cont));
          const h = new Date();
          setTimeout(() => updateOS('numero', `OSVI-${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}-${String(cont).padStart(4,'0')}`), 0);
        }
        // Itens da vistoria
        const itensVist: Array<{ area: string; situacao: string; obs: string }> = os.vistoriaItens || [];
        const addVist = () => updateOS('vistoriaItens', [...itensVist, { area: '', situacao: '', obs: '' }]);
        const updateVist = (idx: number, field: string, v: string) => { const novo = [...itensVist]; novo[idx] = { ...novo[idx], [field]: v }; updateOS('vistoriaItens', novo); };
        const removeVist = (idx: number) => updateOS('vistoriaItens', itensVist.filter((_, i) => i !== idx));

        const secT = (icon: string, txt: string) => (<div style={{ fontSize:11, fontWeight:900, color:'#7c3aed', textTransform:'uppercase', letterSpacing:0.8, borderBottom:'2px solid #e9d5ff', paddingBottom:4, marginBottom:8 }}>{icon} {txt}</div>);
        const fLbl = (txt: string) => (<label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>{txt}</label>);
        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #7c3aed', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>
              <div style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>🔍 ORDEM DE SERVIÇO</div>
                <div style={{ fontSize:12, opacity:0.9, marginTop:2 }}>VISTORIA</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {os.numero || '...'}</div>
              </div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
                {/* 1 — Tipo de Vistoria */}
                <div style={{ background:'#faf5ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e9d5ff' }}>
                  {secT('📋', '1 — Tipo de Vistoria')}
                  {fLbl('Selecione')}
                  <select className={styles.campoInput} value={os.tipoVistoria || ''} onChange={e => updateOS('tipoVistoria', e.target.value)} style={{ fontWeight:700 }}>
                    <option value="">Selecione...</option>
                    <option value="Entrada">📥 Vistoria de Entrada</option>
                    <option value="Saída">📤 Vistoria de Saída</option>
                    <option value="Periódica">🔄 Vistoria Periódica</option>
                    <option value="Segurança">🔒 Vistoria de Segurança</option>
                    <option value="Estrutural">🏗️ Vistoria Estrutural</option>
                    <option value="Elétrica">⚡ Vistoria Elétrica</option>
                    <option value="Hidráulica">💧 Vistoria Hidráulica</option>
                  </select>
                </div>
                {/* 2 — Local */}
                <div style={{ background:'#fefce8', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fef08a' }}>
                  {secT('📍', '2 — Local / Unidade Vistoriada')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Bloco / Área')}<input className={styles.campoInput} placeholder="Bloco A, Apt 101..." value={os.localBloco || ''} onChange={e => updateOS('localBloco', e.target.value)} /></div>
                    <div>{fLbl('Responsável pela Unidade')}<input className={styles.campoInput} placeholder="Nome..." value={os.localResponsavel || ''} onChange={e => updateOS('localResponsavel', e.target.value)} /></div>
                  </div>
                </div>
                {/* 3 — Itens da Vistoria */}
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', border:'1.5px solid #bbf7d0' }}>
                  {secT('✅', '3 — Itens da Vistoria')}
                  {itensVist.map((it, idx) => (
                    <div key={`vi-${idx}`} style={{ display:'grid', gridTemplateColumns:'2fr 100px 2fr 30px', gap:6, marginBottom:6, alignItems:'end' }}>
                      <div>{fLbl('Área / Item')}<input className={styles.campoInput} placeholder="Piso, Pintura, Elétrica..." value={it.area} onChange={e => updateVist(idx, 'area', e.target.value)} /></div>
                      <div>{fLbl('Situação')}
                        <select className={styles.campoInput} value={it.situacao} onChange={e => updateVist(idx, 'situacao', e.target.value)} style={{ fontWeight:700 }}>
                          <option value="">-</option>
                          <option value="Bom">✅ Bom</option>
                          <option value="Regular">🟡 Regular</option>
                          <option value="Ruim">🔴 Ruim</option>
                          <option value="NA">➖ N/A</option>
                        </select>
                      </div>
                      <div>{fLbl('Observação')}<input className={styles.campoInput} placeholder="Obs..." value={it.obs} onChange={e => updateVist(idx, 'obs', e.target.value)} /></div>
                      <button type="button" onClick={() => removeVist(idx)} style={{ background:'#fee2e2', border:'none', borderRadius:6, color:'#dc2626', fontWeight:900, cursor:'pointer', height:32 }}>✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addVist} style={{ background:'#f5f3ff', border:'1.5px dashed #7c3aed', borderRadius:8, padding:'6px 14px', color:'#6d28d9', fontWeight:700, fontSize:12, cursor:'pointer', width:'100%' }}>+ Adicionar Item da Vistoria</button>
                </div>
                {/* 4 — Parecer Geral */}
                <div style={{ background:'#fff7ed', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fed7aa' }}>
                  {secT('📝', '4 — Parecer Geral')}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    {fLbl('Conclusão / Parecer da vistoria')}
                    <MicButton onResult={t => updateOS('parecer', (os.parecer || '') + (os.parecer ? ' ' : '') + t)} />
                  </div>
                  <textarea className={styles.campoInput} rows={3} placeholder="Parecer geral da vistoria..." value={os.parecer || ''} onChange={e => updateOS('parecer', e.target.value)} />
                </div>
                {/* 5 — Resultado */}
                <div style={{ background:'#faf5ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e9d5ff' }}>
                  {secT('📊', '5 — Resultado')}
                  {fLbl('Resultado da Vistoria')}
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    {['Aprovado', 'Aprovado c/ ressalvas', 'Reprovado'].map(opt => (
                      <button key={opt} type="button" onClick={() => updateOS('resultado', opt)}
                        style={{ padding:'6px 14px', borderRadius:8, fontWeight:700, fontSize:12, border: os.resultado === opt ? '2px solid #7c3aed' : '2px solid #d1d5db', background: os.resultado === opt ? '#f5f3ff' : '#fff', color: os.resultado === opt ? '#6d28d9' : '#6b7280', cursor:'pointer' }}>
                        {opt === 'Aprovado' ? '✅' : opt === 'Reprovado' ? '❌' : '⚠️'} {opt}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 6 — Vistoriador */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #c7d2fe' }}>
                  {secT('👷', '6 — Vistoriador')}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>{fLbl('Nome')}<input className={styles.campoInput} placeholder="Nome..." value={os.vistoriadorNome || ''} onChange={e => updateOS('vistoriadorNome', e.target.value)} /></div>
                    <div>{fLbl('CREA / Registro')}<input className={styles.campoInput} placeholder="CREA..." value={os.vistoriadorRegistro || ''} onChange={e => updateOS('vistoriadorRegistro', e.target.value)} /></div>
                  </div>
                </div>
                {/* Data */}
                <div style={{ background:'#fff7ed', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fed7aa' }}>
                  {secT('📅', '7 — Data da Vistoria')}
                  <input className={styles.campoInput} type="date" value={os.dataVistoria || ''} onChange={e => updateOS('dataVistoria', e.target.value)} />
                </div>
                {/* Assinaturas */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinaturas</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline label="Vistoriador" value={os.assinaturaVistoriador || null} onChange={v => updateOS('assinaturaVistoriador', v)} />
                    <AssinaturaInline label="Responsável" value={os.assinaturaResponsavel || null} onChange={v => updateOS('assinaturaResponsavel', v)} />
                  </div>
                </div>
                <OSShareSection modelo="os_vistoria" secTitleFn={secT} osData={os} />
              </div>
            </div>
          </div>
        );
      }

      case 'orcamento': {
        const orc = val || {};
        const updateORC = (field: string, v: unknown) => setResposta(bloco.uid, { ...orc, [field]: v });
        // Auto-gerar número do orçamento
        if (!orc.numeroOrcamento) {
          const cont = Number.parseInt(localStorage.getItem('sm_contador_orcamentos') || '0', 10) + 1;
          localStorage.setItem('sm_contador_orcamentos', String(cont));
          const h = new Date();
          const num = `ORC-${h.getFullYear()}${String(h.getMonth()+1).padStart(2,'0')}${String(h.getDate()).padStart(2,'0')}-${String(cont).padStart(4,'0')}`;
          setTimeout(() => updateORC('numeroOrcamento', num), 0);
        }
        if (!orc._tipo) setTimeout(() => updateORC('_tipo', 'orcamento'), 0);
        const itensOrc: Array<{ descricao: string; qtd: string; unitario: string }> = orc.itens || [];
        const addItem = () => updateORC('itens', [...itensOrc, { descricao: '', qtd: '1', unitario: '' }]);
        const updateItem = (idx: number, field: string, v: string) => {
          const novo = [...itensOrc];
          novo[idx] = { ...novo[idx], [field]: v };
          updateORC('itens', novo);
        };
        const removeItem = (idx: number) => updateORC('itens', itensOrc.filter((_, i) => i !== idx));
        const totalGeral = itensOrc.reduce((acc, it) => acc + (Number.parseFloat(it.qtd || '0') * Number.parseFloat(it.unitario || '0')), 0);

        const logo = localStorage.getItem('sm_logo_empresa') || '';

        return (
          <div key={bloco.uid} className={styles.campo}>
            <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
            <div style={{ border:'2px solid #d97706', borderRadius:14, overflow:'hidden', marginTop:8, background:'#fff' }}>

              {/* Header */}
              <div style={{ background:'linear-gradient(135deg,#d97706,#b45309)', color:'#fff', padding:'16px 18px', textAlign:'center' }}>
                {logo && <img src={logo} alt="Logo" style={{ maxHeight:48, maxWidth:160, objectFit:'contain', marginBottom:8, borderRadius:6 }} />}
                <div style={{ fontSize:16, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>💲 ORÇAMENTO DE SERVIÇO</div>
                <div style={{ fontSize:11, opacity:0.9, marginTop:4, fontFamily:'monospace', fontWeight:700 }}>Nº {orc.numeroOrcamento || '...'}</div>
              </div>

              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

                {/* NÚMERO */}
                <div>
                  <label htmlFor="oc-numero" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}># Número do Orçamento</label>
                  <input id="oc-numero" className={styles.campoInput} placeholder="ORC-00000001" value={orc.numeroOrcamento || ''} onChange={e => updateORC('numeroOrcamento', e.target.value)} style={{ fontFamily:'monospace', fontWeight:700 }} />
                </div>

                {/* DADOS DA EMPRESA */}
                <div style={{ background:'#fffbeb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #fcd34d' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#b45309', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>🏢 Dados da Empresa</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label htmlFor="oc-empresa-nome" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Razão Social / Nome</label>
                      <input id="oc-empresa-nome" className={styles.campoInput} placeholder="Nome da empresa..." value={orc.empresaNome || ''} onChange={e => updateORC('empresaNome', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="oc-empresa-doc" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>CNPJ / CPF</label>
                      <input id="oc-empresa-doc" className={styles.campoInput} placeholder="00.000.000/0001-00" value={orc.empresaDoc || ''} onChange={e => updateORC('empresaDoc', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="oc-empresa-tel" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Telefone / WhatsApp</label>
                      <input id="oc-empresa-tel" className={styles.campoInput} placeholder="(00) 00000-0000" value={orc.empresaTelefone || ''} onChange={e => updateORC('empresaTelefone', e.target.value)} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label htmlFor="oc-empresa-end" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Endereço</label>
                      <input id="oc-empresa-end" className={styles.campoInput} placeholder="Rua, número, bairro, cidade - UF" value={orc.empresaEndereco || ''} onChange={e => updateORC('empresaEndereco', e.target.value)} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label htmlFor="oc-empresa-email" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>E-mail</label>
                      <input id="oc-empresa-email" className={styles.campoInput} placeholder="contato@empresa.com" value={orc.empresaEmail || ''} onChange={e => updateORC('empresaEmail', e.target.value)} />
                    </div>
                  </div>
                  {/* Logo upload */}
                  <div style={{ marginTop:10 }}>
                    <label htmlFor="oc-logo" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>📷 Logo da Empresa (aparece no cabeçalho do PDF)</label>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {(orc.logoEmpresa || logo) && <img src={orc.logoEmpresa || logo} alt="Logo" style={{ height:40, maxWidth:120, objectFit:'contain', borderRadius:6, border:'1px solid #e5e7eb' }} />}
                      <label style={{ cursor:'pointer', padding:'6px 14px', background:'#f59e0b', color:'#fff', borderRadius:8, fontSize:12, fontWeight:700 }}>
                        {orc.logoEmpresa ? 'Trocar' : 'Enviar logo'}
                        <input id="oc-logo" type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => { updateORC('logoEmpresa', reader.result as string); localStorage.setItem('sm_logo_empresa', reader.result as string); };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* CLIENTE */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#0D47A1', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>👤 Cliente</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label htmlFor="oc-cliente-nome" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Nome Completo</label>
                      <input id="oc-cliente-nome" className={styles.campoInput} placeholder="Nome do cliente..." value={orc.clienteNome || ''} onChange={e => updateORC('clienteNome', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="oc-cliente-doc" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>CPF / CNPJ</label>
                      <input id="oc-cliente-doc" className={styles.campoInput} placeholder="000.000.000-00" value={orc.clienteDoc || ''} onChange={e => updateORC('clienteDoc', e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="oc-cliente-tel" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Telefone</label>
                      <input id="oc-cliente-tel" className={styles.campoInput} placeholder="(00) 00000-0000" value={orc.clienteTelefone || ''} onChange={e => updateORC('clienteTelefone', e.target.value)} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label htmlFor="oc-cliente-end" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Endereço</label>
                      <input id="oc-cliente-end" className={styles.campoInput} placeholder="Endereço do cliente..." value={orc.clienteEndereco || ''} onChange={e => updateORC('clienteEndereco', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ITENS DO ORÇAMENTO */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5 }}>📦 Itens / Serviços</span>
                    <button type="button" onClick={addItem} style={{ padding:'5px 12px', background:'#f59e0b', border:'none', borderRadius:8, color:'#fff', fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>+ Adicionar Item</button>
                  </div>

                  {itensOrc.length === 0 && (
                    <div style={{ textAlign:'center', padding:16, color:'#9ca3af', fontSize:13, background:'#f9fafb', borderRadius:10, border:'1.5px dashed #d1d5db' }}>
                      Nenhum item adicionado. Clique em "+ Adicionar Item"
                    </div>
                  )}

                  {itensOrc.map((item, idx) => {
                    const subtotal = (Number.parseFloat(item.qtd || '0') * Number.parseFloat(item.unitario || '0'));
                    return (
                      <div key={`orc-item-${item.descricao || idx}`} style={{ background:'#fafafa', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:10, fontWeight:800, color:'#d97706', textTransform:'uppercase' }}>Item {idx + 1}</span>
                          <button type="button" onClick={() => removeItem(idx)} style={{ background:'#fee2e2', border:'none', borderRadius:6, padding:'3px 8px', color:'#dc2626', fontSize:10, fontWeight:800, cursor:'pointer' }}>✕ Remover</button>
                        </div>
                        <div style={{ marginBottom:6 }}>
                          <label htmlFor={`oc-item-desc-${idx}`} style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Descrição</label>
                          <input id={`oc-item-desc-${idx}`} className={styles.campoInput} placeholder="Descrição do serviço ou material..." value={item.descricao} onChange={e => updateItem(idx, 'descricao', e.target.value)} />
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                          <div>
                            <label htmlFor={`oc-item-qtd-${idx}`} style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Qtd</label>
                            <input id={`oc-item-qtd-${idx}`} className={styles.campoInput} type="number" min={1} step={1} value={item.qtd} onChange={e => updateItem(idx, 'qtd', e.target.value)} style={{ textAlign:'center' }} />
                          </div>
                          <div>
                            <label htmlFor={`oc-item-unitario-${idx}`} style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Valor Unit. (R$)</label>
                            <input id={`oc-item-unitario-${idx}`} className={styles.campoInput} type="number" min={0} step={0.01} placeholder="0,00" value={item.unitario} onChange={e => updateItem(idx, 'unitario', e.target.value)} style={{ textAlign:'center' }} />
                          </div>
                          <div>
                            <span style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Subtotal</span>
                            <div style={{ padding:'8px 12px', background:'#f0fdf4', borderRadius:8, border:'1.5px solid #86efac', fontSize:14, fontWeight:900, fontFamily:'monospace', color:'#16a34a', textAlign:'center' }}>
                              {subtotal.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TOTALIZAÇÃO */}
                <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:12, padding:'14px 18px', textAlign:'center' }}>
                  <span style={{ fontSize:10, fontWeight:900, color:'#16a34a', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>💰 Valor Total do Orçamento</span>
                  <div style={{ fontSize:26, fontWeight:900, fontFamily:'monospace', color:'#16a34a' }}>
                    {totalGeral.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
                  </div>
                  {totalGeral > 0 && (
                    <div style={{ fontSize:11, fontWeight:600, color:'#4b5563', marginTop:4, fontStyle:'italic' }}>
                      ({valorPorExtenso(totalGeral)})
                    </div>
                  )}
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px' }}>
                  <label htmlFor="oc-forma-pgto" style={{ fontSize:10, fontWeight:900, color:'#0D47A1', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>💳 Forma de Pagamento</label>
                  <select id="oc-forma-pgto" className={styles.campoInput} value={orc.formaPagamento || ''} onChange={e => updateORC('formaPagamento', e.target.value)}
                    style={{ cursor:'pointer' }}>
                    <option value="">Selecione...</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Parcelado">Parcelado</option>
                    <option value="A combinar">A combinar</option>
                  </select>
                  {orc.formaPagamento === 'Parcelado' && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                      <div>
                        <label htmlFor="oc-parcelas" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Nº de Parcelas</label>
                        <input id="oc-parcelas" className={styles.campoInput} type="number" min={2} max={48} placeholder="Ex: 3" value={orc.parcelas || ''} onChange={e => updateORC('parcelas', e.target.value)} style={{ textAlign:'center' }} />
                      </div>
                      <div>
                        <span style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Valor da Parcela</span>
                        <div style={{ padding:'8px 12px', background:'#f0fdf4', borderRadius:8, border:'1.5px solid #86efac', fontSize:14, fontWeight:900, fontFamily:'monospace', color:'#16a34a', textAlign:'center' }}>
                          {orc.parcelas && Number.parseInt(orc.parcelas, 10) > 0
                            ? (totalGeral / Number.parseInt(orc.parcelas, 10)).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })
                            : '—'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PREVISÃO DE CONCLUSÃO */}
                <div style={{ background:'#faf5ff', borderRadius:10, padding:'10px 14px', border:'1.5px solid #d8b4fe' }}>
                  <span style={{ fontSize:10, fontWeight:900, color:'#7c3aed', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>📅 Previsão para Conclusão</span>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    <div>
                      <label htmlFor="oc-previsao-horas" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Horas</label>
                      <input id="oc-previsao-horas" className={styles.campoInput} type="number" min={0} placeholder="0" value={orc.previsaoHoras || ''} onChange={e => updateORC('previsaoHoras', e.target.value)} style={{ textAlign:'center' }} />
                    </div>
                    <div>
                      <label htmlFor="oc-previsao-dias" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Dias</label>
                      <input id="oc-previsao-dias" className={styles.campoInput} type="number" min={0} placeholder="0" value={orc.previsaoDias || ''} onChange={e => updateORC('previsaoDias', e.target.value)} style={{ textAlign:'center' }} />
                    </div>
                    <div>
                      <label htmlFor="oc-previsao-meses" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Meses</label>
                      <input id="oc-previsao-meses" className={styles.campoInput} type="number" min={0} placeholder="0" value={orc.previsaoMeses || ''} onChange={e => updateORC('previsaoMeses', e.target.value)} style={{ textAlign:'center' }} />
                    </div>
                  </div>
                  <div style={{ marginTop:8 }}>
                    <label htmlFor="oc-data-inicio" style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Data prevista de início</label>
                    <input id="oc-data-inicio" className={styles.campoInput} type="date" value={orc.dataInicio || ''} onChange={e => updateORC('dataInicio', e.target.value)} />
                  </div>
                </div>

                {/* VALIDADE DO ORÇAMENTO */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label htmlFor="oc-data" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}>📅 Data do Orçamento</label>
                    <input id="oc-data" className={styles.campoInput} type="date" value={orc.dataOrcamento || new Date().toISOString().split('T')[0]} onChange={e => updateORC('dataOrcamento', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="oc-validade" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:3 }}>⏳ Validade (dias)</label>
                    <input id="oc-validade" className={styles.campoInput} type="number" min={1} placeholder="30" value={orc.validade || '30'} onChange={e => updateORC('validade', e.target.value)} style={{ textAlign:'center' }} />
                  </div>
                </div>

                {/* OBSERVAÇÕES */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <label htmlFor="oc-obs" style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5 }}>📝 Observações</label>
                    <MicButton onResult={texto => updateORC('observacoes', (orc.observacoes || '') + (orc.observacoes ? ' ' : '') + texto)} />
                  </div>
                  <textarea id="oc-obs" className={styles.campoInput} rows={3} placeholder="Condições especiais, garantias, informações adicionais..." value={orc.observacoes || ''} onChange={e => updateORC('observacoes', e.target.value)} />
                </div>

                {/* ASSINATURAS */}
                <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', border:'1.5px solid #e5e7eb' }}>
                  <div style={{ fontSize:10, fontWeight:900, color:'#4b5563', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, textAlign:'center' }}>✍️ Assinaturas</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <AssinaturaInline label="Prestador" value={orc.assinaturaPrestador || null} onChange={v => updateORC('assinaturaPrestador', v)} />
                    <AssinaturaInline label="Cliente" value={orc.assinaturaCliente || null} onChange={v => updateORC('assinaturaCliente', v)} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div key={bloco.uid} className={styles.campo}>
            <div className={styles.campoLabelRow}>
              <label className={styles.campoLabel}>{def.icone} {bloco.label || def.nome}</label>
              <MicButton onResult={texto => setResposta(bloco.uid, (val || '') + (val ? ' ' : '') + texto)} />
            </div>
            <textarea
              className={styles.campoInput}
              rows={3}
              placeholder="Preencha este campo... ou clique em Falar 🎙️"
              value={val || ''}
              onChange={e => setResposta(bloco.uid, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.form}>

        {/* Header */}
        <div className={styles.formHeader} style={{ background: funcao.cor }}>
          <div className={styles.formHeaderTopo}>
            <div className={styles.formTipo}>
              <span className={styles.formIcone}>{funcao.icone}</span>
              <div>
                <div className={styles.formNome}>{funcao.nome}</div>
                {osNumeroExibir && (
                  <div style={{ fontFamily:'monospace', fontSize:12, fontWeight:900, color:'rgba(255,255,255,0.9)', background:'rgba(0,0,0,0.3)', padding:'2px 10px', borderRadius:6, marginTop:2 }}>
                    OS #{osNumeroExibir}
                  </div>
                )}
                <div className={styles.formTimer}>
                  <Clock size={14} />
                  {formatarTempo(agora - horarioInicial)}
                </div>
              </div>
            </div>
            <button className={styles.fecharBtn} onClick={cancelarComRascunho}>
              <X size={22} />
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className={styles.formHorarioInicio}>
              ▶ Iniciado às {formatarHora(horarioInicial)}
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button type="button" onClick={() => setShowHistorico(true)}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'rgba(255,255,255,0.25)', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:8, fontSize:11, fontWeight:800, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
                📋 Histórico
              </button>
              <button type="button" onClick={() => setShowRelatorio(true)}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'rgba(255,255,255,0.25)', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:8, fontSize:11, fontWeight:800, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
                📊 Relatório
              </button>
              {onRestaurarOS && osOcultos && osOcultos.length > 0 && (
                <button
                  type="button"
                  onClick={onRestaurarOS}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', background:'rgba(255,255,255,0.25)', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:8, fontSize:11, fontWeight:800, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}
                >
                  <RotateCcw size={13} /> Restaurar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className={styles.formBody}>
          {/* Campo responsável sempre presente */}
          <div className={styles.campo}>
            <label htmlFor="chamado-responsavel" className={styles.campoLabel}>👤 Responsável *</label>
            <input
              id="chamado-responsavel"
              className={styles.campoInput}
              placeholder="Nome do responsável..."
              value={responsavel}
              onChange={e => setResponsavel(e.target.value)}
            />
          </div>

          {/* Blocos configurados */}
          {funcao.blocos.map(bloco => {
            const defBloco = BLOCOS_DISPONIVEIS.find(d => d.id === bloco.tipo);
            const oculto = osOcultos?.includes(bloco.uid);

            if (oculto && onToggleBloco) {
              return (
                <div key={bloco.uid} className={styles.campo} style={{ opacity: 0.4, padding:'10px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#9ca3af' }}>{defBloco?.icone} {bloco.label || defBloco?.nome}</span>
                    <button type="button" onClick={() => onToggleBloco(bloco.uid)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#9ca3af', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700 }}>
                      <EyeOff size={16} /> Oculto
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={`wrap-${bloco.uid}`} style={{ position:'relative' }}>
                {onToggleBloco && (
                  <button type="button" onClick={() => onToggleBloco(bloco.uid)}
                    style={{ position:'absolute', top:2, right:0, background:'none', border:'none', cursor:'pointer', padding:4, color:'#c7d2fe', zIndex:1, display:'flex', alignItems:'center' }}
                    title="Ocultar campo">
                    <Eye size={16} />
                  </button>
                )}
                {renderBloco(bloco)}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.formFooter}>
          <div className={styles.formFooterTempo}>
            <Clock size={16} />
            <span>{formatarTempo(agora - horarioInicial)}</span>
          </div>
          {RASCUNHO_KEY && (
            <button
              onClick={salvarRascunho}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'14px 18px', border:'1.5px solid #1a73e8', borderRadius:12, background:'rgba(26,115,232,0.08)', color:'#1a73e8', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', position:'relative' }}
              title="Salvar rascunho para continuar depois"
            >
              <Save size={18} />
              {rascunhoSalvoMsg ? '✓ Salvo!' : 'Rascunho'}
            </button>
          )}
          <button
            type="button"
            onClick={gerarPDF}
            className={styles.btnPDF}
            title="Gerar PDF para enviar ao cliente"
          >
            <FileDown size={18} />
            PDF
          </button>
          <button
            className={styles.btnEnviar}
            onClick={enviar}
            disabled={!responsavel.trim()}
          >
            <CheckCircle2 size={20} />
            FINALIZAR E ENVIAR
          </button>
        </div>
      </div>

      {/* ── MODAL HISTÓRICO ── */}
      {showHistorico && (() => {
        const CHAMADOS_KEY = 'manutencao_chamados_v2';
        let todos: ChamadoManutencao[] = [];
        try { todos = JSON.parse(localStorage.getItem(CHAMADOS_KEY) || '[]'); } catch { /* ok */ }
        // Filtra só OS de assistência técnica (funcaoId com os_)
        const osList = todos.filter(c => c.funcaoId?.startsWith('os_') || c.osTitulo || c.osNumero);
        const filtro = historicoFiltro.toLowerCase();
        const filtrados = filtro
          ? osList.filter(c =>
              (c.osNumero || '').toLowerCase().includes(filtro) ||
              (c.osTitulo || '').toLowerCase().includes(filtro) ||
              (c.funcaoNome || '').toLowerCase().includes(filtro) ||
              (c.responsavel || '').toLowerCase().includes(filtro) ||
              (c.protocolo || '').toLowerCase().includes(filtro) ||
              String(c.numero).includes(filtro) ||
              (() => { const od = Object.values(c.respostas || {}).find((r: any) => r && typeof r === 'object' && r._tipo) as any; return od && [od.tecnicoNome, od.prestadoraNome, od.maquinaNome, od.tipoManutencao, od.gestorNome].filter(Boolean).join(' ').toLowerCase().includes(filtro); })()
            )
          : osList;
        return (
          <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:600, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:15, fontWeight:900 }}>📋 Histórico de O.S</div>
                <button onClick={() => setShowHistorico(false)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, color:'#fff', fontSize:18, cursor:'pointer', padding:'4px 10px', fontWeight:900 }}>✕</button>
              </div>
              <div style={{ padding:'10px 16px', borderBottom:'1px solid #e5e7eb' }}>
                <input
                  placeholder="🔍 Buscar por nº, título, técnico, protocolo..."
                  value={historicoFiltro}
                  onChange={e => setHistoricoFiltro(e.target.value)}
                  style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #d1d5db', fontSize:13, fontFamily:'inherit' }}
                />
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:16 }}>
                {filtrados.length === 0 ? (
                  <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>
                    <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{osList.length === 0 ? 'Nenhuma O.S enviada ainda' : 'Nenhum resultado para a busca'}</div>
                  </div>
                ) : (
                  filtrados.map(c => {
                    const data = new Date(c.criadoEm);
                    const resps = c.respostas || {};
                    const osData = Object.values(resps).find((r: any) => r && typeof r === 'object' && r._tipo) as any;
                    return (
                      <div key={c.id} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', marginBottom:8, border:'1px solid #e5e7eb' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <span style={{ fontWeight:900, color:'#4f46e5', fontSize:13 }}>
                              {c.osNumero ? `OS #${c.osNumero}` : `#${c.numero}`}
                            </span>
                            {c.protocolo && <span style={{ marginLeft:8, fontSize:11, color:'#6b7280', fontFamily:'monospace' }}>Prot: {c.protocolo}</span>}
                          </div>
                          <span style={{ fontSize:10, color:'#9ca3af', fontWeight:700 }}>
                            {data.toLocaleDateString('pt-BR')} {data.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize:12, color:'#374151', marginTop:4 }}>
                          {osData?.tipoManutencao && <span style={{ background:'#fef3c7', padding:'1px 8px', borderRadius:4, fontSize:10, fontWeight:700, color:'#92400e', marginRight:6 }}>{osData.tipoManutencao}</span>}
                          {osData?.maquinaNome && <span style={{ fontSize:11, color:'#6b7280' }}>🖥️ {osData.maquinaNome}</span>}
                        </div>
                        {osData?.tecnicoNome && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>👷 {osData.tecnicoNome}</div>}
                        {osData?.prestadoraNome && <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>🏢 {osData.prestadoraNome}</div>}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                          <span style={{ fontSize:11, fontWeight:700, color: c.status === 'concluido' ? '#16a34a' : c.status === 'em_andamento' ? '#d97706' : '#6b7280' }}>
                            {c.status === 'concluido' ? '✅ Concluído' : c.status === 'em_andamento' ? '🔄 Em andamento' : c.status === 'cancelado' ? '❌ Cancelado' : '⏳ Aberto'}
                          </span>
                          {osData?.valorServico && <span style={{ fontSize:11, fontWeight:900, color:'#15803d' }}>R$ {Number(osData.valorServico).toFixed(2)}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{ padding:'10px 16px', borderTop:'1px solid #e5e7eb', textAlign:'center', fontSize:11, color:'#9ca3af', fontWeight:700 }}>
                {filtrados.length} de {osList.length} O.S encontradas
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL RELATÓRIO ── */}
      {showRelatorio && (() => {
        const CHAMADOS_KEY = 'manutencao_chamados_v2';
        let todos: ChamadoManutencao[] = [];
        try { todos = JSON.parse(localStorage.getItem(CHAMADOS_KEY) || '[]'); } catch { /* ok */ }
        const osList = todos.filter(c => c.funcaoId?.startsWith('os_') || c.osTitulo || c.osNumero);

        const de = relDataDe ? new Date(relDataDe + 'T00:00:00').getTime() : 0;
        const ate = relDataAte ? new Date(relDataAte + 'T23:59:59').getTime() : Infinity;
        const filtrados = osList.filter(c => c.criadoEm >= de && c.criadoEm <= ate);

        const totalValor = filtrados.reduce((s, c) => {
          const resps = c.respostas || {};
          const osData = Object.values(resps).find((r: any) => r && typeof r === 'object' && r._tipo) as any;
          const v = Number(osData?.valorServico);
          return s + (isNaN(v) ? 0 : v);
        }, 0);

        const porStatus = { aberto: 0, em_andamento: 0, concluido: 0, cancelado: 0 };
        filtrados.forEach(c => { if (porStatus[c.status] !== undefined) porStatus[c.status]++; });

        const tiposCount: Record<string, number> = {};
        filtrados.forEach(c => {
          const resps = c.respostas || {};
          const osData = Object.values(resps).find((r: any) => r && typeof r === 'object' && r._tipo) as any;
          const tipo = osData?.tipoManutencao || 'Não definido';
          tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
        });

        const imprimirRelatorio = () => {
          const w = window.open('', '_blank');
          if (!w) { alert('Popup bloqueado. Habilite popups para imprimir o relatório.'); return; }
          w.document.write(`<html><head><title>Relatório de O.S</title><style>
            body{font-family:Arial,sans-serif;padding:20px;color:#333}
            h1{font-size:20px;text-align:center;margin-bottom:4px}
            h2{font-size:14px;color:#666;text-align:center;margin-top:0}
            .periodo{text-align:center;font-size:12px;color:#888;margin-bottom:20px}
            .cards{display:flex;gap:10px;justify-content:center;margin-bottom:20px;flex-wrap:wrap}
            .card{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px 20px;text-align:center;min-width:120px}
            .card .num{font-size:24px;font-weight:900}
            .card .lbl{font-size:10px;color:#888;text-transform:uppercase;font-weight:700}
            table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}
            th{background:#4f46e5;color:#fff;padding:8px;text-align:left}
            td{padding:6px 8px;border-bottom:1px solid #e5e7eb}
            tr:nth-child(even){background:#f8fafc}
            .footer{text-align:center;font-size:10px;color:#999;margin-top:20px}
          </style></head><body>
          <h1>📊 Relatório de Ordens de Serviço</h1>
          <h2>${funcao.nome}</h2>
          <div class="periodo">${relDataDe ? new Date(relDataDe+'T12:00:00').toLocaleDateString('pt-BR') : 'Início'} a ${relDataAte ? new Date(relDataAte+'T12:00:00').toLocaleDateString('pt-BR') : 'Hoje'}</div>
          <div class="cards">
            <div class="card"><div class="num">${filtrados.length}</div><div class="lbl">Total O.S</div></div>
            <div class="card"><div class="num" style="color:#16a34a">${porStatus.concluido}</div><div class="lbl">Concluídas</div></div>
            <div class="card"><div class="num" style="color:#d97706">${porStatus.em_andamento}</div><div class="lbl">Em Andamento</div></div>
            <div class="card"><div class="num" style="color:#6b7280">${porStatus.aberto}</div><div class="lbl">Abertas</div></div>
            <div class="card"><div class="num" style="color:#15803d">R$ ${totalValor.toFixed(2)}</div><div class="lbl">Valor Total</div></div>
          </div>
          ${Object.keys(tiposCount).length > 0 ? `<h3 style="font-size:13px;margin-bottom:6px">Por Tipo de Manutenção</h3><div class="cards">${Object.entries(tiposCount).map(([t, n]) => `<div class="card"><div class="num">${n}</div><div class="lbl">${t}</div></div>`).join('')}</div>` : ''}
          <table>
            <thead><tr><th>Nº</th><th>Data</th><th>Tipo</th><th>Técnico</th><th>Máquina</th><th>Status</th><th>Valor</th></tr></thead>
            <tbody>${filtrados.map(c => {
              const resps = c.respostas || {};
              const od = Object.values(resps).find((r: any) => r && typeof r === 'object' && r._tipo) as any;
              const d = new Date(c.criadoEm);
              return `<tr>
                <td>${c.osNumero || c.numero}</td>
                <td>${d.toLocaleDateString('pt-BR')}</td>
                <td>${od?.tipoManutencao || '—'}</td>
                <td>${od?.tecnicoNome || '—'}</td>
                <td>${od?.maquinaNome || '—'}</td>
                <td>${c.status === 'concluido' ? '✅' : c.status === 'em_andamento' ? '🔄' : c.status === 'cancelado' ? '❌' : '⏳'} ${c.status}</td>
                <td>${od?.valorServico ? 'R$ ' + Number(od.valorServico).toFixed(2) : '—'}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} • Simples Manutenção</div>
          </body></html>`);
          w.document.close();
          w.onload = () => w.print();
          setTimeout(() => { try { w.print(); } catch { /* onload já tratou */ } }, 500);
        };

        return (
          <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:500, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ background:'linear-gradient(135deg,#059669,#047857)', color:'#fff', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:15, fontWeight:900 }}>📊 Relatório de O.S</div>
                <button onClick={() => setShowRelatorio(false)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, color:'#fff', fontSize:18, cursor:'pointer', padding:'4px 10px', fontWeight:900 }}>✕</button>
              </div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Data Início</label>
                    <input type="date" value={relDataDe} onChange={e => setRelDataDe(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #d1d5db', fontSize:13, fontFamily:'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#6b7280', display:'block', marginBottom:3 }}>Data Fim</label>
                    <input type="date" value={relDataAte} onChange={e => setRelDataAte(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #d1d5db', fontSize:13, fontFamily:'inherit' }} />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, textAlign:'center' }}>
                  <div style={{ background:'#f0f4ff', borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:22, fontWeight:900, color:'#4f46e5' }}>{filtrados.length}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>Total O.S</div>
                  </div>
                  <div style={{ background:'#f0fdf4', borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:22, fontWeight:900, color:'#16a34a' }}>{porStatus.concluido}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>Concluídas</div>
                  </div>
                  <div style={{ background:'#fef3c7', borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:22, fontWeight:900, color:'#d97706' }}>{porStatus.em_andamento}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>Em Andamento</div>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div style={{ background:'#faf5ff', borderRadius:8, padding:10, textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:900, color:'#7c3aed' }}>{porStatus.aberto}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>Abertas</div>
                  </div>
                  <div style={{ background:'#f0fdf4', borderRadius:8, padding:10, textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:900, color:'#15803d' }}>R$ {totalValor.toFixed(2)}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>Valor Total</div>
                  </div>
                </div>

                {Object.keys(tiposCount).length > 0 && (
                  <div style={{ background:'#f8fafc', borderRadius:8, padding:10, border:'1px solid #e5e7eb' }}>
                    <div style={{ fontSize:10, fontWeight:900, color:'#374151', textTransform:'uppercase', marginBottom:6 }}>Por Tipo de Manutenção</div>
                    {Object.entries(tiposCount).map(([tipo, qtd]) => (
                      <div key={tipo} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'3px 0', borderBottom:'1px solid #f1f5f9' }}>
                        <span style={{ color:'#374151' }}>{tipo}</span>
                        <span style={{ fontWeight:900, color:'#4f46e5' }}>{qtd}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" onClick={imprimirRelatorio}
                  style={{ padding:'12px', background:'linear-gradient(135deg,#059669,#047857)', border:'none', borderRadius:10, color:'#fff', fontWeight:900, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                  🖨️ Imprimir Relatório
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default FormChamado;
