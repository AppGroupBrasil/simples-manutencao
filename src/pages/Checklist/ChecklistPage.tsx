import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Check, ClipboardList, History, Settings, Trash2,
  Search, X, BarChart3, FileDown, Hash, Share2, Eye,
  CheckCircle2, Edit2, RefreshCw, PlayCircle, Calendar, FileText, Printer,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { usePin, PinModal } from '../../components/PinProtecao';
import ReportarProblema from './ReportarProblema';
import { visualizarChecklist } from '../../utils/visualizarChecklist';
import type { Checklist, ItemChecklist, ProblemaItem } from './types';
import styles from './Checklist.module.css';

const CHECKLISTS_KEY = 'sm_checklists_v1';
const TEMPLATES_KEY = 'sm_checklist_templates_v1';

type TemplatePersonalizado = {
  id: string;
  titulo: string;
  equip: string;
  codigoEquip: string;
  item: string;
  local: string;
  responsavel: string;
  linhas: { descricao: string; dataProg: string; dataConc: string; obs: string; fotos: string[]; resp: string; status: 'pendente' | 'ok' | 'nok' }[];
  criadoEm: string;
};

type ChecagemRegistrada = {
  id: string;
  templateId?: string;
  titulo: string;
  equip: string;
  codigoEquip: string;
  local: string;
  responsavel: string;
  linhas: { descricao: string; dataProg: string; dataConc: string; obs: string; resp: string; status: 'pendente' | 'ok' | 'nok' }[];
  registradoEm: string;
};

const HISTORICO_CHECAGENS_KEY = 'sm_checagens_v1';

