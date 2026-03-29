import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, CheckCircle2, Clock, Camera, Star, Edit3, Save, Trash2, FileDown, Plus, Eye, EyeOff, RotateCcw } from 'lucide-react';
import EditorImagem from '../../components/EditorImagem';
import type { FuncaoManutencao, ChamadoManutencao, BlocoSelecionado } from './types';
import { BLOCOS_DISPONIVEIS } from './constants';
import MicButton from '../../components/MicButton';
import styles from './FormChamado.module.css';

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
          <input type="file" accept="image/*" capture="environment" className={styles.galeriaInput} onChange={handleFotoEdicao} />
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
                    <input type="file" accept="image/*" capture="environment" className={styles.galeriaInput} onChange={handleAD('antes')} />
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
                    <input type="file" accept="image/*" capture="environment" className={styles.galeriaInput} onChange={handleAD('depois')} />
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
            {onRestaurarOS && osOcultos && osOcultos.length > 0 && (
              <button
                type="button"
                onClick={onRestaurarOS}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', background:'rgba(255,255,255,0.25)', border:'1.5px solid rgba(255,255,255,0.5)', borderRadius:8, fontSize:11, fontWeight:800, color:'#fff', cursor:'pointer', fontFamily:'inherit', marginRight:12 }}
              >
                <RotateCcw size={13} /> Restaurar
              </button>
            )}
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
    </div>
  );
};

export default FormChamado;
