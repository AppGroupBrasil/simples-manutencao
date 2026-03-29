import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Check, ClipboardList, History, Settings, Trash2,
  Search, X, BarChart3, FileDown, Hash, Share2, Eye,
  CheckCircle2, Edit2, RefreshCw, PlayCircle, Calendar, FileText,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import ReportarProblema from './ReportarProblema';
import type { Checklist, ItemChecklist, ProblemaItem } from './types';
import styles from './Checklist.module.css';

const CHECKLISTS_KEY = 'sm_checklists_v1';

function carregar(): Checklist[] {
  try { const v = localStorage.getItem(CHECKLISTS_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
function salvar(lista: Checklist[]): boolean {
  try { localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(lista)); return true; } catch { return false; }
}
function gerarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function gerarProtocolo() {
  const n = new Date();
  const d = `${n.getFullYear()}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}`;
  return `CHK-${d}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}
function fmt(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function diasAtras(ts: number) {
  const dias = Math.floor((Date.now() - ts) / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  return `${dias} dias atrás`;
}
function formatarTempo(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
  return `${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
}

// ── PDF individual ────────────────────────────────────────────────────────────
function imprimirChecklist(cl: Checklist) {
  const total  = cl.itens.length;
  const feitos = cl.itens.filter(i => i.status !== 'pendente').length;
  const probs  = cl.itens.filter(i => i.status === 'problema').length;
  const pct    = total > 0 ? Math.round((feitos / total) * 100) : 0;

  const statusIcon: Record<string, string> = { concluido: '✓', problema: '⚠', pendente: '○' };
  const statusCor:  Record<string, string> = { concluido: '#16a34a', problema: '#d97706', pendente: '#9ca3af' };

  const itensHtml = cl.itens.map(it => {
    const fotosStr = it.problema?.fotos?.length
      ? it.problema.fotos.map((f: string) => `<img src="${f}" style="width:120px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" />`).join('')
      : '';
    const fotosHtml = fotosStr ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">${fotosStr}</div>` : '';
    return `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #f3f4f6;">
      <span style="font-size:18px;font-weight:900;color:${statusCor[it.status]};flex-shrink:0;line-height:1.4;">${statusIcon[it.status]}</span>
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:600;color:#111;${it.status === 'concluido' ? 'text-decoration:line-through;color:#6b7280;' : ''}">${it.texto}</div>
        ${it.problema?.descricao ? `<div style="margin-top:6px;font-size:12px;color:#92400e;background:#fffbeb;border-left:3px solid #f59e0b;padding:6px 10px;border-radius:0 6px 6px 0;">${it.problema.descricao}</div>` : ''}
        ${fotosHtml}
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Checklist ${cl.protocolo}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:Arial,sans-serif; background:#fff; color:#111; padding:32px; }
    .header { background:linear-gradient(135deg,#FFD600,#FF8F00); border-radius:16px; padding:24px 28px; margin-bottom:24px; }
    .tipo-badge { display:inline-block; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; background:rgba(0,0,0,0.12); padding:3px 10px; border-radius:20px; color:#333; margin-bottom:6px; }
    .titulo { font-size:24px; font-weight:900; color:#0D0D0D; }
    .protocolo { font-family:monospace; font-size:12px; font-weight:700; color:#7a3500; background:rgba(255,255,255,0.5); padding:3px 10px; border-radius:6px; margin-top:6px; display:inline-block; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
    .item { background:#f9f9f9; border-radius:10px; padding:12px 16px; border-left:4px solid #FFD600; }
    .label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#888; margin-bottom:3px; }
    .valor { font-size:14px; font-weight:700; color:#111; }
    .progresso-wrap { background:#f3f4f6; border-radius:10px; padding:14px 16px; margin-bottom:20px; }
    .progresso-bar { height:10px; background:#e4e4e7; border-radius:20px; overflow:hidden; margin-top:8px; }
    .progresso-fill { height:100%; border-radius:20px; background:${probs > 0 ? '#f59e0b' : '#22c55e'}; width:${pct}%; }
    .itens-titulo { font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#6b7280; margin-bottom:8px; }
    .footer { text-align:center; font-size:10px; color:#aaa; border-top:1px solid #eee; padding-top:14px; margin-top:24px; }
    @media print { body { padding:16px; } }
  </style></head><body>
  <div class="header">
    <div class="tipo-badge">${cl.tipo === 'livre' ? '📝 Livre' : '👔 Admin'}</div>
    <div class="titulo">✅ ${cl.titulo}</div>
    <div><span class="protocolo"># ${cl.protocolo}</span></div>
  </div>

  <div class="grid">
    <div class="item"><div class="label">Responsável</div><div class="valor">👤 ${cl.responsavelNome || '—'}</div></div>
    <div class="item"><div class="label">Criado por</div><div class="valor">${cl.criadoPorNome}</div></div>
    <div class="item"><div class="label">📅 Criado em</div><div class="valor">${fmt(cl.criadoEm)}</div></div>
    <div class="item"><div class="label">✅ Concluído em</div><div class="valor">${fmt(cl.concluidoEm)}</div></div>
  </div>

  <div class="progresso-wrap">
    <div class="label">Progresso — ${feitos}/${total} itens (${pct}%) · ${probs} problema(s)</div>
    <div class="progresso-bar"><div class="progresso-fill"></div></div>
  </div>

  <div class="itens-titulo">📋 Itens do Checklist</div>
  ${itensHtml}

  <div style="display:flex;justify-content:center;margin:24px 0 16px;">
    <div style="text-align:center;">
      <img src="${(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 200; return c.toDataURL(); })()}" id="qr-placeholder" style="width:160px;height:160px;border-radius:12px;border:2px solid #e5e7eb;" />
      <div style="font-size:10px;color:#888;margin-top:6px;">QR Code · ${cl.protocolo}</div>
      <div style="font-size:11px;color:#555;margin-top:2px;word-break:break-all;">${globalThis.location.origin}/checklist-preencher/${cl.id}</div>
    </div>
  </div>
  <div class="footer">Simples Manutenção · Impresso em ${new Date().toLocaleString('pt-BR')}</div>
  <script>
    (function() {
      var qrImg = document.getElementById('qr-placeholder');
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
      s.onload = function() {
        if (typeof QRCode !== 'undefined' && qrImg) {
          QRCode.toDataURL('${globalThis.location.origin}/checklist-preencher/${cl.id}', { width: 320, margin: 2 }, function(err, dataUrl) {
            if (!err) qrImg.src = dataUrl;
            setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 500);
          });
        } else {
          window.print(); window.onafterprint = function() { window.close(); };
        }
      };
      s.onerror = function() { window.print(); window.onafterprint = function() { window.close(); }; };
      document.head.appendChild(s);
    })();
  </script>
  </body></html>`;

  const janela = globalThis.open('', '_blank', 'width=820,height=750');
  if (janela) { janela.document.write(html); janela.document.close(); }
}

type Aba = 'meus' | 'criar' | 'historico';

// ── Componente de item ────────────────────────────────────────────────────────
const ItemRow: React.FC<{
  item: ItemChecklist;
  onConcluir: () => void;
  onReportar: () => void;
  podeEditar: boolean;
  onFotoClick: (src: string) => void;
}> = ({ item, onConcluir, onReportar, podeEditar, onFotoClick }) => (
  <div className={`${styles.itemRow} ${styles['itemRow_' + item.status]}`}>
    <div className={styles.itemEsquerda}>
      {item.status === 'concluido' && <span className={styles.itemIconeConcluido}>✓</span>}
      {item.status === 'problema'  && <span className={styles.itemIconeProblema}>⚠</span>}
      {item.status === 'pendente'  && <span className={styles.itemIconePendente}>○</span>}

      <div className={styles.itemTextoWrap}>
        <span className={`${styles.itemTexto} ${item.status === 'concluido' ? styles.itemTextoRiscado : ''}`}>
          {item.texto}
        </span>
        {item.status === 'problema' && item.problema && (
          <div className={styles.problemaDetalhe}>
            {item.problema.descricao && (
              <p className={styles.problemaDesc}>{item.problema.descricao}</p>
            )}
            {item.problema.fotos.length > 0 && (
              <div className={styles.problemaFotos}>
                {item.problema.fotos.map((f, i) => (
                  <button key={f} type="button" onClick={() => onFotoClick(f)}
                    style={{ padding:0, border:'none', background:'none', cursor:'zoom-in' }}>
                    <img src={f} alt={`foto ${i+1}`} className={styles.problemaFoto} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    {podeEditar && item.status === 'pendente' && (
      <div className={styles.itemAcoes}>
        <button className={styles.btnConcluirItem} onClick={onConcluir} title="Marcar como concluído">
          <Check size={18} />
        </button>
        <button className={styles.btnReportarItem} onClick={onReportar} title="Reportar problema">
          <span className={styles.triangulo}>!</span>
        </button>
      </div>
    )}
  </div>
);

// ── Página principal ──────────────────────────────────────────────────────────
const ChecklistPage: React.FC = () => {
  const { usuario, listarFuncionarios } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role   = usuario?.role || 'funcionario';
  const userId = usuario?.id   || '';
  const nome   = usuario?.nome || '';
  const podeGerenciar = role === 'master' || role === 'administrador' || role === 'supervisor';

  const [checklists, setChecklists] = useState<Checklist[]>(carregar);
  const [abaAtiva, setAbaAtiva]     = useState<Aba>('meus');
  const [reportandoItem, setReportandoItem] = useState<{ checklistId: string; itemId: string; itemTexto: string } | null>(null);
  const [verGraficos, setVerGraficos]       = useState(false);
  const [busca, setBusca]                   = useState('');
  const [filtroStatus, setFiltroStatus]     = useState('todos');
  const [filtroTipo, setFiltroTipo]         = useState('todos');
  const [dataInicio, setDataInicio]         = useState('');
  const [dataFim, setDataFim]               = useState('');
  const [expandido, setExpandido]           = useState<string | null>(null);
  const [fotoAmpliada, setFotoAmpliada]     = useState<string | null>(null);
  const [previewChecklist, setPreviewChecklist] = useState<Checklist | null>(null);
  const [qrAmpliado, setQrAmpliado] = useState<Checklist | null>(null);
  const [editandoChecklist, setEditandoChecklist] = useState<Checklist | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editResp, setEditResp] = useState('');
  const [preenchendoChecklist, setPreenchendoChecklist] = useState<string | null>(null);
  const [geoLocal, setGeoLocal] = useState<{ lat: number; lng: number; endereco?: string } | null>(null);

  // Abre checklist automaticamente se vier via link compartilhado (?id=checklistId)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (!id) return;
    navigate('/checklist', { replace: true });
    setExpandido(id);
    setAbaAtiva('meus');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Captura localização ao abrir a página
  const geoCapturado = useRef(false);
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
        setGeoLocal(loc);
      },
      () => { /* permissão negada */ },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Criar livre
  const [tituloLivre, setTituloLivre]     = useState('');
  const [novoItemLivre, setNovoItemLivre] = useState('');
  const [itensLivre, setItensLivre]       = useState<string[]>([]);

  // Criar admin
  const [tituloAdmin, setTituloAdmin]     = useState('');
  const [novoItemAdmin, setNovoItemAdmin] = useState('');
  const [itensAdmin, setItensAdmin]       = useState<string[]>([]);
  const [responsavelId, setResponsavelId] = useState('');
  const funcionarios = listarFuncionarios();

  // ── Helpers ────────────────────────────────────────────────────────────────
  const concluirItem = useCallback((checklistId: string, itemId: string) => {
    setChecklists(prev => {
      const p = prev.map(cl => {
        if (cl.id !== checklistId) return cl;
        const itens = cl.itens.map(it => it.id === itemId ? { ...it, status: 'concluido' as const } : it);
        const todosOk = itens.every(it => it.status !== 'pendente');
        const agora = Date.now();
        return {
          ...cl, itens,
          status: todosOk ? 'concluido' as const : cl.status,
          concluidoEm: todosOk ? agora : cl.concluidoEm,
          horarioFinal: todosOk ? agora : cl.horarioFinal,
          tempoTotal: todosOk && cl.horarioInicial ? agora - cl.horarioInicial : cl.tempoTotal,
        };
      });
      salvar(p);
      return p;
    });
  }, []);

  const salvarProblema = useCallback((checklistId: string, itemId: string, problema: ProblemaItem) => {
    setChecklists(prev => {
      const p = prev.map(cl => {
        if (cl.id !== checklistId) return cl;
        const itens = cl.itens.map(it => it.id === itemId ? { ...it, status: 'problema' as const, problema } : it);
        return { ...cl, itens };
      });
      const ok = salvar(p);
      if (!ok) {
        const semAudio = p.map(cl => {
          if (cl.id !== checklistId) return cl;
          return { ...cl, itens: cl.itens.map(it => it.id === itemId ? { ...it, problema: { ...problema, audio: undefined, audioDuracao: undefined } } : it) };
        });
        salvar(semAudio);
        alert('⚠️ O áudio era grande demais e não foi salvo. Descrição e fotos foram salvas normalmente.');
        return semAudio;
      }
      return p;
    });
    setReportandoItem(null);
  }, []);

  const excluirChecklist = useCallback((id: string) => {
    if (!confirm('Excluir este checklist?')) return;
    // Limpa áudios separados
    const cl = checklists.find(c => c.id === id);
    cl?.itens.forEach(it => {
      if (it.problema?.audio?.startsWith('sm_audio_')) {
        localStorage.removeItem(it.problema.audio);
      }
    });
    setChecklists(prev => { const p = prev.filter(c => c.id !== id); salvar(p); return p; });
  }, [checklists]);

  const iniciarChecklist = useCallback((id: string) => {
    setChecklists(prev => {
      const p = prev.map(cl => cl.id === id ? { ...cl, status: 'em_andamento' as const, horarioInicial: cl.horarioInicial || Date.now() } : cl);
      salvar(p);
      return p;
    });
    setPreenchendoChecklist(id);
  }, []);

  const concluirChecklist = useCallback((id: string) => {
    setChecklists(prev => {
      const agora = Date.now();
      const p = prev.map(cl => cl.id === id ? {
        ...cl,
        status: 'concluido' as const,
        itens: cl.itens.map(it => it.status === 'pendente' ? { ...it, status: 'concluido' as const } : it),
        concluidoEm: agora,
        horarioFinal: agora,
        tempoTotal: cl.horarioInicial ? agora - cl.horarioInicial : undefined,
      } : cl);
      salvar(p);
      return p;
    });
  }, []);

  const reutilizarChecklist = useCallback((cl: Checklist) => {
    const novo: Checklist = {
      id: gerarId(),
      protocolo: gerarProtocolo(),
      tipo: cl.tipo,
      titulo: cl.titulo,
      itens: cl.itens.map(it => ({ id: gerarId(), texto: it.texto, status: 'pendente' as const })),
      criadoPor: userId,
      criadoPorNome: nome,
      responsavelId: cl.responsavelId,
      responsavelNome: cl.responsavelNome,
      status: 'ativo',
      criadoEm: Date.now(),
      horarioInicial: Date.now(),
      ...(geoLocal ? { localizacao: geoLocal } : {}),
      adminId: usuario?.adminId,
      supervisorId: usuario?.supervisorId,
    };
    setChecklists(prev => { const p = [novo, ...prev]; salvar(p); return p; });
  }, [userId, nome, geoLocal, usuario]);

  const salvarEdicaoChecklist = useCallback(() => {
    if (!editandoChecklist) return;
    setChecklists(prev => {
      const p = prev.map(cl => cl.id === editandoChecklist.id ? {
        ...cl,
        titulo: editTitulo.trim() || cl.titulo,
        responsavelNome: editResp.trim() || cl.responsavelNome,
      } : cl);
      salvar(p);
      return p;
    });
    setEditandoChecklist(null);
  }, [editandoChecklist, editTitulo, editResp]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _gerarReciboChecklist = (cl: Checklist) => {
    const logo = localStorage.getItem('sm_logo_empresa') || '';
    const { feitos, total, pct } = progresso(cl);
    const problemas = cl.itens.filter(i => i.status === 'problema');

    let reciboStatusHtml: string;
    if (cl.status === 'concluido') reciboStatusHtml = '✅ Concluído';
    else if (cl.status === 'em_andamento') reciboStatusHtml = '🟡 Em Andamento';
    else reciboStatusHtml = '🔵 Ativo';

    const localTexto = cl.localizacao
      ? (cl.localizacao.endereco || cl.localizacao.lat.toFixed(5) + ', ' + cl.localizacao.lng.toFixed(5))
      : '';

    const itensListHtml = cl.itens.map(it => {
      let icon: string;
      if (it.status === 'concluido') icon = '<span class="ok">✅</span>';
      else if (it.status === 'problema') icon = '<span class="prob">⚠️</span>';
      else icon = '<span class="pend">⬜</span>';
      const descHtml = it.problema?.descricao ? ` — <em>${it.problema.descricao}</em>` : '';
      return `<div class="item">${icon} ${it.texto}${descHtml}</div>`;
    }).join('');

    const problemasListHtml = problemas.length > 0
      ? '<h2>⚠️ Problemas Reportados</h2>' + problemas.map(it => `<div class="item prob">• ${it.texto}: ${it.problema?.descricao || ''}</div>`).join('')
      : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recibo Checklist</title><style>
      *{margin:0;padding:0;box-sizing:border-box} body{font-family:Arial,sans-serif;padding:32px;max-width:800px;margin:0 auto;color:#111}
      .header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #22c55e;padding-bottom:16px;margin-bottom:20px}
      .logo{width:80px;height:80px;object-fit:contain;border-radius:12px}
      h1{font-size:22px;color:#166534} h2{font-size:15px;color:#374151;margin:16px 0 8px}
      table{width:100%;border-collapse:collapse;margin-bottom:16px} td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;vertical-align:top}
      .label{font-weight:800;color:#6b7280;text-transform:uppercase;font-size:11px;width:140px}
      .item{padding:6px 0;font-size:13px} .ok{color:#16a34a} .prob{color:#d97706} .pend{color:#9ca3af}
      .footer{text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:24px}
    </style></head><body>
      <div class="header">${logo ? `<img src="${logo}" class="logo" />` : ''}<div><h1>Recibo de Checklist</h1><div style="font-size:13px;color:#6b7280">${cl.protocolo}</div></div></div>
      <table>
        <tr><td class="label">Título</td><td style="font-weight:700">${cl.titulo}</td></tr>
        <tr><td class="label">Tipo</td><td>${cl.tipo === 'admin' ? '👔 Admin' : '📝 Livre'}</td></tr>
        <tr><td class="label">Responsável</td><td>${cl.responsavelNome || '—'}</td></tr>
        <tr><td class="label">Criado por</td><td>${cl.criadoPorNome}</td></tr>
        <tr><td class="label">Data</td><td>${fmt(cl.criadoEm)}</td></tr>
        <tr><td class="label">Status</td><td>${reciboStatusHtml}</td></tr>
        <tr><td class="label">Progresso</td><td>${feitos}/${total} (${pct}%)</td></tr>
        ${cl.horarioInicial ? `<tr><td class="label">Início</td><td>${fmt(cl.horarioInicial)}</td></tr>` : ''}
        ${cl.horarioFinal ? `<tr><td class="label">Final</td><td>${fmt(cl.horarioFinal)}</td></tr>` : ''}
        ${cl.tempoTotal ? `<tr><td class="label">Tempo total</td><td style="font-weight:900;color:#FF8F00">${formatarTempo(cl.tempoTotal)}</td></tr>` : ''}
        ${cl.localizacao ? `<tr><td class="label">Local</td><td>${localTexto}</td></tr>` : ''}
      </table>
      <h2>✅ Itens do Checklist</h2>
      <div style="margin-bottom:16px">${itensListHtml}</div>
      ${problemasListHtml}
      <div class="footer">Documento gerado pelo sistema Simples Manutenção • ${fmt(Date.now())}</div>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const gerarRelatorioChecklist = () => {
    const todosFiltered = aplicarFiltros(visiveis);
    if (todosFiltered.length === 0) { alert('Nenhum checklist encontrado com os filtros aplicados.'); return; }
    const logo = localStorage.getItem('sm_logo_empresa') || '';
    const ativosFiltrado = todosFiltered.filter(cl => cl.status === 'ativo' || cl.status === 'em_andamento').length;
    const concluidosFiltrado = todosFiltered.filter(cl => cl.status === 'concluido').length;
    const comProblema = todosFiltered.filter(cl => cl.itens.some(i => i.status === 'problema')).length;
    const livres = todosFiltered.filter(cl => cl.tipo === 'livre').length;
    const admins = todosFiltered.filter(cl => cl.tipo === 'admin').length;
    const inicioStr = dataInicio ? new Date(dataInicio + 'T00:00').toLocaleDateString('pt-BR') : '...';
    const fimStr = dataFim ? new Date(dataFim + 'T00:00').toLocaleDateString('pt-BR') : '...';
    const periodoTexto = (dataInicio || dataFim) ? `${inicioStr} até ${fimStr}` : 'Todo o período';

    let statusFiltroTexto = '';
    if (filtroStatus === 'ativo') statusFiltroTexto = 'Status: Ativos';
    else if (filtroStatus === 'concluido') statusFiltroTexto = 'Status: Concluídos';
    else if (filtroStatus !== 'todos') statusFiltroTexto = 'Status: Com Problema';
    let tipoFiltroTexto = '';
    if (filtroTipo === 'livre') tipoFiltroTexto = 'Tipo: Livre';
    else if (filtroTipo === 'admin') tipoFiltroTexto = 'Tipo: Admin';
    const filtrosTexto = [statusFiltroTexto, tipoFiltroTexto].filter(Boolean).join(' · ') || 'Todos';

    const rowsHtml = todosFiltered.map(cl => {
      const { feitos, total, pct } = progresso(cl);
      const temProb = cl.itens.some(i => i.status === 'problema');
      let statusLabel: string;
      if (cl.status === 'concluido') statusLabel = '✅ Concluído';
      else if (cl.status === 'em_andamento') statusLabel = '🟡 Em Andamento';
      else statusLabel = '🔵 Ativo';
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;font-family:monospace;font-weight:700;color:#5c2200;">${cl.protocolo}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#111;">${cl.titulo}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${cl.tipo === 'livre' ? '📝 Livre' : '👔 Admin'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${statusLabel}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${cl.responsavelNome || '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${fmt(cl.criadoEm)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;text-align:center;">${feitos}/${total} (${pct}%)</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${temProb ? '⚠️ Sim' : '—'}</td>
      </tr>`;
    }).join('');

    const problemasItems = todosFiltered.flatMap(cl =>
      cl.itens.filter(i => i.status === 'problema').map(it => ({ checklist: cl.titulo, protocolo: cl.protocolo, item: it.texto, desc: it.problema?.descricao || '' }))
    );
    const problemasHtml = problemasItems.length > 0 ? `
      <h2 style="font-size:16px;font-weight:900;color:#92400e;margin:24px 0 12px;">⚠️ Problemas Reportados (${problemasItems.length})</h2>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${problemasItems.map(p => `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;">
          <div style="font-size:12px;font-weight:800;color:#92400e;">${p.checklist} · <span style="font-family:monospace;font-size:11px;">${p.protocolo}</span></div>
          <div style="font-size:13px;font-weight:600;color:#111;margin-top:4px;">• ${p.item}</div>
          ${p.desc ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;font-style:italic;">${p.desc}</div>` : ''}
        </div>`).join('')}
      </div>` : '';

    const rHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Relatório de Checklists</title>
    <style>
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:Arial,sans-serif; background:#fff; color:#111; padding:32px; }
      table { width:100%; border-collapse:collapse; }
      @media print { body { padding:16px; } }
    </style></head><body>
      <div style="background:linear-gradient(135deg,#FFD600,#FF8F00);border-radius:16px;padding:24px 28px;margin-bottom:24px;">
        ${logo ? `<img src="${logo}" style="width:60px;height:60px;object-fit:contain;border-radius:10px;margin-bottom:12px;" />` : ''}
        <div style="font-size:24px;font-weight:900;color:#0D0D0D;">📋 Relatório de Checklists</div>
        <div style="font-size:13px;color:rgba(13,13,13,0.7);font-weight:600;margin-top:6px;">📅 Período: ${periodoTexto} · Filtros: ${filtrosTexto}</div>
        <div style="font-size:11px;color:rgba(13,13,13,0.5);margin-top:4px;">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
        <div style="background:#f9fafb;border-radius:12px;padding:16px;text-align:center;border-left:4px solid #FF8F00;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;">Total</div>
          <div style="font-size:28px;font-weight:900;color:#0D0D0D;">${todosFiltered.length}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;border-left:4px solid #22c55e;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;">Concluídos</div>
          <div style="font-size:28px;font-weight:900;color:#166534;">${concluidosFiltrado}</div>
        </div>
        <div style="background:#fffbeb;border-radius:12px;padding:16px;text-align:center;border-left:4px solid #f59e0b;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;">Com Problema</div>
          <div style="font-size:28px;font-weight:900;color:#92400e;">${comProblema}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
        <div style="background:#fff7ed;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;">Ativos</div>
          <div style="font-size:22px;font-weight:900;color:#c2410c;">${ativosFiltrado}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;">Concluídos</div>
          <div style="font-size:22px;font-weight:900;color:#166534;">${concluidosFiltrado}</div>
        </div>
        <div style="background:#eff6ff;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;">📝 Livre</div>
          <div style="font-size:22px;font-weight:900;color:#1e40af;">${livres}</div>
        </div>
        <div style="background:#faf5ff;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;">👔 Admin</div>
          <div style="font-size:22px;font-weight:900;color:#7c3aed;">${admins}</div>
        </div>
      </div>

      <h2 style="font-size:16px;font-weight:900;color:#111;margin-bottom:12px;">📋 Listagem Detalhada (${todosFiltered.length})</h2>
      <table>
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Protocolo</th>
            <th style="padding:10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Título</th>
            <th style="padding:10px;text-align:center;font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Tipo</th>
            <th style="padding:10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Status</th>
            <th style="padding:10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Responsável</th>
            <th style="padding:10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Data</th>
            <th style="padding:10px;text-align:center;font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Progresso</th>
            <th style="padding:10px;text-align:center;font-size:10px;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb;">Prob.</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      ${problemasHtml}

      <div style="text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:14px;margin-top:24px;">
        Simples Manutenção · Relatório gerado em ${new Date().toLocaleString('pt-BR')}
      </div>
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
    </body></html>`;
    const rw = globalThis.open('', '_blank', 'width=1000,height=750');
    if (rw) { rw.document.write(rHtml); rw.document.close(); }
  };

  const criarLivre = () => {
    if (!tituloLivre.trim() || itensLivre.length === 0) return;
    const novo: Checklist = {
      id: gerarId(), protocolo: gerarProtocolo(), tipo: 'livre',
      titulo: tituloLivre.trim(),
      itens: itensLivre.map(t => ({ id: gerarId(), texto: t, status: 'pendente' })),
      criadoPor: userId, criadoPorNome: nome,
      responsavelId: userId, responsavelNome: nome,
      status: 'ativo', criadoEm: Date.now(),
      horarioInicial: Date.now(),
      ...(geoLocal ? { localizacao: geoLocal } : {}),
      adminId: usuario?.adminId, supervisorId: usuario?.supervisorId,
    };
    setChecklists(prev => { const p = [novo, ...prev]; salvar(p); return p; });
    setTituloLivre(''); setItensLivre([]); setAbaAtiva('meus');
  };

  const criarAdmin = () => {
    if (!tituloAdmin.trim() || itensAdmin.length === 0 || !responsavelId) return;
    const func = funcionarios.find(f => f.id === responsavelId);
    const novo: Checklist = {
      id: gerarId(), protocolo: gerarProtocolo(), tipo: 'admin',
      titulo: tituloAdmin.trim(),
      itens: itensAdmin.map(t => ({ id: gerarId(), texto: t, status: 'pendente' })),
      criadoPor: userId, criadoPorNome: nome,
      responsavelId, responsavelNome: func?.nome || '',
      status: 'ativo', criadoEm: Date.now(),
      horarioInicial: Date.now(),
      ...(geoLocal ? { localizacao: geoLocal } : {}),
      adminId: usuario?.adminId, supervisorId: usuario?.supervisorId,
    };
    setChecklists(prev => { const p = [novo, ...prev]; salvar(p); return p; });
    setTituloAdmin(''); setItensAdmin([]); setResponsavelId(''); setAbaAtiva('meus');
  };

  const addItemLivre = () => {
    if (!novoItemLivre.trim()) { return; }
    setItensLivre(p => [...p, novoItemLivre.trim()]);
    setNovoItemLivre('');
  };
  const addItemAdmin = () => {
    if (!novoItemAdmin.trim()) { return; }
    setItensAdmin(p => [...p, novoItemAdmin.trim()]);
    setNovoItemAdmin('');
  };

  // ── Filtros ────────────────────────────────────────────────────────────────
  const visiveis = useMemo(() => {
    if (role === 'master') return checklists;
    if (podeGerenciar) return checklists.filter(cl => cl.criadoPor === userId || cl.adminId === usuario?.adminId || cl.supervisorId === usuario?.supervisorId);
    return checklists.filter(cl => cl.responsavelId === userId || cl.criadoPor === userId);
  }, [checklists, role, userId, podeGerenciar, usuario]);

  const ativos    = visiveis.filter(cl => cl.status === 'ativo' || cl.status === 'em_andamento');
  const concluidos = visiveis.filter(cl => cl.status === 'concluido');

  const temFiltroAtivo = filtroStatus !== 'todos' || filtroTipo !== 'todos' || busca.trim() !== '' || !!dataInicio || !!dataFim;

  const aplicarFiltros = (lista: Checklist[]) => {
    return lista.filter(cl => {
      if (filtroStatus === 'problema' && !cl.itens.some(i => i.status === 'problema')) return false;
      if (filtroStatus === 'ativo' && cl.status !== 'ativo' && cl.status !== 'em_andamento') return false;
      if (filtroStatus === 'concluido' && cl.status !== 'concluido') return false;
      if (filtroTipo !== 'todos' && cl.tipo !== filtroTipo) return false;
      if (dataInicio) {
        const inicio = new Date(dataInicio + 'T00:00:00').getTime();
        if (cl.criadoEm < inicio) return false;
      }
      if (dataFim) {
        const fim = new Date(dataFim + 'T23:59:59').getTime();
        if (cl.criadoEm > fim) return false;
      }
      if (busca.trim()) {
        const q = busca.toLowerCase();
        return [cl.titulo, cl.protocolo, cl.responsavelNome, cl.criadoPorNome].join(' ').toLowerCase().includes(q);
      }
      return true;
    });
  };

  // Quando um filtro está ativo, buscar em TODOS os visíveis (não só na aba)
  const listaFiltrada   = aplicarFiltros(visiveis);
  const listaAtivos     = temFiltroAtivo ? listaFiltrada : aplicarFiltros(ativos);
  const listaConcluidos = temFiltroAtivo ? listaFiltrada : aplicarFiltros(concluidos);

  // ── Gráficos ──────────────────────────────────────────────────────────────
  const _CORES = ['#FFD600','#FF8F00','#22c55e','#3b82f6','#a855f7','#ef4444'];

  const dadosPorData = useMemo(() => {
    const map: Record<string, number> = {};
    visiveis.forEach(cl => {
      const d = new Date(cl.criadoEm).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).slice(-14).map(([data, total]) => ({ data, total }));
  }, [visiveis]);

  const dadosPorStatus = useMemo(() => [
    { name: 'Ativos',     value: ativos.length,    fill: '#FF8F00' },
    { name: 'Concluídos', value: concluidos.length, fill: '#22c55e' },
  ].filter(d => d.value > 0), [ativos, concluidos]);

  const dadosPorTipo = useMemo(() => {
    const livre = visiveis.filter(cl => cl.tipo === 'livre').length;
    const admin = visiveis.filter(cl => cl.tipo === 'admin').length;
    return [
      { name: '📝 Livre', value: livre, fill: '#3b82f6' },
      { name: '👔 Admin', value: admin, fill: '#a855f7' },
    ].filter(d => d.value > 0);
  }, [visiveis]);

  const dadosPorResponsavel = useMemo(() => {
    const map: Record<string, number> = {};
    visiveis.forEach(cl => { if (cl.responsavelNome) map[cl.responsavelNome] = (map[cl.responsavelNome] || 0) + 1; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,8).map(([nome, total]) => ({ nome, total }));
  }, [visiveis]);

  const progresso = (cl: Checklist) => {
    const total = cl.itens.length;
    const feitos = cl.itens.filter(i => i.status !== 'pendente').length;
    return { feitos, total, pct: total > 0 ? Math.round((feitos / total) * 100) : 0 };
  };

  const podeEditarChecklist = (cl: Checklist) => cl.responsavelId === userId || cl.criadoPor === userId || podeGerenciar;

  // ── Compartilhar checklist ────────────────────────────────────────────────
  const compartilharChecklist = (cl: Checklist) => {
    const { feitos, total, pct } = progresso(cl);
    let statusLabel: string;
    if (cl.status === 'concluido') statusLabel = '✅ Concluído';
    else if (cl.status === 'em_andamento') statusLabel = '🟡 Em Andamento';
    else if (cl.itens.some(i => i.status === 'problema')) statusLabel = '⚠️ Com problema';
    else statusLabel = '🔵 Ativo';
    const linhas = [
      `✅ *Checklist — ${cl.titulo}*`,
      ``,
      `#️⃣ ${cl.protocolo}`,
      `👤 Responsável: ${cl.responsavelNome}`,
      `📅 Data: ${fmt(cl.criadoEm)}`,
      `📌 Status: ${statusLabel}`,
      `📊 Progresso: ${feitos}/${total} itens (${pct}%)`,
    ];
    if (cl.horarioInicial) linhas.push(`▶️ Início: ${fmt(cl.horarioInicial)}`);
    if (cl.horarioFinal)   linhas.push(`⏹️ Final: ${fmt(cl.horarioFinal)}`);
    if (cl.tempoTotal)     linhas.push(`⏱️ Tempo total: ${formatarTempo(cl.tempoTotal)}`);
    if (cl.concluidoEm) linhas.push(`✅ Concluído em: ${fmt(cl.concluidoEm)}`);

    // Localização com link para Google Maps
    if (cl.localizacao) {
      const { lat, lng, endereco } = cl.localizacao;
      if (endereco) linhas.push(`📍 Local: ${endereco}`);
      linhas.push(`🗺️ Ver no mapa: https://www.google.com/maps?q=${lat},${lng}`);
    }

    const problemas = cl.itens.filter(i => i.status === 'problema');
    if (problemas.length > 0) {
      linhas.push('', `⚠️ *Problemas reportados:*`);
      problemas.forEach(it => {
        linhas.push(`• ${it.texto}${it.problema?.descricao ? ': ' + it.problema.descricao : ''}`);
      });
    }

    const link = `${globalThis.location.origin}/checklist-preencher/${cl.id}`;
    linhas.push('', `🔗 Preencher checklist: ${link}`, `📱 QR Code: ${link}`, '', '_Enviado pelo Simples Manutenção_');
    const texto = linhas.join('\n');
    if (navigator.share) {
      navigator.share({ title: cl.titulo, text: texto }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    }
  };

  // ── Card de checklist ─────────────────────────────────────────────────────
  const renderCard = (cl: Checklist) => {
    const { feitos, total, pct } = progresso(cl);
    const podEdit    = podeEditarChecklist(cl);
    const temProblema = cl.itens.some(i => i.status === 'problema');
    const aberto      = expandido === cl.id;

    return (
      <div key={cl.id} className={`${styles.clCard} ${temProblema ? styles.clCardProblema : ''} ${cl.status === 'concluido' ? styles.clCardConcluido : ''}`}>
        {/* Header clicável */}
        <button className={styles.clCardBtn} onClick={() => setExpandido(aberto ? null : cl.id)}>
          <div className={styles.clCardFaixa} style={{ background: cl.tipo === 'admin' ? '#a855f7' : '#3b82f6' }} />
          <div className={styles.clCardConteudo}>
            <div className={styles.clCardTopo}>
              <div className={styles.clCardTituloCont}>
                <span className={styles.clTipo}>{cl.tipo === 'livre' ? '📝 Livre' : '👔 Admin'}</span>
                <h3 className={styles.clNome}>{cl.titulo}</h3>
                <div className={styles.clProtocoloRow}>
                  <Hash size={10} />{cl.protocolo}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                {(() => {
                  if (cl.status === 'concluido') return <span className={styles.clBadgeConcluido}>✅ Concluído</span>;
                  if (cl.status === 'em_andamento') return <span className={styles.clBadgeAtivo} style={{ background:'rgba(234,179,8,0.15)', color:'#a16207', border:'1px solid rgba(234,179,8,0.3)' }}>🟡 Em Andamento</span>;
                  if (temProblema) return <span className={styles.clBadgeProblema}>⚠️ Com problema</span>;
                  return <span className={styles.clBadgeAtivo}>🔵 Ativo</span>;
                })()}
                <span className={styles.clData}>{diasAtras(cl.criadoEm)} · {fmt(cl.criadoEm)}</span>
              </div>
            </div>

            <div className={styles.clInfoRow}>
              <span className={styles.clInfoItem}>👤 <strong>{cl.responsavelNome}</strong></span>
              <span className={styles.clInfoItem}>📊 {feitos}/{total} ({pct}%)</span>
              {temProblema && <span className={styles.clInfoItem} style={{ color:'#d97706' }}>⚠️ {cl.itens.filter(i=>i.status==='problema').length} problema(s)</span>}
              {cl.concluidoEm && <span className={styles.clInfoItem}>✅ {fmt(cl.concluidoEm)}</span>}
            </div>
          </div>
          <span className={styles.expandirSeta}>{aberto ? '▲' : '▼'}</span>
        </button>

        {/* Barra de progresso */}
        <div className={styles.progressoWrap}>
          <div className={styles.progressoBar}>
            <div className={styles.progressoFill} style={{ width: `${pct}%`, background: temProblema ? '#f59e0b' : '#22c55e' }} />
          </div>
        </div>

        {/* Detalhes expandidos */}
        {aberto && (
          <div className={styles.clDetalhes}>
            {/* Grid de datas */}
            <div className={styles.detalheGrid}>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>📅 Criado em</span>
                <span className={styles.detalheValor}>{fmt(cl.criadoEm)}</span>
              </div>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>👤 Responsável</span>
                <span className={styles.detalheValor}>{cl.responsavelNome || '—'}</span>
              </div>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>✍️ Criado por</span>
                <span className={styles.detalheValor}>{cl.criadoPorNome}</span>
              </div>
              <div className={styles.detalheItem}>
                <span className={styles.detalheLabel}>✅ Concluído em</span>
                <span className={styles.detalheValor}>{fmt(cl.concluidoEm)}</span>
              </div>
              {cl.horarioInicial && (
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>▶️ Horário inicial</span>
                  <span className={styles.detalheValor}>{fmt(cl.horarioInicial)}</span>
                </div>
              )}
              {cl.horarioFinal && (
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>⏹️ Horário final</span>
                  <span className={styles.detalheValor}>{fmt(cl.horarioFinal)}</span>
                </div>
              )}
              {cl.tempoTotal && (
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>⏱️ Tempo total</span>
                  <span className={styles.detalheValor} style={{ fontWeight: 900, color: '#FF8F00' }}>{formatarTempo(cl.tempoTotal)}</span>
                </div>
              )}
              {cl.localizacao && (
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>📍 Local</span>
                  <span className={styles.detalheValor} style={{ fontSize: 12 }}>
                    {cl.localizacao.endereco || `${cl.localizacao.lat.toFixed(5)}, ${cl.localizacao.lng.toFixed(5)}`}
                  </span>
                </div>
              )}
              {cl.localizacao && (
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>🗺️ Mapa</span>
                  <a
                    href={`https://www.google.com/maps?q=${cl.localizacao.lat},${cl.localizacao.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', textDecoration: 'underline' }}
                  >
                    Abrir no mapa ↗
                  </a>
                </div>
              )}
            </div>

            {/* Botões */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-start' }}>
              {cl.status === 'ativo' && (
                <button
                  onClick={() => iniciarChecklist(cl.id)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', color:'#0D0D0D', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer' }}
                >
                  <PlayCircle size={14} /> Iniciar
                </button>
              )}
              {cl.status === 'em_andamento' && (
                <button
                  onClick={() => iniciarChecklist(cl.id)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#0D0D0D', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer' }}
                >
                  <PlayCircle size={14} /> Em Andamento
                </button>
              )}
              {cl.status !== 'concluido' && cl.status !== 'ativo' && (
                <button
                  onClick={() => concluirChecklist(cl.id)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer' }}
                >
                  <CheckCircle2 size={14} /> Concluir
                </button>
              )}
              {podeGerenciar && (
                <button
                  onClick={() => { setEditandoChecklist(cl); setEditTitulo(cl.titulo); setEditResp(cl.responsavelNome || ''); }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(59,130,246,0.1)', border:'1.5px solid rgba(59,130,246,0.3)', color:'#2563eb', borderRadius:10, cursor:'pointer', width:36, height:36 }}
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
              )}
              <button
                onClick={() => reutilizarChecklist(cl)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(124,58,237,0.1)', border:'1.5px solid rgba(124,58,237,0.3)', color:'#7c3aed', borderRadius:10, cursor:'pointer', width:36, height:36 }}
                title="Reutilizar"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => compartilharChecklist(cl)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(37,211,102,0.12)', border:'1.5px solid rgba(37,211,102,0.4)', color:'#16a34a', borderRadius:10, cursor:'pointer', width:36, height:36 }}
                title="Compartilhar"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => imprimirChecklist(cl)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(220,38,38,0.08)', border:'1.5px solid rgba(220,38,38,0.3)', color:'#dc2626', borderRadius:10, cursor:'pointer', width:36, height:36 }}
                title="PDF"
              >
                <FileDown size={16} />
              </button>
              <button
                onClick={() => setPreviewChecklist(cl)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(107,114,128,0.08)', border:'1.5px solid rgba(107,114,128,0.3)', color:'#4b5563', borderRadius:10, cursor:'pointer', width:36, height:36 }}
                title="Pré-visualizar"
              >
                <Eye size={16} />
              </button>
              {podeGerenciar && (
                <button className={styles.btnExcluirCl} onClick={() => excluirChecklist(cl.id)} title="Excluir" style={{ width:36, height:36, padding:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* QR Code */}
            <button type="button"
              onClick={() => setQrAmpliado(cl)}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 16px', background:'#f9fafb', borderRadius:12, border:'1.5px solid #e4e4e7', cursor:'pointer', transition:'background 0.15s', fontFamily:'inherit', textAlign:'left', width:'100%' }}
              title="Toque para ampliar o QR Code"
            >
              <QRCodeCanvas
                value={`${globalThis.location.origin}/checklist-preencher/${cl.id}`}
                size={64}
                level="M"
                style={{ borderRadius:6 }}
              />
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <span style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px' }}>QR Code do Checklist</span>
                <span style={{ fontSize:12, color:'#9ca3af', lineHeight:1.3 }}>Toque para ampliar e mostrar para outro funcionário</span>
              </div>
            </button>

            {/* Itens */}
            <div id={`checklist-itens-${cl.id}`} className={styles.itensLista}>
              {cl.itens.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  podeEditar={podEdit && cl.status === 'em_andamento'}
                  onConcluir={() => concluirItem(cl.id, item.id)}
                  onReportar={() => setReportandoItem({ checklistId: cl.id, itemId: item.id, itemTexto: item.texto })}
                  onFotoClick={setFotoAmpliada}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const listaAtual = abaAtiva === 'meus' ? listaAtivos : listaConcluidos;
  // (empty-state labels are rendered inline in each aba section)

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerEsquerda}>
          <span style={{ fontSize: 44 }}>✅</span>
          <div>
            <h1 className={styles.headerTitulo}>Checklists</h1>
            <p className={styles.headerSub}>Listas de verificação e controle</p>
          </div>
        </div>
        <div className={styles.headerDireita}>
          <div className={styles.resumoCards}>
            <div className={styles.resumoCard}><span className={styles.resumoNumero}>{visiveis.length}</span><span className={styles.resumoLabel}>Total</span></div>
            <div className={`${styles.resumoCard} ${styles.resumoCardAmbar}`}><span className={styles.resumoNumero}>{ativos.length}</span><span className={styles.resumoLabel}>Ativos</span></div>
            <div className={`${styles.resumoCard} ${styles.resumoCardVerde}`}><span className={styles.resumoNumero}>{concluidos.length}</span><span className={styles.resumoLabel}>Concluídos</span></div>
          </div>
          <div className={styles.headerAcoes}>
            <button
              className={`${styles.btnAcao} ${verGraficos ? styles.btnAcaoAtivo : ''}`}
              onClick={() => setVerGraficos(v => !v)}
            >
              <BarChart3 size={17} /> Relatórios
            </button>
            <button className={styles.btnPdf} onClick={() => globalThis.print()}>
              <FileDown size={17} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Gráficos ────────────────────────────────────────────────────── */}
      {verGraficos && visiveis.length > 0 && (
        <div className={styles.graficosSecao}>
          <h2 className={styles.graficosTitulo}><BarChart3 size={20} /> Relatórios e Gráficos</h2>
          <div className={styles.graficosGrid}>

            {dadosPorData.length > 0 && (
              <div className={styles.graficoCard}>
                <h3 className={styles.graficoCardTitulo}>📅 Checklists por data (últimos 14 dias)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dadosPorData} margin={{ top:8, right:16, left:-10, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                    <XAxis dataKey="data" tick={{ fontSize:11, fill:'var(--cor-texto-secundario)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize:11, fill:'var(--cor-texto-secundario)' }} />
                    <Tooltip contentStyle={{ background:'var(--cor-superficie)', border:'1px solid var(--cor-borda)', borderRadius:8 }} />
                    <Bar dataKey="total" fill="#FFD600" radius={[4,4,0,0]} name="Checklists" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {dadosPorStatus.length > 0 && (
              <div className={styles.graficoCard}>
                <h3 className={styles.graficoCardTitulo}>📊 Distribuição por status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dadosPorStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                      label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                      {dadosPorStatus.map(e => <Cell key={e.name} fill={e.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:'var(--cor-superficie)', border:'1px solid var(--cor-borda)', borderRadius:8 }} />
                    <Legend wrapperStyle={{ fontSize:12, marginTop:8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {dadosPorTipo.length > 0 && (
              <div className={styles.graficoCard}>
                <h3 className={styles.graficoCardTitulo}>🏷️ Livre vs Admin</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dadosPorTipo} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                      label={({ percent }) => `${(percent*100).toFixed(0)}%`}>
                      {dadosPorTipo.map(e => <Cell key={e.name} fill={e.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:'var(--cor-superficie)', border:'1px solid var(--cor-borda)', borderRadius:8 }} />
                    <Legend wrapperStyle={{ fontSize:12, marginTop:8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {dadosPorResponsavel.length > 0 && (
              <div className={styles.graficoCard}>
                <h3 className={styles.graficoCardTitulo}>👤 Top responsáveis</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dadosPorResponsavel} layout="vertical" margin={{ top:8, right:16, left:4, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize:11, fill:'var(--cor-texto-secundario)' }} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize:11, fill:'var(--cor-texto-secundario)' }} width={90} />
                    <Tooltip contentStyle={{ background:'var(--cor-superficie)', border:'1px solid var(--cor-borda)', borderRadius:8 }} />
                    <Bar dataKey="total" fill="#FF8F00" radius={[0,4,4,0]} name="Checklists" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Abas ────────────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${abaAtiva === 'meus' ? styles.tabAtivo : ''}`} onClick={() => setAbaAtiva('meus')}>
          <ClipboardList size={18} /> Ativos {ativos.length > 0 && <span className={styles.tabBadge}>{ativos.length}</span>}
        </button>
        <button className={`${styles.tab} ${abaAtiva === 'criar' ? styles.tabAtivo : ''}`} onClick={() => setAbaAtiva('criar')}>
          <Plus size={18} /> Criar Novo
        </button>
        <button className={`${styles.tab} ${abaAtiva === 'historico' ? styles.tabAtivo : ''}`} onClick={() => setAbaAtiva('historico')}>
          <History size={18} /> Histórico {concluidos.length > 0 && <span className={styles.tabBadge}>{concluidos.length}</span>}
        </button>
      </div>

      {/* ── Busca + Filtros (Ativos e Histórico) ────────────────────────── */}
      {abaAtiva !== 'criar' && (
        <>
          <div className={styles.buscaWrapper}>
            <Search size={18} className={styles.buscaIcone} />
            <input
              className={styles.buscaInput}
              placeholder="Buscar por título, responsável, protocolo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && <button className={styles.buscaLimpar} onClick={() => setBusca('')}><X size={16} /></button>}
          </div>

          <div className={styles.filtrosRow}>
            {[
              { key:'todos',     label:'Todos',        count: visiveis.length },
              { key:'ativo',     label:'Ativos',       count: ativos.length },
              { key:'concluido', label:'Concluídos',   count: concluidos.length },
              { key:'problema',  label:'Com problema', count: visiveis.filter(cl => cl.itens.some(i => i.status === 'problema')).length },
            ].map(f => (
              <button key={f.key} className={`${styles.filtroBotao} ${filtroStatus === f.key ? styles.filtroBotaoAtivo : ''}`} onClick={() => setFiltroStatus(f.key)}>
                {f.label} <span className={styles.filtroCount}>{f.count}</span>
              </button>
            ))}
            <button className={`${styles.filtroBotao} ${filtroTipo === 'todos' ? styles.filtroBotaoAtivo : ''}`} onClick={() => setFiltroTipo('todos')}>Todos os tipos</button>
            <button className={`${styles.filtroBotao} ${filtroTipo === 'livre' ? styles.filtroBotaoAtivo : ''}`} onClick={() => setFiltroTipo('livre')}>📝 Livre</button>
            <button className={`${styles.filtroBotao} ${filtroTipo === 'admin' ? styles.filtroBotaoAtivo : ''}`} onClick={() => setFiltroTipo('admin')}>👔 Admin</button>
          </div>

          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Calendar size={16} color="#6b7280" />
              <span style={{ fontSize:12, fontWeight:700, color:'#6b7280' }}>De:</span>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                style={{ padding:'6px 10px', border:'2px solid var(--cor-borda)', borderRadius:10, fontSize:13, fontWeight:600, color:'var(--cor-texto)', background:'var(--cor-superficie)', fontFamily:'inherit', outline:'none' }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#6b7280' }}>Até:</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                style={{ padding:'6px 10px', border:'2px solid var(--cor-borda)', borderRadius:10, fontSize:13, fontWeight:600, color:'var(--cor-texto)', background:'var(--cor-superficie)', fontFamily:'inherit', outline:'none' }} />
            </div>
            {(dataInicio || dataFim) && (
              <button onClick={() => { setDataInicio(''); setDataFim(''); }}
                style={{ padding:'6px 12px', fontSize:12, fontWeight:700, color:'#dc2626', background:'rgba(220,38,38,0.08)', border:'1.5px solid rgba(220,38,38,0.3)', borderRadius:10, cursor:'pointer', fontFamily:'inherit' }}>
                <X size={14} style={{ verticalAlign:'middle', marginRight:3 }} />Limpar datas
              </button>
            )}
            <button onClick={() => gerarRelatorioChecklist()}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}>
              <FileText size={16} /> Gerar Relatório
            </button>
          </div>

          {busca && (
            <p className={styles.resultadoBusca}>
              {listaAtual.length === 0 ? 'Nenhum resultado' : `${listaAtual.length} resultado(s) encontrado(s)`}
            </p>
          )}
        </>
      )}

      {/* ── ABA: ATIVOS ─────────────────────────────────────────────────── */}
      {abaAtiva === 'meus' && (
        <div className={styles.listaChecklists}>
          {listaAtivos.length === 0 && (
            <div className={styles.vazio}>
              <ClipboardList size={64} strokeWidth={1} />
              <p className={styles.vazioTitulo}>Nenhum checklist ativo</p>
              <p>Clique em "Criar Novo" para começar</p>
            </div>
          )}
          {listaAtivos.map(renderCard)}
        </div>
      )}

      {/* ── ABA: CRIAR ──────────────────────────────────────────────────── */}
      {abaAtiva === 'criar' && (
        <div className={styles.criarWrap}>
          {/* Livre */}
          <div className={styles.criarCard}>
            <div className={styles.criarCardHeader}>
              <span style={{ fontSize:28 }}>📝</span>
              <div><h2>Checklist Livre</h2><p>Você mesmo anota e verifica os itens</p></div>
            </div>
            <input className={styles.inputTitulo} placeholder="Título do checklist..." value={tituloLivre} onChange={e => setTituloLivre(e.target.value)} />
            <div className={styles.addItemRow}>
              <input className={styles.inputItem} placeholder="Adicionar item..." value={novoItemLivre} onChange={e => setNovoItemLivre(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItemLivre()} />
              <button className={styles.btnAddItem} onClick={addItemLivre}><Plus size={18} /></button>
            </div>
            {itensLivre.length > 0 && (
              <div className={styles.itensPreview}>
                {itensLivre.map((it) => (
                  <div key={it} className={styles.itemPreviewRow}>
                    <span>○ {it}</span>
                    <button onClick={() => setItensLivre(p => p.filter(x => x !== it))}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <button className={styles.btnCriar} onClick={criarLivre} disabled={!tituloLivre.trim() || itensLivre.length === 0}>
              <Check size={18} /> Criar Checklist Livre
            </button>
          </div>

          {/* Admin */}
          {podeGerenciar && (
            <div className={`${styles.criarCard} ${styles.criarCardAdmin}`}>
              <div className={styles.criarCardHeader}>
                <span style={{ fontSize:28 }}>👔</span>
                <div><h2>Checklist para Funcionário</h2><p>Crie e atribua a um funcionário específico</p></div>
              </div>
              <input className={styles.inputTitulo} placeholder="Título do checklist..." value={tituloAdmin} onChange={e => setTituloAdmin(e.target.value)} />
              <select className={styles.inputTitulo} value={responsavelId} onChange={e => setResponsavelId(e.target.value)}>
                <option value="">Selecione o funcionário...</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} — {f.cargo || 'Sem cargo'}</option>)}
              </select>
              <div className={styles.addItemRow}>
                <input className={styles.inputItem} placeholder="Adicionar item..." value={novoItemAdmin} onChange={e => setNovoItemAdmin(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItemAdmin()} />
                <button className={styles.btnAddItem} onClick={addItemAdmin}><Plus size={18} /></button>
              </div>
              {itensAdmin.length > 0 && (
                <div className={styles.itensPreview}>
                  {itensAdmin.map((it) => (
                    <div key={it} className={styles.itemPreviewRow}>
                      <span>○ {it}</span>
                      <button onClick={() => setItensAdmin(p => p.filter(x => x !== it))}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <button className={`${styles.btnCriar} ${styles.btnCriarAdmin}`} onClick={criarAdmin} disabled={!tituloAdmin.trim() || itensAdmin.length === 0 || !responsavelId}>
                <Settings size={18} /> Criar e Atribuir
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: HISTÓRICO ──────────────────────────────────────────────── */}
      {abaAtiva === 'historico' && (
        <div className={styles.listaChecklists}>
          {listaConcluidos.length === 0 && (
            <div className={styles.vazio}>
              <History size={64} strokeWidth={1} />
              <p className={styles.vazioTitulo}>Nenhum checklist concluído</p>
            </div>
          )}
          {listaConcluidos.map(renderCard)}
        </div>
      )}

      {/* Lightbox foto */}
      {fotoAmpliada && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <button type="button" onClick={() => setFotoAmpliada(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'zoom-out' }} aria-label="Fechar foto" tabIndex={-1} />
          <img src={fotoAmpliada} alt="foto ampliada"
            style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:12, boxShadow:'0 0 60px rgba(0,0,0,0.8)', position:'relative', zIndex:1 }} />
          <button onClick={() => setFotoAmpliada(null)}
            style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer', zIndex:2 }}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Modal Preview — como o funcionário vê o checklist */}
      {previewChecklist && (() => {
        const cl = previewChecklist;
        const { feitos, total, pct } = progresso(cl);
        const temProblema = cl.itens.some(i => i.status === 'problema');
        return (
          <div className={styles.pvOverlay}>
            <button type="button" onClick={() => setPreviewChecklist(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar preview" tabIndex={-1} />
            <div className={styles.pvModal} style={{ position:'relative', zIndex:1 }}>

              {/* Badge */}
              <div className={styles.pvBadge}>
                <Eye size={13} /> Pré-visualização — Assim ficará para o funcionário
              </div>

              {/* Header simulado */}
              <div className={styles.pvHeader}>
                <div className={styles.pvHeaderTopo}>
                  <span style={{ fontSize: 36 }}>✅</span>
                  <div>
                    <div className={styles.pvTitulo}>{cl.titulo}</div>
                    <div className={styles.pvProtocolo}>#{cl.protocolo}</div>
                  </div>
                </div>
                <div className={styles.pvMeta}>
                  <span>👤 {cl.responsavelNome || '—'}</span>
                  <span>📅 {fmt(cl.criadoEm)}</span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className={styles.pvProgressoWrap}>
                <div className={styles.pvProgressoTexto}>
                  <span>📊 Progresso</span>
                  <span style={{ fontWeight: 900 }}>{feitos}/{total} ({pct}%)</span>
                </div>
                <div className={styles.pvProgressoBar}>
                  <div className={styles.pvProgressoFill} style={{ width: `${pct}%`, background: temProblema ? '#f59e0b' : '#22c55e' }} />
                </div>
              </div>

              {/* Lista de itens */}
              <div className={styles.pvItens}>
                <div className={styles.pvItensLabel}>📋 Itens do checklist</div>
                {cl.itens.map((item, idx) => (
                  <div key={item.id} className={styles.pvItem + ' ' + styles['pvItem_' + item.status]}>
                    <div className={styles.pvItemEsquerda}>
                      {item.status === 'concluido' && <span className={styles.pvIconeOk}>✓</span>}
                      {item.status === 'problema'  && <span className={styles.pvIconeProb}>⚠</span>}
                      {item.status === 'pendente'  && <span className={styles.pvIconePend}>{idx + 1}</span>}
                      <span className={`${styles.pvItemTexto} ${item.status === 'concluido' ? styles.pvItemRiscado : ''}`}>
                        {item.texto}
                      </span>
                    </div>
                    <div className={styles.pvItemDireita}>
                      {item.status === 'pendente' && (
                        <>
                          <span className={styles.pvBtnOkDemo}>
                            <Check size={14} />
                          </span>
                          <span className={styles.pvBtnTrianguloDemo}>
                            <span className={styles.pvTrianguloExcl}>!</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rodapé */}
              <div className={styles.pvFooter}>
                <button className={styles.pvBtnFechar} onClick={() => setPreviewChecklist(null)}>Fechar pré-visualização</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal preencher checklist (interativo) */}
      {preenchendoChecklist && (() => {
        const cl = checklists.find(c => c.id === preenchendoChecklist);
        if (!cl) return null;
        const { feitos, total, pct } = progresso(cl);
        const temProblema = cl.itens.some(i => i.status === 'problema');
        const todosConcluidos = cl.itens.every(i => i.status !== 'pendente');
        return (
          <div
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          >
            <button type="button" onClick={() => setPreenchendoChecklist(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar" tabIndex={-1} />
            <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:520, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.35)', position:'relative', zIndex:1 }}>
              {/* Header */}
              <div style={{ background:'linear-gradient(135deg,#FFD600,#FF8F00)', borderRadius:'24px 24px 0 0', padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:32 }}>✅</span>
                    <div>
                      <div style={{ fontSize:18, fontWeight:900, color:'#0D0D0D' }}>{cl.titulo}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#7a3500', background:'rgba(255,255,255,0.5)', padding:'2px 8px', borderRadius:6, display:'inline-block', marginTop:4, fontFamily:'monospace' }}>#{cl.protocolo}</div>
                    </div>
                  </div>
                  <button onClick={() => setPreenchendoChecklist(null)} style={{ background:'rgba(0,0,0,0.1)', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#333' }}>
                    <X size={20} />
                  </button>
                </div>
                <div style={{ display:'flex', gap:16, marginTop:12, fontSize:13, color:'#333', fontWeight:600 }}>
                  <span>👤 {cl.responsavelNome || '—'}</span>
                  <span>📅 {fmt(cl.criadoEm)}</span>
                </div>
              </div>

              {/* Progresso */}
              <div style={{ padding:'16px 24px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, color:'#374151', marginBottom:8 }}>
                  <span>📊 Progresso</span>
                  <span style={{ fontWeight:900 }}>{feitos}/{total} ({pct}%)</span>
                </div>
                <div style={{ height:10, background:'#e4e4e7', borderRadius:20, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:20, background: temProblema ? '#f59e0b' : '#22c55e', width:`${pct}%`, transition:'width 0.3s' }} />
                </div>
              </div>

              {/* Itens interativos */}
              <div style={{ padding:'16px 24px' }}>
                <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', color:'#6b7280', marginBottom:12 }}>📋 Itens do checklist</div>
                {cl.itens.map((item, idx) => (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0', borderBottom:'1px solid #f3f4f6' }}>
                    <div style={{ flex:1, display:'flex', alignItems:'center', gap:10 }}>
                      {item.status === 'concluido' && <span style={{ color:'#16a34a', fontWeight:900, fontSize:18 }}>✓</span>}
                      {item.status === 'problema' && <span style={{ color:'#d97706', fontWeight:900, fontSize:18 }}>⚠</span>}
                      {item.status === 'pendente' && <span style={{ color:'#9ca3af', fontWeight:700, fontSize:14, width:22, textAlign:'center' }}>{idx + 1}</span>}
                      <span style={{ fontSize:14, fontWeight:600, color: item.status === 'concluido' ? '#9ca3af' : '#111', textDecoration: item.status === 'concluido' ? 'line-through' : 'none' }}>{item.texto}</span>
                    </div>
                    {item.status === 'pendente' && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button
                          onClick={() => concluirItem(cl.id, item.id)}
                          style={{ width:36, height:36, borderRadius:10, border:'none', background:'#22c55e', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                          title="Concluir item"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => { setPreenchendoChecklist(null); setReportandoItem({ checklistId: cl.id, itemId: item.id, itemTexto: item.texto }); }}
                          style={{ width:36, height:36, borderRadius:10, border:'none', background:'#f59e0b', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontWeight:900 }}
                          title="Reportar problema"
                        >
                          !
                        </button>
                      </div>
                    )}
                    {item.status === 'problema' && item.problema?.descricao && (
                      <span style={{ fontSize:11, color:'#92400e', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.problema.descricao}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Rodapé */}
              <div style={{ padding:'16px 24px', borderTop:'1px solid #e5e7eb', display:'flex', gap:10 }}>
                {todosConcluidos ? (
                  <button
                    onClick={() => { concluirChecklist(cl.id); setPreenchendoChecklist(null); }}
                    style={{ flex:1, padding:'14px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:900, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                  >
                    <CheckCircle2 size={18} /> Finalizar Checklist
                  </button>
                ) : (
                  <button
                    onClick={() => setPreenchendoChecklist(null)}
                    style={{ flex:1, padding:'14px', background:'#0D0D0D', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:900, cursor:'pointer', fontFamily:'inherit' }}
                  >
                    Continuar depois
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* QR Code ampliado */}
      {qrAmpliado && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:16 }}
        >
          <button type="button" onClick={() => setQrAmpliado(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar QR" tabIndex={-1} />
          <div style={{ background:'#fff', borderRadius:24, padding:32, display:'flex', flexDirection:'column', alignItems:'center', gap:16, position:'relative', zIndex:1 }}>
            <QRCodeCanvas
              value={`${globalThis.location.origin}/checklist-preencher/${qrAmpliado.id}`}
              size={280}
              level="M"
              style={{ borderRadius:12 }}
            />
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:900, color:'#111' }}>{qrAmpliado.titulo}</div>
              <div style={{ fontSize:13, color:'#6b7280', marginTop:4 }}>{qrAmpliado.protocolo}</div>
            </div>
            <button
              onClick={() => setQrAmpliado(null)}
              style={{ padding:'10px 28px', background:'#0D0D0D', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal editar checklist */}
      {editandoChecklist && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
        >
          <button type="button" onClick={() => setEditandoChecklist(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar edição" tabIndex={-1} />
          <div style={{ background:'#fff', borderRadius:24, padding:28, width:'100%', maxWidth:420, boxShadow:'0 24px 80px rgba(0,0,0,0.3)', position:'relative', zIndex:1 }}>
            <h2 style={{ margin:'0 0 20px', fontSize:20, fontWeight:900, color:'#0D0D0D' }}>✏️ Editar Checklist</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label htmlFor="edit-cl-titulo" style={{ fontSize:12, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px' }}>Título</label>
                <input
                  id="edit-cl-titulo"
                  value={editTitulo}
                  onChange={e => setEditTitulo(e.target.value)}
                  style={{ width:'100%', padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:15, fontFamily:'inherit', marginTop:6, boxSizing:'border-box' }}
                />
              </div>
              <div>
                <label htmlFor="edit-cl-resp" style={{ fontSize:12, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px' }}>Responsável</label>
                <input
                  id="edit-cl-resp"
                  value={editResp}
                  onChange={e => setEditResp(e.target.value)}
                  style={{ width:'100%', padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:15, fontFamily:'inherit', marginTop:6, boxSizing:'border-box' }}
                />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button
                onClick={() => setEditandoChecklist(null)}
                style={{ flex:1, padding:'13px', background:'none', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', color:'#6b7280', fontFamily:'inherit' }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicaoChecklist}
                style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:15, fontWeight:900, color:'#0D0D0D', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
              >
                <Check size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {reportandoItem && (
        <ReportarProblema
          itemTexto={reportandoItem.itemTexto}
          onSalvar={p => salvarProblema(reportandoItem.checklistId, reportandoItem.itemId, p)}
          onCancelar={() => setReportandoItem(null)}
        />
      )}
    </div>
  );
};

export default ChecklistPage;
