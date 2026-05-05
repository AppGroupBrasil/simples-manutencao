import React, { useState, useMemo, useRef } from 'react';
import { Search, X, Clock, AlertCircle, Filter, Inbox, FileDown, BarChart3, Hash, ClipboardList, Calendar, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import type { ChamadoManutencao } from '../Manutencao/types';
import { visualizarChamado } from '../../utils/visualizarChamado';
import styles from './MeusChamados.module.css';

// ── Carrega chamados do localStorage ─────────────────────────────────────
const CHAMADOS_KEY = 'manutencao_chamados_v2';

const fmtData = (ts?: number) => ts
  ? new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '—';

// ── Impressão individual ──────────────────────────────────────────────────
function imprimirChamado(c: ChamadoManutencao) {
  const statusLabel: Record<string, string> = {
    aberto: 'Aberto', em_andamento: 'Em Andamento', concluido: 'Concluído', cancelado: 'Cancelado',
  };
  const statusCor: Record<string, string> = {
    aberto: '#455a64', em_andamento: '#e65100', concluido: '#2e7d32', cancelado: '#b71c1c',
  };
  const tempo = (ms?: number) => {
    if (!ms) return '—';
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s` : `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  };

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Chamado ${c.protocolo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 32px; }
    .header { background: linear-gradient(135deg,#FFD600,#FF8F00); border-radius: 16px; padding: 24px 28px; margin-bottom: 24px; display: flex; align-items: center; gap: 18px; }
    .icone { font-size: 52px; }
    .titulo { font-size: 26px; font-weight: 900; color: #0D0D0D; }
    .protocolo { font-family: monospace; font-size: 13px; font-weight: 700; color: #7a3500; background: rgba(255,255,255,0.5); padding: 4px 12px; border-radius: 6px; margin-top: 6px; display: inline-block; }
    .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 13px; color: #fff; background: ${statusCor[c.status] || '#455a64'}; margin-left: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .item { background: #f9f9f9; border-radius: 10px; padding: 14px 16px; border-left: 4px solid #FFD600; }
    .label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
    .valor { font-size: 15px; font-weight: 700; color: #111; }
    .valor-destaque { font-size: 18px; font-weight: 900; color: #FF8F00; font-family: monospace; }
    .obs { background: #fffbeb; border: 1px solid #FFD600; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; }
    .obs .label { margin-bottom: 6px; }
    .footer { text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; }
    @media print { body { padding: 16px; } }
  </style></head><body>
  <div class="header">
    <div class="icone">${c.funcaoIcone}</div>
    <div>
      <div class="titulo">${c.funcaoNome}</div>
      <div>
        <span class="protocolo"># ${c.protocolo}</span>
        <span class="status">${statusLabel[c.status] || c.status}</span>
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="item"><div class="label">Responsável</div><div class="valor">${c.responsavel}${c.responsavelCargo ? ` — ${c.responsavelCargo}` : ''}</div></div>
    <div class="item"><div class="label">Criado por</div><div class="valor">${c.criadoPorNome}</div></div>
    <div class="item"><div class="label">▶ Horário inicial</div><div class="valor">${fmtData(c.horarioInicial)}</div></div>
    <div class="item"><div class="label">⏹ Horário final</div><div class="valor">${fmtData(c.horarioFinal)}</div></div>
    <div class="item"><div class="label">⏱ Tempo total</div><div class="valor-destaque">${tempo(c.tempoTotal)}</div></div>
    <div class="item"><div class="label">📅 Criado em</div><div class="valor">${fmtData(c.criadoEm)}</div></div>
  </div>

  ${c.observacoes ? `<div class="obs"><div class="label">📝 Observações</div><div class="valor">${c.observacoes}</div></div>` : ''}

  ${c.localizacao?.endereco ? `<div class="obs"><div class="label">📍 Localização</div><div class="valor">${c.localizacao.endereco}</div></div>` : ''}

  ${(() => {
    const entries = Object.entries(c.respostas || {});
    if (!entries.length) return '';
    let respostasHtml = '<div style="margin-bottom:20px;"><div class="label" style="margin-bottom:10px;">📝 Respostas do formulário</div>';
    entries.forEach(([, val]) => {
      if (val === '' || val === null || val === undefined) return;
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0].descricao !== undefined) {
        val.forEach((item: any) => {
          respostasHtml += '<div style="background:#f9f9f9;border-radius:10px;padding:12px 16px;border-left:4px solid #FFD600;margin-bottom:10px;">';
          if (item.descricao) respostasHtml += '<div style="font-size:14px;font-weight:600;color:#111;margin-bottom:6px;">' + item.descricao + '</div>';
          if (item.fotos?.length) {
            respostasHtml += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
            item.fotos.forEach((f: string) => { respostasHtml += '<img src="' + f + '" style="width:140px;height:105px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" />'; });
            respostasHtml += '</div>';
          }
          respostasHtml += '</div>';
        });
      } else if (typeof val === 'string' && val.startsWith('data:image')) {
        respostasHtml += '<div style="margin-bottom:10px;"><img src="' + val + '" style="max-width:200px;border-radius:8px;border:1px solid #e5e7eb;" /></div>';
      } else if (Array.isArray(val) && val.some((v: any) => typeof v === 'string' && v.startsWith('data:image'))) {
        respostasHtml += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">';
        val.forEach((v: any) => { if (typeof v === 'string' && v.startsWith('data:image')) respostasHtml += '<img src="' + v + '" style="width:140px;height:105px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" />'; });
        respostasHtml += '</div>';
      } else {
        const texto = typeof val === 'object' ? JSON.stringify(val) : String(val);
        respostasHtml += '<div style="background:#f9f9f9;border-radius:10px;padding:10px 14px;border-left:4px solid #FFD600;margin-bottom:8px;font-size:14px;color:#111;">' + texto + '</div>';
      }
    });
    respostasHtml += '</div>';
    return respostasHtml;
  })()}

  <div style="text-align:center;margin:20px 0;padding:20px;background:#f9fafb;border-radius:14px;border:1.5px solid #e4e4e7;">
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#888;margin-bottom:10px;">📱 QR Code do Chamado</div>
    <canvas id="qrCanvas" width="320" height="320" style="width:160px;height:160px;border-radius:8px;"></canvas>
    <div style="font-size:11px;color:#9ca3af;margin-top:8px;">QR Code · ${c.protocolo}</div>
  </div>

  <div class="footer">Simples Manutenção · Impresso em ${new Date().toLocaleString('pt-BR')}</div>
  <script>
    (function() {
      var qrUrl = '${globalThis.location.origin}/chamado/${c.protocolo}';
      function doPrint() {
        setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 300);
      }
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
      s.onload = function() {
        if (typeof QRCode !== 'undefined') {
          var canvas = document.getElementById('qrCanvas');
          QRCode.toCanvas(canvas, qrUrl, { width: 320, margin: 2 }, function(err) {
            doPrint();
          });
        } else { doPrint(); }
      };
      s.onerror = function() { doPrint(); };
      document.head.appendChild(s);
    })();
  </script>
  </body></html>`;

  const janela = window.open('', '_blank', 'width=800,height=700');
  if (janela) { janela.document.write(html); janela.document.close(); }
}

function carregarChamados(): ChamadoManutencao[] {
  try {
    const v = localStorage.getItem(CHAMADOS_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

// ── Utilitários ───────────────────────────────────────────────────────────
function formatarTempo(ms?: number) {
  if (!ms) return '—';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
  return `${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
}

function formatarDataHora(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function diasAtras(ts: number) {
  const diff = Date.now() - ts;
  const dias = Math.floor(diff / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  return `${dias} dias atrás`;
}

const STATUS_INFO: Record<string, { label: string; cor: string; bg: string; icone: string }> = {
  aberto:       { label: 'Aberto',       cor: '#455a64', bg: '#eceff1', icone: '🔵' },
  em_andamento: { label: 'Em Andamento', cor: '#e65100', bg: '#fff3e0', icone: '🟠' },
  concluido:    { label: 'Concluído',    cor: '#2e7d32', bg: '#e8f5e9', icone: '✅' },
  cancelado:    { label: 'Cancelado',    cor: '#b71c1c', bg: '#ffebee', icone: '❌' },
};

function salvarChamados(lista: ChamadoManutencao[]) {
  localStorage.setItem(CHAMADOS_KEY, JSON.stringify(lista));
}

const MeusChamadosPage: React.FC = () => {
  const { usuario } = useAuth();
  const role   = usuario?.role || 'funcionario';
  const userId = usuario?.id   || '';

  const [chamados, setChamados] = useState<ChamadoManutencao[]>(carregarChamados);
  const [busca, setBusca]               = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo]     = useState('todos');
  const [expandido, setExpandido]       = useState<string | null>(null);
  const [verGraficos, setVerGraficos]   = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [relDataInicio, setRelDataInicio] = useState('');
  const [relDataFim, setRelDataFim]       = useState('');
  const [relStatus, setRelStatus]         = useState('todos');
  const [relTipoManut, setRelTipoManut]   = useState('todos');
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Atualizar status ──────────────────────────────────────────────────────
  const atualizarStatus = (id: string, novoStatus: ChamadoManutencao['status']) => {
    setChamados(prev => {
      const p = prev.map(c => c.id === id ? {
        ...c, status: novoStatus,
        ...(novoStatus === 'concluido' ? { horarioFinal: Date.now(), tempoTotal: Date.now() - c.horarioInicial } : {}),
      } : c);
      salvarChamados(p);
      return p;
    });
  };

  // ── Filtrar por hierarquia ────────────────────────────────────────────────
  const chamadosVisiveis = useMemo(() => {
    if (role === 'master') return chamados;
    if (role === 'administrador') {
      return chamados.filter(c =>
        c.criadoPor === userId || c.adminId === userId
      );
    }
    if (role === 'supervisor') {
      return chamados.filter(c =>
        c.criadoPor === userId || c.supervisorId === userId
      );
    }
    // Funcionário vê chamados atribuídos a ele
    return chamados.filter(c => c.responsavelId === userId || c.criadoPor === userId);
  }, [chamados, role, userId]);

  // ── Tipos únicos ──────────────────────────────────────────────────────────
  const tipos = useMemo(() => {
    const set = new Set(chamadosVisiveis.map(c => c.funcaoNome));
    return Array.from(set);
  }, [chamadosVisiveis]);

  // ── Busca + filtros ───────────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    return chamadosVisiveis.filter(c => {
      if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false;
      if (filtroTipo   !== 'todos' && c.funcaoNome !== filtroTipo) return false;
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const texto = [
          c.funcaoNome, c.responsavel, c.criadoPorNome,
          STATUS_INFO[c.status]?.label,
          formatarDataHora(c.criadoEm),
          Object.values(c.respostas || {}).join(' '),
        ].join(' ').toLowerCase();
        return texto.includes(q);
      }
      return true;
    });
  }, [chamadosVisiveis, busca, filtroStatus, filtroTipo]);

  // ── Contadores ────────────────────────────────────────────────────────────
  const total       = chamadosVisiveis.length;
  const abertos     = chamadosVisiveis.filter(c => c.status === 'aberto' || c.status === 'em_andamento').length;
  const concluidos  = chamadosVisiveis.filter(c => c.status === 'concluido').length;

  // ── Dados para gráficos ───────────────────────────────────────────────────
  const dadosPorStatus = useMemo(() => [
    { name: 'Abertos',       value: chamadosVisiveis.filter(c => c.status === 'aberto').length,       fill: '#455a64' },
    { name: 'Em Andamento',  value: chamadosVisiveis.filter(c => c.status === 'em_andamento').length,  fill: '#e65100' },
    { name: 'Concluídos',    value: chamadosVisiveis.filter(c => c.status === 'concluido').length,     fill: '#2e7d32' },
    { name: 'Cancelados',    value: chamadosVisiveis.filter(c => c.status === 'cancelado').length,     fill: '#b71c1c' },
  ].filter(d => d.value > 0), [chamadosVisiveis]);

  const dadosPorTipo = useMemo(() => {
    const map: Record<string, number> = {};
    chamadosVisiveis.forEach(c => { map[c.funcaoNome] = (map[c.funcaoNome] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [chamadosVisiveis]);

  const dadosPorData = useMemo(() => {
    const map: Record<string, number> = {};
    chamadosVisiveis.forEach(c => {
      const d = new Date(c.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).slice(-14).map(([data, total]) => ({ data, total }));
  }, [chamadosVisiveis]);

  const dadosPorResponsavel = useMemo(() => {
    const map: Record<string, number> = {};
    chamadosVisiveis.forEach(c => { map[c.responsavel] = (map[c.responsavel] || 0) + 1; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([nome, total]) => ({ nome, total }));
  }, [chamadosVisiveis]);

  const CORES_GRAFICO = ['#FFD600','#FF8F00','#2962FF','#00BFA5','#AA00FF','#D50000','#00C853','#FF6D00'];

  // ── Gerar relatório filtrado ──────────────────────────────────────────────
  function gerarRelatorio() {
    let dados = [...chamadosVisiveis];

    // Filtro por data
    if (relDataInicio) {
      const inicio = new Date(relDataInicio).setHours(0,0,0,0);
      dados = dados.filter(c => c.criadoEm >= inicio);
    }
    if (relDataFim) {
      const fim = new Date(relDataFim).setHours(23,59,59,999);
      dados = dados.filter(c => c.criadoEm <= fim);
    }

    // Filtro por status
    if (relStatus !== 'todos') {
      dados = dados.filter(c => c.status === relStatus);
    }

    // Filtro por tipo (livre vs personalizada)
    if (relTipoManut === 'livre') {
      dados = dados.filter(c => c.funcaoId === 'livre');
    } else if (relTipoManut === 'personalizada') {
      dados = dados.filter(c => c.funcaoId !== 'livre');
    }

    // Ordenar por data
    dados.sort((a, b) => b.criadoEm - a.criadoEm);

    const statusLabel: Record<string, string> = {
      aberto: 'Aberto', em_andamento: 'Em Andamento', concluido: 'Concluído', cancelado: 'Cancelado',
    };
    const statusCor: Record<string, string> = {
      aberto: '#455a64', em_andamento: '#e65100', concluido: '#2e7d32', cancelado: '#b71c1c',
    };
    const fmtTempo = (ms?: number) => {
      if (!ms) return '—';
      const t = Math.floor(ms / 1000);
      const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
      return h > 0 ? `${h}h ${String(m).padStart(2,'0')}m` : `${m}m ${String(s).padStart(2,'0')}s`;
    };

    // Resumo
    const totalRel = dados.length;
    const abertosRel = dados.filter(c => c.status === 'aberto').length;
    const andamentoRel = dados.filter(c => c.status === 'em_andamento').length;
    const concluidosRel = dados.filter(c => c.status === 'concluido').length;
    const canceladosRel = dados.filter(c => c.status === 'cancelado').length;
    const livreRel = dados.filter(c => c.funcaoId === 'livre').length;
    const persRel = dados.filter(c => c.funcaoId !== 'livre').length;

    // Filtros aplicados
    const filtrosTexto: string[] = [];
    if (relDataInicio || relDataFim) {
      const di = relDataInicio ? new Date(relDataInicio).toLocaleDateString('pt-BR') : 'início';
      const df = relDataFim ? new Date(relDataFim).toLocaleDateString('pt-BR') : 'hoje';
      filtrosTexto.push(`Período: ${di} até ${df}`);
    }
    if (relStatus !== 'todos') filtrosTexto.push(`Status: ${statusLabel[relStatus] || relStatus}`);
    if (relTipoManut !== 'todos') filtrosTexto.push(`Tipo: ${relTipoManut === 'livre' ? 'Manutenção Livre' : 'Manutenção Personalizada'}`);
    if (!filtrosTexto.length) filtrosTexto.push('Sem filtros — todos os chamados');

    const linhasHtml = dados.map((c, idx) => {
      // Fotos do chamado
      let fotosHtml = '';
      const entries = Object.entries(c.respostas || {});
      entries.forEach(([, val]) => {
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0].descricao !== undefined) {
          val.forEach((item: any) => {
            if (item.fotos?.length) {
              fotosHtml += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">';
              item.fotos.forEach((f: string) => { fotosHtml += '<img src="' + f + '" style="width:100px;height:75px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" />'; });
              fotosHtml += '</div>';
            }
          });
        } else if (typeof val === 'string' && val.startsWith('data:image')) {
          fotosHtml += '<div style="margin-top:6px;"><img src="' + val + '" style="max-width:120px;border-radius:6px;border:1px solid #e5e7eb;" /></div>';
        } else if (Array.isArray(val) && val.some((v: any) => typeof v === 'string' && v.startsWith('data:image'))) {
          fotosHtml += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">';
          val.forEach((v: any) => { if (typeof v === 'string' && v.startsWith('data:image')) fotosHtml += '<img src="' + v + '" style="width:100px;height:75px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" />'; });
          fotosHtml += '</div>';
        }
      });

      return `
      <tr style="border-bottom:1px solid #f3f4f6;${idx % 2 === 0 ? '' : 'background:#fafafa;'}">
        <td style="padding:10px 8px;font-size:12px;vertical-align:top;">
          <div style="font-weight:700;">${c.funcaoIcone} ${c.funcaoNome}</div>
          <div style="font-size:10px;color:#888;font-family:monospace;">#${c.protocolo}</div>
        </td>
        <td style="padding:10px 8px;font-size:12px;vertical-align:top;">${c.responsavel}</td>
        <td style="padding:10px 8px;font-size:12px;vertical-align:top;">
          <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-weight:800;font-size:11px;color:#fff;background:${statusCor[c.status] || '#455a64'};">${statusLabel[c.status] || c.status}</span>
        </td>
        <td style="padding:10px 8px;font-size:12px;vertical-align:top;">${fmtData(c.criadoEm)}</td>
        <td style="padding:10px 8px;font-size:12px;vertical-align:top;font-weight:700;color:#FF8F00;font-family:monospace;">${fmtTempo(c.tempoTotal)}</td>
        <td style="padding:10px 8px;font-size:12px;vertical-align:top;">
          ${c.funcaoId === 'livre' ? '<span style="background:#ede9fe;color:#7c3aed;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">Livre</span>' : '<span style="background:#fff7ed;color:#c2410c;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">Personalizada</span>'}
          ${fotosHtml}
        </td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Relatório de Manutenção</title>
    <style>
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:Arial,sans-serif; background:#fff; color:#111; padding:28px; }
      .header { background:linear-gradient(135deg,#FFD600,#FF8F00); border-radius:16px; padding:22px 26px; margin-bottom:20px; }
      .header h1 { font-size:24px; font-weight:900; color:#0D0D0D; margin-bottom:4px; }
      .header p { font-size:12px; color:rgba(13,13,13,0.7); font-weight:600; }
      .filtros { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:14px 18px; margin-bottom:18px; font-size:12px; color:#6b7280; }
      .filtros strong { color:#111; }
      .resumo { display:grid; grid-template-columns:repeat(auto-fit,minmax(100px,1fr)); gap:10px; margin-bottom:20px; }
      .resumo-card { background:#f9f9f9; border-radius:10px; padding:12px 14px; text-align:center; border-left:4px solid #FFD600; }
      .resumo-card .num { font-size:22px; font-weight:900; color:#FF8F00; }
      .resumo-card .lbl { font-size:10px; font-weight:800; text-transform:uppercase; color:#888; letter-spacing:0.4px; }
      table { width:100%; border-collapse:collapse; }
      th { background:#0D0D0D; color:#FFD600; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; padding:10px 8px; text-align:left; }
      th:first-child { border-radius:8px 0 0 0; }
      th:last-child { border-radius:0 8px 0 0; }
      .footer { text-align:center; font-size:10px; color:#aaa; border-top:1px solid #eee; padding-top:14px; margin-top:24px; }
      @media print {
        body { padding:16px; }
        tr { break-inside:avoid; }
      }
    </style></head><body>
    <div class="header">
      <h1>📊 Relatório de Manutenção</h1>
      <p>Gerado em ${new Date().toLocaleString('pt-BR')} · ${usuario?.nome || ''}</p>
    </div>

    <div class="filtros">
      <strong>🔍 Filtros aplicados:</strong> ${filtrosTexto.join(' · ')}
    </div>

    <div class="resumo">
      <div class="resumo-card"><div class="num">${totalRel}</div><div class="lbl">Total</div></div>
      <div class="resumo-card"><div class="num" style="color:#455a64">${abertosRel}</div><div class="lbl">Abertos</div></div>
      <div class="resumo-card"><div class="num" style="color:#e65100">${andamentoRel}</div><div class="lbl">Em Andamento</div></div>
      <div class="resumo-card"><div class="num" style="color:#2e7d32">${concluidosRel}</div><div class="lbl">Concluídos</div></div>
      <div class="resumo-card"><div class="num" style="color:#b71c1c">${canceladosRel}</div><div class="lbl">Cancelados</div></div>
      <div class="resumo-card"><div class="num" style="color:#7c3aed">${livreRel}</div><div class="lbl">Livre</div></div>
      <div class="resumo-card"><div class="num" style="color:#c2410c">${persRel}</div><div class="lbl">Personalizada</div></div>
    </div>

    ${totalRel === 0 ? '<p style="text-align:center;color:#9ca3af;font-size:14px;padding:40px 0;">Nenhum chamado encontrado com os filtros selecionados.</p>' : `
    <table>
      <thead>
        <tr>
          <th>Chamado</th>
          <th>Responsável</th>
          <th>Status</th>
          <th>Data</th>
          <th>Tempo</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>${linhasHtml}</tbody>
    </table>`}

    <div class="footer">Simples Manutenção · Relatório gerado automaticamente</div>
    <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
    </body></html>`;

    const janela = window.open('', '_blank', 'width=900,height=800');
    if (janela) { janela.document.write(html); janela.document.close(); }
    setMostrarRelatorio(false);
  }

  // ── Label de perfil ───────────────────────────────────────────────────────
  const perfilLabel: Record<string, string> = {
    master:        'Visão global — todos os chamados de todos os usuários',
    administrador: 'Visão administrador — todos os chamados da sua empresa',
    supervisor:    'Visão supervisor — sua equipe',
    funcionario:   'Seus chamados enviados',
  };

  return (
    <div className={styles.page} ref={contentRef} id="meus-chamados-content">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerEsquerda}>
          <span className={styles.headerIcone}>📥</span>
          <div>
            <h1 className={styles.headerTitulo}>Meus Chamados</h1>
            <p className={styles.headerSub}>{perfilLabel[role]}</p>
          </div>
        </div>

        {/* Cards de resumo + ações */}
        <div className={styles.headerDireita}>
          <div className={styles.resumoCards}>
            <div className={styles.resumoCard}>
              <span className={styles.resumoNumero}>{total}</span>
              <span className={styles.resumoLabel}>Total</span>
            </div>
            <div className={`${styles.resumoCard} ${styles.resumoCardAmbar}`}>
              <span className={styles.resumoNumero}>{abertos}</span>
              <span className={styles.resumoLabel}>Em aberto</span>
            </div>
            <div className={`${styles.resumoCard} ${styles.resumoCardVerde}`}>
              <span className={styles.resumoNumero}>{concluidos}</span>
              <span className={styles.resumoLabel}>Concluídos</span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className={styles.headerAcoes}>
            <button
              className={`${styles.btnAcao} ${verGraficos ? styles.btnAcaoAtivo : ''}`}
              onClick={() => setVerGraficos(v => !v)}
              title="Ver relatórios e gráficos"
            >
              <BarChart3 size={17} />
              Relatórios
            </button>
            <button
              className={styles.btnRelatorio}
              onClick={() => setMostrarRelatorio(true)}
              title="Gerar relatório filtrado"
            >
              <ClipboardList size={17} />
              Relatório
            </button>
            <button
              className={styles.btnPdf}
              onClick={() => globalThis.print()}
              title="Gerar PDF / Imprimir"
            >
              <FileDown size={17} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Seção de gráficos ─────────────────────────────────────────────── */}
      {verGraficos && chamadosVisiveis.length > 0 && (
        <div className={styles.graficosSecao}>
          <h2 className={styles.graficosTitulo}>
            <BarChart3 size={20} /> Relatórios e Gráficos
          </h2>

          <div className={styles.graficosGrid}>

            {/* Gráfico por data (últimos 14 dias) */}
            {dadosPorData.length > 0 && (
              <div className={styles.graficoCard}>
                <h3 className={styles.graficoCardTitulo}>📅 Chamados por data (últimos 14 dias)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dadosPorData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                    <XAxis dataKey="data" tick={{ fontSize: 11, fill: 'var(--cor-texto-secundario)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--cor-texto-secundario)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8 }}
                      labelStyle={{ fontWeight: 700, color: 'var(--cor-texto)' }}
                    />
                    <Bar dataKey="total" fill="#FFD600" radius={[4, 4, 0, 0]} name="Chamados" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* PieChart por status */}
            {dadosPorStatus.length > 0 && (
              <div className={styles.graficoCard}>
                <h3 className={styles.graficoCardTitulo}>📊 Distribuição por status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dadosPorStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {dadosPorStatus.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* BarChart por tipo */}
            {dadosPorTipo.length > 0 && (
              <div className={styles.graficoCard}>
                <h3 className={styles.graficoCardTitulo}>🏷️ Chamados por tipo</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dadosPorTipo} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--cor-texto-secundario)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--cor-texto-secundario)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8 }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Chamados">
                      {dadosPorTipo.map((entry, i) => (
                        <Cell key={entry.name} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* BarChart por responsável (top 8) */}
            {dadosPorResponsavel.length > 0 && (
              <div className={styles.graficoCard}>
                <h3 className={styles.graficoCardTitulo}>👤 Top responsáveis</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dadosPorResponsavel} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--cor-texto-secundario)' }} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: 'var(--cor-texto-secundario)' }} width={90} />
                    <Tooltip
                      contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8 }}
                    />
                    <Bar dataKey="total" fill="#FF8F00" radius={[0, 4, 4, 0]} name="Chamados" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Busca inteligente ─────────────────────────────────────────────── */}
      <div className={styles.buscaWrapper}>
        <Search size={18} className={styles.buscaIcone} />
        <input
          className={styles.buscaInput}
          placeholder="Buscar por tipo, responsável, data, observações, status..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        {busca && (
          <button className={styles.buscaLimpar} onClick={() => setBusca('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Filtros de status ─────────────────────────────────────────────── */}
      <div className={styles.filtrosRow}>
        {[
          { key: 'todos',        label: 'Todos',        count: total },
          { key: 'aberto',       label: 'Abertos',      count: chamadosVisiveis.filter(c => c.status === 'aberto').length },
          { key: 'em_andamento', label: 'Em Andamento', count: chamadosVisiveis.filter(c => c.status === 'em_andamento').length },
          { key: 'concluido',    label: 'Concluídos',   count: chamadosVisiveis.filter(c => c.status === 'concluido').length },
          { key: 'cancelado',    label: 'Cancelados',   count: chamadosVisiveis.filter(c => c.status === 'cancelado').length },
        ].map(f => (
          <button
            key={f.key}
            className={`${styles.filtroBotao} ${filtroStatus === f.key ? styles.filtroBotaoAtivo : ''}`}
            onClick={() => setFiltroStatus(f.key)}
          >
            {f.label}
            <span className={styles.filtroCount}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* ── Filtro por tipo ───────────────────────────────────────────────── */}
      {tipos.length > 1 && (
        <div className={styles.filtrosRow} style={{ marginTop: -4 }}>
          <Filter size={14} style={{ color: 'var(--cor-texto-secundario)', flexShrink: 0, alignSelf: 'center' }} />
          <button
            className={`${styles.filtroBotao} ${filtroTipo === 'todos' ? styles.filtroBotaoAtivo : ''}`}
            onClick={() => setFiltroTipo('todos')}
          >
            Todos os tipos
          </button>
          {tipos.map(t => (
            <button
              key={t}
              className={`${styles.filtroBotao} ${filtroTipo === t ? styles.filtroBotaoAtivo : ''}`}
              onClick={() => setFiltroTipo(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* ── Resultado da busca ────────────────────────────────────────────── */}
      {busca && (
        <p className={styles.resultadoBusca}>
          {filtrados.length === 0
            ? 'Nenhum resultado para esta busca'
            : (() => { const s = filtrados.length === 1 ? '' : 's'; return `${filtrados.length} resultado${s} encontrado${s}`; })()}
        </p>
      )}

      {/* ── Lista vazia ───────────────────────────────────────────────────── */}
      {chamadosVisiveis.length === 0 && (
        <div className={styles.vazio}>
          <Inbox size={72} strokeWidth={1} />
          <p className={styles.vazioTitulo}>Nenhum chamado ainda</p>
          <p className={styles.vazioSub}>Quando você abrir um chamado no módulo de Manutenção, ele aparecerá aqui.</p>
        </div>
      )}

      {/* ── Lista de chamados ─────────────────────────────────────────────── */}
      {filtrados.length > 0 && (
        <div className={styles.lista}>
          {filtrados.map(c => {
            const info   = STATUS_INFO[c.status] || STATUS_INFO.aberto;
            const aberto = expandido === c.id;

            return (
              <div key={c.id} className={`${styles.card} ${c.status === 'concluido' ? styles.cardConcluido : ''}`}>

                {/* Cabeçalho clicável */}
                <button
                  className={styles.cardHeader}
                  onClick={() => setExpandido(aberto ? null : c.id)}
                >
                  {/* Faixa lateral colorida */}
                  <div
                    className={styles.cardFaixa}
                    style={{ background: c.funcaoCor || '#FFD600' }}
                  />

                  <div className={styles.cardConteudo}>
                    <div className={styles.cardTopo}>
                      {/* Tipo + ícone */}
                      <div className={styles.cardTipo}>
                        <span className={styles.cardIcone}>{c.funcaoIcone}</span>
                        <div>
                          <div className={styles.cardNome}>{c.funcaoNome}</div>
                          {c.protocolo && (
                            <div className={styles.cardProtocolo}>
                              <Hash size={10} />
                              {c.protocolo}
                            </div>
                          )}
                          <div className={styles.cardData}>
                            {diasAtras(c.criadoEm)} · {formatarDataHora(c.criadoEm)}
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={styles.statusBadge}
                        style={{ background: info.bg, color: info.cor }}
                      >
                        {info.icone} {info.label}
                      </span>
                    </div>

                    {/* Info rápida */}
                    <div className={styles.cardInfoRow}>
                      <span className={styles.cardInfoItem}>
                        👤 <strong>{c.responsavel}</strong>
                        <span style={{ color:'var(--cor-texto-secundario)', fontWeight:500, marginLeft:6 }}>
                          · {formatarDataHora(c.criadoEm)}
                        </span>
                      </span>
                      {c.tempoTotal && (
                        <span className={styles.cardInfoItem}>
                          <Clock size={13} />
                          <strong>Tempo:</strong> {formatarTempo(c.tempoTotal)}
                        </span>
                      )}
                      {c.status !== 'concluido' && !!c.horarioInicial && (
                        <span className={styles.cardInfoItem}>
                          ▶ {new Date(c.horarioInicial).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={styles.expandirSeta}>{aberto ? '▲' : '▼'}</span>
                </button>

                {/* Detalhes expandidos */}
                {aberto && (
                  <div className={styles.detalhes}>

                    {/* Ações de status */}
                    {c.status !== 'concluido' && c.status !== 'cancelado' && (
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {c.status === 'aberto' && (
                          <button
                            onClick={() => atualizarStatus(c.id, 'em_andamento')}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background:'#FF8F00', color:'#0D0D0D', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:'pointer' }}
                          >
                            ▶ Iniciar
                          </button>
                        )}
                        {c.status === 'em_andamento' && (
                          <span style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background:'#fff3e0', color:'#e65100', borderRadius:10, fontSize:14, fontWeight:800 }}>
                            ● Em Andamento
                          </span>
                        )}
                        <button
                          onClick={() => atualizarStatus(c.id, 'concluido')}
                          style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background:'#22c55e', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:'pointer' }}
                        >
                          ✓ Concluir
                        </button>
                      </div>
                    )}

                    {/* Botões visualizar + PDF individual */}
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
                      <button
                        onClick={() => visualizarChamado(c)}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer' }}
                      >
                        <Eye size={15} /> Visualizar
                      </button>
                      <button
                        onClick={() => imprimirChamado(c)}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#dc2626', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer' }}
                      >
                        <FileDown size={15} /> PDF deste chamado
                      </button>
                    </div>

                    {/* Grid de datas e tempo */}
                    <div className={styles.detalheGrid}>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheLabel}>▶ Horário inicial</span>
                        <span className={styles.detalheValor}>
                          {c.horarioInicial ? formatarDataHora(c.horarioInicial) : '—'}
                        </span>
                      </div>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheLabel}>⏹ Horário final</span>
                        <span className={styles.detalheValor}>
                          {c.horarioFinal ? formatarDataHora(c.horarioFinal) : 'Em aberto'}
                        </span>
                      </div>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheLabel}>⏱ Tempo total</span>
                        <span className={styles.detalheValorDestaque}>
                          {formatarTempo(c.tempoTotal)}
                        </span>
                      </div>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheLabel}>📋 ID</span>
                        <span className={styles.detalheValorMono}>{c.id}</span>
                      </div>
                    </div>

                    {/* Respostas do formulário */}
                    {Object.entries(c.respostas || {}).some(([, v]) => v !== '' && v !== null && v !== undefined) && (
                      <div className={styles.respostas}>
                        <p className={styles.respostasLabel}>📝 Respostas do formulário</p>
                        {Object.entries(c.respostas).map(([uid, val]) => {
                          if (val === '' || val === null || val === undefined) return null;
                          // Itens de manutenção livre (array de {id, descricao, fotos})
                          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0].descricao !== undefined) {
                            return val.map((item: any, idx: number) => (
                              <div key={`${uid}-${idx}`} className={styles.respostaItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                {item.descricao && <span className={styles.respostaTexto}>{item.descricao}</span>}
                                {item.fotos?.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                                    {item.fotos.map((f: string) => (
                                      <button key={f} type="button" onClick={() => setFotoAmpliada(f)} style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in' }}>
                                        <img src={f} alt="foto"
                                          style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ));
                          }
                          // Imagem base64 única
                          if (typeof val === 'string' && val.startsWith('data:image')) {
                            return (
                              <div key={uid} className={styles.respostaItem}>
                                <button type="button" onClick={() => setFotoAmpliada(val)} style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in' }}>
                                  <img src={val} alt="foto"
                                    style={{ maxWidth: 120, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                </button>
                              </div>
                            );
                          }
                          // Array de imagens base64
                          if (Array.isArray(val) && val.some((v: any) => typeof v === 'string' && v.startsWith('data:image'))) {
                            return (
                              <div key={uid} className={styles.respostaItem} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {val.filter((v: any) => typeof v === 'string' && v.startsWith('data:image')).map((f: string) => (
                                  <button key={f} type="button" onClick={() => setFotoAmpliada(f)} style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in' }}>
                                    <img src={f} alt="foto"
                                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                  </button>
                                ))}
                              </div>
                            );
                          }
                          const texto = typeof val === 'object' ? JSON.stringify(val) : String(val);
                          return (
                            <div key={uid} className={styles.respostaItem}>
                              <span className={styles.respostaTexto}>{texto}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lista filtrada vazia (mas há chamados) */}
      {chamadosVisiveis.length > 0 && filtrados.length === 0 && (
        <div className={styles.vazio}>
          <AlertCircle size={64} strokeWidth={1} />
          <p className={styles.vazioTitulo}>Nenhum resultado</p>
          <p className={styles.vazioSub}>Tente outros filtros ou termos na busca.</p>
          <button
            className={styles.btnLimparFiltros}
            onClick={() => { setBusca(''); setFiltroStatus('todos'); setFiltroTipo('todos'); }}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Modal relatório */}
      {mostrarRelatorio && (
        <div className={styles.relOverlay}>
          <button type="button" aria-label="Fechar relatório" tabIndex={-1}
            onClick={() => setMostrarRelatorio(false)}
            style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} />
          <div className={styles.relModal} style={{ position:'relative', zIndex:1 }}>
            <div className={styles.relHeader}>
              <h2 className={styles.relTitulo}>📊 Gerar Relatório</h2>
              <p className={styles.relSub}>Filtre os chamados por data, status e tipo de manutenção</p>
            </div>

            <div className={styles.relBody}>
              {/* Período */}
              <div className={styles.relGrupo}>
                <label className={styles.relLabel}><Calendar size={14} /> Período</label>
                <div className={styles.relDatasRow}>
                  <div className={styles.relDateWrap}>
                    <span className={styles.relDateLabel}>De</span>
                    <input type="date" className={styles.relInput}
                      value={relDataInicio} onChange={e => setRelDataInicio(e.target.value)} />
                  </div>
                  <div className={styles.relDateWrap}>
                    <span className={styles.relDateLabel}>Até</span>
                    <input type="date" className={styles.relInput}
                      value={relDataFim} onChange={e => setRelDataFim(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className={styles.relGrupo}>
                <span className={styles.relLabel}>🔵 Status</span>
                <div className={styles.relOpcoes}>
                  {[
                    { key: 'todos', label: 'Todos' },
                    { key: 'aberto', label: 'Aberto' },
                    { key: 'em_andamento', label: 'Em Andamento' },
                    { key: 'concluido', label: 'Concluído' },
                    { key: 'cancelado', label: 'Cancelado' },
                  ].map(o => (
                    <button key={o.key}
                      className={`${styles.relOpcao} ${relStatus === o.key ? styles.relOpcaoAtiva : ''}`}
                      onClick={() => setRelStatus(o.key)}
                    >{o.label}</button>
                  ))}
                </div>
              </div>

              {/* Tipo de manutenção */}
              <div className={styles.relGrupo}>
                <span className={styles.relLabel}>🏷️ Tipo de Manutenção</span>
                <div className={styles.relOpcoes}>
                  {[
                    { key: 'todos', label: 'Todos' },
                    { key: 'livre', label: '📋 Manutenção Livre' },
                    { key: 'personalizada', label: '⚙️ Manutenção Personalizada' },
                  ].map(o => (
                    <button key={o.key}
                      className={`${styles.relOpcao} ${relTipoManut === o.key ? styles.relOpcaoAtiva : ''}`}
                      onClick={() => setRelTipoManut(o.key)}
                    >{o.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.relFooter}>
              <button className={styles.relBtnCancelar} onClick={() => setMostrarRelatorio(false)}>
                Cancelar
              </button>
              <button className={styles.relBtnGerar} onClick={gerarRelatorio}>
                <FileDown size={16} /> Gerar Relatório PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal foto ampliada */}
      {fotoAmpliada && (
        <div
          role="none"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9e3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out',
          }}
        >
          <button type="button" aria-label="Fechar foto" tabIndex={-1}
            onClick={() => setFotoAmpliada(null)}
            style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'zoom-out' }} />
          <img src={fotoAmpliada} alt="foto ampliada"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 0 60px rgba(0,0,0,0.8)', position:'relative', zIndex:1 }} />
          <button onClick={() => setFotoAmpliada(null)}
            style={{
              position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 2,
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MeusChamadosPage;