function carregarChecagens(): ChecagemRegistrada[] {
  try { const v = localStorage.getItem(HISTORICO_CHECAGENS_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
function salvarChecagens(lista: ChecagemRegistrada[]) {
  try { localStorage.setItem(HISTORICO_CHECAGENS_KEY, JSON.stringify(lista)); } catch { /* ignore */ }
}

function carregarTemplates(): TemplatePersonalizado[] {
  try { const v = localStorage.getItem(TEMPLATES_KEY); return v ? JSON.parse(v) : []; } catch { return []; }
}
function salvarTemplates(lista: TemplatePersonalizado[]) {
  try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(lista)); } catch { /* ignore */ }
}

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
  const { aberto: pinAberto, pedirPin, onSucesso: pinSucesso, onFechar: pinFechar } = usePin();

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
  const [modalPersonalizado, setModalPersonalizado] = useState(false);
  const [tituloPersonalizado, setTituloPersonalizado] = useState('');
  const [equipPersonalizado, setEquipPersonalizado] = useState('');
  const [codigoEquipPersonalizado, setCodigoEquipPersonalizado] = useState('');
  const [itemPersonalizado, setItemPersonalizado] = useState('');
  const [localPersonalizado, setLocalPersonalizado] = useState('');
  const [responsavelPersonalizado, setResponsavelPersonalizado] = useState('');
  const [checklistPersonalizado, setChecklistPersonalizado] = useState('');
  const [modalTextoChecklist, setModalTextoChecklist] = useState(false);
  const [dataProgramadaPersonalizado, setDataProgramadaPersonalizado] = useState('');
  const [dataConcluidaPersonalizado, setDataConcluidaPersonalizado] = useState('');
  const [linhasPersonalizado, setLinhasPersonalizado] = useState<{ descricao: string; dataProg: string; dataConc: string; obs: string; fotos: string[]; resp: string; status: 'pendente' | 'ok' | 'nok' }[]>([{ descricao: '', dataProg: '', dataConc: '', obs: '', fotos: [], resp: '', status: 'pendente' }]);
  const [modalData, setModalData] = useState<{ idx: number; tipo: 'prog' | 'conc' } | null>(null);
  const [modalDataTemp, setModalDataTemp] = useState('');
  const [modalDetalheIdx, setModalDetalheIdx] = useState<number | null>(null);
  const [templates, setTemplates] = useState<TemplatePersonalizado[]>(() => carregarTemplates());
  const [modalVerTemplates, setModalVerTemplates] = useState(false);
  const [checagens, setChecagens] = useState<ChecagemRegistrada[]>(() => carregarChecagens());
  const [modalHistorico, setModalHistorico] = useState(false);
  const [modalQRShare, setModalQRShare] = useState<string | null>(null);

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
                  onClick={() => pedirPin(() => { setEditandoChecklist(cl); setEditTitulo(cl.titulo); setEditResp(cl.responsavelNome || ''); })}
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
                onClick={() => visualizarChecklist(cl)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(107,114,128,0.08)', border:'1.5px solid rgba(107,114,128,0.3)', color:'#4b5563', borderRadius:10, cursor:'pointer', width:36, height:36 }}
                title="Visualizar checklist"
              >
                <Eye size={16} />
              </button>
              {podeGerenciar && (
                <button className={styles.btnExcluirCl} onClick={() => pedirPin(() => excluirChecklist(cl.id))} title="Excluir" style={{ width:36, height:36, padding:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
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
        <button className={`${styles.tab}`} onClick={() => setModalPersonalizado(true)}>
          <Settings size={18} /> Checklist Personalizado
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

      <PinModal aberto={pinAberto} onSucesso={pinSucesso} onFechar={pinFechar} />

      {/* Modal Checklist Personalizado */}
      {modalPersonalizado && (
        <div className={styles.pvOverlay} onClick={() => setModalPersonalizado(false)}>
          <div className={styles.pvModal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className={styles.pvHeader}>
              <div className={styles.pvHeaderTopo}>
                <Settings size={22} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 900, fontSize: 18 }}>Checklist Personalizado</span>
                <button
                  onClick={() => setModalPersonalizado(false)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ padding: '20px 20px 24px' }}>
              {/* === CABEÇALHO === */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Cabeçalho</span>
                <button onClick={() => {
                  setTituloPersonalizado(''); setEquipPersonalizado(''); setCodigoEquipPersonalizado('');
                  setItemPersonalizado(''); setLocalPersonalizado(''); setResponsavelPersonalizado('');
                  setLinhasPersonalizado([{ descricao: '', dataProg: '', dataConc: '', obs: '', fotos: [], resp: '', status: 'pendente' }]);
                }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '2px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>
                  <RefreshCw size={13} /> Novo / Limpar
                </button>
              </div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--cor-texto, #111)' }}>
                Título do Checklist
              </label>
              <input
                type="text"
                placeholder="Ex: Inspeção Mensal de Equipamentos"
                value={tituloPersonalizado}
                onChange={e => setTituloPersonalizado(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '2px solid #e5e7eb', fontSize: 15, outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--cor-texto, #111)' }}>
                    Equipamento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Compressor"
                    value={equipPersonalizado}
                    onChange={e => setEquipPersonalizado(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '2px solid #e5e7eb', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--cor-texto, #111)' }}>
                    Cód. Equipamento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: EQ-001"
                    value={codigoEquipPersonalizado}
                    onChange={e => setCodigoEquipPersonalizado(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '2px solid #e5e7eb', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--cor-texto, #111)' }}>
                    Item
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Filtro de ar"
                    value={itemPersonalizado}
                    onChange={e => setItemPersonalizado(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '2px solid #e5e7eb', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--cor-texto, #111)' }}>
                    Local
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Sala de máquinas"
                    value={localPersonalizado}
                    onChange={e => setLocalPersonalizado(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '2px solid #e5e7eb', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--cor-texto, #111)' }}>
                    Resp.
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={responsavelPersonalizado}
                    onChange={e => setResponsavelPersonalizado(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '2px solid #e5e7eb', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* === ITENS DO CHECKLIST === */}
              <div style={{ margin: '20px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 2, background: '#f3f4f6' }} />
                <span style={{ fontWeight: 800, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>Itens do Checklist</span>
                <div style={{ flex: 1, height: 2, background: '#f3f4f6' }} />
              </div>
              {/* Legenda de status */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 11, color: '#9ca3af' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e7eb', display: 'inline-block' }} /> Pendente</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> OK</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> NOK</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {linhasPersonalizado.map((linha, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', background: linha.status === 'ok' ? '#f0fdf4' : linha.status === 'nok' ? '#fef2f2' : '#fff', borderRadius: 10, padding: '4px 4px 4px 0', border: `2px solid ${linha.status === 'ok' ? '#86efac' : linha.status === 'nok' ? '#fca5a5' : '#e5e7eb'}` }}>
                    {/* Botões status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 6 }}>
                      <button onClick={() => { const n=[...linhasPersonalizado]; n[idx]={...n[idx], status: linha.status === 'ok' ? 'pendente' : 'ok'}; setLinhasPersonalizado(n); }} title="OK" style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: linha.status === 'ok' ? '#22c55e' : '#e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <Check size={12} style={{ color: linha.status === 'ok' ? '#fff' : '#9ca3af' }} />
                      </button>
                      <button onClick={() => { const n=[...linhasPersonalizado]; n[idx]={...n[idx], status: linha.status === 'nok' ? 'pendente' : 'nok'}; setLinhasPersonalizado(n); }} title="NOK" style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: linha.status === 'nok' ? '#ef4444' : '#e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <X size={12} style={{ color: linha.status === 'nok' ? '#fff' : '#9ca3af' }} />
                      </button>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', background: 'transparent' }}>
                      <input
                        type="text"
                        placeholder="Descreva o item..."
                        value={linha.descricao}
                        onChange={e => {
                          const novas = [...linhasPersonalizado];
                          novas[idx] = { ...novas[idx], descricao: e.target.value };
                          setLinhasPersonalizado(novas);
                        }}
                        style={{ flex: 1, padding: '7px 10px', border: 'none', fontSize: 13, outline: 'none', background: 'transparent' }}
                      />
                      <button onClick={() => setModalDetalheIdx(idx)} title="Fotos e observações" style={{ padding: '0 9px', height: '100%', minHeight: 34, border: 'none', borderLeft: '1px solid #e5e7eb', background: (linha.obs || linha.fotos.length > 0) ? '#f0fdf4' : 'transparent', cursor: 'pointer', fontSize: 14, color: (linha.obs || linha.fotos.length > 0) ? '#16a34a' : '#9ca3af', fontWeight: 700, flexShrink: 0 }}>
                        •••
                      </button>
                    </div>
                    <button title={linha.dataProg ? new Date(linha.dataProg + 'T00:00:00').toLocaleDateString('pt-BR') : 'Dt. Programada'} onClick={() => { setModalData({ idx, tipo: 'prog' }); setModalDataTemp(linha.dataProg); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: 10, border: '2px solid #e5e7eb', background: linha.dataProg ? '#dbeafe' : '#fff', cursor: 'pointer', width: 36, flexShrink: 0 }}>
                      <Calendar size={16} style={{ color: linha.dataProg ? '#2563eb' : '#9ca3af' }} />
                    </button>
                    <button title={linha.dataConc ? new Date(linha.dataConc + 'T00:00:00').toLocaleDateString('pt-BR') : 'Dt. Concluída'} onClick={() => { setModalData({ idx, tipo: 'conc' }); setModalDataTemp(linha.dataConc); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: 10, border: '2px solid #e5e7eb', background: linha.dataConc ? '#dcfce7' : '#fff', cursor: 'pointer', width: 36, flexShrink: 0 }}>
                      <Calendar size={16} style={{ color: linha.dataConc ? '#16a34a' : '#9ca3af' }} />
                    </button>
                    {idx === linhasPersonalizado.length - 1 ? (
                      <button onClick={() => setLinhasPersonalizado([...linhasPersonalizado, { descricao: '', dataProg: '', dataConc: '', obs: '', fotos: [], resp: '', status: 'pendente' }])} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '2px solid #2563eb', background: '#eff6ff', cursor: 'pointer', flexShrink: 0 }}>
                        <Plus size={14} style={{ color: '#2563eb' }} />
                      </button>
                    ) : (
                      <button onClick={() => setLinhasPersonalizado(linhasPersonalizado.filter((_, i) => i !== idx))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '2px solid #fca5a5', background: '#fef2f2', cursor: 'pointer', flexShrink: 0 }}>
                        <X size={12} style={{ color: '#ef4444' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Rodapé */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, borderTop: '2px solid #f3f4f6', paddingTop: 16 }}>
                <button onClick={() => setModalVerTemplates(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <History size={15} /> Formulários salvos
                </button>
                <button onClick={() => setModalHistorico(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <BarChart3 size={15} /> Histórico
                </button>
                {/* Imprimir */}
                <button title="Imprimir formulário" onClick={() => {
                  const statusLabel = (s: string) => s === 'ok' ? '✓ OK' : s === 'nok' ? '✗ NOK' : '— Pendente';
                  const linhasHtml = linhasPersonalizado.map((l, i) => `
                    <tr>
                      <td style="padding:7px;border:1px solid #e5e7eb;">${i+1}</td>
                      <td style="padding:7px;border:1px solid #e5e7eb;">${l.descricao || '—'}</td>
                      <td style="padding:7px;border:1px solid #e5e7eb;text-align:center;">${statusLabel(l.status)}</td>
                      <td style="padding:7px;border:1px solid #e5e7eb;text-align:center;">${l.dataProg ? new Date(l.dataProg+'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                      <td style="padding:7px;border:1px solid #e5e7eb;text-align:center;">${l.dataConc ? new Date(l.dataConc+'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                      <td style="padding:7px;border:1px solid #e5e7eb;">${l.resp || '—'}</td>
                      <td style="padding:7px;border:1px solid #e5e7eb;">${l.obs || '—'}</td>
                    </tr>`).join('');
                  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${tituloPersonalizado || 'Checklist'}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#f3f4f6;padding:7px;border:1px solid #e5e7eb;font-size:12px}td{font-size:12px}@media print{@page{margin:20mm}}</style></head><body>
                    <h1>${tituloPersonalizado || 'Checklist Personalizado'}</h1>
                    <p style="margin:2px 0;font-size:12px;color:#6b7280">Equipamento: <b>${equipPersonalizado||'—'}</b> &nbsp;|&nbsp; Cód.: <b>${codigoEquipPersonalizado||'—'}</b> &nbsp;|&nbsp; Local: <b>${localPersonalizado||'—'}</b> &nbsp;|&nbsp; Resp.: <b>${responsavelPersonalizado||'—'}</b></p>
                    <table><thead><tr><th>#</th><th>Item</th><th>Status</th><th>Dt. Prog.</th><th>Dt. Conc.</th><th>Responsável</th><th>Observações</th></tr></thead><tbody>${linhasHtml}</tbody></table>
                  </body></html>`;
                  const w = window.open('', '_blank'); if(w){w.document.write(html);w.document.close();w.print();}
                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, border: '2px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer' }}>
                  <Printer size={16} style={{ color: '#374151' }} />
                </button>
                {/* Compartilhar via QR */}
                <button title="QR Code / link do formulário" onClick={() => {
                  const dados = {
                    titulo: tituloPersonalizado, equip: equipPersonalizado, codigoEquip: codigoEquipPersonalizado,
                    item: itemPersonalizado, local: localPersonalizado, responsavel: responsavelPersonalizado,
                    linhas: linhasPersonalizado.map(l => ({ ...l, fotos: [] })),
                  };
                  const encoded = btoa(encodeURIComponent(JSON.stringify(dados)));
                  const url = `${window.location.origin}${window.location.pathname}?checklist_personalizado=${encoded}`;
                  setModalQRShare(url);
                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, border: '2px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer' }}>
                  <Share2 size={16} style={{ color: '#374151' }} />
                </button>
                {/* Registrar checagem */}
                <button
                  disabled={!tituloPersonalizado.trim()}
                  onClick={() => {
                    const exec: ChecagemRegistrada = {
                      id: gerarId(),
                      titulo: tituloPersonalizado.trim(),
                      equip: equipPersonalizado,
                      codigoEquip: codigoEquipPersonalizado,
                      local: localPersonalizado,
                      responsavel: responsavelPersonalizado,
                      linhas: linhasPersonalizado.map(l => ({ descricao: l.descricao, dataProg: l.dataProg, dataConc: l.dataConc, obs: l.obs, resp: l.resp, status: l.status })),
                      registradoEm: new Date().toISOString(),
                    };
                    const lista = [exec, ...checagens];
                    setChecagens(lista);
                    salvarChecagens(lista);
                    alert('Checagem registrada no histórico!');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: 'none', background: tituloPersonalizado.trim() ? '#059669' : '#d1d5db', color: '#fff', cursor: tituloPersonalizado.trim() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700 }}
                >
                  <PlayCircle size={15} /> Registrar
                </button>
                <button
                  disabled={!tituloPersonalizado.trim()}
                  onClick={() => {
                    const novo: TemplatePersonalizado = {
                      id: gerarId(),
                      titulo: tituloPersonalizado.trim(),
                      equip: equipPersonalizado,
                      codigoEquip: codigoEquipPersonalizado,
                      item: itemPersonalizado,
                      local: localPersonalizado,
                      responsavel: responsavelPersonalizado,
                      linhas: linhasPersonalizado,
                      criadoEm: new Date().toISOString(),
                    };
                    const lista = [...templates, novo];
                    setTemplates(lista);
                    salvarTemplates(lista);
                    alert(`Formulário "${novo.titulo}" salvo com sucesso!`);
                  }}
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: tituloPersonalizado.trim() ? '#2563eb' : '#d1d5db', color: '#fff', cursor: tituloPersonalizado.trim() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700 }}
                >
                  <Check size={15} /> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: formulários salvos */}
      {modalVerTemplates && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalVerTemplates(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', width: '90%', maxWidth: 480, boxShadow: '0 16px 60px rgba(0,0,0,0.3)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <History size={20} style={{ color: '#6b7280' }} />
              <span style={{ fontWeight: 800, fontSize: 16 }}>Formulários salvos</span>
              <button onClick={() => setModalVerTemplates(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>
            {templates.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', margin: '24px 0' }}>Nenhum formulário salvo ainda.</p>
            ) : (
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {templates.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t.titulo}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.equip && `${t.equip} · `}{t.linhas.length} item(s) · {new Date(t.criadoEm).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <button onClick={() => {
                      setTituloPersonalizado(t.titulo);
                      setEquipPersonalizado(t.equip);
                      setCodigoEquipPersonalizado(t.codigoEquip);
                      setItemPersonalizado(t.item);
                      setLocalPersonalizado(t.local);
                      setResponsavelPersonalizado(t.responsavel);
                      setLinhasPersonalizado(t.linhas.map(l => ({ ...l, dataProg: '', dataConc: '', resp: l.resp || '', status: l.status || 'pendente' as const })));
                      setModalVerTemplates(false);
                    }} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      Usar
                    </button>
                    <button onClick={() => {
                      const lista = templates.filter(x => x.id !== t.id);
                      setTemplates(lista);
                      salvarTemplates(lista);
                    }} style={{ padding: '7px 10px', borderRadius: 8, border: '2px solid #fca5a5', background: '#fef2f2', cursor: 'pointer' }}>
                      <Trash2 size={14} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal detalhes do item: fotos e observações */}
      {modalDetalheIdx !== null && (() => {
        const linha = linhasPersonalizado[modalDetalheIdx];
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalDetalheIdx(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', width: '90%', maxWidth: 460, boxShadow: '0 16px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <FileText size={20} style={{ color: '#6b7280' }} />
                <span style={{ fontWeight: 800, fontSize: 16 }}>Detalhes do Item</span>
                <button onClick={() => setModalDetalheIdx(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>Item <strong>{linha.descricao || `#${modalDetalheIdx + 1}`}</strong></p>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Responsável pelo item</label>
              <input
                type="text"
                placeholder="Nome do responsável (opcional)"
                value={linha.resp}
                onChange={e => {
                  const novas = [...linhasPersonalizado];
                  novas[modalDetalheIdx] = { ...novas[modalDetalheIdx], resp: e.target.value };
                  setLinhasPersonalizado(novas);
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '2px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
              />
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Observações</label>
              <textarea
                rows={4}
                placeholder="Anotações, pontos de atenção, procedimentos..."
                value={linha.obs}
                onChange={e => {
                  const novas = [...linhasPersonalizado];
                  novas[modalDetalheIdx] = { ...novas[modalDetalheIdx], obs: e.target.value };
                  setLinhasPersonalizado(novas);
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '2px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 16 }}
              />
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Fotos</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '2px dashed #d1d5db', cursor: 'pointer', color: '#6b7280', fontSize: 14, marginBottom: 10 }}>
                <Plus size={16} /> Adicionar foto
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
                  const files = Array.from(e.target.files || []);
                  const readers = files.map(f => new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); }));
                  Promise.all(readers).then(urls => {
                    const novas = [...linhasPersonalizado];
                    novas[modalDetalheIdx] = { ...novas[modalDetalheIdx], fotos: [...novas[modalDetalheIdx].fotos, ...urls] };
                    setLinhasPersonalizado(novas);
                  });
                  e.target.value = '';
                }} />
              </label>
              {linha.fotos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {linha.fotos.map((url, fi) => (
                    <div key={fi} style={{ position: 'relative' }}>
                      <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #e5e7eb' }} />
                      <button onClick={() => {
                        const novas = [...linhasPersonalizado];
                        novas[modalDetalheIdx] = { ...novas[modalDetalheIdx], fotos: novas[modalDetalheIdx].fotos.filter((_, i) => i !== fi) };
                        setLinhasPersonalizado(novas);
                      }} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setModalDetalheIdx(null)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#111', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                Concluir
              </button>
            </div>
          </div>
        );
      })()}

      {/* Mini-modal seleção de data */}
      {modalData !== null && (() => {
        const partes = modalDataTemp ? modalDataTemp.split('-') : ['', '', ''];
        const ano = partes[0] || ''; const mes = partes[1] || ''; const dia = partes[2] || '';
        const setDia = (d: string) => setModalDataTemp(`${ano || new Date().getFullYear()}-${mes || '01'}-${d.padStart(2,'0')}`);
        const setMes = (m: string) => setModalDataTemp(`${ano || new Date().getFullYear()}-${m.padStart(2,'0')}-${dia || '01'}`);
        const setAno = (a: string) => setModalDataTemp(`${a}-${mes || '01'}-${dia || '01'}`);
        const cor = modalData.tipo === 'prog' ? '#2563eb' : '#16a34a';
        const inputStyle: React.CSSProperties = { flex: 1, padding: '10px 8px', borderRadius: 10, border: '2px solid #e5e7eb', fontSize: 16, outline: 'none', textAlign: 'center', boxSizing: 'border-box' };
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalData(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', minWidth: 300, boxShadow: '0 16px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Calendar size={20} style={{ color: cor }} />
                <span style={{ fontWeight: 800, fontSize: 16 }}>
                  {modalData.tipo === 'prog' ? 'Data Programada' : 'Data Concluída'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, marginTop: 0 }}>
                {modalData.tipo === 'prog' ? 'Data prevista para execução do item.' : 'Data em que o item foi concluído.'}
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>DIA</div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>MÊS</div>
                <div style={{ flex: '1.5', textAlign: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>ANO</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" min={1} max={31} placeholder="DD" value={dia} onChange={e => setDia(e.target.value.slice(-2).padStart(2,'0') || e.target.value)} style={inputStyle} />
                <input type="number" min={1} max={12} placeholder="MM" value={mes} onChange={e => setMes(e.target.value.slice(-2).padStart(2,'0') || e.target.value)} style={inputStyle} />
                <input type="number" min={2000} max={2100} placeholder="AAAA" value={ano} onChange={e => setAno(e.target.value)} style={{ ...inputStyle, flex: 1.5 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button onClick={() => setModalData(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
                <button onClick={() => {
                  const novas = [...linhasPersonalizado];
                  if (modalData.tipo === 'prog') novas[modalData.idx] = { ...novas[modalData.idx], dataProg: modalDataTemp };
                  else novas[modalData.idx] = { ...novas[modalData.idx], dataConc: modalDataTemp };
                  setLinhasPersonalizado(novas);
                  setModalData(null);
                }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: cor, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal QR Code compartilhar */}
      {modalQRShare && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalQRShare(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: '90%', maxWidth: 360, boxShadow: '0 16px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Compartilhar formulário</span>
              <button onClick={() => setModalQRShare(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>
            <QRCodeCanvas value={modalQRShare} size={200} level="M" />
            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: 0 }}>Escaneie para abrir o formulário em outro dispositivo</p>
            <button onClick={() => navigator.clipboard.writeText(modalQRShare).then(() => alert('Link copiado!')).catch(() => alert(modalQRShare))} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Share2 size={14} /> Copiar link
            </button>
          </div>
        </div>
      )}

      {/* Modal histórico de checagens */}
      {modalHistorico && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalHistorico(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', width: '94%', maxWidth: 560, boxShadow: '0 16px 60px rgba(0,0,0,0.3)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <BarChart3 size={20} style={{ color: '#6b7280' }} />
              <span style={{ fontWeight: 800, fontSize: 16 }}>Histórico de Checagens</span>
              <button onClick={() => setModalHistorico(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>
            {checagens.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', margin: '24px 0' }}>Nenhuma checagem registrada ainda.</p>
            ) : (
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {checagens.map(c => {
                  const ok = c.linhas.filter(l => l.status === 'ok').length;
                  const nok = c.linhas.filter(l => l.status === 'nok').length;
                  const total = c.linhas.length;
                  return (
                    <div key={c.id} style={{ padding: '12px 14px', borderRadius: 12, border: '2px solid #e5e7eb', background: '#f9fafb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{c.titulo}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.equip && `${c.equip} · `}{new Date(c.registradoEm).toLocaleString('pt-BR')}</div>
                        </div>
                        <button onClick={() => { const lista = checagens.filter(x => x.id !== c.id); setChecagens(lista); salvarChecagens(lista); }} style={{ padding: '5px 8px', borderRadius: 8, border: '2px solid #fca5a5', background: '#fef2f2', cursor: 'pointer' }}>
                          <Trash2 size={13} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>✓ OK: {ok}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>✗ NOK: {nok}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', fontWeight: 700 }}>— Pend: {total - ok - nok}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal texto do Checklist */}
      {modalTextoChecklist && (
        <div className={styles.pvOverlay} style={{ zIndex: 9000 }} onClick={() => setModalTextoChecklist(false)}>
          <div className={styles.pvModal} onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className={styles.pvHeader}>
              <div className={styles.pvHeaderTopo}>
                <FileText size={20} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 900, fontSize: 16 }}>Descrição do Checklist</span>
                <button
                  onClick={() => setModalTextoChecklist(false)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <textarea
                rows={8}
                placeholder="Descreva os itens, procedimentos ou observações do checklist..."
                value={checklistPersonalizado}
                onChange={e => setChecklistPersonalizado(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '2px solid #e5e7eb', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6,
                }}
              />
              <button
                onClick={() => setModalTextoChecklist(false)}
                style={{
                  alignSelf: 'flex-end', padding: '10px 24px', borderRadius: 10,
                  background: '#FFD600', border: 'none', fontWeight: 800, fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChecklistPage;
