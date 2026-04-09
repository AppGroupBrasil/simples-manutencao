import React, { useState, useRef, useCallback } from 'react';
import { Save, Plus, Clock, Trash2, Eye, Share2, Edit3 } from 'lucide-react';
import MicButton from '../../components/MicButton';
import { usePin, PinModal } from '../../components/PinProtecao';
import styles from './FormChamado.module.css';

// ── tipos ──
interface OSData {
  id: string;
  numero: string;
  criadoEm: number;
  status: string;
  prioridade: string;
  maquinaNome: string;
  tecnicoNome: string;
  prestadoraNome: string;
  gestorNome: string;
  dados: Record<string, unknown>;
}

const LS_HISTORICO = 'sm_os_at_historico';
const LS_TECNICOS = 'sm_cad_tecnicos';
const LS_GESTORES = 'sm_cad_gestores';
const LS_PRESTADORAS = 'sm_cad_prestadoras';
const LS_MAQUINAS = 'sm_cad_maquinas';
const LS_EMAILS = 'sm_cad_emails_os';
const LS_WHATSAPP = 'sm_cad_whatsapp_os';

function gerarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function gerarNumero() {
  const cont = Number.parseInt(localStorage.getItem('sm_contador_os_at_pub') || '0', 10) + 1;
  localStorage.setItem('sm_contador_os_at_pub', String(cont));
  const h = new Date();
  return `OSAT-${h.getFullYear()}${String(h.getMonth() + 1).padStart(2, '0')}${String(h.getDate()).padStart(2, '0')}-${String(cont).padStart(4, '0')}`;
}

