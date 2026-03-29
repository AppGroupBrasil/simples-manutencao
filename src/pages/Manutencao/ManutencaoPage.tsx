import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, Plus, Clock, CheckCircle2, PlayCircle, Trash2, Edit2, Inbox, Home, UserCheck, Search, X, RefreshCw, Share2, Eye, EyeOff, ClipboardList, QrCode, Users, Star, Camera, Play, FileDown, Receipt, RotateCcw, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import WizardCriar from './WizardCriar';
import FormChamado from './FormChamado';
import FormChamadoLivre from './FormChamadoLivre';
import PainelEnviadas from './PainelEnviadas';
import { QRCodeCanvas } from 'qrcode.react';
import type { FuncaoManutencao, ChamadoManutencao, OrcamentoData, ContratoData, ReciboData } from './types';
import { BLOCOS_DISPONIVEIS } from './constants';
import styles from './Manutencao.module.css';
import { useTilesPrefs, GearButton, TilesConfigModal, TilesRenderer } from './TilesConfig';
import type { TileAction } from './TilesConfig';

function gerarQrDataUrl(chamadoId: string): string {
  const wrapper = document.querySelector(`[data-qr-chamado="${chamadoId}"]`);
  const canvas = wrapper?.querySelector('canvas');
  if (canvas) return canvas.toDataURL('image/png');
  return '';
}

const FUNCOES_KEY   = 'manutencao_funcoes_v2';
const CHAMADOS_KEY  = 'manutencao_chamados_v2';
const OS_OCULTOS_KEY = 'sm_os_ocultos';
const CONTADOR_KEY  = 'sm_contador_chamados';
const OS_CONTADOR_KEY = 'sm_contador_os';

function carregar<T>(key: string, padrao: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : padrao; }
  catch { return padrao; }
}
function salvar(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)); }
function gerarId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function formatarTempo(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
  return `${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
}
function gerarProtocolo() {
  const now = new Date();
  const data = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  return `CHM-${data}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}
function proximoNumero(): number {
  const atual = Number(localStorage.getItem(CONTADOR_KEY) || '0');
  const prox  = atual >= 9999 ? 1 : atual + 1;
  localStorage.setItem(CONTADOR_KEY, String(prox));
  return prox;
}
function formatarNumero(n: number) {
  return `#${String(n).padStart(4, '0')}`;
}
function formatarData(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
}

const STATUS_LABEL: Record<string, string> = {
  aberto: '🟡 Aberto',
  em_andamento: '🔵 Em Andamento',
  concluido: '✅ Concluído',
  cancelado: '⛔ Cancelado',
};

function compartilharChamado(c: ChamadoManutencao) {
  const linhas = [
    `🛠️ *${c.funcaoNome}*`,
    ``,
    `${c.numero ? formatarNumero(c.numero) + ' · ' : ''}${c.protocolo}`,
    '👤 Responsável: ' + c.responsavel + (c.responsavelCargo ? ' — ' + c.responsavelCargo : ''),
    `📅 Data: ${formatarData(c.criadoEm)}`,
    `📌 Status: ${STATUS_LABEL[c.status] ?? c.status}`,
  ];
  if (c.horarioInicial) linhas.push(`▶️ Início: ${formatarData(c.horarioInicial)}`);
  if (c.horarioFinal)   linhas.push(`⏹️ Final: ${formatarData(c.horarioFinal)}`);
  if (c.tempoTotal) linhas.push(`⏱️ Tempo total: ${formatarTempo(c.tempoTotal)}`);
  if (c.observacoes) linhas.push(`📝 ${c.observacoes}`);

  // Localização com link para Google Maps
  if (c.localizacao) {
    const { lat, lng, endereco } = c.localizacao;
    if (endereco) linhas.push(`📍 Local: ${endereco}`);
    linhas.push(`🗺️ Ver no mapa: https://www.google.com/maps?q=${lat},${lng}`);
  }

  // itens da manutenção livre
  const itens = c.respostas?.itens as Array<{ descricao: string; fotos: string[] }> | undefined;
  if (itens?.length) {
    linhas.push('');
    itens.forEach((item, i) => {
      if (item.descricao) linhas.push(`📌 Item ${i + 1}: ${item.descricao}`);
    });
  }

  const link = `${globalThis.location.origin}/manutencao/form?chamado=${c.id}`;
  linhas.push('', `🔗 Preencher manutenção: ${link}`, `📱 QR Code: ${link}`, '_Enviado pelo Simples Manutenção_');
  const texto = linhas.join('\n');

  if (navigator.share) {
    navigator.share({ title: c.funcaoNome, text: texto }).catch(() => {});
  } else {
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  }
}

