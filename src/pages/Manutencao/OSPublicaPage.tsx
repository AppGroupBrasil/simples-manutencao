import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { OS_MODELOS_SHARE } from './constants';
import type { OSCampoShare, OSModeloShare } from './constants';

/* Print CSS — hide action buttons when printing */
const printStyle = document.createElement('style');
printStyle.textContent = `@media print { .no-print { display: none !important; } }`;
if (!document.head.querySelector('[data-os-print]')) {
  printStyle.setAttribute('data-os-print', '1');
  document.head.appendChild(printStyle);
}

function gerarProtocolo(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return String(num);
}

interface OSRegistro {
  id: string;
  numero: string;
  protocolo: string;
  criadoEm: number;
  modelo: string;
  dados: Record<string, string>;
}

/* ─── ASSINATURA PAD (module-level) ──────────────────────── */
const AssinaturaPad: React.FC<{
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  cor: string;
}> = ({ value, onChange, readOnly, cor }) => {
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
    onChange?.(canvasRef.current.toDataURL('image/png'));
    setAssinando(false);
  }, [onChange]);

  if (readOnly) {
    if (value) return <img src={value} alt="Assinatura" style={{ width: '100%', height: 80, objectFit: 'contain', background: '#fafafa', border: '1.5px solid #e4e4e7', borderRadius: 10 }} />;
    return <div style={{ width: '100%', height: 60, background: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>Sem assinatura</div>;
  }

  if (value) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <img src={value} alt="Assinatura" style={{ width: '100%', height: 80, objectFit: 'contain', background: '#fafafa', border: '1.5px solid #e4e4e7', borderRadius: 10 }} />
      <button type="button" onClick={() => onChange?.('')} style={{ padding: 6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
        ✕ Limpar assinatura
      </button>
    </div>
  );

  if (assinando) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ position: 'relative', width: '100%', background: '#fafafa', border: `2px solid ${cor}`, borderRadius: 10, overflow: 'hidden' }}>
        <canvas ref={canvasRef} width={400} height={140}
          style={{ width: '100%', height: 100, touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={iniciar} onMouseMove={mover} onMouseUp={parar} onMouseLeave={parar}
          onTouchStart={iniciar} onTouchMove={mover} onTouchEnd={parar}
        />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" onClick={limpar} style={{ flex: 1, padding: 6, background: '#f3f4f6', color: '#374151', border: '1.5px solid #e4e4e7', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Limpar</button>
        <button type="button" onClick={() => setAssinando(false)} style={{ flex: 1, padding: 6, background: '#f3f4f6', color: '#374151', border: '1.5px solid #e4e4e7', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
        <button type="button" onClick={confirmar} style={{ flex: 2, padding: 6, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>✓ Confirmar</button>
      </div>
    </div>
  );

  return (
    <button type="button" onClick={() => setAssinando(true)}
      style={{ width: '100%', padding: '12px 0', background: '#fafafa', border: `2px dashed ${cor}`, borderRadius: 10, color: cor, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      ✍️ Toque para assinar
    </button>
  );
};

export default function OSPublicaPage() {
  const { modelo } = useParams<{ modelo: string }>();
  const [searchParams] = useSearchParams();

  const modeloDef = modelo ? OS_MODELOS_SHARE[modelo] : undefined;

  // Load pre-filled data from localStorage via ?id= param
  const dadosIniciais = React.useMemo<Record<string, string>>(() => {
    const shareId = searchParams.get('id') || '';
    if (!shareId) return {};
    try {
      const raw = localStorage.getItem(`sm_os_share_${shareId}`);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed?.dados && typeof parsed.dados === 'object') {
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed.dados)) {
          if (typeof v === 'string') result[k] = v;
        }
        return result;
      }
    } catch { /* ignore invalid */ }
    return {};
  }, [searchParams]);

  const lsHistorico = `sm_os_pub_${modelo}_historico`;
  const lsRascunho = `sm_os_pub_${modelo}_rascunho`;

  const [tela, setTela] = useState<'form' | 'historico' | 'ver'>('form');
  const [os, setOs] = useState<Record<string, string>>(() => {
    // Priority: shared data > saved draft
    if (Object.keys(dadosIniciais).length > 0) return { ...dadosIniciais };
    try {
      const draft = localStorage.getItem(lsRascunho);
      if (draft) return JSON.parse(draft);
    } catch { /* ok */ }
    return {};
  });
  const [historico, setHistorico] = useState<OSRegistro[]>([]);
  const [verItem, setVerItem] = useState<OSRegistro | null>(null);
  const [salvoMsg, setSalvoMsg] = useState<string>('');
  const [busca, setBusca] = useState('');

  const campos = modeloDef?.campos || [];
  const grupos = React.useMemo(() => {
    return campos.reduce<Record<string, OSCampoShare[]>>((acc, c) => {
      const g = c.grupo || 'Outros';
      if (!acc[g]) acc[g] = [];
      acc[g].push(c);
      return acc;
    }, {});
  }, [campos]);

  useEffect(() => {
    try { setHistorico(JSON.parse(localStorage.getItem(lsHistorico) || '[]')); } catch { /* ok */ }
  }, [lsHistorico]);

  useEffect(() => {
    if (modeloDef && !os.numero) {
      setOs(prev => ({ ...prev, numero: prev.numero || gerarProtocolo() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!modeloDef]);

  // Auto-save draft on every change
  useEffect(() => {
    if (Object.keys(os).length > 0) {
      try { localStorage.setItem(lsRascunho, JSON.stringify(os)); } catch { /* quota */ }
    }
  }, [os, lsRascunho]);

  if (!modeloDef) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>Modelo não encontrado</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>O tipo de O.S &quot;{modelo}&quot; não existe.</p>
        </div>
      </div>
    );
  }

  const isEditable = (_key: string) => true;

  const update = (key: string, val: string) => setOs(prev => ({ ...prev, [key]: val }));

  const salvar = () => {
    const protocolo = os.numero || gerarProtocolo();
    const reg: OSRegistro = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      numero: protocolo,
      protocolo,
      criadoEm: Date.now(),
      modelo: modelo || '',
      dados: { ...os },
    };
    const updated = [reg, ...historico];
    try {
      localStorage.setItem(lsHistorico, JSON.stringify(updated));
      setHistorico(updated);
      setSalvoMsg('ok');
      setTimeout(() => setSalvoMsg(''), 2500);
    } catch {
      // Probably quota exceeded — try saving without base64 signatures
      try {
        const slim: Record<string, string> = {};
        for (const [k, v] of Object.entries(os)) {
          slim[k] = v?.startsWith('data:image') ? '(assinatura salva localmente)' : v;
        }
        const regSlim = { ...reg, dados: slim };
        const updSlim = [regSlim, ...historico];
        localStorage.setItem(lsHistorico, JSON.stringify(updSlim));
        setHistorico(updSlim);
        setSalvoMsg('ok');
        setTimeout(() => setSalvoMsg(''), 2500);
      } catch {
        setSalvoMsg('erro');
        setTimeout(() => setSalvoMsg(''), 3000);
      }
    }
  };

  const novo = () => {
    if (!modeloDef) return;
    setOs({ numero: gerarProtocolo() });
    try { localStorage.removeItem(lsRascunho); } catch { /* ok */ }
    setTela('form');
  };

  const imprimir = () => window.print();

  const renderField = (c: OSCampoShare, data: Record<string, string>, onChange?: (key: string, val: string) => void) => {
    const readOnly = onChange ? !isEditable(c.key) : true;
    const val = data[c.key] || '';
    const base: React.CSSProperties = {
      width: '100%', padding: '8px 10px',
      border: readOnly ? '1.5px solid #e5e7eb' : `1.5px solid ${modeloDef.cor}`,
      borderRadius: 8, fontSize: 13, fontWeight: 600,
      background: readOnly ? '#f9fafb' : '#fff',
      color: readOnly ? '#9ca3af' : '#111827',
      outline: 'none', fontFamily: 'inherit',
    };
    if (c.tipo === 'select') {
      return (
        <select style={{ ...base, fontWeight: 700 }} value={val} disabled={readOnly}
          onChange={e => onChange?.(c.key, e.target.value)}>
          <option value="">Selecione...</option>
          {(c.opcoes || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (c.tipo === 'textarea') {
      return (
        <textarea style={{ ...base, resize: 'vertical' }} rows={3}
          placeholder={readOnly ? '' : (c.placeholder || '')}
          value={val} readOnly={readOnly}
          onChange={e => onChange?.(c.key, e.target.value)} />
      );
    }
    if (c.tipo === 'signature') {
      return <AssinaturaPad value={val} onChange={onChange ? v => onChange(c.key, v) : undefined} readOnly={readOnly} cor={modeloDef.cor} />;
    }
    return (
      <input style={base} type={c.tipo || 'text'}
        placeholder={readOnly ? '' : (c.placeholder || '')}
        value={val} readOnly={readOnly}
        onChange={e => onChange?.(c.key, e.target.value)} />
    );
  };

  const renderFieldView = (c: OSCampoShare, data: Record<string, string>) => {
    const val = data[c.key] || '';
    if (c.tipo === 'signature') {
      if (val && val.startsWith('data:image')) {
        return <img src={val} alt={c.label} style={{ width: '100%', height: 80, objectFit: 'contain', background: '#fafafa', border: '1.5px solid #e4e4e7', borderRadius: 10 }} />;
      }
      return <div style={{ width: '100%', height: 50, background: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>Sem assinatura</div>;
    }
    return <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', padding: '6px 0', wordBreak: 'break-word' }}>{val || <span style={{ color: '#d1d5db' }}>—</span>}</div>;
  };

  /* ─── VER ITEM SALVO ───────────────────────────────────── */
  if (tela === 'ver' && verItem) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button type="button" onClick={() => setTela('historico')}
              style={{ padding: '6px 14px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              ← Voltar
            </button>
            <button type="button" onClick={imprimir}
              style={{ padding: '6px 14px', background: modeloDef.cor, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              🖨️ Imprimir
            </button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: `2px solid ${modeloDef.cor}` }}>
            <div style={{ background: `linear-gradient(135deg,${modeloDef.cor},${modeloDef.cor}dd)`, color: '#fff', padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>{modeloDef.icone} {modeloDef.titulo}</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{modeloDef.subtitulo}</div>
              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6, fontFamily: 'monospace', letterSpacing: 3 }}>Protocolo: {verItem.protocolo || verItem.numero}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{new Date(verItem.criadoEm).toLocaleString('pt-BR')}</div>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(grupos).map(([grupo, grpCampos]) => (
                <div key={grupo} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: modeloDef.cor, textTransform: 'uppercase', marginBottom: 6 }}>{grupo}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {grpCampos.map(c => (
                      <div key={c.key}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 2 }}>{c.label}</label>
                        {renderFieldView(c, verItem.dados)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── HISTÓRICO ─────────────────────────────────────────── */
  if (tela === 'historico') {
    const filtrado = busca.trim()
      ? historico.filter(h => {
          const q = busca.trim().toLowerCase();
          return (h.protocolo || h.numero || '').toLowerCase().includes(q)
            || new Date(h.criadoEm).toLocaleString('pt-BR').includes(q)
            || Object.values(h.dados).some(v => v?.toLowerCase().includes(q));
        })
      : historico;

    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: 0 }}>📁 Histórico</h2>
            <button type="button" onClick={novo}
              style={{ padding: '8px 16px', background: modeloDef.cor, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              + Nova O.S
            </button>
          </div>
          {/* Busca */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="🔍 Buscar por protocolo, data ou conteúdo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${modeloDef.cor}`, borderRadius: 10, fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
            />
          </div>
          {filtrado.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
              {busca.trim() ? 'Nenhum resultado encontrado.' : 'Nenhuma O.S salva ainda.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtrado.map(h => (
                <button key={h.id} type="button"
                  onClick={() => { setVerItem(h); setTela('ver'); }}
                  style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1.5px solid #e5e7eb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', fontFamily: 'monospace', letterSpacing: 2 }}>#{h.protocolo || h.numero}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(h.criadoEm).toLocaleString('pt-BR')}</div>
                  </div>
                  <span style={{ fontSize: 20, color: '#9ca3af' }}>→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── FORMULÁRIO ────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: `2px solid ${modeloDef.cor}` }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg,${modeloDef.cor},${modeloDef.cor}dd)`, color: '#fff', padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>{modeloDef.icone} {modeloDef.titulo}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{modeloDef.subtitulo}</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6, fontFamily: 'monospace', letterSpacing: 3 }}>Protocolo: {os.numero || '...'}</div>
          </div>

          {/* Campos */}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(grupos).map(([grupo, grpCampos]) => (
              <div key={grupo} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: modeloDef.cor, textTransform: 'uppercase', marginBottom: 6 }}>{grupo}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {grpCampos.map(c => (
                    <div key={c.key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        {c.label}
                      </label>
                      {renderField(c, os, update)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="no-print" style={{ padding: '12px 16px', borderTop: '2px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={salvar}
                style={{ flex: 1, padding: '10px 0', background: salvoMsg === 'erro' ? '#dc2626' : salvoMsg === 'ok' ? '#16a34a' : modeloDef.cor, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s' }}>
                {salvoMsg === 'ok' ? '✅ Salvo com sucesso!' : salvoMsg === 'erro' ? '❌ Erro ao salvar' : '💾 Salvar O.S'}
              </button>
              <button type="button" onClick={novo}
                style={{ padding: '10px 16px', background: '#f3f4f6', border: '1.5px solid #d1d5db', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                📄 Nova
              </button>
              <button type="button" onClick={() => setTela('historico')}
                style={{ padding: '10px 16px', background: '#f3f4f6', border: '1.5px solid #d1d5db', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                📁 Histórico
              </button>
            </div>
            {salvoMsg === 'ok' && (
              <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#166534' }}>
                ✅ O.S salva! Acesse pelo botão &quot;Histórico&quot; a qualquer momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
