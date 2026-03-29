import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import ReportarProblema from './ReportarProblema';
import type { Checklist, ProblemaItem } from './types';

const CHECKLISTS_KEY = 'sm_checklists_v1';

function carregar(): Checklist[] {
  try { const v = localStorage.getItem(CHECKLISTS_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
function salvar(lista: Checklist[]) {
  try { localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(lista)); } catch { /* */ }
}
function fmt(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatarTempo(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
  return `${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
}

interface Props { checklistId: string; }

const ChecklistFillPage: React.FC<Props> = ({ checklistId }) => {
  const [checklists, setChecklists] = useState<Checklist[]>(carregar);
  const [reportando, setReportando] = useState<{ itemId: string; itemTexto: string } | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [geoExecutor, setGeoExecutor] = useState<{ lat: number; lng: number; endereco?: string } | null>(null);
  const geoCapturado = useRef(false);

  // Captura localização de quem está executando o checklist
  useEffect(() => {
    if (geoCapturado.current || !navigator.geolocation) return;
    geoCapturado.current = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc: { lat: number; lng: number; endereco?: string } = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json&accept-language=pt-BR`);
          const j = await r.json();
          if (j.display_name) loc.endereco = j.display_name;
        } catch { /* sem endereço */ }
        setGeoExecutor(loc);
      },
      () => { /* permissão negada */ },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  function sair() {
    try { window.close(); } catch { /* */ }
    setTimeout(() => { window.location.href = '/'; }, 200);
  }

  const cl = useMemo(() => checklists.find(c => c.id === checklistId) || null, [checklists, checklistId]);

  const atualizar = useCallback((updated: Checklist[]) => {
    salvar(updated);
    setChecklists(updated);
  }, []);

  const concluirItem = useCallback((itemId: string) => {
    if (!cl) return;
    const updated = checklists.map(c => {
      if (c.id !== cl.id) return c;
      const itens = c.itens.map(it => it.id === itemId ? { ...it, status: 'concluido' as const } : it);
      const todosOk = itens.every(it => it.status !== 'pendente');
      const agora = Date.now();
      return {
        ...c, itens,
        status: todosOk ? 'concluido' as const : c.status,
        concluidoEm: todosOk ? agora : c.concluidoEm,
        horarioFinal: todosOk ? agora : c.horarioFinal,
        tempoTotal: todosOk && c.horarioInicial ? agora - c.horarioInicial : c.tempoTotal,
      };
    });
    atualizar(updated);
  }, [cl, checklists, atualizar]);

  const salvarProblema = useCallback((itemId: string, problema: ProblemaItem) => {
    if (!cl) return;
    const updated = checklists.map(c => {
      if (c.id !== cl.id) return c;
      return { ...c, itens: c.itens.map(it => it.id === itemId ? { ...it, status: 'problema' as const, problema } : it) };
    });
    atualizar(updated);
    setReportando(null);
  }, [cl, checklists, atualizar]);

  const finalizarChecklist = useCallback(() => {
    if (!cl) return;
    const agora = Date.now();
    const updated = checklists.map(c => {
      if (c.id !== cl.id) return c;
      return {
        ...c,
        status: 'concluido' as const,
        itens: c.itens.map(it => it.status === 'pendente' ? { ...it, status: 'concluido' as const } : it),
        concluidoEm: agora,
        horarioFinal: agora,
        tempoTotal: c.horarioInicial ? agora - c.horarioInicial : undefined,
        ...(geoExecutor ? { localizacao: geoExecutor } : {}),
      };
    });
    atualizar(updated);
    setConcluido(true);
  }, [cl, checklists, atualizar]);

  // ── Não encontrado ──
  if (!cl) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f3f4f6', padding:20 }}>
        <div style={{ background:'#fff', borderRadius:24, padding:40, textAlign:'center', maxWidth:420, boxShadow:'0 12px 40px rgba(0,0,0,0.1)' }}>
          <AlertCircle size={56} color="#dc2626" style={{ marginBottom:16 }} />
          <h1 style={{ fontSize:22, fontWeight:900, color:'#111', margin:'0 0 8px' }}>Checklist não encontrado</h1>
          <p style={{ fontSize:14, color:'#6b7280', marginBottom:20 }}>O checklist pode ter sido removido ou o link está incorreto.</p>
          <button onClick={sair} style={{ padding:'12px 28px', background:'#0D0D0D', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
            <LogOut size={16} style={{ verticalAlign:'middle', marginRight:6 }} />Sair
          </button>
        </div>
      </div>
    );
  }

  // ── Tela de conclusão ──
  if (concluido || cl.status === 'concluido') {
    const feitos = cl.itens.filter(i => i.status !== 'pendente').length;
    const probs = cl.itens.filter(i => i.status === 'problema').length;
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'linear-gradient(135deg,#f0fdf4,#ecfdf5)', padding:20 }}>
        <div style={{ background:'#fff', borderRadius:24, padding:40, textAlign:'center', maxWidth:480, boxShadow:'0 12px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#166534', margin:'0 0 8px' }}>Checklist Concluído!</h1>
          <p style={{ fontSize:15, color:'#374151', marginBottom:20 }}>{cl.titulo}</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:20 }}>
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'10px 18px' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>Itens</div>
              <div style={{ fontSize:20, fontWeight:900, color:'#166534' }}>{feitos}/{cl.itens.length}</div>
            </div>
            {probs > 0 && (
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'10px 18px' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>Problemas</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#92400e' }}>{probs}</div>
              </div>
            )}
            {cl.tempoTotal && (
              <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:'10px 18px' }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>Tempo</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#c2410c' }}>{formatarTempo(cl.tempoTotal)}</div>
              </div>
            )}
          </div>
          <p style={{ fontSize:12, color:'#9ca3af' }}>Concluído em {fmt(cl.concluidoEm)}</p>
          <button onClick={sair} style={{ marginTop:20, padding:'12px 28px', background:'#0D0D0D', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:8 }}>
            <LogOut size={16} /> Sair
          </button>
          <p style={{ fontSize:11, color:'#d1d5db', marginTop:16 }}>Simples Manutenção</p>
        </div>
      </div>
    );
  }

  // ── Página interativa ──
  const feitos = cl.itens.filter(i => i.status !== 'pendente').length;
  const total = cl.itens.length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
  const temProblema = cl.itens.some(i => i.status === 'problema');
  const todosConcluidos = cl.itens.every(i => i.status !== 'pendente');

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#FFD600,#FF8F00)', padding:'24px 20px 20px' }}>
        <div style={{ maxWidth:520, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <span style={{ fontSize:36 }}>✅</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:20, fontWeight:900, color:'#0D0D0D' }}>{cl.titulo}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#7a3500', background:'rgba(255,255,255,0.5)', padding:'2px 8px', borderRadius:6, display:'inline-block', marginTop:4, fontFamily:'monospace' }}>#{cl.protocolo}</div>
            </div>
            <button onClick={sair} title="Sair" style={{ background:'rgba(0,0,0,0.1)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#333', flexShrink:0 }}>
              <LogOut size={20} />
            </button>
          </div>
          <div style={{ display:'flex', gap:16, fontSize:13, color:'#333', fontWeight:600 }}>
            <span>👤 {cl.responsavelNome || '—'}</span>
            <span>📅 {fmt(cl.criadoEm)}</span>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px 20px' }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, color:'#374151', marginBottom:8 }}>
            <span>📊 Progresso</span>
            <span style={{ fontWeight:900 }}>{feitos}/{total} ({pct}%)</span>
          </div>
          <div style={{ height:10, background:'#e4e4e7', borderRadius:20, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:20, background: temProblema ? '#f59e0b' : '#22c55e', width:`${pct}%`, transition:'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Itens */}
      <div style={{ maxWidth:520, margin:'0 auto', padding:'0 20px 100px' }}>
        <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', color:'#6b7280', marginBottom:12 }}>📋 Itens do checklist</div>
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          {cl.itens.map((item, idx) => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom: idx < cl.itens.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:10 }}>
                {item.status === 'concluido' && <span style={{ color:'#16a34a', fontWeight:900, fontSize:20 }}>✓</span>}
                {item.status === 'problema' && <span style={{ color:'#d97706', fontWeight:900, fontSize:20 }}>⚠</span>}
                {item.status === 'pendente' && <span style={{ color:'#9ca3af', fontWeight:700, fontSize:15, width:24, textAlign:'center' }}>{idx + 1}</span>}
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:15, fontWeight:600, color: item.status === 'concluido' ? '#9ca3af' : '#111', textDecoration: item.status === 'concluido' ? 'line-through' : 'none' }}>{item.texto}</span>
                  {item.status === 'problema' && item.problema?.descricao && (
                    <div style={{ marginTop:6, fontSize:12, color:'#92400e', background:'#fffbeb', borderLeft:'3px solid #f59e0b', padding:'6px 10px', borderRadius:'0 6px 6px 0' }}>{item.problema.descricao}</div>
                  )}
                  {item.status === 'problema' && item.problema?.fotos && item.problema.fotos.length > 0 && (
                    <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                      {item.problema.fotos.map((f, i) => (
                        <img key={`foto-${item.id}-${i}`} src={f} alt="" style={{ width:60, height:45, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb', cursor:'pointer' }}
                          onClick={() => setFotoAmpliada(f)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {item.status === 'pendente' && (
                <div style={{ display:'flex', gap:6 }}>
                  <button
                    onClick={() => concluirItem(item.id)}
                    style={{ width:40, height:40, borderRadius:12, border:'none', background:'#22c55e', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 6px rgba(34,197,94,0.3)' }}
                    title="Concluir item"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => setReportando({ itemId: item.id, itemTexto: item.texto })}
                    style={{ width:40, height:40, borderRadius:12, border:'none', background:'#f59e0b', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontWeight:900, fontSize:18, boxShadow:'0 2px 6px rgba(245,158,11,0.3)' }}
                    title="Reportar problema"
                  >
                    !
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botão fixo no rodapé */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'16px 20px', background:'#fff', borderTop:'1px solid #e5e7eb', boxShadow:'0 -4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:520, margin:'0 auto' }}>
          {todosConcluidos ? (
            <button
              onClick={finalizarChecklist}
              style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:900, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
            >
              <CheckCircle2 size={20} /> Finalizar Checklist
            </button>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#6b7280', fontSize:14, fontWeight:600, padding:8 }}>
              <span>📋</span> {total - feitos} {total - feitos === 1 ? 'item pendente' : 'itens pendentes'}
            </div>
          )}
        </div>
      </div>

      {/* Modal reportar problema */}
      {reportando && (
        <ReportarProblema
          itemTexto={reportando.itemTexto}
          onSalvar={(problema) => salvarProblema(reportando.itemId, problema)}
          onCancelar={() => setReportando(null)}
        />
      )}

      {/* Lightbox foto */}
      {fotoAmpliada && (
        <div
          onClick={() => setFotoAmpliada(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, cursor:'zoom-out' }}
        >
          <img src={fotoAmpliada} alt="foto ampliada" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:12 }} />
          <button onClick={() => setFotoAmpliada(null)}
            style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}>
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChecklistFillPage;