function loadList<T>(key: string): T[] { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveList<T>(key: string, list: T[]) { localStorage.setItem(key, JSON.stringify(list)); }

// ── Assinatura inline ──
const AssinaturaInline: React.FC<{ label: string; value: string | null; onChange: (v: string | null) => void }> = ({ label, value, onChange }) => {
  const [assinando, setAssinando] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const ultimo = useRef({ x: 0, y: 0 });
  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    if ('touches' in e) { const t = e.touches[0]; return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy }; }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }, []);
  const iniciar = useCallback((e: React.TouchEvent | React.MouseEvent) => { e.preventDefault(); desenhando.current = true; ultimo.current = getPos(e); }, [getPos]);
  const mover = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!desenhando.current) return; e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
    const pos = getPos(e); ctx.beginPath(); ctx.moveTo(ultimo.current.x, ultimo.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke(); ultimo.current = pos;
  }, [getPos]);
  const parar = useCallback(() => { desenhando.current = false; }, []);
  if (value) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <img src={value} alt={label} style={{ width: '100%', height: 60, objectFit: 'contain', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 6 }} />
      <div style={{ display: 'flex', gap: 4, width: '100%' }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', flex: 1, textAlign: 'center' }}>{label}</span>
        <button type="button" onClick={() => onChange(null)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>✕</button>
      </div>
    </div>
  );
  if (assinando) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <canvas ref={canvasRef} width={300} height={100} style={{ width: '100%', height: 60, border: '2px solid #4338ca', borderRadius: 6, touchAction: 'none', cursor: 'crosshair', background: '#fafafa' }}
        onMouseDown={iniciar} onMouseMove={mover} onMouseUp={parar} onMouseLeave={parar} onTouchStart={iniciar} onTouchMove={mover} onTouchEnd={parar} />
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" onClick={() => setAssinando(false)} style={{ flex: 1, fontSize: 9, padding: '3px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
        <button type="button" onClick={() => { const ctx = canvasRef.current?.getContext('2d'); if (ctx && canvasRef.current) { ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); } }} style={{ flex: 1, fontSize: 9, padding: '3px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}>Limpar</button>
        <button type="button" onClick={() => { if (canvasRef.current) { onChange(canvasRef.current.toDataURL('image/png')); setAssinando(false); } }} style={{ flex: 2, fontSize: 9, padding: '3px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>✓ OK</button>
      </div>
    </div>
  );
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button type="button" onClick={() => setAssinando(true)} style={{ width: '100%', height: 60, border: '2px dashed #d1d5db', borderRadius: 6, background: '#fafafa', cursor: 'pointer', fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>✍️ {label}</button>
    </div>
  );
};

// ── ConfigDropdown (cadastro reutilizável) ──
const ConfigDropdown: React.FC<{
  lsKey: string;
  campos: { key: string; label: string; placeholder: string }[];
  onSelect: (item: Record<string, string>) => void;
  currentValue?: string;
}> = ({ lsKey, campos, onSelect, currentValue }) => {
  const [aberto, setAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [novo, setNovo] = useState<Record<string, string>>({});
  const [lista, setLista] = useState<Record<string, string>[]>(() => loadList(lsKey));

  const salvar = () => {
    if (!novo[campos[0].key]?.trim()) return;
    const updated = [...lista, { ...novo }];
    saveList(lsKey, updated); setLista(updated); setNovo({}); setAdicionando(false);
  };
  const remover = (idx: number) => { const updated = lista.filter((_, i) => i !== idx); saveList(lsKey, updated); setLista(updated); };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button type="button" onClick={() => setAberto(!aberto)} title="Cadastrar / Selecionar"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2, opacity: 0.7 }}>⚙️</button>
      {aberto && (
        <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: '#fff', border: '2px solid #d97706', borderRadius: 12, padding: 12, minWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#92400e', textTransform: 'uppercase' }}>📋 Cadastrados</span>
            <button type="button" onClick={() => setAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          {lista.length === 0 && <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', marginBottom: 8 }}>Nenhum cadastrado.</div>}
          {lista.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, padding: '5px 8px', background: currentValue === item[campos[0].key] ? '#fef3c7' : '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}
              onClick={() => { onSelect(item); setAberto(false); }}>
              <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#374151' }}>{campos.map(c => item[c.key]).filter(Boolean).join(' · ')}</div>
              <button type="button" onClick={e => { e.stopPropagation(); remover(idx); }}
                style={{ background: '#fee2e2', border: 'none', borderRadius: 4, color: '#dc2626', fontSize: 10, fontWeight: 900, cursor: 'pointer', padding: '2px 6px' }}>✕</button>
            </div>
          ))}
          {!adicionando ? (
            <button type="button" onClick={() => setAdicionando(true)}
              style={{ marginTop: 6, width: '100%', padding: '6px 0', background: '#fffbeb', border: '1.5px dashed #d97706', borderRadius: 8, color: '#92400e', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>+ Cadastrar novo</button>
          ) : (
            <div style={{ marginTop: 8, background: '#fffbeb', borderRadius: 8, padding: 8, border: '1.5px solid #fde68a' }}>
              {campos.map(c => (
                <div key={c.key} style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: 9, fontWeight: 700, color: '#92400e' }}>{c.label}</label>
                  <input className={styles.campoInput} placeholder={c.placeholder} value={novo[c.key] || ''} onChange={e => setNovo({ ...novo, [c.key]: e.target.value })} style={{ fontSize: 11 }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button type="button" onClick={salvar} style={{ flex: 1, padding: '5px 0', background: '#16a34a', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>✓ Salvar</button>
                <button type="button" onClick={() => { setAdicionando(false); setNovo({}); }} style={{ flex: 1, padding: '5px 0', background: '#e5e7eb', border: 'none', borderRadius: 6, color: '#6b7280', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ══ PÁGINA PRINCIPAL ═════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════
type Tela = 'form' | 'historico' | 'visualizar';

const OSAssistenciaTecnicaPage: React.FC = () => {
  const [tela, setTela] = useState<Tela>('form');
  const [os, setOS] = useState<Record<string, unknown>>(() => ({ _tipo: 'os_assistencia_tecnica', numero: gerarNumero() }));
  const [historico, setHistorico] = useState<OSData[]>(() => loadList(LS_HISTORICO));
  const [visualizando, setVisualizando] = useState<OSData | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const { aberto: pinAberto, pedirPin, onSucesso: pinSucesso, onFechar: pinFechar } = usePin();

  const updateOS = (field: string, v: unknown) => setOS(prev => ({ ...prev, [field]: v }));

  // Materiais
  const itensMat: Array<{ descricao: string; qtd: string; preco: string; cotadoEm: string }> = (os.materiais as any) || [];
  const addMat = () => updateOS('materiais', [...itensMat, { descricao: '', qtd: '1', preco: '', cotadoEm: '' }]);
  const updateMat = (idx: number, field: string, v: string) => { const novo = [...itensMat]; novo[idx] = { ...novo[idx], [field]: v }; updateOS('materiais', novo); };
  const removeMat = (idx: number) => updateOS('materiais', itensMat.filter((_, i) => i !== idx));
  const totalMat = itensMat.reduce((acc, it) => acc + (Number.parseFloat(it.qtd || '0') * Number.parseFloat(it.preco || '0')), 0);
  const valorServico = Number.parseFloat((os.valorServico as string) || '0');
  const valorTotal = totalMat + valorServico;

  const salvarOS = () => {
    const entry: OSData = {
      id: gerarId(),
      numero: (os.numero as string) || '',
      criadoEm: Date.now(),
      status: (os.status as string) || 'Aguardando',
      prioridade: (os.prioridade as string) || '',
      maquinaNome: (os.maquinaNome as string) || '',
      tecnicoNome: (os.tecnicoNome as string) || '',
      prestadoraNome: (os.prestadoraNome as string) || '',
      gestorNome: (os.gestorNome as string) || '',
      dados: { ...os },
    };
    const updated = [entry, ...historico];
    saveList(LS_HISTORICO, updated);
    setHistorico(updated);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  const novoFormulario = () => {
    setOS({ _tipo: 'os_assistencia_tecnica', numero: gerarNumero() });
    setSalvo(false);
    setTela('form');
  };

  const excluirHistorico = (id: string) => {
    const updated = historico.filter(h => h.id !== id);
    saveList(LS_HISTORICO, updated);
    setHistorico(updated);
    if (visualizando?.id === id) { setVisualizando(null); setTela('historico'); }
  };

  const abrirHistorico = (item: OSData) => {
    setVisualizando(item);
    setTela('visualizar');
  };

  const editarHistorico = (item: OSData) => {
    setOS({ ...item.dados });
    setTela('form');
  };

  const copiarLink = () => {
    const url = globalThis.location.origin + '/os-assistencia-tecnica';
    navigator.clipboard.writeText(url).then(() => { setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2000); }).catch(() => { });
  };

  const resumoOS = (d: Record<string, unknown> = os) => {
    const linhas = [`O.S Assistência Técnica — Nº ${String(d.numero || '...')}`, ''];
    if (d.maquinaNome) linhas.push(`Máquina: ${String(d.maquinaNome)} (${String(d.maquinaCodigo || '-')})`);
    if (d.tecnicoNome) linhas.push(`Técnico: ${String(d.tecnicoNome)}`);
    if (d.tecnicoDescricao) linhas.push(`Descrição: ${String(d.tecnicoDescricao)}`);
    if (d.prestadoraNome) linhas.push(`Prestadora: ${String(d.prestadoraNome)} — CNPJ: ${String(d.prestadoraCnpj || '-')}`);
    if (d.prazoData) linhas.push(`Prazo: ${String(d.prazoData)}`);
    if (d.gestorNome) linhas.push(`Gestor: ${String(d.gestorNome)} (${String(d.gestorCargo || '-')})`);
    if (d.status) linhas.push(`Status: ${String(d.status)}`);
    if (d.prioridade) linhas.push(`Prioridade: ${d.prioridade}`);
    return linhas.join('\n');
  };

  const resumoWA = (d: Record<string, unknown> = os) => {
    return resumoOS(d).replace(/^(.+)/gm, (_, l) => {
      if (l.includes(':')) { const [k, ...v] = l.split(':'); return `*${k}:*${v.join(':')}`; }
      return `*${l}*`;
    });
  };

  const secTitle = (icon: string, txt: string) => (
    <div style={{ fontSize: 11, fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: '2px solid #fde68a', paddingBottom: 4, marginBottom: 8 }}>{icon} {txt}</div>
  );
  const fieldLbl = (txt: string) => (
    <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 3 }}>{txt}</label>
  );

  // ── TELA: VISUALIZAR HISTÓRICO ──
  if (tela === 'visualizar' && visualizando) {
    const d = visualizando.dados as Record<string, any>;
    const mat = (d.materiais as Array<{ descricao: string; qtd: string; preco: string; cotadoEm: string }>) || [];
    const tmMat = mat.reduce((a, i) => a + Number.parseFloat(i.qtd || '0') * Number.parseFloat(i.preco || '0'), 0);
    const vs = Number.parseFloat((d.valorServico as string) || '0');
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <button onClick={() => setTela('historico')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#d97706', marginBottom: 12 }}>← Voltar ao Histórico</button>
          <div style={{ border: '2px solid #d97706', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
            <div style={{ background: 'linear-gradient(135deg,#d97706,#92400e)', color: '#fff', padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>🛠️ ORDEM DE SERVIÇO</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>ASSISTÊNCIA TÉCNICA</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, fontFamily: 'monospace', fontWeight: 700 }}>Nº {d.numero as string}</div>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {d.maquinaNome && <div style={{ background: '#fffbeb', borderRadius: 8, padding: '8px 12px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#b45309', textTransform: 'uppercase' }}>🖥️ Máquina</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{d.maquinaNome as string} {d.maquinaCodigo ? `(${d.maquinaCodigo})` : ''}</div>
                {d.maquinaDescricao && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{d.maquinaDescricao as string}</div>}
              </div>}
              {d.tecnicoNome && <div style={{ background: '#f0f4ff', borderRadius: 8, padding: '8px 12px', border: '1px solid #c7d2fe' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#1e40af', textTransform: 'uppercase' }}>👷 Técnico</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{d.tecnicoNome as string}</div>
                {d.tecnicoDescricao && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{d.tecnicoDescricao as string}</div>}
              </div>}
              {d.avaliacaoTerceirizada && <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 12px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#b45309', textTransform: 'uppercase' }}>📋 Avaliação Terceirizada</div>
                <div style={{ fontSize: 11, color: '#374151' }}>{d.avaliacaoTerceirizada as string}</div>
              </div>}
              {mat.length > 0 && <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#16a34a', textTransform: 'uppercase' }}>🛒 Materiais</div>
                {mat.map((m, i) => <div key={i} style={{ fontSize: 11, color: '#374151' }}>• {m.descricao} — Qtd: {m.qtd} — R$ {m.preco} — Cotado: {m.cotadoEm}</div>)}
                <div style={{ fontSize: 12, fontWeight: 900, color: '#15803d', marginTop: 4 }}>Total Materiais: R$ {tmMat.toFixed(2)}</div>
              </div>}
              {d.prestadoraNome && <div style={{ background: '#faf5ff', borderRadius: 8, padding: '8px 12px', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase' }}>🏢 Prestadora</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{d.prestadoraNome as string} — {d.prestadoraCnpj as string || '-'}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{d.prestadoraEmail as string || ''} {d.prestadoraWhatsapp ? `| ${d.prestadoraWhatsapp}` : ''}</div>
              </div>}
              {d.prazoData && <div style={{ fontSize: 11 }}><strong>📅 Prazo:</strong> {d.prazoData as string} {d.prazoObs ? `(${d.prazoObs})` : ''}</div>}
              {d.gestorNome && <div style={{ fontSize: 11 }}><strong>✅ Gestor:</strong> {d.gestorNome as string} {d.gestorCargo ? `(${d.gestorCargo})` : ''}</div>}
              {(vs > 0 || tmMat > 0) && <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace', color: '#16a34a' }}>R$ {(vs + tmMat).toFixed(2)}</div>
              </div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {d.status && <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #e2e8f0' }}>Status: {d.status as string}</div>}
                {d.prioridade && <div style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #e2e8f0' }}>Prioridade: {d.prioridade as string}</div>}
              </div>
            </div>
          </div>
          {/* Ações */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => pedirPin(() => editarHistorico(visualizando))} style={{ flex: 1, padding: '10px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Edit3 size={14} /> Editar</button>
            <a href={`mailto:?subject=${encodeURIComponent(`O.S Nº ${d.numero}`)}&body=${encodeURIComponent(resumoOS(d))}`} style={{ flex: 1, padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>📧 E-mail</a>
            <a href={`https://wa.me/?text=${encodeURIComponent(resumoWA(d))}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>💬 WhatsApp</a>
          </div>
        </div>
      </div>
    );
  }

  // ── TELA: HISTÓRICO ──
  if (tela === 'historico') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#92400e' }}>📋 Histórico de O.S</h2>
            <button onClick={() => setTela('form')} style={{ padding: '8px 16px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>← Formulário</button>
          </div>
          {historico.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              <div style={{ fontSize: 48 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma O.S salva ainda.</div>
            </div>
          ) : historico.map(item => (
            <div key={item.id} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#92400e', fontFamily: 'monospace' }}>{item.numero}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(item.criadoEm).toLocaleString('pt-BR')}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {item.status && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: item.status === 'Concluído' ? '#dcfce7' : item.status === 'Cancelado' ? '#fee2e2' : '#fef3c7', color: item.status === 'Concluído' ? '#15803d' : item.status === 'Cancelado' ? '#dc2626' : '#92400e' }}>{item.status}</span>}
                  {item.prioridade && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#f3f4f6', color: '#374151' }}>{item.prioridade}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: 11, color: '#374151' }}>
                {item.maquinaNome && <span>🖥️ {item.maquinaNome}</span>}
                {item.tecnicoNome && <span>👷 {item.tecnicoNome}</span>}
                {item.prestadoraNome && <span>🏢 {item.prestadoraNome}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={() => abrirHistorico(item)} style={{ flex: 1, padding: '7px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Eye size={13} /> Ver</button>
                <button onClick={() => pedirPin(() => editarHistorico(item))} style={{ flex: 1, padding: '7px 0', background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Edit3 size={13} /> Editar</button>
                <button onClick={() => pedirPin(() => excluirHistorico(item.id))} style={{ padding: '7px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── TELA: FORMULÁRIO ──
  const foneNum = ((os.enviarWhatsapp as string) || '').replace(/\D/g, '');
  const fone55 = foneNum.length > 0 && !foneNum.startsWith('55') ? '55' + foneNum : foneNum;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '16px 16px 100px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Barra de topo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28 }}>🛠️</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#92400e' }}>O.S Assistência Técnica</div>
              <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{os.numero as string}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={copiarLink} title="Copiar link" style={{ padding: '6px 12px', background: linkCopiado ? '#dcfce7' : '#f3f4f6', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: linkCopiado ? '#15803d' : '#374151' }}>
              <Share2 size={13} /> {linkCopiado ? 'Copiado!' : 'Link'}
            </button>
            <button onClick={() => setTela('historico')} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#374151' }}>
              <Clock size={13} /> Histórico ({historico.length})
            </button>
          </div>
        </div>

        {/* Notificação salvo */}
        {salvo && <div style={{ background: '#dcfce7', border: '2px solid #86efac', borderRadius: 10, padding: '10px 16px', marginBottom: 12, textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#15803d' }}>✅ O.S salva com sucesso!</div>}

        {/* Formulário */}
        <div style={{ border: '2px solid #d97706', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
          <div style={{ background: 'linear-gradient(135deg,#d97706,#92400e)', color: '#fff', padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>🛠️ ORDEM DE SERVIÇO</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>ASSISTÊNCIA TÉCNICA</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, fontFamily: 'monospace', fontWeight: 700 }}>Nº {os.numero as string}</div>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 1 — MÁQUINA */}
            <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {secTitle('🖥️', '1 — Máquina / Equipamento')}
                <ConfigDropdown lsKey={LS_MAQUINAS} campos={[{ key: 'nome', label: 'Nome', placeholder: 'Ex: Compressor...' }, { key: 'codigo', label: 'Código', placeholder: 'EQ-0042' }]} currentValue={os.maquinaNome as string} onSelect={item => { updateOS('maquinaNome', item.nome); updateOS('maquinaCodigo', item.codigo); }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>{fieldLbl('Nome da Máquina')}<input className={styles.campoInput} placeholder="Ex: Compressor..." value={(os.maquinaNome as string) || ''} onChange={e => updateOS('maquinaNome', e.target.value)} /></div>
                <div>{fieldLbl('Código / Patrimônio')}<input className={styles.campoInput} placeholder="EQ-0042" value={(os.maquinaCodigo as string) || ''} onChange={e => updateOS('maquinaCodigo', e.target.value)} /></div>
              </div>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>{fieldLbl('Modelo')}<input className={styles.campoInput} placeholder="Ex: Split 12000 BTUs..." value={(os.maquinaModelo as string) || ''} onChange={e => updateOS('maquinaModelo', e.target.value)} /></div>
                <div>{fieldLbl('Marca')}<input className={styles.campoInput} placeholder="Ex: Samsung, Bosch..." value={(os.maquinaMarca as string) || ''} onChange={e => updateOS('maquinaMarca', e.target.value)} /></div>
                <div>{fieldLbl('Localização')}<input className={styles.campoInput} placeholder="Ex: Bloco A, 2º andar..." value={(os.maquinaLocalizacao as string) || ''} onChange={e => updateOS('maquinaLocalizacao', e.target.value)} /></div>
              </div>
            </div>

            {/* 2 — TÉCNICO */}
            <div style={{ background: '#f0f4ff', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #c7d2fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {secTitle('👷', '2 — Técnico do Chamado')}
                <ConfigDropdown lsKey={LS_TECNICOS} campos={[{ key: 'nome', label: 'Nome', placeholder: 'Nome completo...' }]} currentValue={os.tecnicoNome as string} onSelect={item => updateOS('tecnicoNome', item.nome)} />
              </div>
              <div>{fieldLbl('Nome do Técnico')}<input className={styles.campoInput} placeholder="Nome do técnico..." value={(os.tecnicoNome as string) || ''} onChange={e => updateOS('tecnicoNome', e.target.value)} /></div>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  {fieldLbl('Descrição do Problema / Serviço')}
                  <MicButton onResult={t => updateOS('tecnicoDescricao', ((os.tecnicoDescricao as string) || '') + ((os.tecnicoDescricao as string) ? ' ' : '') + t)} />
                </div>
                <textarea className={styles.campoInput} rows={3} placeholder="Descreva o problema..." value={(os.tecnicoDescricao as string) || ''} onChange={e => updateOS('tecnicoDescricao', e.target.value)} />
              </div>
            </div>

            {/* 3 — AVALIAÇÃO TERCEIRIZADA */}
            <div style={{ background: '#fef3c7', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #fde68a' }}>
              {secTitle('📋', '3 — Avaliação de Técnico Terceirizado')}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                {fieldLbl('Parecer / Laudo Técnico')}
                <MicButton onResult={t => updateOS('avaliacaoTerceirizada', ((os.avaliacaoTerceirizada as string) || '') + ((os.avaliacaoTerceirizada as string) ? ' ' : '') + t)} />
              </div>
              <textarea className={styles.campoInput} rows={3} placeholder="Diagnóstico e parecer..." value={(os.avaliacaoTerceirizada as string) || ''} onChange={e => updateOS('avaliacaoTerceirizada', e.target.value)} />
            </div>

            {/* 4 — COMPRA DE MATERIAL */}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #bbf7d0' }}>
              {secTitle('🛒', '4 — Compra de Material')}
              <div style={{ marginBottom: 10 }}>
                {fieldLbl('Necessita compra de material?')}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {['Sim', 'Não'].map(opt => (
                    <button key={opt} type="button" onClick={() => updateOS('compraMaterial', opt)}
                      style={{ padding: '6px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, border: (os.compraMaterial as string) === opt ? '2px solid #16a34a' : '2px solid #d1d5db', background: (os.compraMaterial as string) === opt ? '#dcfce7' : '#fff', color: (os.compraMaterial as string) === opt ? '#15803d' : '#6b7280', cursor: 'pointer' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {(os.compraMaterial as string) === 'Sim' && (
                <>
                  {itensMat.map((it, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 30px', gap: 6, marginBottom: 6, alignItems: 'end' }}>
                      <div>{fieldLbl('Descrição')}<input className={styles.campoInput} placeholder="Material..." value={it.descricao} onChange={e => updateMat(idx, 'descricao', e.target.value)} /></div>
                      <div>{fieldLbl('Qtd')}<input className={styles.campoInput} type="number" min={1} value={it.qtd} onChange={e => updateMat(idx, 'qtd', e.target.value)} /></div>
                      <div>{fieldLbl('Preço (R$)')}<input className={styles.campoInput} type="number" min={0} step={0.01} value={it.preco} onChange={e => updateMat(idx, 'preco', e.target.value)} /></div>
                      <div>{fieldLbl('Onde cotou')}<input className={styles.campoInput} placeholder="Loja..." value={it.cotadoEm} onChange={e => updateMat(idx, 'cotadoEm', e.target.value)} /></div>
                      <button type="button" onClick={() => removeMat(idx)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, color: '#dc2626', fontWeight: 900, cursor: 'pointer', height: 32 }}>✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addMat} style={{ background: '#dcfce7', border: '1.5px dashed #16a34a', borderRadius: 8, padding: '6px 14px', color: '#15803d', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%' }}>+ Adicionar Material</button>
                  {totalMat > 0 && <div style={{ textAlign: 'right', fontWeight: 900, fontSize: 13, color: '#15803d', marginTop: 6 }}>Total Materiais: R$ {totalMat.toFixed(2)}</div>}
                </>
              )}
            </div>

            {/* 5 — PRESTADORA */}
            <div style={{ background: '#faf5ff', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e9d5ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {secTitle('🏢', '5 — Prestadora de Serviço')}
                <ConfigDropdown lsKey={LS_PRESTADORAS}
                  campos={[{ key: 'nome', label: 'Nome', placeholder: 'Empresa...' }, { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' }, { key: 'email', label: 'E-mail', placeholder: 'contato@empresa.com' }, { key: 'whatsapp', label: 'WhatsApp', placeholder: '(00) 00000-0000' }]}
                  currentValue={os.prestadoraNome as string}
                  onSelect={item => { updateOS('prestadoraNome', item.nome); updateOS('prestadoraCnpj', item.cnpj); updateOS('prestadoraEmail', item.email); updateOS('prestadoraWhatsapp', item.whatsapp); }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>{fieldLbl('Nome / Razão Social')}<input className={styles.campoInput} placeholder="Empresa..." value={(os.prestadoraNome as string) || ''} onChange={e => updateOS('prestadoraNome', e.target.value)} /></div>
                <div>{fieldLbl('CNPJ')}<input className={styles.campoInput} placeholder="00.000.000/0000-00" value={(os.prestadoraCnpj as string) || ''} onChange={e => updateOS('prestadoraCnpj', e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div>{fieldLbl('E-mail')}<input className={styles.campoInput} type="email" placeholder="contato@empresa.com" value={(os.prestadoraEmail as string) || ''} onChange={e => updateOS('prestadoraEmail', e.target.value)} /></div>
                <div>{fieldLbl('WhatsApp')}<input className={styles.campoInput} placeholder="(00) 00000-0000" value={(os.prestadoraWhatsapp as string) || ''} onChange={e => updateOS('prestadoraWhatsapp', e.target.value)} /></div>
              </div>
            </div>

            {/* 6 — PRAZO */}
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #fed7aa' }}>
              {secTitle('📅', '6 — Prazo para Conclusão')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>{fieldLbl('Data Limite')}<input className={styles.campoInput} type="date" value={(os.prazoData as string) || ''} onChange={e => updateOS('prazoData', e.target.value)} /></div>
                <div>{fieldLbl('Observação')}<input className={styles.campoInput} placeholder="Ex: dias úteis..." value={(os.prazoObs as string) || ''} onChange={e => updateOS('prazoObs', e.target.value)} /></div>
              </div>
            </div>

            {/* 7 — GESTOR */}
            <div style={{ background: '#f0f4ff', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #c7d2fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {secTitle('✅', '7 — Gestor que Valida a O.S')}
                <ConfigDropdown lsKey={LS_GESTORES} campos={[{ key: 'nome', label: 'Nome', placeholder: 'Nome...' }, { key: 'cargo', label: 'Cargo', placeholder: 'Gerente...' }]} currentValue={os.gestorNome as string} onSelect={item => { updateOS('gestorNome', item.nome); updateOS('gestorCargo', item.cargo); }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>{fieldLbl('Nome do Gestor')}<input className={styles.campoInput} placeholder="Nome..." value={(os.gestorNome as string) || ''} onChange={e => updateOS('gestorNome', e.target.value)} /></div>
                <div>{fieldLbl('Cargo')}<input className={styles.campoInput} placeholder="Gerente, Supervisor..." value={(os.gestorCargo as string) || ''} onChange={e => updateOS('gestorCargo', e.target.value)} /></div>
              </div>
            </div>

            {/* 8 — VALOR */}
            <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              {secTitle('💰', '8 — Valor do Serviço')}
              {fieldLbl('Valor do Serviço (R$)')}
              <input className={styles.campoInput} type="number" min={0} step={0.01} placeholder="0,00" value={(os.valorServico as string) || ''} onChange={e => updateOS('valorServico', e.target.value)} style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', textAlign: 'center', border: '2px solid #86efac' }} />
              {valorTotal > 0 && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 900, color: '#15803d' }}>💰 Total (Serviço + Material): R$ {valorTotal.toFixed(2)}</div>}
            </div>

            {/* 9 — STATUS E PRIORIDADE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e2e8f0' }}>
                {fieldLbl('Status')}
                <select className={styles.campoInput} value={(os.status as string) || ''} onChange={e => updateOS('status', e.target.value)} style={{ fontWeight: 700 }}>
                  <option value="">Selecione...</option>
                  <option value="Aguardando">⏳ Aguardando</option>
                  <option value="Em andamento">🔄 Em andamento</option>
                  <option value="Aguardando peça">📦 Aguardando peça</option>
                  <option value="Concluído">✅ Concluído</option>
                  <option value="Cancelado">❌ Cancelado</option>
                </select>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e2e8f0' }}>
                {fieldLbl('Prioridade')}
                <select className={styles.campoInput} value={(os.prioridade as string) || ''} onChange={e => updateOS('prioridade', e.target.value)} style={{ fontWeight: 700 }}>
                  <option value="">Selecione...</option>
                  <option value="Baixa">🟢 Baixa</option>
                  <option value="Média">🟡 Média</option>
                  <option value="Alta">🟠 Alta</option>
                  <option value="Urgente">🔴 Urgente</option>
                </select>
              </div>
            </div>

            {/* ASSINATURAS */}
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e5e7eb' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' }}>✍️ Assinaturas</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <AssinaturaInline label="Gestor" value={(os.assinaturaGestor as string) || null} onChange={v => updateOS('assinaturaGestor', v)} />
                <AssinaturaInline label="Técnico" value={(os.assinaturaTecnico as string) || null} onChange={v => updateOS('assinaturaTecnico', v)} />
              </div>
            </div>

            {/* 10 — E-MAIL */}
            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {secTitle('📧', '10 — Enviar por E-mail')}
                <ConfigDropdown lsKey={LS_EMAILS} campos={[{ key: 'nome', label: 'Nome', placeholder: 'Destinatário...' }, { key: 'email', label: 'E-mail', placeholder: 'email@exemplo.com' }]} currentValue={os.enviarEmail as string} onSelect={item => updateOS('enviarEmail', item.email)} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  {fieldLbl('E-mail do destinatário')}
                  <input className={styles.campoInput} type="email" placeholder="email@exemplo.com" value={(os.enviarEmail as string) || ''} onChange={e => updateOS('enviarEmail', e.target.value)} />
                </div>
                <a href={(os.enviarEmail as string) ? `mailto:${encodeURIComponent((os.enviarEmail as string))}?subject=${encodeURIComponent(`O.S Assistência Técnica — Nº ${os.numero}`)}&body=${encodeURIComponent(resumoOS())}` : '#'}
                  onClick={e => { if (!(os.enviarEmail as string)) e.preventDefault(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: (os.enviarEmail as string) ? '#2563eb' : '#9ca3af', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap', height: 36, cursor: (os.enviarEmail as string) ? 'pointer' : 'not-allowed' }}>
                  📧 Enviar
                </a>
              </div>
            </div>

            {/* 11 — WHATSAPP */}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {secTitle('💬', '11 — Enviar por WhatsApp')}
                <ConfigDropdown lsKey={LS_WHATSAPP} campos={[{ key: 'nome', label: 'Nome', placeholder: 'Contato...' }, { key: 'telefone', label: 'WhatsApp', placeholder: '(00) 00000-0000' }]} currentValue={os.enviarWhatsapp as string} onSelect={item => updateOS('enviarWhatsapp', item.telefone)} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  {fieldLbl('Número do WhatsApp')}
                  <input className={styles.campoInput} placeholder="(00) 00000-0000" value={(os.enviarWhatsapp as string) || ''} onChange={e => updateOS('enviarWhatsapp', e.target.value)} />
                </div>
                <a href={fone55 ? `https://wa.me/${fone55}?text=${encodeURIComponent(resumoWA())}` : '#'}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => { if (!fone55) e.preventDefault(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: fone55 ? '#16a34a' : '#9ca3af', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap', height: 36, cursor: fone55 ? 'pointer' : 'not-allowed' }}>
                  💬 Enviar
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Barra de ações fixa */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '2px solid #e5e7eb', padding: '10px 16px', display: 'flex', gap: 8, justifyContent: 'center', zIndex: 50 }}>
          <button onClick={salvarOS} style={{ flex: 1, maxWidth: 200, padding: '12px 0', background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={16} /> Salvar O.S
          </button>
          <button onClick={novoFormulario} style={{ flex: 1, maxWidth: 200, padding: '12px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={16} /> Nova O.S
          </button>
          <button onClick={() => setTela('historico')} style={{ flex: 1, maxWidth: 200, padding: '12px 0', background: '#374151', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Clock size={16} /> Histórico
          </button>
        </div>

      </div>

      <PinModal aberto={pinAberto} onSucesso={pinSucesso} onFechar={pinFechar} />

    </div>
  );
};

export default OSAssistenciaTecnicaPage;