function imprimirChamado(c: ChamadoManutencao) {
  const statusLabel: Record<string, string> = {
    aberto: 'Aberto', em_andamento: 'Em Andamento', concluido: 'Concluído', cancelado: 'Cancelado',
  };
  const statusCor: Record<string, string> = {
    aberto: '#455a64', em_andamento: '#e65100', concluido: '#2e7d32', cancelado: '#b71c1c',
  };
  const fmt = (ts?: number) => ts ? formatarData(ts) : '—';
  const tempo = (ms?: number) => ms ? formatarTempo(ms) : '—';
  const logo = localStorage.getItem('sm_logo_empresa') || '';

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Chamado ${c.protocolo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 32px; }
    .header { background: linear-gradient(135deg,#FFD600,#FF8F00); border-radius: 16px; padding: 24px 28px; margin-bottom: 24px; display: flex; align-items: center; gap: 18px; }
    .header-logo { max-height: 56px; max-width: 180px; object-fit: contain; }
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
    ${logo ? `<img src="${logo}" class="header-logo" alt="Logo" />` : `<div class="icone">${c.funcaoIcone}</div>`}
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
    <div class="item"><div class="label">▶ Horário inicial</div><div class="valor">${fmt(c.horarioInicial)}</div></div>
    <div class="item"><div class="label">⏹ Horário final</div><div class="valor">${fmt(c.horarioFinal)}</div></div>
    <div class="item"><div class="label">⏱ Tempo total</div><div class="valor-destaque">${tempo(c.tempoTotal)}</div></div>
    <div class="item"><div class="label">📅 Criado em</div><div class="valor">${fmt(c.criadoEm)}</div></div>
  </div>

  ${c.observacoes ? `<div class="obs"><div class="label">📝 Observações</div><div class="valor">${c.observacoes}</div></div>` : ''}

  ${c.localizacao?.endereco ? `<div class="obs"><div class="label">📍 Localização</div><div class="valor">${c.localizacao.endereco}</div></div>` : ''}

  <div style="text-align:center;margin:20px 0;padding:20px;background:#f9fafb;border-radius:14px;border:1.5px solid #e4e4e7;">
    <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#888;margin-bottom:10px;">📱 QR Code do Chamado</div>
    <img id="qrImg" style="width:160px;height:160px;border-radius:8px;" />
    <div style="font-size:11px;color:#9ca3af;margin-top:8px;">QR Code · ${c.protocolo}</div>
  </div>

  ${(() => {
    const entries = Object.entries(c.respostas || {});
    if (!entries.length) return '';
    let respostasHtml = '<div style="margin-bottom:20px;"><div class="label" style="margin-bottom:10px;">📝 Respostas do formulário</div>';
    entries.forEach(([, val]) => {
      if (val === '' || val === null || val === undefined) return;
      // Orçamento completo
      if (typeof val === 'object' && val !== null && (val as OrcamentoData)._tipo === 'orcamento') {
        const o = val as OrcamentoData;
        const itensOrc = o.itens || [];
        const totalGeral = itensOrc.reduce((acc: number, it: any) => acc + (Number.parseFloat(it.qtd || '0') * Number.parseFloat(it.unitario || '0')), 0);
        respostasHtml += '<div style="background:#fffbeb;border-radius:12px;padding:16px;border:2px solid #d97706;margin-bottom:12px;">';
        respostasHtml += '<div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#b45309;margin-bottom:10px;text-align:center;">💲 ORÇAMENTO DE SERVIÇO' + (o.numeroOrcamento ? ' — Nº ' + o.numeroOrcamento : '') + '</div>';
        if (o.empresaNome) respostasHtml += '<div style="margin-bottom:4px"><span style="font-size:10px;font-weight:800;color:#6b7280">EMPRESA:</span> <span style="font-size:13px;font-weight:700;color:#111">' + o.empresaNome + (o.empresaDoc ? ' — ' + o.empresaDoc : '') + '</span></div>';
        if (o.empresaTelefone) respostasHtml += '<div style="margin-bottom:4px;font-size:12px;color:#374151">📞 ' + o.empresaTelefone + (o.empresaEmail ? ' · ✉ ' + o.empresaEmail : '') + '</div>';
        if (o.empresaEndereco) respostasHtml += '<div style="margin-bottom:6px;font-size:12px;color:#374151">📍 ' + o.empresaEndereco + '</div>';
        if (o.clienteNome) respostasHtml += '<div style="margin-bottom:4px"><span style="font-size:10px;font-weight:800;color:#6b7280">CLIENTE:</span> <span style="font-size:13px;font-weight:700;color:#111">' + o.clienteNome + (o.clienteDoc ? ' — ' + o.clienteDoc : '') + '</span></div>';
        if (o.clienteTelefone) respostasHtml += '<div style="margin-bottom:4px;font-size:12px;color:#374151">📞 ' + o.clienteTelefone + '</div>';
        if (o.clienteEndereco) respostasHtml += '<div style="margin-bottom:6px;font-size:12px;color:#374151">📍 ' + o.clienteEndereco + '</div>';
        if (itensOrc.length > 0) {
          respostasHtml += '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:12px">';
          respostasHtml += '<tr style="background:#d97706;color:#fff"><th style="padding:6px 8px;text-align:left;border-radius:6px 0 0 0">Descrição</th><th style="padding:6px 8px;text-align:center;width:50px">Qtd</th><th style="padding:6px 8px;text-align:right;width:90px">Unit.</th><th style="padding:6px 8px;text-align:right;width:90px;border-radius:0 6px 0 0">Subtotal</th></tr>';
          itensOrc.forEach((it: any, i: number) => {
            const sub = (Number.parseFloat(it.qtd || '0') * Number.parseFloat(it.unitario || '0'));
            respostasHtml += '<tr style="background:' + (i % 2 === 0 ? '#fff' : '#fefce8') + '"><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">' + (it.descricao || '—') + '</td><td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e5e7eb">' + (it.qtd || '0') + '</td><td style="padding:6px 8px;text-align:right;border-bottom:1px solid #e5e7eb">' + Number.parseFloat(it.unitario || '0').toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) + '</td><td style="padding:6px 8px;text-align:right;font-weight:700;border-bottom:1px solid #e5e7eb">' + sub.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) + '</td></tr>';
          });
          respostasHtml += '</table>';
        }
        if (totalGeral > 0) respostasHtml += '<div style="margin:8px 0;background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:10px;text-align:center"><div style="font-size:10px;font-weight:800;color:#16a34a">VALOR TOTAL</div><div style="font-size:22px;font-weight:900;font-family:monospace;color:#16a34a">' + totalGeral.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) + '</div><div style="font-size:11px;font-weight:600;color:#4b5563;font-style:italic">(' + valorPorExtenso(totalGeral) + ')</div></div>';
        if (o.formaPagamento) respostasHtml += '<div style="margin-top:4px;font-size:12px;color:#374151">💳 Pagamento: <strong>' + o.formaPagamento + '</strong>' + (o.formaPagamento === 'Parcelado' && o.parcelas ? ' — ' + o.parcelas + 'x de ' + (totalGeral / Number.parseInt(o.parcelas, 10)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '') + '</div>';
        const previsaoParts: string[] = [];
        if (o.previsaoHoras && Number.parseInt(o.previsaoHoras, 10) > 0) previsaoParts.push(o.previsaoHoras + 'h');
        if (o.previsaoDias && Number.parseInt(o.previsaoDias, 10) > 0) previsaoParts.push(o.previsaoDias + ' dia(s)');
        if (o.previsaoMeses && Number.parseInt(o.previsaoMeses, 10) > 0) previsaoParts.push(o.previsaoMeses + ' mês(es)');
        if (previsaoParts.length > 0) respostasHtml += '<div style="margin-top:4px;font-size:12px;color:#374151">📅 Previsão: <strong>' + previsaoParts.join(', ') + '</strong>' + (o.dataInicio ? ' · Início: ' + new Date(o.dataInicio+'T12:00:00').toLocaleDateString('pt-BR') : '') + '</div>';
        if (o.validade) respostasHtml += '<div style="margin-top:4px;font-size:12px;color:#374151">⏳ Validade: <strong>' + o.validade + ' dias</strong></div>';
        if (o.observacoes) respostasHtml += '<div style="margin-top:6px;background:#f9fafb;border-radius:8px;padding:8px 12px;font-size:12px;color:#374151;border-left:3px solid #d97706">' + o.observacoes + '</div>';
        respostasHtml += '</div>';
      }
      // Recibo
      // Contrato de serviço
      if (typeof val === 'object' && val !== null && (val as ContratoData)._tipo === 'contrato_servico') {
        const ct = val as ContratoData;
        const valorCT = Number.parseFloat(ct.valor || '0');
        respostasHtml += '<div style="background:#f8fafc;border-radius:12px;padding:16px;border:2px solid #1e3a5f;margin-bottom:12px;">';
        respostasHtml += '<div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#1e3a5f;margin-bottom:10px;text-align:center;">📄 CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MANUTENÇÃO</div>';
        if (ct.contratanteNome) respostasHtml += '<div style="margin-bottom:4px"><span style="font-size:10px;font-weight:800;color:#6b7280">CONTRATANTE:</span> <span style="font-size:13px;font-weight:700;color:#111">' + ct.contratanteNome + (ct.contratanteDoc ? ' — ' + ct.contratanteDoc : '') + '</span></div>';
        if (ct.contratadoNome) respostasHtml += '<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:#6b7280">CONTRATADO:</span> <span style="font-size:13px;font-weight:700;color:#111">' + ct.contratadoNome + (ct.contratadoDoc ? ' — ' + ct.contratadoDoc : '') + '</span></div>';
        if (ct.objetoDescricao) respostasHtml += '<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:#6b7280">OBJETO:</span><div style="font-size:13px;font-weight:600;color:#111">' + ct.objetoDescricao + '</div></div>';
        if (valorCT > 0) respostasHtml += '<div style="margin:6px 0;background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;padding:8px;text-align:center"><div style="font-size:10px;font-weight:800;color:#16a34a">VALOR</div><div style="font-size:18px;font-weight:900;font-family:monospace;color:#16a34a">' + valorCT.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) + '</div></div>';
        if (ct.prazoInicio || ct.prazoFim) respostasHtml += '<div style="margin-top:4px;font-size:12px;color:#374151">📅 Vigência: ' + (ct.prazoInicio ? new Date(ct.prazoInicio+'T12:00:00').toLocaleDateString('pt-BR') : '...') + ' a ' + (ct.prazoFim ? new Date(ct.prazoFim+'T12:00:00').toLocaleDateString('pt-BR') : '...') + '</div>';
        respostasHtml += '</div>';
      }
      if (typeof val === 'object' && val !== null && 'nomeContratante' in val) {
        const rc = val as ReciboData;
        const valorNum = Number.parseFloat(rc.valorRecebido || '0');
        const isSimples = rc._tipo === 'recibo_simples';
        if (isSimples) {
          respostasHtml += '<div style="background:#fafafa;border-radius:12px;padding:16px;border:2px solid #374151;margin-bottom:12px;">';
          respostasHtml += '<div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#1a1a2e;margin-bottom:10px;text-align:center;">RECIBO DE PRESTAÇÃO DE SERVIÇO' + (rc.numeroRecibo ? ' — Nº ' + rc.numeroRecibo : '') + '</div>';
          respostasHtml += '<div style="font-size:12px;color:#374151;line-height:1.6;margin-bottom:8px;">Declaro, para os devidos fins, que recebi de:</div>';
          if (rc.nomeContratante) respostasHtml += '<div style="margin-bottom:4px"><span style="font-size:10px;font-weight:800;color:#6b7280">Nome:</span> <span style="font-size:13px;font-weight:700;color:#111">' + rc.nomeContratante + '</span></div>';
          if (rc.docContratante) respostasHtml += '<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:#6b7280">CPF/CNPJ:</span> <span style="font-size:13px;font-weight:700;color:#111">' + rc.docContratante + '</span></div>';
          if (valorNum > 0) respostasHtml += '<div style="margin:8px 0;background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;font-weight:800;color:#16a34a">A IMPORTÂNCIA DE</div><div style="font-size:20px;font-weight:900;font-family:monospace;color:#16a34a">' + valorNum.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) + '</div><div style="font-size:11px;font-weight:600;color:#4b5563;font-style:italic">(' + valorPorExtenso(valorNum) + ')</div></div>';
          if (rc.descricaoServico) respostasHtml += '<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:#6b7280">DESCRIÇÃO:</span><div style="font-size:13px;font-weight:600;color:#111">' + rc.descricaoServico + '</div></div>';
          if (rc.formaPagamento) respostasHtml += '<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:#6b7280">FORMA DE PAGAMENTO:</span> <span style="font-size:13px;font-weight:700;color:#111">' + rc.formaPagamento + '</span></div>';
          respostasHtml += '<div style="font-size:12px;color:#374151;font-weight:600;margin:8px 0;text-align:center;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:8px;">Declaro que o valor acima foi recebido integralmente.</div>';
          if (rc.local || rc.data) respostasHtml += '<div style="margin-top:6px;font-size:12px;color:#374151">' + (rc.local ? '📍 ' + rc.local : '') + (rc.local && rc.data ? ' · ' : '') + (rc.data ? '📅 ' + new Date(rc.data + "T12:00:00").toLocaleDateString('pt-BR') : '') + '</div>';
          if (rc.nomePrestador) respostasHtml += '<div style="margin-top:6px"><span style="font-size:10px;font-weight:800;color:#6b7280">PRESTADOR:</span> <span style="font-size:13px;font-weight:700;color:#111">' + rc.nomePrestador + (rc.docPrestador ? ' — ' + rc.docPrestador : '') + '</span></div>';
          respostasHtml += '</div>';
        } else {
          respostasHtml += '<div style="background:#f0f4ff;border-radius:12px;padding:16px;border:1.5px solid #c7d2fe;margin-bottom:12px;">';
          respostasHtml += '<div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#0D47A1;margin-bottom:10px;">🧾 Recibo' + (rc.numeroRecibo ? ' Nº ' + rc.numeroRecibo : '') + '</div>';
          if (rc.nomeContratante) respostasHtml += '<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:#6b7280">CONTRATANTE:</span> <span style="font-size:13px;font-weight:700;color:#111">' + rc.nomeContratante + (rc.docContratante ? ' — ' + rc.docContratante : '') + '</span></div>';
          if (rc.nomePrestador) respostasHtml += '<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:#6b7280">PRESTADOR:</span> <span style="font-size:13px;font-weight:700;color:#111">' + rc.nomePrestador + (rc.docPrestador ? ' — ' + rc.docPrestador : '') + '</span></div>';
          if (rc.descricaoServico) respostasHtml += '<div style="margin-bottom:8px"><span style="font-size:10px;font-weight:800;color:#6b7280">SERVIÇO:</span><div style="font-size:14px;font-weight:600;color:#111">' + rc.descricaoServico + '</div></div>';
          if (valorNum > 0) respostasHtml += '<div style="margin-top:8px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:8px;padding:10px;text-align:center"><span style="font-size:10px;font-weight:800;color:#16a34a">VALOR RECEBIDO</span><div style="font-size:20px;font-weight:900;font-family:monospace;color:#16a34a">' + valorNum.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) + ' <span style="font-size:11px;font-weight:600;color:#4b5563;font-style:italic">(' + valorPorExtenso(valorNum) + ')</span></div></div>';
          if (rc.local || rc.data) respostasHtml += '<div style="margin-top:6px;font-size:12px;color:#374151">' + (rc.local ? '📍 ' + rc.local : '') + (rc.local && rc.data ? ' · ' : '') + (rc.data ? '📅 ' + new Date(rc.data + "T12:00:00").toLocaleDateString('pt-BR') : '') + '</div>';
          respostasHtml += '</div>';
        }
      }
      else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0].descricao !== undefined) {
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

  <div class="footer">Simples Manutenção · Impresso em ${new Date().toLocaleString('pt-BR')}</div>
  <script>
    (function() {
      var qrImg = document.getElementById('qrImg');
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
      s.onload = function() {
        if (typeof QRCode !== 'undefined' && qrImg) {
          QRCode.toDataURL('${c.protocolo}', { width: 320, margin: 2 }, function(err, dataUrl) {
            if (!err) qrImg.src = dataUrl;
            setTimeout(function() { window.print(); }, 500);
          });
        } else { window.print(); }
      };
      s.onerror = function() { window.print(); };
      document.head.appendChild(s);
      window.onafterprint = function() { window.close(); };
    })();
  </script>
  </body></html>`;

  const janela = globalThis.open('', '_blank', 'width=800,height=700');
  if (janela) { janela.document.open(); janela.document.write(html); janela.document.close(); }
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
      let sufixo = '';
      if (r) { sufixo = (r < 100 ? ' e ' : ' ') + extenso(r); }
      return (mil === 1 ? 'mil' : extenso(mil) + ' mil') + sufixo;
    }
    const mi = Math.floor(n / 1000000), r = n % 1000000;
    let sufixo = '';
    if (r) { sufixo = (r < 1000 ? ' e ' : ' ') + extenso(r); }
    return (mi === 1 ? 'um milhão' : extenso(mi) + ' milhões') + sufixo;
  };
  const inteiro = Math.floor(valor), cents = Math.round((valor - inteiro) * 100);
  let resultado = '';
  if (inteiro > 0) {
    resultado = extenso(inteiro) + (inteiro === 1 ? ' real' : ' reais');
  }
  if (cents > 0) {
    if (inteiro > 0) { resultado += ' e '; }
    resultado += extenso(cents) + (cents === 1 ? ' centavo' : ' centavos');
  }
  return resultado;
}

function gerarRecibo(c: ChamadoManutencao) {
  const logo = localStorage.getItem('sm_logo_empresa') || '';
  const fmt = (ts?: number) => ts ? formatarData(ts) : '—';
  const tempo = (ms?: number) => ms ? formatarTempo(ms) : '—';
  const statusLabel: Record<string, string> = {
    aberto: 'Aberto', em_andamento: 'Em Andamento', concluido: 'Concluído', cancelado: 'Cancelado',
  };

  // Extrair dados do bloco recibo (se existir)
  const resp = c.respostas || {};
  let recibo: any = null;

  Object.entries(resp).forEach(([, val]) => {
    if (val === '' || val === null || val === undefined) return;
    if (typeof val === 'object' && val !== null && 'nomeContratante' in val) {
      recibo = val;
    }
  });

  const rc = recibo || {};
  const valorNum = Number.parseFloat(rc.valorRecebido || '0');
  const assinaturaPrestador = rc.assinaturaPrestador || '';
  const assinaturaContratante = rc.assinaturaContratante || '';

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Recibo — ${c.protocolo}</title>
  <style>
    @page { size: A4; margin: 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a1a; padding: 0; font-size: 12px; }
    .page { max-width: 780px; margin: 0 auto; padding: 20px 24px; }
    .topo { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0D47A1; padding-bottom: 12px; margin-bottom: 14px; }
    .topo-logo img { max-height: 48px; max-width: 150px; object-fit: contain; }
    .topo-logo-placeholder { width: 48px; height: 48px; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #9ca3af; font-weight: 800; }
    .topo-titulo { text-align: right; }
    .topo-titulo h1 { font-size: 18px; font-weight: 900; color: #0D47A1; text-transform: uppercase; letter-spacing: 1px; }
    .topo-titulo .sub { font-size: 10px; color: #6b7280; font-weight: 600; margin-top: 2px; }
    .doc-info { display: flex; justify-content: space-between; background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 8px 14px; margin-bottom: 14px; }
    .doc-info div { display: flex; flex-direction: column; gap: 1px; }
    .doc-info .il { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
    .doc-info .iv { font-size: 11px; font-weight: 700; color: #1e3a5f; font-family: monospace; }
    .sec { margin-bottom: 12px; }
    .sec-t { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #0D47A1; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .di { background: #fafbfc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; }
    .di .dl { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 2px; }
    .di .dv { font-size: 12px; font-weight: 700; color: #111; }
    .di.full { grid-column: 1 / -1; }
    .desc-box { background: #fafbfc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; min-height: 40px; font-size: 12px; line-height: 1.5; color: #111; }
    .valor-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 10px 16px; text-align: center; margin-top: 4px; }
    .valor-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #16a34a; }
    .valor-num { font-size: 22px; font-weight: 900; font-family: monospace; color: #16a34a; }
    .ass-row { display: flex; gap: 20px; margin-top: 16px; }
    .ass-box { flex: 1; text-align: center; }
    .ass-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
    .ass-img { max-width: 100%; height: 60px; object-fit: contain; }
    .ass-space { height: 50px; }
    .ass-line { border-top: 2px solid #1a1a1a; margin-top: 2px; padding-top: 3px; font-size: 9px; color: #9ca3af; }
    .validade { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 8px 12px; text-align: center; font-size: 10px; color: #92400e; font-weight: 600; margin: 14px 0 10px; }
    .rodape { text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; line-height: 1.5; }
    @media print { body { padding: 0; } .page { padding: 0; } }
  </style></head><body>
  <div class="page">

    <div class="topo">
      <div class="topo-logo">
        ${logo ? `<img src="${logo}" alt="Logo" />` : '<div class="topo-logo-placeholder">LOGO</div>'}
      </div>
      <div class="topo-titulo">
        <h1>Recibo de Prestação de Serviço</h1>
        <div class="sub">Ordem de Serviço / Manutenção</div>
      </div>
    </div>

    <div class="doc-info">
      <div><span class="il">Nº Recibo</span><span class="iv">${rc.numeroRecibo || '—'}</span></div>
      <div><span class="il">Protocolo</span><span class="iv">${c.protocolo}</span></div>
      <div><span class="il">Status</span><span class="iv">${statusLabel[c.status] || c.status}</span></div>
      <div><span class="il">Emissão</span><span class="iv">${rc.data ? new Date(rc.data + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</span></div>
    </div>

    <!-- CONTRATANTE -->
    <div class="sec">
      <div class="sec-t">👤 Dados do Contratante</div>
      <div class="grid2">
        <div class="di"><div class="dl">Nome Completo</div><div class="dv">${rc.nomeContratante || '________________________________'}</div></div>
        <div class="di"><div class="dl">CPF / CNPJ</div><div class="dv">${rc.docContratante || '________________________________'}</div></div>
      </div>
    </div>

    <!-- PRESTADOR -->
    <div class="sec">
      <div class="sec-t">🛠️ Dados do Prestador de Serviço</div>
      <div class="grid2">
        <div class="di"><div class="dl">Nome Completo</div><div class="dv">${rc.nomePrestador || c.responsavel || '________________________________'}</div></div>
        <div class="di"><div class="dl">CPF / CNPJ</div><div class="dv">${rc.docPrestador || '________________________________'}</div></div>
        ${c.responsavelCargo ? `<div class="di"><div class="dl">Cargo / Função</div><div class="dv">${c.responsavelCargo}</div></div>` : ''}
        <div class="di"><div class="dl">Solicitado por</div><div class="dv">${c.criadoPorNome}</div></div>
      </div>
    </div>

    <!-- SERVIÇO -->
    <div class="sec">
      <div class="sec-t">📋 Descrição do Serviço Executado</div>
      <div class="grid2" style="margin-bottom:8px">
        <div class="di"><div class="dl">Tipo de Serviço</div><div class="dv">${c.funcaoIcone} ${c.funcaoNome}</div></div>
        <div class="di"><div class="dl">Data de Abertura</div><div class="dv">${fmt(c.criadoEm)}</div></div>
      </div>
      <div class="desc-box">${rc.descricaoServico || c.observacoes || '<span style="color:#9ca3af">Descrição do serviço executado...</span>'}</div>
    </div>

    <!-- TEMPO -->
    <div class="sec">
      <div class="sec-t">⏱ Tempo de Execução</div>
      <div class="grid2">
        <div class="di"><div class="dl">Início</div><div class="dv">${fmt(c.horarioInicial)}</div></div>
        <div class="di"><div class="dl">Término</div><div class="dv">${fmt(c.horarioFinal)}</div></div>
      </div>
      <div class="di full" style="background:#f0fdf4;border-color:#86efac;margin-top:8px"><div class="dl" style="color:#16a34a">Tempo Total</div><div class="dv" style="font-size:14px;font-family:monospace;color:#16a34a">${tempo(c.tempoTotal)}</div></div>
    </div>

    ${c.localizacao?.endereco ? `
    <div class="sec">
      <div class="sec-t">📍 Local do Serviço</div>
      <div class="di full"><div class="dv">${c.localizacao.endereco}</div></div>
    </div>` : ''}

    <!-- VALOR -->
    <div class="sec">
      <div class="sec-t">💰 Valor do Serviço</div>
      <div class="valor-box">
        <div class="valor-label">Valor Total Recebido</div>
        <div class="valor-num">${valorNum > 0 ? valorNum.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) : 'R$ _______________'}</div>
        ${valorNum > 0 ? `<div style="font-size:10px;font-weight:600;color:#4b5563;margin-top:4px;font-style:italic">(${valorPorExtenso(valorNum)})</div>` : ''}
      </div>
      <div style="margin-top:6px;font-size:10px;color:#6b7280;text-align:center">
        Recebi a quantia acima referente ao serviço descrito neste documento.
      </div>
    </div>

    <!-- LOCAL E DATA -->
    <div class="sec">
      <div class="sec-t">📍 Local e Data</div>
      <div class="grid2">
        <div class="di"><div class="dl">Local</div><div class="dv">${rc.local || '________________________________'}</div></div>
        <div class="di"><div class="dl">Data</div><div class="dv">${rc.data ? new Date(rc.data + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</div></div>
      </div>
    </div>

    <!-- ASSINATURAS -->
    <div class="sec">
      <div class="sec-t">✍️ Assinaturas</div>
      <div class="ass-row">
        <div class="ass-box">
          <div class="ass-label">Prestador de Serviço</div>
          ${assinaturaPrestador ? `<img class="ass-img" src="${assinaturaPrestador}" />` : '<div class="ass-space"></div>'}
          <div class="ass-line">${rc.nomePrestador || c.responsavel || 'Nome do prestador'}</div>
          <div style="font-size:8px;color:#aaa;margin-top:1px">${rc.docPrestador || 'CPF / CNPJ'}</div>
        </div>
        <div class="ass-box">
          <div class="ass-label">Contratante</div>
          ${assinaturaContratante ? `<img class="ass-img" src="${assinaturaContratante}" />` : '<div class="ass-space"></div>'}
          <div class="ass-line">${rc.nomeContratante || 'Nome do contratante'}</div>
          <div style="font-size:8px;color:#aaa;margin-top:1px">${rc.docContratante || 'CPF / CNPJ'}</div>
        </div>
      </div>
    </div>

    <div class="validade">
      Declaro ter recebido o valor acima pela prestação do serviço descrito. Este recibo tem valor de comprovante de pagamento.
    </div>

    <div class="rodape">
      Documento gerado pelo <strong>Simples Manutenção</strong><br>
      ${new Date().toLocaleString('pt-BR')} · ${c.protocolo}
    </div>

  </div>
  <script>globalThis.onload = () => { globalThis.print(); globalThis.onafterprint = () => globalThis.close(); }</script>
  </body></html>`;

  const janela = globalThis.open('', '_blank', 'width=800,height=900');
  if (janela) { janela.document.open(); janela.document.write(html); janela.document.close(); }
}

function gerarReciboSimples(c: ChamadoManutencao) {
  const logo = localStorage.getItem('sm_logo_empresa') || '';
  const resp = c.respostas || {};
  let recibo: any = null;
  Object.entries(resp).forEach(([, val]) => {
    if (val && typeof val === 'object' && 'nomeContratante' in val && (val as Record<string, unknown>)._tipo === 'recibo_simples') recibo = val;
  });
  const rc = recibo || {};
  const valorNum = Number.parseFloat(rc.valorRecebido || '0');
  const assinatura = rc.assinaturaPrestador || '';

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Recibo Simples — ${c.protocolo}</title>
  <style>
    @page { size: A4; margin: 20mm 22mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', 'Times New Roman', serif; background: #fff; color: #1a1a1a; padding: 0; font-size: 13px; line-height: 1.7; }
    .page { max-width: 700px; margin: 0 auto; padding: 30px 32px; }
    .header { text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 16px; margin-bottom: 24px; }
    .header .logo { margin-bottom: 10px; }
    .header .logo img { max-height: 50px; max-width: 160px; object-fit: contain; }
    .header h1 { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; }
    .header .numero { font-size: 12px; color: #666; font-family: monospace; font-weight: 700; margin-top: 4px; }
    .corpo { margin-bottom: 20px; }
    .corpo p { margin-bottom: 14px; text-align: justify; }
    .campo-valor { font-weight: 900; color: #111; }
    .campo-linha { border-bottom: 1.5px solid #333; padding-bottom: 1px; min-width: 100px; display: inline-block; }
    .valor-box { background: #f8f8f8; border: 2px solid #333; border-radius: 6px; padding: 14px 20px; text-align: center; margin: 16px 0; }
    .valor-box .label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
    .valor-box .valor { font-size: 24px; font-weight: 900; font-family: monospace; color: #111; }
    .valor-box .extenso { font-size: 12px; font-style: italic; color: #555; margin-top: 4px; }
    .descricao-box { background: #fafafa; border: 1.5px solid #ddd; border-radius: 6px; padding: 14px 16px; min-height: 60px; margin: 10px 0 16px; font-size: 13px; line-height: 1.6; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 14px 0; }
    .info-item { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; }
    .info-item .lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 2px; }
    .info-item .val { font-size: 13px; font-weight: 700; color: #111; }
    .declaracao { text-align: center; font-weight: 700; font-size: 13px; color: #333; margin: 20px 0; padding: 12px; border: 1.5px solid #ccc; border-radius: 6px; background: #fefce8; }
    .ass-area { text-align: center; margin-top: 40px; }
    .ass-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 6px; }
    .ass-img { max-width: 240px; height: 70px; object-fit: contain; margin: 0 auto; display: block; }
    .ass-space { height: 60px; }
    .ass-line { border-top: 2px solid #1a1a1a; width: 280px; margin: 4px auto 0; padding-top: 6px; }
    .ass-nome { font-size: 13px; font-weight: 700; color: #111; }
    .ass-doc { font-size: 10px; color: #888; margin-top: 2px; }
    .obs { margin-top: 30px; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fefce8; }
    .obs .obs-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #92400e; margin-bottom: 6px; }
    .obs ul { font-size: 11px; color: #92400e; padding-left: 16px; line-height: 1.6; }
    .rodape { text-align: center; font-size: 9px; color: #bbb; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 24px; }
    @media print { body { padding: 0; } .page { padding: 0; } }
  </style></head><body>
  <div class="page">

    <div class="header">
      ${logo ? `<div class="logo"><img src="${logo}" alt="Logo" /></div>` : ''}
      <h1>Recibo de Prestação de Serviço</h1>
      ${rc.numeroRecibo ? `<div class="numero">Nº ${rc.numeroRecibo}</div>` : ''}
    </div>

    <div class="corpo">

      <p>Declaro, para os devidos fins, que recebi de:</p>

      <div class="info-grid">
        <div class="info-item"><div class="lbl">Nome</div><div class="val">${rc.nomeContratante || '________________________________'}</div></div>
        <div class="info-item"><div class="lbl">CPF / CNPJ</div><div class="val">${rc.docContratante || '________________________________'}</div></div>
      </div>

      <div class="valor-box">
        <div class="label">A importância de</div>
        <div class="valor">${valorNum > 0 ? valorNum.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) : 'R$ _______________'}</div>
        ${valorNum > 0 ? `<div class="extenso">(${valorPorExtenso(valorNum)})</div>` : ''}
      </div>

      <p>Referente à prestação de serviço de manutenção descrita abaixo:</p>

      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#999;margin-bottom:4px;">Descrição do serviço:</div>
      <div class="descricao-box">${rc.descricaoServico || '<span style="color:#bbb">Descrição do serviço executado...</span>'}</div>

      <div class="info-grid">
        <div class="info-item"><div class="lbl">Forma de pagamento</div><div class="val">${rc.formaPagamento || '________________________________'}</div></div>
        <div class="info-item"><div class="lbl">Local e data</div><div class="val">${rc.local ? rc.local + ', ' : ''}${rc.data ? new Date(rc.data + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</div></div>
      </div>

      <div class="declaracao">Declaro que o valor acima foi recebido integralmente.</div>

    </div>

    <div class="ass-area">
      <div class="ass-label">Assinatura do prestador</div>
      ${assinatura ? `<img class="ass-img" src="${assinatura}" />` : '<div class="ass-space"></div>'}
      <div class="ass-line">
        <div class="ass-nome">${rc.nomePrestador || 'Nome do prestador'}</div>
        <div class="ass-doc">${rc.docPrestador || 'CPF / CNPJ'}</div>
      </div>
    </div>

    <div class="obs">
      <div class="obs-title">Observações</div>
      <ul>
        <li>Este recibo é válido como comprovante de pagamento conforme legislação brasileira.</li>
        <li>Recomenda-se manter uma via para ambas as partes.</li>
      </ul>
    </div>

    <div class="rodape">
      Documento gerado pelo <strong>Simples Manutenção</strong><br>
      ${new Date().toLocaleString('pt-BR')} · ${c.protocolo}
    </div>

  </div>
  <script>globalThis.onload = () => { globalThis.print(); globalThis.onafterprint = () => globalThis.close(); }</script>
  </body></html>`;

  const janela = globalThis.open('', '_blank', 'width=800,height=900');
  if (janela) { janela.document.open(); janela.document.write(html); janela.document.close(); }
}

function gerarContratoServico(c: ChamadoManutencao) {
  const logo = localStorage.getItem('sm_logo_empresa') || '';
  const resp = c.respostas || {};
  let contrato: any = null;
  Object.entries(resp).forEach(([, val]) => {
    if (val && typeof val === 'object' && (val as Record<string, unknown>)._tipo === 'contrato_servico') contrato = val;
  });
  const ct = contrato || {};
  const valorCT = Number.parseFloat(ct.valor || '0');
  const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '____/____/________';
  const assContratante = ct.assinaturaContratante || '';
  const assContratado = ct.assinaturaContratado || '';

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Contrato — ${c.protocolo}</title>
  <style>
    @page { size: A4; margin: 18mm 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', 'Times New Roman', serif; background: #fff; color: #1a1a1a; font-size: 12px; line-height: 1.7; }
    .page { max-width: 720px; margin: 0 auto; padding: 20px 24px; }
    .header { text-align: center; border-bottom: 3px double #1e3a5f; padding-bottom: 14px; margin-bottom: 20px; }
    .header .logo img { max-height: 50px; max-width: 160px; object-fit: contain; margin-bottom: 8px; }
    .header h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #1e3a5f; }
    .header .sub { font-size: 11px; color: #666; font-weight: 600; margin-top: 2px; }
    .intro { margin-bottom: 16px; text-align: justify; font-style: italic; }
    .parte { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; }
    .parte-t { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #1e3a5f; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 6px; }
    .parte-row { display: flex; gap: 20px; margin-bottom: 3px; font-size: 12px; }
    .parte-row .lbl { font-weight: 800; color: #666; min-width: 80px; }
    .parte-row .val { font-weight: 700; color: #111; }
    .clausula { margin-bottom: 16px; }
    .clausula-t { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a5f; border-bottom: 2px solid #e5e7eb; padding-bottom: 3px; margin-bottom: 8px; }
    .clausula p, .clausula div { text-align: justify; margin-bottom: 6px; }
    .valor-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 6px; padding: 10px; text-align: center; margin: 8px 0; }
    .valor-box .v { font-size: 20px; font-weight: 900; font-family: monospace; color: #16a34a; }
    .valor-box .ext { font-size: 11px; font-style: italic; color: #555; }
    .desc-box { background: #fafafa; border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; min-height: 30px; margin: 4px 0 8px; }
    .ass-row { display: flex; gap: 30px; margin-top: 30px; }
    .ass-box { flex: 1; text-align: center; }
    .ass-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 6px; }
    .ass-img { max-width: 200px; height: 60px; object-fit: contain; margin: 0 auto; display: block; }
    .ass-space { height: 50px; }
    .ass-line { border-top: 2px solid #1a1a1a; width: 240px; margin: 4px auto 0; padding-top: 4px; font-size: 11px; font-weight: 700; color: #111; }
    .ass-doc { font-size: 9px; color: #888; margin-top: 1px; }
    .test-area { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .test-box { border-top: 1.5px solid #1a1a1a; padding-top: 8px; text-align: center; }
    .test-lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #999; margin-bottom: 2px; }
    .test-nome { font-size: 11px; font-weight: 700; color: #111; }
    .test-doc { font-size: 9px; color: #888; }
    .rodape { text-align: center; font-size: 9px; color: #bbb; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 20px; }
    hr.sep { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
    @media print { body { padding: 0; } .page { padding: 0; } }
  </style></head><body>
  <div class="page">

    <div class="header">
      ${logo ? `<div class="logo"><img src="${logo}" alt="Logo" /></div>` : ''}
      <h1>Contrato de Prestação de Serviços</h1>
      <div class="sub">de Manutenção</div>
    </div>

    <div class="intro">Pelo presente instrumento particular, de um lado:</div>

    <div class="parte">
      <div class="parte-t">👤 Contratante</div>
      <div class="parte-row"><span class="lbl">Nome:</span><span class="val">${ct.contratanteNome || '________________________________'}</span></div>
      <div class="parte-row"><span class="lbl">CPF/CNPJ:</span><span class="val">${ct.contratanteDoc || '________________________________'}</span></div>
      <div class="parte-row"><span class="lbl">Endereço:</span><span class="val">${ct.contratanteEndereco || '________________________________'}</span></div>
      <div class="parte-row"><span class="lbl">E-mail:</span><span class="val">${ct.contratanteEmail || '________________________________'}</span></div>
      <div class="parte-row"><span class="lbl">Telefone:</span><span class="val">${ct.contratanteTelefone || '________________________________'}</span></div>
    </div>

    <div class="intro">E, de outro lado:</div>

    <div class="parte">
      <div class="parte-t">🛠️ Contratado</div>
      <div class="parte-row"><span class="lbl">Nome:</span><span class="val">${ct.contratadoNome || '________________________________'}</span></div>
      <div class="parte-row"><span class="lbl">CPF/CNPJ:</span><span class="val">${ct.contratadoDoc || '________________________________'}</span></div>
      <div class="parte-row"><span class="lbl">Endereço:</span><span class="val">${ct.contratadoEndereco || '________________________________'}</span></div>
      <div class="parte-row"><span class="lbl">E-mail:</span><span class="val">${ct.contratadoEmail || '________________________________'}</span></div>
      <div class="parte-row"><span class="lbl">Telefone:</span><span class="val">${ct.contratadoTelefone || '________________________________'}</span></div>
    </div>

    <p style="text-align:justify;margin-bottom:16px;">Têm entre si justo e contratado o presente <strong>Contrato de Prestação de Serviços de Manutenção</strong>, que se regerá pelas disposições do Código Civil Brasileiro (Lei nº 10.406/2002) e demais normas aplicáveis, mediante as cláusulas e condições seguintes:</p>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 1 – Do Objeto</div>
      <p>O presente contrato tem por objeto a prestação de serviços de manutenção preventiva e/ou corretiva de máquinas, equipamentos e serviços em geral, conforme especificações abaixo:</p>
      <div style="font-size:10px;font-weight:800;color:#999;margin:6px 0 2px;">Descrição dos equipamentos/serviços:</div>
      <div class="desc-box">${ct.objetoDescricao || '—'}</div>
      <div style="font-size:10px;font-weight:800;color:#999;margin:4px 0 2px;">Local da prestação dos serviços:</div>
      <div class="desc-box">${ct.objetoLocal || '—'}</div>
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 2 – Das Obrigações do Contratado</div>
      <p>O CONTRATADO se obriga a:</p>
      <p>I – Executar os serviços com zelo, qualidade e dentro das normas técnicas aplicáveis;<br/>
      II – Utilizar mão de obra qualificada;<br/>
      III – Cumprir os prazos acordados;<br/>
      IV – Responsabilizar-se por danos causados por culpa ou dolo na execução dos serviços;<br/>
      V – Fornecer, quando aplicável, relatório técnico dos serviços realizados.</p>
      ${ct.obrigacoesContratado ? `<div class="desc-box">${ct.obrigacoesContratado}</div>` : ''}
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 3 – Das Obrigações do Contratante</div>
      <p>O CONTRATANTE se obriga a:</p>
      <p>I – Fornecer acesso aos equipamentos e instalações;<br/>
      II – Efetuar o pagamento conforme estipulado neste contrato;<br/>
      III – Informar previamente quaisquer condições especiais de operação;<br/>
      IV – Disponibilizar ambiente adequado para execução dos serviços.</p>
      ${ct.obrigacoesContratante ? `<div class="desc-box">${ct.obrigacoesContratante}</div>` : ''}
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 4 – Do Prazo</div>
      <p>O presente contrato terá vigência de <strong>${ct.prazoMeses || '____'}</strong> meses, iniciando-se em <strong>${fmtDate(ct.prazoInicio)}</strong> e encerrando-se em <strong>${fmtDate(ct.prazoFim)}</strong>, podendo ser renovado mediante acordo entre as partes.</p>
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 5 – Do Valor e Forma de Pagamento</div>
      <p>O valor dos serviços será de:</p>
      <div class="valor-box">
        <div class="v">${valorCT > 0 ? valorCT.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) : 'R$ _______________'}</div>
        ${valorCT > 0 ? `<div class="ext">(${valorPorExtenso(valorCT)})</div>` : ''}
      </div>
      <p><strong>Forma de pagamento:</strong> ${ct.formaPagamento || '________________________________'}</p>
      <p><strong>Data(s) de pagamento:</strong> ${ct.dataPagamento || '________________________________'}</p>
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 6 – Da Rescisão</div>
      <p>O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio de <strong>${ct.avisoPrevio || '____'}</strong> dias, por escrito.</p>
      <p>Em caso de descumprimento contratual, a parte prejudicada poderá rescindir o contrato imediatamente.</p>
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 7 – Das Penalidades</div>
      <p>O descumprimento de quaisquer cláusulas deste contrato sujeitará a parte infratora ao pagamento de multa no valor de:
      ${ct.multa ? `<strong>${Number.parseFloat(ct.multa).toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}</strong>` : `R$ __________`}
      ${ct.multaPorcentagem ? ` ou <strong>${ct.multaPorcentagem}%</strong> do valor do contrato` : ''}.</p>
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 8 – Da Responsabilidade Trabalhista</div>
      <p>O presente contrato não gera vínculo empregatício entre as partes, sendo o CONTRATADO o único responsável por encargos trabalhistas, previdenciários e fiscais de seus empregados ou colaboradores.</p>
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 9 – Do Foro</div>
      <p>Fica eleito o foro da comarca de <strong>${ct.foro || '________________________'}</strong> para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
    </div>

    <hr class="sep"/>

    <div class="clausula">
      <div class="clausula-t">Cláusula 10 – Disposições Gerais</div>
      <p>Este contrato obriga as partes e seus sucessores, sendo vedada a cessão sem prévia autorização por escrito.</p>
      ${ct.disposicoesAdicionais ? `<div class="desc-box">${ct.disposicoesAdicionais}</div>` : ''}
    </div>

    <hr class="sep"/>

    <p style="text-align:justify;margin-bottom:12px;">E, por estarem justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor.</p>

    <p style="text-align:center;margin-bottom:20px;"><strong>${ct.local ? ct.local + ', ' : ''}${ct.data ? new Date(ct.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' }) : new Date().toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' })}</strong></p>

    <div class="ass-row">
      <div class="ass-box">
        <div class="ass-label">Contratante</div>
        ${assContratante ? `<img class="ass-img" src="${assContratante}" />` : '<div class="ass-space"></div>'}
        <div class="ass-line">${ct.contratanteNome || 'Nome do contratante'}</div>
        <div class="ass-doc">${ct.contratanteDoc || 'CPF / CNPJ'}</div>
      </div>
      <div class="ass-box">
        <div class="ass-label">Contratado</div>
        ${assContratado ? `<img class="ass-img" src="${assContratado}" />` : '<div class="ass-space"></div>'}
        <div class="ass-line">${ct.contratadoNome || 'Nome do contratado'}</div>
        <div class="ass-doc">${ct.contratadoDoc || 'CPF / CNPJ'}</div>
      </div>
    </div>

    <div class="test-area">
      <div class="test-box">
        <div class="test-lbl">Testemunha 1</div>
        <div class="test-nome">${ct.testemunha1Nome || '________________________'}</div>
        <div class="test-doc">${ct.testemunha1Doc || 'CPF: ________________________'}</div>
      </div>
      <div class="test-box">
        <div class="test-lbl">Testemunha 2</div>
        <div class="test-nome">${ct.testemunha2Nome || '________________________'}</div>
        <div class="test-doc">${ct.testemunha2Doc || 'CPF: ________________________'}</div>
      </div>
    </div>

    <div class="rodape">
      Documento gerado pelo <strong>Simples Manutenção</strong><br>
      ${new Date().toLocaleString('pt-BR')} · ${c.protocolo}
    </div>

  </div>
  <script>globalThis.onload = () => { globalThis.print(); globalThis.onafterprint = () => globalThis.close(); }</script>
  </body></html>`;

  const janela = globalThis.open('', '_blank', 'width=800,height=900');
  if (janela) { janela.document.open(); janela.document.write(html); janela.document.close(); }
}

type Aba = 'chamados' | 'gerenciar' | 'enviadas';

// ── Modal reutilizar manutenção ────────────────────────────────────────────
const ModalReutilizar: React.FC<{
  chamado: ChamadoManutencao;
  onConfirmar: () => void;
  onCancelar: () => void;
}> = ({ chamado, onConfirmar, onCancelar }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
    <div style={{ background:'#fff', borderRadius:24, padding:28, width:'100%', maxWidth:420, boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <span style={{ fontSize:52 }}>{chamado.funcaoIcone}</span>
        <h2 style={{ margin:'10px 0 4px', fontSize:20, fontWeight:900, color:'#0D0D0D' }}>Reutilizar Manutenção?</h2>
        <p style={{ margin:0, fontSize:14, color:'#6b7280' }}>
          Deseja abrir uma nova ordem para
        </p>
        <p style={{ margin:'4px 0 0', fontSize:16, fontWeight:800, color:'#0D0D0D' }}>
          {chamado.funcaoNome}
        </p>
        <div style={{ margin:'10px auto 0', display:'inline-flex', alignItems:'center', gap:8, background:'#f4f4f5', borderRadius:10, padding:'6px 14px' }}>
          <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:800, color:'#FF8F00' }}>
            {formatarNumero(chamado.numero)} · {chamado.protocolo}
          </span>
        </div>
        <p style={{ margin:'8px 0 0', fontSize:12, color:'#9ca3af' }}>
          Última vez: {formatarData(chamado.criadoEm)} · {chamado.responsavel}
        </p>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button
          onClick={onCancelar}
          style={{ flex:1, padding:'13px', background:'none', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', color:'#6b7280', fontFamily:'inherit' }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:15, fontWeight:900, color:'#0D0D0D', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
        >
          <RefreshCw size={18} /> Sim, reutilizar
        </button>
      </div>
    </div>
  </div>
);

// ── Modal atribuir (admin) ─────────────────────────────────────────────────
const ModalAtribuir: React.FC<{
  funcao: FuncaoManutencao;
  onConfirmar: (responsavelId: string, responsavelNome: string, responsavelCargo: string, obs: string) => void;
  onCancelar: () => void;
  onPreview?: () => void;
}> = ({ funcao, onConfirmar, onCancelar, onPreview }) => {
  const { listarFuncionarios } = useAuth();
  const funcionarios = listarFuncionarios();
  const [responsavelId, setResponsavelId] = useState('');
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');

  const handleConfirmar = () => {
    if (!responsavelId) { setErro('Selecione um responsável'); return; }
    const f = funcionarios.find(f => f.id === responsavelId)!;
    onConfirmar(f.id, f.nome, f.cargo || '', obs);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:24, padding:28, width:'100%', maxWidth:460, boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <span style={{ fontSize:36 }}>{funcao.icone}</span>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:'#0D0D0D' }}>Atribuir Chamado</h2>
            <p style={{ margin:'3px 0 0', fontSize:13, color:'#71717a' }}>{funcao.nome}</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label htmlFor="atribuir-responsavel" style={{ fontSize:12, fontWeight:800, color:'#6b7280', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Responsável *</label>
            {funcionarios.length === 0 ? (
              <div style={{ padding:'12px 16px', background:'#fef9c3', borderRadius:10, fontSize:13, color:'#854d0e', fontWeight:600 }}>
                ⚠️ Nenhum funcionário cadastrado. Cadastre em "Usuários".
              </div>
            ) : (
              <select id="atribuir-responsavel" value={responsavelId} onChange={e => { setResponsavelId(e.target.value); setErro(''); }}
                style={{ width:'100%', padding:'12px 16px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:15, outline:'none', fontFamily:'inherit' }}>
                <option value="">Selecione o funcionário...</option>
                {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} — {f.cargo || 'Sem cargo'}</option>)}
              </select>
            )}
            {erro && <p style={{ margin:'4px 0 0', fontSize:12, color:'#dc2626', fontWeight:600 }}>{erro}</p>}
          </div>
          <div>
            <label htmlFor="atribuir-obs" style={{ fontSize:12, fontWeight:800, color:'#6b7280', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Observações (opcional)</label>
            <textarea id="atribuir-obs" value={obs} onChange={e => setObs(e.target.value)} placeholder="Descreva o que precisa ser feito..." rows={3}
              style={{ width:'100%', padding:'12px 16px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
          </div>
        </div>
        {/* Botão pré-visualizar formulário */}
        {onPreview && funcao.blocos.length > 0 && (
          <button onClick={onPreview}
            style={{ width:'100%', marginTop:16, padding:'11px', background:'#EEF2FF', border:'2px solid #C7D2FE', borderRadius:12, fontSize:13, fontWeight:800, color:'#4338CA', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'background 0.15s' }}
          >
            <Eye size={16} /> Pré-visualizar formulário do funcionário
          </button>
        )}

        <div style={{ display:'flex', gap:10, marginTop: onPreview && funcao.blocos.length > 0 ? 12 : 20 }}>
          <button onClick={onCancelar} style={{ flex:1, padding:'12px', background:'none', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', color:'#6b7280' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={funcionarios.length === 0}
            style={{ flex:2, padding:'12px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:14, fontWeight:900, color:'#0D0D0D', cursor:'pointer' }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><UserCheck size={18} /> Criar e Atribuir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal Editar Chamado ───────────────────────────────────────────────────
const ModalEditarChamado: React.FC<{
  chamado: ChamadoManutencao;
  onSalvar: (c: ChamadoManutencao) => void;
  onCancelar: () => void;
}> = ({ chamado, onSalvar, onCancelar }) => {
  const { listarFuncionarios } = useAuth();
  const funcionarios = listarFuncionarios();

  const [responsavelId, setResponsavelId] = useState(chamado.responsavelId);
  const [obs, setObs] = useState(chamado.observacoes || '');
  const [status, setStatus] = useState(chamado.status);

  const salvar = () => {
    const f = funcionarios.find(f => f.id === responsavelId);
    onSalvar({
      ...chamado,
      responsavel: f?.nome || chamado.responsavel,
      responsavelId,
      responsavelCargo: f?.cargo || chamado.responsavelCargo,
      observacoes: obs || undefined,
      status,
    });
  };

  const statusOpcoes: { valor: ChamadoManutencao['status']; label: string; cor: string }[] = [
    { valor: 'aberto',       label: 'Aberto',        cor: '#455a64' },
    { valor: 'em_andamento', label: 'Em Andamento',   cor: '#e65100' },
    { valor: 'concluido',    label: 'Concluído',      cor: '#2e7d32' },
    { valor: 'cancelado',    label: 'Cancelado',      cor: '#b71c1c' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:24, padding:28, width:'100%', maxWidth:480, boxShadow:'0 24px 80px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <span style={{ fontSize:36 }}>{chamado.funcaoIcone}</span>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:'#0D0D0D' }}>Editar Chamado</h2>
            <p style={{ margin:'3px 0 0', fontSize:13, color:'#71717a' }}>{chamado.funcaoNome} · {chamado.protocolo}</p>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Status */}
          <div>
            <span style={{ fontSize:12, fontWeight:800, color:'#6b7280', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Status</span>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {statusOpcoes.map(s => (
                <button key={s.valor} onClick={() => setStatus(s.valor)}
                  style={{ padding:'8px 14px', borderRadius:10, border: status === s.valor ? `2px solid ${s.cor}` : '2px solid #e4e4e7', background: status === s.valor ? s.cor : '#f9fafb', color: status === s.valor ? '#fff' : '#6b7280', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label htmlFor="editar-responsavel" style={{ fontSize:12, fontWeight:800, color:'#6b7280', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Responsável</label>
            <select id="editar-responsavel" value={responsavelId} onChange={e => setResponsavelId(e.target.value)}
              style={{ width:'100%', padding:'12px 16px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:15, outline:'none', fontFamily:'inherit' }}>
              <option value={chamado.responsavelId}>{chamado.responsavel}{chamado.responsavelCargo ? ` — ${chamado.responsavelCargo}` : ''}</option>
              {funcionarios.filter(f => f.id !== chamado.responsavelId).map(f => (
                <option key={f.id} value={f.id}>{f.nome} — {f.cargo || 'Sem cargo'}</option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="editar-obs" style={{ fontSize:12, fontWeight:800, color:'#6b7280', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Observações</label>
            <textarea id="editar-obs" value={obs} onChange={e => setObs(e.target.value)} placeholder="Observações..." rows={3}
              style={{ width:'100%', padding:'12px 16px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onCancelar} style={{ flex:1, padding:'12px', background:'none', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', color:'#6b7280', fontFamily:'inherit' }}>Cancelar</button>
          <button onClick={salvar}
            style={{ flex:2, padding:'12px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:14, fontWeight:900, color:'#0D0D0D', cursor:'pointer', fontFamily:'inherit' }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><CheckCircle2 size={18} /> Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Página principal ───────────────────────────────────────────────────────
const ManutencaoPage: React.FC = () => {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role   = usuario?.role || 'funcionario';
  const userId = usuario?.id   || 'anonimo';
  const nome   = usuario?.nome || 'Usuário';

  const podeGerenciar = role === 'master' || role === 'administrador' || role === 'supervisor';
  const ehFuncionario = role === 'funcionario';

  const OS_ID = '__ordem_servico__';

  const [funcoes,  setFuncoes]  = useState<FuncaoManutencao[]>(() => carregar(FUNCOES_KEY, []));
  const [chamados, setChamados] = useState<ChamadoManutencao[]>(() => carregar(CHAMADOS_KEY, []));
  const [agora, setAgora] = useState(Date.now());

  const [abaAtiva,       setAbaAtiva]     = useState<Aba>('chamados');
  const [wizard,         setWizard]       = useState(false);
  const [formAberto,     setFormAberto]   = useState<FuncaoManutencao | null>(null);
  const [atribuindo,     setAtribuindo]   = useState<FuncaoManutencao | null>(null);
  const [editandoFuncao, setEditandoFuncao]     = useState<FuncaoManutencao | null>(null);
  const [reutilizando,   setReutilizando] = useState<ChamadoManutencao | null>(null);
  const [busca,          setBusca]        = useState('');
  const [filtroTipo,     setFiltroTipo]   = useState<'todos'|'os'|'livre'|'personalizada'>('todos');
  const [filtroStatusChamado, setFiltroStatusChamado] = useState<'todos'|'aberto'|'em_andamento'|'concluido'>('todos');
  const [formLivreAberto, setFormLivreAberto] = useState(false);
  const [expandedId,     setExpandedId]   = useState<string | null>(null);
  const [fotoAmpliada,   setFotoAmpliada] = useState<string | null>(null);
  const [tutorialFuncao, setTutorialFuncao] = useState<FuncaoManutencao | 'livre' | 'checklist' | 'os' | 'funcionarios' | 'qrcodes' | null>(null);
  const [previewFuncao, setPreviewFuncao] = useState<FuncaoManutencao | null>(null);
  const [preenchendoChamado, setPreenchendoChamado] = useState<ChamadoManutencao | null>(null);
  const [editandoChamado, setEditandoChamado] = useState<ChamadoManutencao | null>(null);
  const [, setQrAmpliado] = useState<ChamadoManutencao | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);
  const [osConfigAberto, setOsConfigAberto] = useState(false);
  const [osOcultos, setOsOcultos] = useState<string[]>(() => carregar(OS_OCULTOS_KEY, []));

  // Config layout/cores dos tiles
  const { prefs: tilesPrefs, atualizar: atualizarTilesPrefs } = useTilesPrefs();
  const [cfgAberto, setCfgAberto] = useState(false);

  // Abre formulário automaticamente se vier via link compartilhado (?abrir=funcaoId)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const abrir = params.get('abrir');
    if (!abrir) return;
    // Remove o param da URL sem recarregar a página
    navigate('/manutencao', { replace: true });
    if (abrir === 'livre') {
      setFormLivreAberto(true);
    } else {
      const funcao = funcoes.find(f => f.id === abrir);
      if (funcao) {
        if (podeGerenciar) setAtribuindo(funcao);
        else setFormAberto(funcao);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // roda apenas na montagem

  useEffect(() => {
    const ativos = chamados.filter(c => c.status !== 'concluido' && c.status !== 'cancelado');
    if (ativos.length === 0) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [chamados]);

  const salvarFuncao = useCallback((funcao: FuncaoManutencao) => {
    setFuncoes(prev => {
      const idx = prev.findIndex(f => f.id === funcao.id);
      const prox = idx >= 0
        ? prev.map(f => f.id === funcao.id ? funcao : f)
        : [...prev, { ...funcao, criadoPor: userId }];
      salvar(FUNCOES_KEY, prox);
      return prox;
    });
    setWizard(false); setEditandoFuncao(null);
  }, [userId]);

  const excluirFuncao = useCallback((id: string) => {
    setFuncoes(prev => { const p = prev.filter(f => f.id !== id); salvar(FUNCOES_KEY, p); return p; });
    setConfirmandoExclusao(null);
  }, []);

  const abrirChamado = useCallback((chamado: ChamadoManutencao) => {
    // Se for OS, extrair título e gerar número sequencial
    if (chamado.funcaoId === OS_ID) {
      const titulo = chamado.respostas?.os_titulo_os;
      if (titulo) chamado.osTitulo = titulo;
      const atual = Number(localStorage.getItem(OS_CONTADOR_KEY) || '0');
      const prox = atual + 1;
      localStorage.setItem(OS_CONTADOR_KEY, String(prox));
      chamado.osNumero = String(prox).padStart(6, '0');
    }
    setChamados(prev => { const p = [chamado, ...prev]; salvar(CHAMADOS_KEY, p); return p; });
    setFormAberto(null);
  }, []);

  const abrirChamadoLivre = useCallback((chamado: ChamadoManutencao) => {
    setChamados(prev => { const p = [chamado, ...prev]; salvar(CHAMADOS_KEY, p); return p; });
    setFormLivreAberto(false);
    setAbaAtiva('enviadas');
  }, []);

  const criarChamadoAtribuido = useCallback((
    funcao: FuncaoManutencao,
    responsavelId: string, responsavelNome: string, responsavelCargo: string, obs: string
  ) => {
    const chamado: ChamadoManutencao = {
      id: gerarId(),
      numero: proximoNumero(),
      protocolo: gerarProtocolo(),
      funcaoId: funcao.id, funcaoNome: funcao.nome, funcaoIcone: funcao.icone, funcaoCor: funcao.cor,
      responsavel: responsavelNome, responsavelId, responsavelCargo,
      status: 'aberto', horarioInicial: Date.now(), respostas: {},
      criadoPor: userId, criadoPorNome: nome, criadoPorRole: role,
      criadoEm: Date.now(), observacoes: obs,
      adminId: usuario?.adminId, supervisorId: usuario?.supervisorId,
    };
    setChamados(prev => { const p = [chamado, ...prev]; salvar(CHAMADOS_KEY, p); return p; });
    setAtribuindo(null);
  }, [userId, nome, role, usuario]);

  const atualizarStatus = useCallback((id: string, novoStatus: ChamadoManutencao['status']) => {
    setChamados(prev => {
      const p = prev.map(c => c.id === id ? {
        ...c, status: novoStatus,
        ...(novoStatus === 'concluido' ? { horarioFinal: Date.now(), tempoTotal: Date.now() - c.horarioInicial } : {}),
      } : c);
      salvar(CHAMADOS_KEY, p);
      return p;
    });
  }, []);

  // Iniciar chamado e abrir formulário para preenchimento
  const iniciarEPreencher = useCallback((chamado: ChamadoManutencao) => {
    // Muda status para em_andamento
    setChamados(prev => {
      const p = prev.map(c => c.id === chamado.id ? { ...c, status: 'em_andamento' as const } : c);
      salvar(CHAMADOS_KEY, p);
      return p;
    });
    // Encontra a função correspondente
    const funcao = funcoes.find(f => f.id === chamado.funcaoId);
    if (funcao && funcao.blocos.length > 0) {
      setPreenchendoChamado(chamado);
    }
  }, [funcoes]);

  // Atualiza respostas de um chamado existente (após preenchimento do formulário)
  const preencherRespostas = useCallback((chamadoComRespostas: ChamadoManutencao) => {
    if (!preenchendoChamado) return;
    // Limpa rascunho salvo
    localStorage.removeItem(`sm_rascunho_${preenchendoChamado.id}`);
    setChamados(prev => {
      const p = prev.map(c => c.id === preenchendoChamado.id ? {
        ...c,
        respostas: chamadoComRespostas.respostas,
        status: 'concluido' as const,
        horarioFinal: Date.now(),
        tempoTotal: Date.now() - c.horarioInicial,
        ...(chamadoComRespostas.localizacao ? { localizacao: chamadoComRespostas.localizacao } : {}),
      } : c);
      salvar(CHAMADOS_KEY, p);
      return p;
    });
    setPreenchendoChamado(null);
  }, [preenchendoChamado]);

  const excluirChamado = useCallback((id: string) => {
    setChamados(prev => { const p = prev.filter(c => c.id !== id); salvar(CHAMADOS_KEY, p); return p; });
  }, []);

  // Confirma reutilização — abre form com a função do chamado anterior
  const confirmarReutilizar = useCallback(() => {
    if (!reutilizando) return;
    const funcao = funcoes.find(f => f.id === reutilizando.funcaoId);
    setReutilizando(null);
    if (!funcao) return;
    if (podeGerenciar) setAtribuindo(funcao);
    else setFormAberto(funcao);
  }, [reutilizando, funcoes, podeGerenciar]);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const meusChamadosVisiveis = useMemo(() => chamados.filter(c =>
    c.status !== 'cancelado' &&
    (podeGerenciar || c.responsavelId === userId || c.criadoPor === userId)
  ), [chamados, podeGerenciar, userId]);

  const meusChamadosAtivos = useMemo(() => meusChamadosVisiveis.filter(c =>
    c.status !== 'concluido'
  ), [meusChamadosVisiveis]);

  const meusChamadosConcluidos = useMemo(() => meusChamadosVisiveis.filter(c =>
    c.status === 'concluido'
  ), [meusChamadosVisiveis]);

  const contadoresStatus = useMemo(() => ({
    todos: meusChamadosVisiveis.length,
    aberto: meusChamadosVisiveis.filter(c => c.status === 'aberto').length,
    em_andamento: meusChamadosVisiveis.filter(c => c.status === 'em_andamento').length,
    concluido: meusChamadosConcluidos.length,
  }), [meusChamadosVisiveis, meusChamadosConcluidos]);

  const funcoesFiltradas = useMemo(() => {
    if (!busca.trim()) return funcoes.filter(f => f.ativo && f.id !== OS_ID);
    const q = busca.toLowerCase();
    return funcoes.filter(f => f.ativo && f.id !== OS_ID && f.nome.toLowerCase().includes(q));
  }, [funcoes, busca]);

  const chamadosFiltrados = useMemo(() => {
    let lista: ChamadoManutencao[];
    if (filtroStatusChamado === 'concluido') lista = meusChamadosConcluidos;
    else if (filtroStatusChamado === 'aberto') lista = meusChamadosVisiveis.filter(c => c.status === 'aberto');
    else if (filtroStatusChamado === 'em_andamento') lista = meusChamadosVisiveis.filter(c => c.status === 'em_andamento');
    else lista = meusChamadosVisiveis;
    if (filtroTipo === 'os') lista = lista.filter(c => c.funcaoId === OS_ID);
    else if (filtroTipo === 'livre') lista = lista.filter(c => c.funcaoId === 'livre');
    else if (filtroTipo === 'personalizada') lista = lista.filter(c => c.funcaoId !== OS_ID && c.funcaoId !== 'livre');
    if (!busca.trim()) return lista;
    const q = busca.toLowerCase();
    return lista.filter(c =>
      [c.funcaoNome, c.responsavel, c.protocolo, formatarNumero(c.numero ?? 0)].join(' ').toLowerCase().includes(q)
    );
  }, [meusChamadosVisiveis, meusChamadosConcluidos, busca, filtroTipo, filtroStatusChamado]);


  const handleTileClick = (funcao: FuncaoManutencao) => {
    // Se a função tem bloco de contrato, abre o formulário diretamente para preencher
    if (funcao.blocos.some(b => b.tipo === 'contrato_servico')) {
      setFormAberto(funcao);
    } else if (podeGerenciar) {
      setAtribuindo(funcao);
    } else {
      setFormAberto(funcao);
    }
  };

  /* ── Ordem de Serviço pré-montada ────────────────────────────────────── */
  const criarFuncaoOS = useCallback((): FuncaoManutencao => ({
    id: OS_ID,
    nome: 'Ordem de Serviço',
    icone: '📋',
    cor: '#0D47A1',
    blocos: [
      { uid: 'os_titulo_os',     tipo: 'titulo',          label: 'Título da OS',                obrigatorio: true  },
      { uid: 'os_status',        tipo: 'status',          label: 'Status da OS',                obrigatorio: false },
      { uid: 'os_prioridade',    tipo: 'prioridade',      label: 'Prioridade',                  obrigatorio: false },
      { uid: 'os_cliente',       tipo: 'titulo',          label: 'Cliente / Solicitante',       obrigatorio: false },
      { uid: 'os_contato',       tipo: 'titulo',          label: 'Telefone / Contato',          obrigatorio: false },
      { uid: 'os_endereco',      tipo: 'texto',           label: 'Endereço / Local do Serviço', obrigatorio: false },
      { uid: 'os_equipamento',   tipo: 'titulo',          label: 'Equipamento / Patrimônio',    obrigatorio: false },
      { uid: 'os_modelo',        tipo: 'titulo',          label: 'Marca / Modelo',              obrigatorio: false },
      { uid: 'os_numserie',      tipo: 'titulo',          label: 'Nº de Série',                 obrigatorio: false },
      { uid: 'os_placa',         tipo: 'placa',           label: 'Placa do Veículo',            obrigatorio: false },
      { uid: 'os_descricao',     tipo: 'descricao',       label: 'Descrição do Problema / Serviço Solicitado', obrigatorio: false },
      { uid: 'os_diagnostico',   tipo: 'descricao',       label: 'Diagnóstico Técnico',         obrigatorio: false },
      { uid: 'os_servico',       tipo: 'descricao',       label: 'Serviço Executado',           obrigatorio: false },
      { uid: 'os_pecas',         tipo: 'texto',           label: 'Peças / Materiais Utilizados', obrigatorio: false },
      { uid: 'os_servicos',      tipo: 'servicos_valores', label: 'Serviços e Valores',           obrigatorio: false },
      { uid: 'os_checklist',     tipo: 'checklist',       label: 'Checklist de Verificação',    obrigatorio: false, opcoes: [] },
      { uid: 'os_fotos',         tipo: 'galeria',         label: 'Fotos do Serviço',            obrigatorio: false },
      { uid: 'os_antes_depois',  tipo: 'antes_depois',    label: 'Antes e Depois',              obrigatorio: false },
      { uid: 'os_localizacao',   tipo: 'localizacao',     label: 'Localização GPS',             obrigatorio: false },
      { uid: 'os_observacoes',   tipo: 'texto',           label: 'Observações',                 obrigatorio: false },
      { uid: 'os_horario_ini',   tipo: 'horario_inicial', label: 'Início do Atendimento',       obrigatorio: false },
      { uid: 'os_horario_fim',   tipo: 'horario_final',   label: 'Fim do Atendimento',          obrigatorio: false },
      { uid: 'os_tempo',         tipo: 'tempo_total',     label: 'Tempo Total',                 obrigatorio: false },
      { uid: 'os_ass_cliente',   tipo: 'assinatura',      label: 'Assinatura do Cliente',       obrigatorio: false },
      { uid: 'os_ass_mecanico',  tipo: 'assinatura',      label: 'Assinatura do Mecânico',      obrigatorio: false },
      { uid: 'os_avaliacao',     tipo: 'avaliacao_estrela', label: 'Avaliação do Atendimento',  obrigatorio: false },
    ],
    qrTipo: 'nenhum',
    criadoPor: userId,
    criadoEm: Date.now(),
    ativo: true,
  }), [userId]);

  const handleOSClick = useCallback(() => {
    const osAtualizada = criarFuncaoOS();
    let funcaoOS = funcoes.find(f => f.id === OS_ID);
    if (funcaoOS) {
      // Sincronizar blocos — garante que novos campos apareçam
      funcaoOS = { ...funcaoOS, blocos: osAtualizada.blocos };
      setFuncoes(prev => {
        const prox = prev.map(f => f.id === OS_ID ? funcaoOS! : f);
        salvar(FUNCOES_KEY, prox);
        return prox;
      });
    } else {
      funcaoOS = osAtualizada;
      setFuncoes(prev => {
        const prox = [...prev, funcaoOS!];
        salvar(FUNCOES_KEY, prox);
        return prox;
      });
    }
    setFormAberto(funcaoOS);
  }, [funcoes, criarFuncaoOS]);

  const toggleOsBloco = useCallback((uid: string) => {
    setOsOcultos(prev => {
      const next = prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid];
      salvar(OS_OCULTOS_KEY, next);
      return next;
    });
  }, []);

  const restaurarOsPadrao = useCallback(() => {
    setOsOcultos([]);
    salvar(OS_OCULTOS_KEY, []);
  }, []);

  const blocosOSCompletos = useMemo(() => criarFuncaoOS().blocos, [criarFuncaoOS]);

  // ── Card de chamado ──────────────────────────────────────────────────────
  const renderChamadoCard = (c: ChamadoManutencao, concluido = false) => {
    const funcaoDoCard = funcoes.find(f => f.id === c.funcaoId);
    const respostasVals = Object.values(c.respostas || {});
    const temRecibo = funcaoDoCard?.blocos.some(b => b.tipo === 'recibo') && respostasVals.some(v => v && typeof v === 'object' && v !== null && 'nomeContratante' in v && (v as Record<string, unknown>)._tipo !== 'recibo_simples');
    const temReciboSimples = funcaoDoCard?.blocos.some(b => b.tipo === 'recibo_simples') && respostasVals.some(v => v && typeof v === 'object' && v !== null && 'nomeContratante' in v && (v as Record<string, unknown>)._tipo === 'recibo_simples');
    const temContrato = funcaoDoCard?.blocos.some(b => b.tipo === 'contrato_servico') && respostasVals.some(v => v && typeof v === 'object' && v !== null && 'contratanteNome' in v);
    return (
    <div key={c.id} className={`${styles.chamadoCard} ${concluido ? styles.chamadoConcluido : ''}`}
      style={{ '--card-cor': c.funcaoCor } as React.CSSProperties}>

      <div className={styles.chamadoHeader}>
        <div className={styles.chamadoTipo}>
          <span className={styles.chamadoIcone}>{c.funcaoIcone}</span>
          <div>
            <span className={styles.chamadoNomeTipo}>{c.funcaoNome}</span>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
              {!!c.numero && (
                <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:900, color:'#fff', background:'#0D0D0D', padding:'2px 8px', borderRadius:6 }}>
                  {formatarNumero(c.numero)}
                </span>
              )}
              <span style={{ fontFamily:'monospace', fontSize:11, color:'#FF8F00', fontWeight:700 }}>{c.protocolo}</span>
            </div>
          </div>
        </div>
        {concluido && c.tempoTotal && <span className={styles.chamadoTempoTotal}>{formatarTempo(c.tempoTotal)}</span>}
        {!concluido && <div className={styles.chamadoTimer}><Clock size={16} />{formatarTempo(agora - c.horarioInicial)}</div>}
      </div>

      <div className={styles.chamadoInfo}>
        {c.osNumero && (
          <div className={styles.chamadoInfoItem}>
            <span className={styles.chamadoInfoLabel}>Nº da OS</span>
            <span className={styles.chamadoInfoValor} style={{ fontFamily:'monospace', fontWeight:800 }}>{c.osNumero}</span>
          </div>
        )}
        {c.osTitulo && (
          <div className={styles.chamadoInfoItem}>
            <span className={styles.chamadoInfoLabel}>Título da OS</span>
            <span className={styles.chamadoInfoValor}>{c.osTitulo}</span>
          </div>
        )}
        <div className={styles.chamadoInfoItem}>
          <span className={styles.chamadoInfoLabel}>Responsável</span>
          <span className={styles.chamadoInfoValor}>{c.responsavel}{c.responsavelCargo ? ` — ${c.responsavelCargo}` : ''}</span>
        </div>
        <div className={styles.chamadoInfoItem}>
          <span className={styles.chamadoInfoLabel}>Data</span>
          <span className={styles.chamadoInfoValor}>{formatarData(c.criadoEm)}</span>
        </div>
        {c.observacoes && (
          <div className={styles.chamadoInfoItem}>
            <span className={styles.chamadoInfoLabel}>Observações</span>
            <span className={styles.chamadoInfoValor}>{c.observacoes}</span>
          </div>
        )}
      </div>

      {/* QR Code do chamado */}
      <button
        type="button"
        data-qr-chamado={c.id}
        onClick={() => setQrAmpliado(c)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setQrAmpliado(c); }}
        style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 16px', background:'#f9fafb', borderRadius:12, border:'1.5px solid #e4e4e7', margin:'0 0 8px', cursor:'pointer', transition:'background 0.15s', width:'100%', fontFamily:'inherit', textAlign:'left' }}
        title="Toque para ampliar o QR Code"
      >
        <QRCodeCanvas
          value={`${globalThis.location.origin}/manutencao/form?chamado=${c.id}`}
          size={64}
          level="M"
          style={{ borderRadius:6 }}
        />
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <span style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px' }}>QR Code do Chamado</span>
          <span style={{ fontSize:12, color:'#9ca3af', lineHeight:1.3 }}>Toque para ampliar e mostrar para outro funcionário</span>
        </div>
      </button>

      {/* Expansão de itens — Manutenção Livre */}
      {c.funcaoId === 'livre' && Array.isArray((c.respostas as any)?.itens) && (c.respostas as any).itens.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
            style={{ width:'100%', padding:'8px 12px', background:'#f0f0ff', border:'1.5px solid #c7d2fe', borderRadius:10, color:'#4338ca', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom: expandedId === c.id ? 10 : 0 }}
          >
            {expandedId === c.id ? '▲ Fechar' : `▼ Ver ${(c.respostas as any).itens.length} item(s) registrado(s)`}
          </button>
          {expandedId === c.id && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {(c.respostas as any).itens.map((item: { descricao: string; fotos: string[] }, idx: number) => (
                <div key={`${item.descricao}-${item.fotos?.[0] ?? idx}`} style={{ background:'#fafafa', border:'1.5px solid #e4e4e7', borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.5px' }}>Item {idx + 1}</span>
                  {item.descricao && <p style={{ margin:0, fontSize:14, color:'#111', lineHeight:1.5 }}>{item.descricao}</p>}
                  {item.fotos?.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {item.fotos.map((f: string, fi: number) => (
                        <button key={f} type="button" onClick={() => setFotoAmpliada(f)}
                          style={{ padding:0, border:'none', background:'none', cursor:'zoom-in' }}>
                          <img src={f} alt={`item${idx+1} foto${fi+1}`}
                            style={{ width:70, height:70, objectFit:'cover', borderRadius:8, border:'2px solid #e4e4e7' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles.chamadoAcoes}>
        {!concluido && c.status === 'aberto' && (
          <button className={styles.btnAndamento} onClick={() => iniciarEPreencher(c)}>
            <PlayCircle size={18} /> Iniciar
          </button>
        )}
        {!concluido && c.status === 'em_andamento' && (
          <button className={styles.btnAndamento} onClick={() => iniciarEPreencher(c)}>
            <PlayCircle size={16} /> Em Andamento
          </button>
        )}
        {!concluido && (
          <button className={styles.btnConcluir} onClick={() => atualizarStatus(c.id, 'concluido')}>
            <CheckCircle2 size={18} /> Concluir
          </button>
        )}

        {/* Botão editar */}
        {podeGerenciar && (
          <button
            onClick={() => setEditandoChamado(c)}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(59,130,246,0.1)', border:'1.5px solid rgba(59,130,246,0.3)', borderRadius:10, color:'#2563eb', cursor:'pointer', width:36, height:36 }}
            title="Editar chamado"
          >
            <Edit2 size={16} />
          </button>
        )}

        {/* Botão reutilizar */}
        <button
          onClick={() => setReutilizando(c)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(124,58,237,0.1)', border:'1.5px solid rgba(124,58,237,0.3)', borderRadius:10, color:'#7c3aed', cursor:'pointer', width:36, height:36 }}
          title="Reutilizar esta manutenção"
        >
          <RefreshCw size={16} />
        </button>

        {/* Botão compartilhar */}
        <button
          onClick={() => compartilharChamado(c)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(37,211,102,0.12)', border:'1.5px solid rgba(37,211,102,0.4)', borderRadius:10, color:'#16a34a', cursor:'pointer', width:36, height:36 }}
          title="Compartilhar via WhatsApp"
        >
          <Share2 size={16} />
        </button>

        {/* Botão PDF */}
        <button
          onClick={() => imprimirChamado(c)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(220,38,38,0.08)', border:'1.5px solid rgba(220,38,38,0.3)', borderRadius:10, color:'#dc2626', cursor:'pointer', width:36, height:36 }}
          title="Gerar PDF"
        >
          <FileDown size={16} />
        </button>

        {/* Botão Recibo */}
        {temRecibo && (
        <button
          onClick={() => gerarRecibo(c)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(13,71,161,0.08)', border:'1.5px solid rgba(13,71,161,0.3)', borderRadius:10, color:'#0D47A1', cursor:'pointer', width:36, height:36 }}
          title="Gerar Recibo de Prestação de Serviço"
        >
          <Receipt size={16} />
        </button>
        )}

        {/* Botão Recibo Simples */}
        {temReciboSimples && (
        <button
          onClick={() => gerarReciboSimples(c)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(55,65,81,0.08)', border:'1.5px solid rgba(55,65,81,0.3)', borderRadius:10, color:'#374151', cursor:'pointer', width:36, height:36 }}
          title="Gerar Recibo Modelo Simples"
        >
          <FileDown size={14} style={{ marginRight:-4 }} /><Receipt size={12} />
        </button>
        )}

        {/* Botão Contrato */}
        {temContrato && (
        <button
          onClick={() => gerarContratoServico(c)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px', background:'rgba(30,58,95,0.08)', border:'1.5px solid rgba(30,58,95,0.3)', borderRadius:10, color:'#1e3a5f', cursor:'pointer', width:36, height:36 }}
          title="Gerar Contrato de Serviço"
        >
          <FileText size={16} />
        </button>
        )}

        {podeGerenciar && (
          <button className={styles.btnExcluir} onClick={() => { if (confirm('Excluir?')) excluirChamado(c.id); }} title="Excluir">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
  };

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader} style={{ position: 'relative' }}>
        <div className={styles.pageHeaderTitulo}>
          <span className={styles.pageHeaderIcone}>🛠️</span>
          <div className={styles.pageHeaderTexto}>
            <h1>Manutenção</h1>
            <p>{ehFuncionario ? `Olá, ${nome}` : 'Sistema de chamados e ordens'}</p>
            {meusChamadosAtivos.length > 0 && (
              <span className={styles.badgeAtivos}>⚡ {meusChamadosAtivos.length} em aberto</span>
            )}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 14 }}>
          <GearButton onClick={() => setCfgAberto(true)} />
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${abaAtiva === 'chamados' ? styles.tabAtivo : ''}`} onClick={() => setAbaAtiva('chamados')}>
          <Home size={18} /> Chamados
        </button>
        {podeGerenciar && (
          <button className={`${styles.tab} ${abaAtiva === 'gerenciar' ? styles.tabAtivo : ''}`} onClick={() => setAbaAtiva('gerenciar')}>
            <Settings size={18} /> Personalizar Manutenção
          </button>
        )}
        <button className={`${styles.tab} ${abaAtiva === 'enviadas' ? styles.tabAtivo : ''}`} onClick={() => setAbaAtiva('enviadas')}>
          <Inbox size={18} /> Enviadas
          {chamados.length > 0 && (
            <span style={{ background:'#0D0D0D', color:'#FFD600', fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:20, marginLeft:4 }}>{chamados.length}</span>
          )}
        </button>
      </div>

      {/* ── ABA CHAMADOS ──────────────────────────────────────────────────── */}
      {abaAtiva === 'chamados' && (
        <>
          {/* Tiles de funções fixas */}
          <div className={tilesPrefs.layout === 'simples' ? styles.tilesGrid : undefined} style={tilesPrefs.layout === 'simples' ? undefined : { marginTop: 20, marginBottom: 16 }}>
            <TilesRenderer
              prefs={tilesPrefs}
              tiles={[
                ...(podeGerenciar && !busca ? [{
                  icone: <Plus size={52} style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }} />,
                  nome: 'Personalizar Manutenção',
                  desc: 'Crie campos e categorias',
                  acao: '+ Criar',
                  onClick: () => setWizard(true),
                  onHelp: undefined,
                  visivel: true,
                }] : []),
                ...(!busca || 'manutenção livre'.includes(busca.toLowerCase()) ? [{
                  icone: <span style={{ fontSize: 52, lineHeight: 1 }}>📋</span>,
                  nome: 'Manutenção Livre',
                  desc: 'Registro rápido sem template',
                  acao: '+ Registrar',
                  onClick: () => setFormLivreAberto(true),
                  onHelp: () => setTutorialFuncao('livre' as const),
                  visivel: true,
                }] : []),
                ...(!busca || 'checklist'.includes(busca.toLowerCase()) ? [{
                  icone: <ClipboardList size={52} style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }} />,
                  nome: 'Checklist',
                  desc: 'Listas de verificação',
                  acao: '+ Acessar',
                  onClick: () => navigate('/checklist'),
                  onHelp: () => setTutorialFuncao('checklist' as const),
                  visivel: true,
                }] : []),
                ...(!busca || 'ordem de serviço'.includes(busca.toLowerCase()) || 'os'.includes(busca.toLowerCase()) ? [{
                  icone: <span style={{ fontSize: 52, lineHeight: 1 }}>📋</span>,
                  nome: 'Ordem de Serviço',
                  desc: 'Gerencie ordens de serviço',
                  acao: '+ Abrir',
                  onClick: handleOSClick,
                  onHelp: () => setTutorialFuncao('os' as const),
                  visivel: true,
                }] : []),
                ...(podeGerenciar && (!busca || 'funcionários'.includes(busca.toLowerCase())) ? [{
                  icone: <Users size={52} style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }} />,
                  nome: 'Funcionários',
                  desc: 'Equipes e tarefas',
                  acao: '+ Acessar',
                  onClick: () => navigate('/usuarios'),
                  onHelp: () => setTutorialFuncao('funcionarios' as const),
                  visivel: true,
                }] : []),
              ] as TileAction[]}
            />
          </div>

          {/* Custom tiles (funcoesFiltradas) — sempre em grid quadrado */}
          {(funcoesFiltradas.length > 0 || (funcoesFiltradas.length === 0 && busca) || (funcoes.length === 0 && !podeGerenciar)) && (
            <div className={styles.tilesGrid} style={{ marginTop: 0 }}>
              {funcoesFiltradas.map(funcao => (
              <div key={funcao.id} style={{ position: 'relative' }}>
                <div
                  className={`${styles.tile} ${styles.tileCustom}`}
                  style={{ '--tile-bg': funcao.cor, width: '100%', cursor: 'pointer' } as React.CSSProperties}
                  onClick={() => handleTileClick(funcao)}
                >
                  <span className={styles.tileIcone}>{funcao.icone}</span>
                  <span className={styles.tileNome}>{funcao.nome}</span>
                  <div style={{ display:'flex', gap:6, marginTop:4 }} onClick={e => e.stopPropagation()}>
                    {podeGerenciar && (
                      <button style={{ background:'rgba(0,0,0,0.2)', border:'none', borderRadius:6, padding:'5px 10px', color:'#0D0D0D', cursor:'pointer', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', gap:3 }}
                        onClick={() => { setEditandoFuncao(funcao); setWizard(true); }}>
                        <Edit2 size={11} /> Editar
                      </button>
                    )}
                    <button style={{ background:'rgba(0,0,0,0.2)', border:'none', borderRadius:6, padding:'5px 8px', color:'#0D0D0D', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:800 }}
                      onClick={() => setFormAberto(funcao)}>
                      <Eye size={11} /> Ver
                    </button>
                    {podeGerenciar && (
                      <button style={{ background:'rgba(0,0,0,0.2)', border:'none', borderRadius:6, padding:'5px 8px', color:'#0D0D0D', cursor:'pointer' }}
                        onClick={() => setConfirmandoExclusao(funcao.id)}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setTutorialFuncao(funcao); }}
                  style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.25)', border:'1.5px solid rgba(255,255,255,0.5)', color:'#fff', fontSize:13, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2, lineHeight:1 }}
                  title="Como funciona"
                >?</button>
                {confirmandoExclusao === funcao.id && (
                  <div className={styles.tileConfirmOverlay}>
                    <span className={styles.tileConfirmTexto}>Excluir "{funcao.nome}"?</span>
                    <div className={styles.tileConfirmBtns}>
                      <button className={styles.tileConfirmSim} onClick={() => excluirFuncao(funcao.id)}>
                        <Trash2 size={14} /> Excluir
                      </button>
                      <button className={styles.tileConfirmNao} onClick={() => setConfirmandoExclusao(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {funcoesFiltradas.length === 0 && busca && (
              <div className={styles.vazio} style={{ gridColumn:'1/-1' }}>
                <span className={styles.vazioIcone}>🔍</span>
                <p>Nenhuma função encontrada para "{busca}"</p>
              </div>
            )}
            {funcoes.length === 0 && !podeGerenciar && (
              <div className={styles.vazio}>
                <span className={styles.vazioIcone}>🛠️</span>
                <p>Nenhuma função cadastrada</p>
              </div>
            )}
            </div>
          )}

          {/* Modal config tiles */}
          {cfgAberto && (
            <TilesConfigModal
              prefs={tilesPrefs}
              onUpdate={atualizarTilesPrefs}
              onClose={() => setCfgAberto(false)}
            />
          )}

          {/* Busca */}
          <div style={{ position:'relative', marginBottom: 12 }}>
            <Search size={18} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', pointerEvents:'none' }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar função, responsável, #número ou protocolo..."
              style={{
                width:'100%', padding:'14px 44px 14px 50px', border:'2px solid var(--cor-borda)',
                borderRadius:14, fontSize:15, color:'var(--cor-texto)', background:'var(--cor-superficie)',
                outline:'none', boxSizing:'border-box', fontFamily:'inherit',
              }}
            />
            {busca && (
              <button onClick={() => setBusca('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtros por tipo */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            {([['todos','Todos'],['os','📋 OS'],['livre','📝 Livre'],['personalizada','🔧 Personalizada']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFiltroTipo(filtroTipo === key ? 'todos' : key)}
                style={{
                  padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer',
                  fontFamily:'inherit', border: filtroTipo === key ? '2px solid #FF8F00' : '2px solid var(--cor-borda)',
                  background: filtroTipo === key ? 'linear-gradient(135deg, #FFD600, #FF8F00)' : 'var(--cor-superficie)',
                  color: filtroTipo === key ? '#0D0D0D' : 'var(--cor-texto)',
                  transition:'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filtros por status */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
            {([
              { key: 'todos' as const, label: 'Todos', count: contadoresStatus.todos },
              { key: 'aberto' as const, label: '🟡 Não Iniciadas', count: contadoresStatus.aberto },
              { key: 'em_andamento' as const, label: '🔵 Em Andamento', count: contadoresStatus.em_andamento },
              { key: 'concluido' as const, label: '✅ Concluídas', count: contadoresStatus.concluido },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setFiltroStatusChamado(filtroStatusChamado === f.key ? 'todos' : f.key)}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'7px 14px', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer',
                  fontFamily:'inherit', whiteSpace:'nowrap',
                  border: filtroStatusChamado === f.key ? '2px solid #FF8F00' : '2px solid var(--cor-borda)',
                  background: filtroStatusChamado === f.key ? 'linear-gradient(135deg, #FFD600, #FF8F00)' : 'var(--cor-superficie)',
                  color: filtroStatusChamado === f.key ? '#0D0D0D' : 'var(--cor-texto)',
                  transition:'all 0.2s',
                }}
              >
                {f.label} <span style={{ background: filtroStatusChamado === f.key ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.08)', padding:'1px 7px', borderRadius:20, fontSize:11, fontWeight:800 }}>{f.count}</span>
              </button>
            ))}
          </div>

          {/* Lista principal */}
          {chamadosFiltrados.length > 0 && (
            <div className={styles.secao}>
              <h2 className={styles.secaoTitulo}>
                {(() => {
                  if (filtroStatusChamado === 'em_andamento') return <><Clock size={20} /> Em Andamento</>;
                  if (filtroStatusChamado === 'aberto') return <><Clock size={20} /> Não Iniciadas</>;
                  if (filtroStatusChamado === 'concluido') return <><CheckCircle2 size={20} /> Concluídos</>;
                  return <><Inbox size={20} /> Todas as Manutenções</>;
                })()} ({chamadosFiltrados.length})
              </h2>
              <div className={styles.chamadosList}>
                {chamadosFiltrados.map(c => renderChamadoCard(c, c.status === 'concluido'))}
              </div>
            </div>
          )}

          {chamados.length === 0 && funcoes.length > 0 && !busca && (
            <div className={styles.vazio}>
              <span className={styles.vazioIcone}>📋</span>
              <p>Nenhum chamado aberto</p>
              <p>{podeGerenciar ? 'Clique em uma função acima e atribua a um funcionário' : 'Seus chamados aparecerão aqui'}</p>
            </div>
          )}
        </>
      )}

      {/* ── ABA GERENCIAR ─────────────────────────────────────────────────── */}
      {abaAtiva === 'gerenciar' && podeGerenciar && (
        <>
          <div style={{ border: '2px dashed #FFD600', borderRadius: 16, padding: '20px 24px', marginBottom: 16, background: 'rgba(255,214,0,0.06)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--cor-texto)', lineHeight: 1.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <strong>AQUI FICARÃO</strong> TODAS AS MANUTENÇÕES QUE VOCÊ <strong>PERSONALIZAR</strong>
            </p>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button className={styles.btnPrimario} onClick={() => setWizard(true)}>
              <Plus size={18} />
              <span style={{ textAlign: 'center', lineHeight: 1.3 }}>PERSONALIZAR<br />MANUTENÇÃO</span>
            </button>
          </div>
          <div className={styles.tilesGrid}>
            {/* Tile fixo — QR Codes */}
            <div style={{ position: 'relative' }}>
              <button
                className={`${styles.tile} ${styles.tileCustom}`}
                style={{ '--tile-bg': '#6A1B9A', color: '#fff', width: '100%' } as React.CSSProperties}
                onClick={() => navigate('/qrcodes')}
              >
                <QrCode size={52} style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }} />
                <span className={styles.tileNome}>QR Codes</span>
                <span className={styles.tileBotao}><Plus size={14} /> Acessar</span>
              </button>
              <button
                onClick={e => { e.stopPropagation(); setTutorialFuncao('qrcodes'); }}
                style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.25)', border:'1.5px solid rgba(255,255,255,0.5)', color:'#fff', fontSize:13, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2, lineHeight:1 }}
                title="Como funciona"
              >?</button>
            </div>

            {funcoes.map(f => (
              <div key={f.id} className={styles.tile} style={{ '--tile-bg': f.cor, cursor:'pointer' } as React.CSSProperties}
                onClick={() => setPreviewFuncao(f)}>
                <span className={styles.tileIcone}>{f.icone}</span>
                <span className={styles.tileNome}>{f.nome}</span>
                <div style={{ display:'flex', gap:6, marginTop:4 }}>
                  <button style={{ background:'rgba(0,0,0,0.2)', border:'none', borderRadius:6, padding:'5px 10px', color:'#0D0D0D', cursor:'pointer', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', gap:3 }}
                    onClick={e => { e.stopPropagation(); setEditandoFuncao(f); setWizard(true); }}>
                    <Edit2 size={11} /> Editar
                  </button>
                  <button style={{ background:'rgba(0,0,0,0.2)', border:'none', borderRadius:6, padding:'5px 8px', color:'#0D0D0D', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:800 }}
                    onClick={e => { e.stopPropagation(); setFormAberto(f); }}>
                    <Eye size={11} /> Ver
                  </button>
                  <button style={{ background:'rgba(0,0,0,0.2)', border:'none', borderRadius:6, padding:'5px 8px', color:'#0D0D0D', cursor:'pointer' }}
                    onClick={e => { e.stopPropagation(); excluirFuncao(f.id); }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
            {funcoes.length === 0 && (
              <div className={styles.vazio} style={{ gridColumn:'1/-1' }}>
                <span className={styles.vazioIcone}>⚙️</span>
                <p>Nenhuma função criada ainda</p>
              </div>
            )}
          </div>

          <div style={{ border: '2px solid #e4e4e7', borderRadius: 16, padding: '20px 24px', marginTop: 8, background: 'var(--cor-superficie)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 900, color: 'var(--cor-texto)' }}>
              💡 Precisa de uma nova função?
            </p>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--cor-texto-secundario)', lineHeight: 1.6 }}>
              Solicite aqui! Desenvolvemos sem nenhum custo adicional e entregamos em poucas horas.
            </p>
          </div>
        </>
      )}

      {/* ── ABA ENVIADAS ──────────────────────────────────────────────────── */}
      {abaAtiva === 'enviadas' && (
        <PainelEnviadas
          chamados={chamados}
          usuarioId={userId}
          usuarioRole={role}
          adminId={usuario?.adminId}
          supervisorId={usuario?.supervisorId}
          onExcluir={podeGerenciar ? excluirChamado : undefined}
          onCompartilhar={compartilharChamado}
          onImprimir={imprimirChamado}
        />
      )}

      {/* Modais */}
      {wizard && (
        <WizardCriar
          funcaoEditar={editandoFuncao ?? undefined}
          onConcluir={salvarFuncao}
          onCancelar={() => { setWizard(false); setEditandoFuncao(null); }}
        />
      )}
      {formAberto && (
        <FormChamado
          funcao={formAberto}
          usuarioId={userId} usuarioNome={nome} usuarioRole={role}
          adminId={usuario?.adminId} supervisorId={usuario?.supervisorId}
          onEnviar={abrirChamado}
          onCancelar={() => setFormAberto(null)}
          statusAoEnviar={formAberto.id === OS_ID ? 'aberto' : 'concluido'}
          osNumeroExibir={formAberto.id === OS_ID ? String(Number(localStorage.getItem(OS_CONTADOR_KEY) || '0') + 1).padStart(6, '0') : undefined}
          osOcultos={formAberto.id === OS_ID ? osOcultos : undefined}
          onToggleBloco={formAberto.id === OS_ID ? toggleOsBloco : undefined}
          onRestaurarOS={formAberto.id === OS_ID ? restaurarOsPadrao : undefined}
        />
      )}
      {preenchendoChamado && funcoes.find(f => f.id === preenchendoChamado.funcaoId) && (
        <FormChamado
          funcao={funcoes.find(f => f.id === preenchendoChamado.funcaoId)!}
          usuarioId={preenchendoChamado.responsavelId} usuarioNome={preenchendoChamado.responsavel} usuarioRole={role}
          adminId={usuario?.adminId} supervisorId={usuario?.supervisorId}
          chamadoId={preenchendoChamado.id}
          onEnviar={preencherRespostas}
          onCancelar={() => setPreenchendoChamado(null)}
          osNumeroExibir={preenchendoChamado.osNumero}
        />
      )}
      {atribuindo && (
        <ModalAtribuir
          funcao={atribuindo}
          onConfirmar={(rId, rNome, rCargo, obs) => criarChamadoAtribuido(atribuindo, rId, rNome, rCargo, obs)}
          onCancelar={() => setAtribuindo(null)}
          onPreview={() => setPreviewFuncao(atribuindo)}
        />
      )}
      {reutilizando && (
        <ModalReutilizar
          chamado={reutilizando}
          onConfirmar={confirmarReutilizar}
          onCancelar={() => setReutilizando(null)}
        />
      )}
      {/* Modal editar chamado */}
      {editandoChamado && (
        <ModalEditarChamado
          chamado={editandoChamado}
          onSalvar={(atualizado) => {
            setChamados(prev => {
              const p = prev.map(c => c.id === atualizado.id ? atualizado : c);
              salvar(CHAMADOS_KEY, p);
              return p;
            });
            setEditandoChamado(null);
          }}
          onCancelar={() => setEditandoChamado(null)}
        />
      )}
      {/* Lightbox foto */}
      {fotoAmpliada && (
        <div
          role="none"
          onClick={() => setFotoAmpliada(null)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setFotoAmpliada(null); }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, cursor:'zoom-out' }}
        >
          <img
            src={fotoAmpliada}
            alt="foto ampliada"
            style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:12, boxShadow:'0 0 60px rgba(0,0,0,0.8)' }}
          />
          <button
            onClick={() => setFotoAmpliada(null)}
            style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* ── Modal tutorial da função ── */}
      {tutorialFuncao && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:2000, padding:'0 0 0 0' }}
        >
          <button type="button" onClick={() => setTutorialFuncao(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar tutorial" tabIndex={-1} />
          <div
            style={{ background:'var(--cor-superficie, #fff)', borderRadius:'24px 24px 0 0', padding:'28px 24px 40px', width:'100%', maxWidth:480, boxShadow:'0 -8px 40px rgba(0,0,0,0.2)', maxHeight:'85vh', overflowY:'auto', position:'relative', zIndex:1 }}
          >
            {/* Handle */}
            <div style={{ width:40, height:4, background:'#e4e4e7', borderRadius:4, margin:'0 auto 20px' }} />

            {(() => {
              if (typeof tutorialFuncao === 'string' && tutorialFuncao !== 'livre') return (
              (() => {
                const tutorials: Record<string, { icone: string; cor: string; nome: string; sub: string; passos: { n: string; t: string; d: string }[] }> = {
                  checklist: {
                    icone: '📋', cor: '#1565C0', nome: 'Checklist', sub: 'Verificação por etapas',
                    passos: [
                      { n:'1', t:'O que é?', d:'O Checklist permite criar listas de verificação para inspeções, rondas e auditorias com itens a conferir.' },
                      { n:'2', t:'Como usar', d:'Acesse → crie um novo checklist → adicione os itens de verificação → marque cada um como OK ou com problema.' },
                      { n:'3', t:'Reportar problema', d:'Se um item estiver com defeito, registre o problema com foto e descrição diretamente no checklist.' },
                      { n:'4', t:'Histórico', d:'Todos os checklists realizados ficam salvos para consulta e exportação.' },
                    ],
                  },
                  os: {
                    icone: '📋', cor: '#0D47A1', nome: 'Ordem de Serviço', sub: 'OS completa com todos os campos',
                    passos: [
                      { n:'1', t:'O que é?', d:'A Ordem de Serviço é um formulário completo com campos pré-configurados para registrar serviços de manutenção.' },
                      { n:'2', t:'Como abrir', d:'Clique em Abrir → preencha os dados do cliente, equipamento, diagnóstico e serviço realizado.' },
                      { n:'3', t:'Timer automático', d:'O sistema registra automaticamente o tempo de atendimento desde a abertura até a conclusão.' },
                      { n:'4', t:'PDF e compartilhamento', d:'Ao concluir, gere o PDF da OS ou compartilhe por WhatsApp com o cliente.' },
                    ],
                  },
                  funcionarios: {
                    icone: '👥', cor: '#2E7D32', nome: 'Funcionários', sub: 'Gestão da equipe',
                    passos: [
                      { n:'1', t:'O que é?', d:'Gerencie os funcionários da sua equipe — cadastre, edite cargos e defina permissões de acesso.' },
                      { n:'2', t:'Cadastrar', d:'Adicione novos funcionários com nome, cargo, e-mail e senha de acesso ao sistema.' },
                      { n:'3', t:'Atribuir chamados', d:'Com funcionários cadastrados, você pode atribuir chamados de manutenção para cada um.' },
                      { n:'4', t:'Acompanhar', d:'Visualize todos os chamados atribuídos e o desempenho de cada funcionário.' },
                    ],
                  },
                  qrcodes: {
                    icone: '📱', cor: '#6A1B9A', nome: 'QR Codes', sub: 'Acesso rápido por QR Code',
                    passos: [
                      { n:'1', t:'O que é?', d:'Gere QR Codes para que moradores, clientes e funcionários abram formulários de manutenção diretamente.' },
                      { n:'2', t:'Como gerar', d:'Acesse → selecione a função → gere o QR Code → imprima e cole no local desejado.' },
                      { n:'3', t:'Leitura', d:'Ao escanear o QR Code, o formulário correspondente abre automaticamente no celular.' },
                      { n:'4', t:'Gestão', d:'Gerencie todos os QR Codes criados, ative/desative e visualize estatísticas de uso.' },
                    ],
                  },
                };
                const info = tutorials[tutorialFuncao];
                if (!info) return null;
                return (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                      <div style={{ width:52, height:52, borderRadius:16, background:info.cor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{info.icone}</div>
                      <div>
                        <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'var(--cor-texto,#0D0D0D)' }}>{info.nome}</h2>
                        <p style={{ margin:'3px 0 0', fontSize:13, color:'#71717a' }}>{info.sub}</p>
                      </div>
                    </div>
                    {info.passos.map(s => (
                      <div key={s.n} style={{ display:'flex', gap:12, padding:'12px 14px', background:'#f9f9f9', borderRadius:14, marginBottom:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:info.cor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, flexShrink:0 }}>{s.n}</div>
                        <div>
                          <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:800, color:'#0D0D0D' }}>{s.t}</p>
                          <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.5 }}>{s.d}</p>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()
              );
              if (tutorialFuncao === 'livre') return (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                  <div style={{ width:52, height:52, borderRadius:16, background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>📋</div>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'var(--cor-texto,#0D0D0D)' }}>Manutenção Livre</h2>
                    <p style={{ margin:'3px 0 0', fontSize:13, color:'#71717a' }}>Registro livre de manutenção</p>
                  </div>
                </div>
                {[
                  { n:'1', t:'Quando usar?', d:'Use quando a manutenção não se encaixa em nenhuma função criada. Ideal para ocorrências avulsas e urgentes.' },
                  { n:'2', t:'Como registrar', d:'Clique em Registrar → adicione descrição e fotos de cada item que precisar → envie.' },
                  { n:'3', t:'Múltiplos itens', d:'Você pode adicionar vários itens numa única ordem — cada um com descrição e fotos próprias.' },
                  { n:'4', t:'Histórico', d:'Todos os registros ficam salvos na aba Enviadas para consulta futura.' },
                ].map(s => (
                  <div key={s.n} style={{ display:'flex', gap:12, padding:'12px 14px', background:'#f9f9f9', borderRadius:14, marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'#0D0D0D', color:'#FFD600', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, flexShrink:0 }}>{s.n}</div>
                    <div>
                      <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:800, color:'#0D0D0D' }}>{s.t}</p>
                      <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.5 }}>{s.d}</p>
                    </div>
                  </div>
                ))}
              </>
              );
              const f = tutorialFuncao;
              return (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                  <div style={{ width:52, height:52, borderRadius:16, background:f.cor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                    {f.icone}
                  </div>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'var(--cor-texto,#0D0D0D)' }}>{f.nome}</h2>
                    <p style={{ margin:'3px 0 0', fontSize:13, color:'#71717a' }}>Função de manutenção personalizada</p>
                  </div>
                </div>
                {[
                  { n:'1', t: podeGerenciar ? 'Atribuir chamado' : 'Abrir chamado', d: podeGerenciar ? 'Clique no card → selecione o funcionário responsável → adicione observações → clique em Criar e Atribuir.' : 'Clique no card → preencha o formulário → envie para registrar o chamado.' },
                  { n:'2', t:'Acompanhamento', d:'O funcionário verá o chamado em "Meus Chamados" e pode iniciar, atualizar e concluir o atendimento.' },
                  { n:'3', t:'Timer automático', d:'O sistema registra automaticamente o tempo total de atendimento desde a abertura até a conclusão.' },
                  { n:'4', t:'Compartilhar', d:'Ao concluir, use o botão Compartilhar para enviar o resumo via WhatsApp.' },
                  ...((f.qrTipo && f.qrTipo !== 'nenhum') ? [{ n:'5', t:'Acesso por QR Code', d:`Esta função tem QR Code configurado (${f.qrTipo}). Escaneie para abrir o formulário diretamente.` }] : []),
                ].map(s => (
                  <div key={s.n} style={{ display:'flex', gap:12, padding:'12px 14px', background:'#f9f9f9', borderRadius:14, marginBottom:8 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:f.cor, color:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, flexShrink:0 }}>{s.n}</div>
                    <div>
                      <p style={{ margin:'0 0 3px', fontSize:14, fontWeight:800, color:'#0D0D0D' }}>{s.t}</p>
                      <p style={{ margin:0, fontSize:13, color:'#6b7280', lineHeight:1.5 }}>{s.d}</p>
                    </div>
                  </div>
                ))}
              </>
              );
            })()}

            <button
              onClick={() => setTutorialFuncao(null)}
              style={{ width:'100%', marginTop:16, padding:'14px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:14, fontSize:15, fontWeight:900, color:'#0D0D0D', cursor:'pointer' }}
            >
              Entendido ✓
            </button>
          </div>
        </div>
      )}

      {/* ── Modal visualizar formulário (como o funcionário vê) ── */}
      {previewFuncao && (() => {
        const pf = previewFuncao;
        const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

        const renderBlocoPreview = (bloco: typeof pf.blocos[0]) => {
          const def = BLOCOS_DISPONIVEIS.find(d => d.id === bloco.tipo);
          if (!def) return null;
          const lbl = bloco.label || def.nome;
          const obg = bloco.obrigatorio;

          const fieldLabel = (
            <span style={{ fontSize:13, fontWeight:800, color:'#374151', display:'block', marginBottom:6 }}>
              {def.icone} {lbl} {obg && <span style={{ color:'#dc2626', fontWeight:900 }}>*</span>}
            </span>
          );
          const inputBox = (placeholder: string) => (
            <div style={{ padding:'12px 14px', background:'#f9fafb', border:'2px solid #e5e7eb', borderRadius:12, fontSize:14, color:'#9ca3af' }}>{placeholder}</div>
          );
          const textareaBox = (placeholder: string) => (
            <div style={{ padding:'12px 14px', background:'#f9fafb', border:'2px solid #e5e7eb', borderRadius:12, fontSize:14, color:'#9ca3af', minHeight:80 }}>{placeholder}</div>
          );

          switch (bloco.tipo) {
            case 'titulo': case 'subtitulo':
              return <div key={bloco.uid} style={{ marginBottom:14 }}>{fieldLabel}{inputBox(`Digite ${def.nome.toLowerCase()}...`)}</div>;

            case 'texto': case 'descricao': case 'feedback': case 'perguntas': case 'ocorrencia': case 'problema':
              return <div key={bloco.uid} style={{ marginBottom:14 }}>{fieldLabel}{textareaBox('Digite aqui... ou clique em Falar 🎙️')}</div>;

            case 'status':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {['Pendente','Em andamento','Concluído','Cancelado'].map(s => (
                      <span key={s} style={{ padding:'8px 14px', background:'#f3f4f6', border:'2px solid #e5e7eb', borderRadius:10, fontSize:12, fontWeight:700, color:'#6b7280' }}>{s}</span>
                    ))}
                  </div>
                </div>
              );

            case 'prioridade':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {[{v:'Baixa',c:'#2e7d32'},{v:'Média',c:'#f57c00'},{v:'Alta',c:'#d84315'},{v:'Urgente',c:'#b71c1c'}].map(p => (
                      <span key={p.v} style={{ padding:'8px 16px', border:`2px solid ${p.c}`, borderRadius:10, fontSize:13, fontWeight:800, color:p.c, background:'#fff' }}>{p.v}</span>
                    ))}
                  </div>
                </div>
              );

            case 'avaliacao_estrela':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', gap:4 }}>
                    {[1,2,3,4,5].map(n => <Star key={n} size={30} color="#d4d4d8" />)}
                  </div>
                </div>
              );

            case 'avaliacao_escala':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                      <span key={n} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:800, color:'#9ca3af', background:'#f9fafb' }}>{n}</span>
                    ))}
                  </div>
                </div>
              );

            case 'satisfacao':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                    {[{e:'😞',l:'Muito insatisfeito'},{e:'😕',l:'Insatisfeito'},{e:'😐',l:'Neutro'},{e:'😊',l:'Satisfeito'},{e:'😄',l:'Muito satisfeito'}].map(s => (
                      <div key={s.l} style={{ textAlign:'center', opacity:0.5 }}>
                        <span style={{ fontSize:28, display:'block' }}>{s.e}</span>
                        <span style={{ fontSize:9, color:'#9ca3af', fontWeight:600 }}>{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 'checklist':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {['Item 1','Item 2','Item 3'].map(item => (
                      <div key={item} style={{ padding:'10px 14px', background:'#f9fafb', border:'2px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:600, color:'#6b7280' }}>⬜ {item}</div>
                    ))}
                  </div>
                </div>
              );

            case 'galeria':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:28, border:'2px dashed #d1d5db', borderRadius:14, background:'#f9fafb', color:'#9ca3af', fontWeight:600, fontSize:13 }}>
                    <Camera size={32} color="#aaa" />
                    <span>Toque para adicionar fotos</span>
                  </div>
                </div>
              );

            case 'antes_depois':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {['📷 Antes','📷 Depois'].map(t => (
                      <div key={t} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:20, border:'2px dashed #d1d5db', borderRadius:14, background:'#f9fafb', fontSize:12, color:'#9ca3af', fontWeight:700 }}>
                        <Camera size={24} color="#aaa" /><span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 'horario_inicial':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#f0fdf4', border:'2px solid #bbf7d0', borderRadius:12, fontSize:14, fontWeight:700, color:'#166534' }}>
                    <Play size={16} color="#2e7d32" /> {horaAtual}
                  </div>
                  <p style={{ fontSize:11, color:'#9ca3af', margin:'3px 0 0' }}>Preenchido automaticamente ao abrir o chamado</p>
                </div>
              );

            case 'horario_final':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#fef2f2', border:'2px solid #fecaca', borderRadius:12, fontSize:14, fontWeight:700, color:'#991b1b' }}>
                    <CheckCircle2 size={16} color="#d32f2f" /> Será marcado ao enviar
                  </div>
                  <p style={{ fontSize:11, color:'#9ca3af', margin:'3px 0 0' }}>Preenchido automaticamente ao finalizar</p>
                </div>
              );

            case 'tempo_total':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#FFF8E1', border:'2px solid #FFE082', borderRadius:12, fontSize:16, fontWeight:800, color:'#0D0D0D', fontFamily:'Courier New, monospace' }}>
                    <Clock size={18} /> 00m 00s
                  </div>
                  <p style={{ fontSize:11, color:'#9ca3af', margin:'3px 0 0' }}>Calculado automaticamente</p>
                </div>
              );

            case 'localizacao':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ padding:14, textAlign:'center', background:'linear-gradient(135deg,#e0f2f1,#b2dfdb)', border:'2px solid #80cbc4', borderRadius:12, fontSize:14, fontWeight:800, color:'#00695c' }}>📍 Capturar minha localização</div>
                </div>
              );

            case 'agendar':
              return <div key={bloco.uid} style={{ marginBottom:14 }}>{fieldLabel}{inputBox('Selecione data e hora...')}</div>;

            case 'assinatura':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ padding:28, textAlign:'center', border:'2px dashed #d1d5db', borderRadius:14, background:'#f9fafb', fontSize:14, color:'#9ca3af', fontWeight:600 }}>✍️ Toque aqui para assinar</div>
                </div>
              );

            case 'vencimento':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  {inputBox('📆 Selecione data de vencimento...')}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                    {[1,3,7,15,30].map(d => (
                      <span key={d} style={{ padding:'4px 10px', background:'#f3f4f6', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:11, fontWeight:700, color:'#6b7280' }}>{d}d antes</span>
                    ))}
                  </div>
                </div>
              );

            case 'kilometragem':
              return <div key={bloco.uid} style={{ marginBottom:14 }}>{fieldLabel}{inputBox('Digite a kilometragem atual...')}</div>;

            case 'placa': case 'modelo': case 'cor_veiculo': case 'tipo_veiculo':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  {bloco.opcoes && bloco.opcoes.length > 0
                    ? <div style={{ padding:'12px 14px', background:'#f9fafb', border:'2px solid #e5e7eb', borderRadius:12, fontSize:14, color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'space-between' }}>Selecione... ▾</div>
                    : inputBox(`Digite ${def.nome.toLowerCase()}...`)
                  }
                </div>
              );

            case 'servicos_valores':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ border:'2px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'50px 1fr 90px 90px', gap:0, background:'#f3f4f6', padding:'8px 10px', fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>
                      <span>Qtd</span><span>Descrição</span><span>Preço Un.</span><span>Subtotal</span>
                    </div>
                    {[1,2].map(i => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'50px 1fr 90px 90px', gap:0, padding:'8px 10px', borderTop:'1px solid #e5e7eb' }}>
                        <span style={{ color:'#9ca3af', fontSize:13 }}>1</span>
                        <span style={{ color:'#9ca3af', fontSize:13 }}>Serviço {i}...</span>
                        <span style={{ color:'#9ca3af', fontSize:13 }}>R$ 0,00</span>
                        <span style={{ color:'#9ca3af', fontSize:13 }}>R$ 0,00</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#f9fafb', borderTop:'2px solid #e5e7eb', fontWeight:900, fontSize:14 }}>
                      <span>TOTAL</span><span style={{ color:'#16a34a' }}>R$ 0,00</span>
                    </div>
                  </div>
                </div>
              );

            case 'recibo':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ border:'2px solid #c7d2fe', borderRadius:14, overflow:'hidden' }}>
                    <div style={{ background:'#0D47A1', color:'#fff', padding:'10px 14px', textAlign:'center' }}>
                      <div style={{ fontSize:14, fontWeight:900, textTransform:'uppercase', letterSpacing:1 }}>🧾 Recibo de Prestação de Serviço</div>
                      <div style={{ fontSize:10, opacity:0.85, marginTop:2, fontFamily:'monospace' }}>Nº REC-XXXXXXXX-0001</div>
                    </div>
                    <div style={{ padding:12, display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ background:'#f0f4ff', borderRadius:8, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#0D47A1', textTransform:'uppercase', marginBottom:6 }}>👤 Contratante</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                          <div style={{ padding:'8px 10px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>Nome completo...</div>
                          <div style={{ padding:'8px 10px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>CPF / CNPJ</div>
                        </div>
                      </div>
                      <div style={{ background:'#f0fdf4', borderRadius:8, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#16a34a', textTransform:'uppercase', marginBottom:6 }}>🛠️ Prestador de Serviço</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                          <div style={{ padding:'8px 10px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>Nome completo...</div>
                          <div style={{ padding:'8px 10px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>CPF / CNPJ</div>
                        </div>
                      </div>
                      <div style={{ padding:'8px 10px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af', minHeight:40 }}>📋 Descrição do serviço... 🎙️</div>
                      <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:10, padding:10, textAlign:'center' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#16a34a', textTransform:'uppercase' }}>💰 Valor Recebido</div>
                        <div style={{ fontSize:18, fontWeight:900, fontFamily:'monospace', color:'#16a34a' }}>R$ 0,00</div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        <div style={{ padding:'8px 10px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>📍 Local...</div>
                        <div style={{ padding:'8px 10px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>📅 Data</div>
                      </div>
                      <div style={{ background:'#f9fafb', borderRadius:8, padding:'8px 10px', border:'1.5px solid #e5e7eb' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#6b7280', textTransform:'uppercase', textAlign:'center', marginBottom:6 }}>✍️ Assinaturas Digitais</div>
                        <div style={{ display:'flex', gap:8 }}>
                          <div style={{ flex:1, height:50, border:'2px dashed #c7d2fe', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9ca3af', fontWeight:600 }}>Prestador</div>
                          <div style={{ flex:1, height:50, border:'2px dashed #c7d2fe', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9ca3af', fontWeight:600 }}>Contratante</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'recibo_simples':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ border:'2px solid #374151', borderRadius:14, overflow:'hidden', background:'#fff' }}>
                    <div style={{ background:'#1a1a2e', color:'#fff', padding:'12px 14px', textAlign:'center' }}>
                      <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>RECIBO DE PRESTAÇÃO DE SERVIÇO</div>
                      <div style={{ fontSize:10, opacity:0.85, marginTop:2, fontFamily:'monospace' }}>Nº REC-XXXXXXXX-0001</div>
                    </div>
                    <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ fontSize:12, color:'#374151', lineHeight:1.6 }}>Declaro, para os devidos fins, que recebi de:</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        <div style={{ padding:'8px 10px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>Nome...</div>
                        <div style={{ padding:'8px 10px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>CPF / CNPJ</div>
                      </div>
                      <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:10, padding:10, textAlign:'center' }}>
                        <div style={{ fontSize:11, color:'#374151', marginBottom:4 }}>A importância de:</div>
                        <div style={{ fontSize:18, fontWeight:900, fontFamily:'monospace', color:'#16a34a' }}>R$ 0,00</div>
                        <div style={{ fontSize:10, fontStyle:'italic', color:'#6b7280' }}>(valor por extenso)</div>
                      </div>
                      <div style={{ fontSize:12, color:'#374151' }}>Referente à prestação de serviço de manutenção descrita abaixo:</div>
                      <div style={{ padding:'8px 10px', background:'#fafafa', border:'1.5px solid #ddd', borderRadius:8, fontSize:12, color:'#9ca3af', minHeight:50 }}>📋 Descrição do serviço... 🎙️</div>
                      <div style={{ padding:'8px 10px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>💳 Forma de pagamento...</div>
                      <div style={{ padding:'8px 12px', background:'#fffbeb', border:'1.5px solid #fcd34d', borderRadius:8, fontSize:12, fontWeight:700, color:'#92400e', textAlign:'center' }}>Declaro que o valor acima foi recebido integralmente.</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        <div style={{ padding:'8px 10px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>📍 Local...</div>
                        <div style={{ padding:'8px 10px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>📅 Data</div>
                      </div>
                      <div style={{ background:'#f0f4ff', borderRadius:8, padding:'8px 10px', border:'1.5px solid #c7d2fe' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#0D47A1', textTransform:'uppercase', marginBottom:6 }}>🛠️ Prestador de Serviço</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                          <div style={{ padding:'8px 10px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>Nome do prestador...</div>
                          <div style={{ padding:'8px 10px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, color:'#9ca3af' }}>CPF / CNPJ</div>
                        </div>
                      </div>
                      <div style={{ background:'#f9fafb', borderRadius:8, padding:'8px 10px', border:'1.5px solid #e5e7eb' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#6b7280', textTransform:'uppercase', textAlign:'center', marginBottom:6 }}>✍️ Assinatura do Prestador</div>
                        <div style={{ height:50, border:'2px dashed #c7d2fe', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#9ca3af', fontWeight:600 }}>Toque para assinar</div>
                      </div>
                      <div style={{ background:'#fffbeb', borderRadius:8, padding:'8px 10px', border:'1px solid #fcd34d' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#92400e', textTransform:'uppercase', marginBottom:4 }}>📌 Observações</div>
                        <div style={{ fontSize:10, color:'#92400e', lineHeight:1.4 }}>• Recibo válido como comprovante de pagamento.<br/>• Manter uma via para ambas as partes.</div>
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'contrato_servico':
              return (
                <div key={bloco.uid} style={{ marginBottom:14 }}>
                  {fieldLabel}
                  <div style={{ border:'2px solid #1e3a5f', borderRadius:14, overflow:'hidden', background:'#fff' }}>
                    <div style={{ background:'#1e3a5f', color:'#fff', padding:'12px 14px', textAlign:'center' }}>
                      <div style={{ fontSize:14, fontWeight:900, textTransform:'uppercase', letterSpacing:1.5 }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
                      <div style={{ fontSize:10, opacity:0.85, marginTop:2 }}>DE MANUTENÇÃO</div>
                    </div>
                    <div style={{ padding:12, display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ fontSize:11, color:'#374151', fontStyle:'italic' }}>Pelo presente instrumento particular, de um lado:</div>
                      {/* Contratante */}
                      <div style={{ background:'#f0f4ff', borderRadius:8, padding:'8px 10px', border:'1.5px solid #c7d2fe' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#0D47A1', textTransform:'uppercase', marginBottom:4 }}>👤 Contratante</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                          <div style={{ padding:'6px 8px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, color:'#9ca3af' }}>Nome...</div>
                          <div style={{ padding:'6px 8px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, color:'#9ca3af' }}>CPF/CNPJ</div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:4, marginTop:4 }}>
                          <div style={{ padding:'6px 8px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, color:'#9ca3af' }}>Endereço...</div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:4 }}>
                          <div style={{ padding:'6px 8px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, color:'#9ca3af' }}>E-mail</div>
                          <div style={{ padding:'6px 8px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, color:'#9ca3af' }}>Telefone</div>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:'#374151', fontStyle:'italic' }}>E, de outro lado:</div>
                      {/* Contratado */}
                      <div style={{ background:'#f0fdf4', borderRadius:8, padding:'8px 10px', border:'1.5px solid #bbf7d0' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#16a34a', textTransform:'uppercase', marginBottom:4 }}>🛠️ Contratado</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                          <div style={{ padding:'6px 8px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, color:'#9ca3af' }}>Nome...</div>
                          <div style={{ padding:'6px 8px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, fontSize:11, color:'#9ca3af' }}>CPF/CNPJ</div>
                        </div>
                      </div>
                      {/* Cláusulas resumidas */}
                      {['1 – Do Objeto','2 – Obrigações do Contratado','3 – Obrigações do Contratante','4 – Do Prazo','5 – Valor e Pagamento','6 – Da Rescisão','7 – Penalidades','8 – Resp. Trabalhista','9 – Do Foro','10 – Disposições Gerais'].map(cl => (
                        <div key={cl} style={{ padding:'6px 10px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, fontSize:10, fontWeight:700, color:'#1e3a5f' }}>📋 Cláusula {cl}</div>
                      ))}
                      {/* Valor */}
                      <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:8, padding:8, textAlign:'center' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#16a34a', textTransform:'uppercase' }}>💰 Valor do Contrato</div>
                        <div style={{ fontSize:16, fontWeight:900, fontFamily:'monospace', color:'#16a34a' }}>R$ 0,00</div>
                      </div>
                      {/* Assinaturas */}
                      <div style={{ background:'#f9fafb', borderRadius:8, padding:'8px 10px', border:'1.5px solid #e5e7eb' }}>
                        <div style={{ fontSize:9, fontWeight:900, color:'#6b7280', textTransform:'uppercase', textAlign:'center', marginBottom:4 }}>✍️ Assinaturas</div>
                        <div style={{ display:'flex', gap:8 }}>
                          <div style={{ flex:1, height:40, border:'2px dashed #c7d2fe', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#9ca3af', fontWeight:600 }}>Contratante</div>
                          <div style={{ flex:1, height:40, border:'2px dashed #bbf7d0', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#9ca3af', fontWeight:600 }}>Contratado</div>
                        </div>
                      </div>
                      {/* Testemunhas */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        <div style={{ padding:'6px 8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, fontSize:10, color:'#9ca3af' }}>👤 Testemunha 1</div>
                        <div style={{ padding:'6px 8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, fontSize:10, color:'#9ca3af' }}>👤 Testemunha 2</div>
                      </div>
                    </div>
                  </div>
                </div>
              );

            default:
              return <div key={bloco.uid} style={{ marginBottom:14 }}>{fieldLabel}{textareaBox('Preencha este campo... 🎙️')}</div>;
          }
        };

        return (
          <div
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16 }}
          >
            <button type="button" onClick={() => setPreviewFuncao(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar preview" tabIndex={-1} />
            <div
              style={{ background:'var(--cor-superficie, #fff)', borderRadius:24, width:'100%', maxWidth:520, maxHeight:'92vh', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.35)', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}
            >
              {/* Header — idêntico ao FormChamado */}
              <div style={{ background: pf.cor, padding:'18px 20px 12px', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:36, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{pf.icone}</span>
                    <div>
                      <div style={{ fontSize:18, fontWeight:900, color:'#0D0D0D' }}>{pf.nome}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:14, fontWeight:800, color:'#0D0D0D', fontFamily:'Courier New, monospace', background:'rgba(255,255,255,0.3)', padding:'2px 10px', borderRadius:16, width:'fit-content', marginTop:3 }}>
                        <Clock size={13} /> 00m 00s
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setPreviewFuncao(null)} style={{ background:'rgba(255,255,255,0.25)', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', color:'#0D0D0D', cursor:'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'rgba(13,13,13,0.6)' }}>▶ Iniciado às {horaAtual}</div>
              </div>

              {/* Badge de pré-visualização */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 16px', background:'#EEF2FF', color:'#4338CA', fontSize:12, fontWeight:800, borderBottom:'1px solid #E0E7FF' }}>
                <Eye size={14} /> Pré-visualização — Assim ficará para o funcionário
              </div>

              {/* Corpo com campos renderizados */}
              <div style={{ flex:1, overflowY:'auto', padding:20 }}>
                {pf.blocos.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 20px', color:'#999' }}>
                    <span style={{ fontSize:40, display:'block', marginBottom:12 }}>📝</span>
                    <p style={{ fontSize:14, fontWeight:700, color:'#666' }}>Nenhum campo configurado</p>
                    <p style={{ fontSize:13, color:'#999' }}>Edite a função para adicionar blocos ao formulário.</p>
                  </div>
                ) : (
                  <>
                    {/* Responsável — sempre presente */}
                    <div style={{ marginBottom:14 }}>
                      <span style={{ fontSize:13, fontWeight:800, color:'#374151', display:'block', marginBottom:6 }}>
                        👤 Responsável <span style={{ color:'#dc2626', fontWeight:900 }}>*</span>
                      </span>
                      <div style={{ padding:'12px 14px', background:'#f9fafb', border:'2px solid #e5e7eb', borderRadius:12, fontSize:14, color:'#9ca3af' }}>Nome do responsável...</div>
                    </div>

                    {/* Blocos configurados */}
                    {pf.blocos.map(bloco => renderBlocoPreview(bloco))}
                  </>
                )}
              </div>

              {/* Footer — idêntico ao FormChamado */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'14px 20px', background:'#fafafa', borderTop:'2px solid #f0f0f0', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:800, color:'#6b7280', fontFamily:'Courier New, monospace' }}>
                  <Clock size={15} /> 00m 00s
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', borderRadius:14, fontSize:14, fontWeight:900, letterSpacing:'0.5px' }}>
                  <CheckCircle2 size={18} /> FINALIZAR E ENVIAR
                </div>
              </div>

              {/* Ações reais */}
              <div style={{ padding:'12px 20px 16px', display:'flex', gap:10, flexShrink:0 }}>
                {pf.id === OS_ID ? (
                  <button onClick={() => { setPreviewFuncao(null); setOsConfigAberto(true); }}
                    style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:14, fontWeight:900, color:'#0D0D0D', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <Settings size={16} /> Configurar Campos
                  </button>
                ) : (
                  <button onClick={() => { setPreviewFuncao(null); setEditandoFuncao(pf); setWizard(true); }}
                    style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:14, fontWeight:900, color:'#0D0D0D', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <Edit2 size={16} /> Editar Formulário
                  </button>
                )}
                <button onClick={() => setPreviewFuncao(null)}
                  style={{ padding:'12px 20px', background:'none', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, fontWeight:700, color:'#6b7280', cursor:'pointer', fontFamily:'inherit' }}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {formLivreAberto && (
        <FormChamadoLivre
          usuarioId={userId}
          usuarioNome={nome}
          usuarioRole={role}
          adminId={usuario?.adminId}
          supervisorId={usuario?.supervisorId}
          onEnviar={abrirChamadoLivre}
          onCancelar={() => setFormLivreAberto(false)}
        />
      )}

      {/* ── Overlay Configurar Campos da OS ────────────────────────── */}
      {osConfigAberto && (
        <div className={styles.osConfigOverlay}>
          <button type="button" onClick={() => setOsConfigAberto(false)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar configuração" tabIndex={-1} />
          <div className={styles.osConfigModal} style={{ position:'relative', zIndex:1 }}>
            <div className={styles.osConfigHeader}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Settings size={20} />
                <h3 className={styles.osConfigTitulo}>Personalizar OS</h3>
              </div>
              <button className={styles.osConfigFechar} onClick={() => setOsConfigAberto(false)}>
                <X size={18} />
              </button>
            </div>
            <p className={styles.osConfigDesc}>
              Oculte campos que você não usa. O modelo será salvo automaticamente.
            </p>
            <div className={styles.osConfigLista}>
              {blocosOSCompletos.map(bloco => {
                const def = BLOCOS_DISPONIVEIS.find(d => d.id === bloco.tipo);
                const oculto = osOcultos.includes(bloco.uid);
                return (
                  <button
                    key={bloco.uid}
                    className={`${styles.osConfigItem} ${oculto ? styles.osConfigItemOculto : ''}`}
                    onClick={() => toggleOsBloco(bloco.uid)}
                  >
                    <span className={styles.osConfigItemInfo}>
                      <span className={styles.osConfigItemIcone}>{def?.icone || '📝'}</span>
                      <span className={styles.osConfigItemNome}>{bloco.label || def?.nome}</span>
                    </span>
                    {oculto ? <EyeOff size={18} className={styles.osConfigEyeOff} /> : <Eye size={18} className={styles.osConfigEye} />}
                  </button>
                );
              })}
            </div>
            {osOcultos.length > 0 && (
              <button className={styles.osConfigRestaurar} onClick={restaurarOsPadrao}>
                <RotateCcw size={16} /> Restaurar padrão original
              </button>
            )}
            <div className={styles.osConfigRodape}>
              {osOcultos.length > 0
                ? (() => { const pl = osOcultos.length > 1; return `${osOcultos.length} campo${pl ? 's' : ''} oculto${pl ? 's' : ''}`; })()
                : 'Modelo padrão — todos os campos visíveis'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManutencaoPage;
