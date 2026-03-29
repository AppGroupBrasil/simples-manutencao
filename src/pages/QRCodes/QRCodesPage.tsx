import React, { useState, useMemo, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Search, QrCode, Globe, Lock, Key, Printer, Copy, Check, X, Download, Upload, FileText, Image, Eye, Clock, Star, Camera, Play, CheckCircle2 } from 'lucide-react';
import { BLOCOS_DISPONIVEIS } from '../Manutencao/constants';
import type { FuncaoManutencao } from '../Manutencao/types';
import styles from './QRCodes.module.css';

const FUNCOES_KEY = 'manutencao_funcoes_v2';
const LOGO_KEY = 'sm_logo_empresa';

function carregar<T>(key: string, padrao: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : padrao; }
  catch { return padrao; }
}

function gerarUrl(funcao: FuncaoManutencao): string {
  const base = globalThis.location.origin;
  if (funcao.qrTipo === 'chave' && funcao.qrChave) {
    return `${base}/manutencao/form?chave=${funcao.qrChave}`;
  }
  return `${base}/manutencao/form?id=${funcao.id}`;
}

const TIPO_LABEL: Record<string, { texto: string; icone: React.ReactNode; classe: string }> = {
  chave:   { texto: 'Com Chave',  icone: <Key size={12} />,    classe: styles.tipoChave },
  publico: { texto: 'Público',    icone: <Globe size={12} />,  classe: styles.tipoPublico },
  privado: { texto: 'Privado',    icone: <Lock size={12} />,   classe: styles.tipoPrivado },
};

// ── Texto explicativo baseado no nome da função ────────────────────────────
function gerarTextoExplicativo(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('vistoria'))    return `Escaneie o QR Code para realizar uma ${nome}`;
  if (n.includes('manutenção') || n.includes('manutencao')) return `Escaneie o QR Code para solicitar uma ${nome}`;
  if (n.includes('inspeção') || n.includes('inspecao')) return `Escaneie o QR Code para iniciar uma ${nome}`;
  if (n.includes('emergência') || n.includes('emergencia')) return `Escaneie o QR Code para reportar uma ${nome}`;
  if (n.includes('ocorrência') || n.includes('ocorrencia')) return `Escaneie o QR Code para registrar uma ${nome}`;
  if (n.includes('problema'))    return `Escaneie o QR Code para reportar um ${nome}`;
  if (n.includes('chamado'))     return `Escaneie o QR Code para abrir um ${nome}`;
  if (n.includes('revisão') || n.includes('revisao')) return `Escaneie o QR Code para agendar uma ${nome}`;
  return `Escaneie o QR Code para acessar: ${nome}`;
}

// ── Templates A4 ────────────────────────────────────────────────────────────
type ModeloId = 1 | 2 | 3;

function gerarTemplateA4(
  modelo: ModeloId,
  funcao: FuncaoManutencao,
  qrDataUrl: string,
  logoDataUrl: string | null,
  url: string,
): string {
  const texto = gerarTextoExplicativo(funcao.nome);
  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" class="logo" alt="Logo" />`
    : `<div class="logo-placeholder">SUA LOGO</div>`;

  if (modelo === 1) {
    // Modelo 1 — Profissional Corporativo (fundo branco, linhas limpas)
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QR Code A4 — ${funcao.nome}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:210mm; min-height:297mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:'Segoe UI',system-ui,-apple-system,sans-serif; background:#fff; display:flex; flex-direction:column; align-items:center; }
    .header { width:100%; padding:40px 50px 30px; display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid ${funcao.cor}; }
    .logo { max-height:70px; max-width:200px; object-fit:contain; }
    .logo-placeholder { width:160px; height:60px; background:#f5f5f5; border:2px dashed #ccc; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:14px; color:#aaa; font-weight:700; }
    .header-right { text-align:right; }
    .header-right .funcao-icone { font-size:36px; }
    .header-right .funcao-nome { font-size:22px; font-weight:900; color:#0D0D0D; margin-top:4px; }
    .content { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; }
    .qr-frame { background:#fff; border:4px solid ${funcao.cor}; border-radius:24px; padding:32px; box-shadow:0 8px 40px rgba(0,0,0,0.08); }
    .qr-frame img { width:220px; height:220px; display:block; }
    .texto-principal { margin-top:36px; font-size:26px; font-weight:900; color:#0D0D0D; text-align:center; max-width:500px; line-height:1.4; }
    .texto-sub { margin-top:12px; font-size:15px; color:#888; text-align:center; }
    .badge { margin-top:20px; display:inline-flex; align-items:center; gap:8px; background:${funcao.cor}22; border:2px solid ${funcao.cor}44; border-radius:12px; padding:10px 24px; font-size:16px; font-weight:800; color:#0D0D0D; }
    .footer { width:100%; padding:24px 50px; border-top:2px solid #f0f0f0; display:flex; align-items:center; justify-content:space-between; font-size:11px; color:#bbb; }
    .footer-url { font-family:monospace; font-size:10px; color:#ccc; max-width:60%; word-break:break-all; }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="header-right">
      <div class="funcao-icone">${funcao.icone}</div>
      <div class="funcao-nome">${funcao.nome}</div>
    </div>
  </div>
  <div class="content">
    <div class="qr-frame"><img src="${qrDataUrl}" alt="QR Code"/></div>
    <div class="texto-principal">${texto}</div>
    <div class="texto-sub">Aponte a câmera do seu celular para o QR Code acima</div>
    <div class="badge">${funcao.icone} ${funcao.nome}</div>
  </div>
  <div class="footer">
    <span>Simples Manutenção — simplesmanutencao.com.br</span>
    <span class="footer-url">${url}</span>
  </div>
</body>
</html>`;
  }

  if (modelo === 2) {
    // Modelo 2 — Moderno com fundo colorido
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QR Code A4 — ${funcao.nome}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:210mm; min-height:297mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:'Segoe UI',system-ui,-apple-system,sans-serif; background:linear-gradient(160deg, ${funcao.cor} 0%, ${funcao.cor}cc 40%, #fff 40%); display:flex; flex-direction:column; }
    .topo { padding:50px 50px 0; display:flex; align-items:flex-start; justify-content:space-between; }
    .logo { max-height:60px; max-width:180px; object-fit:contain; filter:brightness(0) invert(1); }
    .logo-placeholder { width:140px; height:50px; background:rgba(255,255,255,0.2); border:2px dashed rgba(255,255,255,0.5); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:13px; color:rgba(255,255,255,0.7); font-weight:700; }
    .topo-titulo { text-align:right; color:#0D0D0D; }
    .topo-titulo .icone { font-size:42px; }
    .topo-titulo h1 { font-size:28px; font-weight:900; margin-top:6px; }
    .centro { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px 50px 40px; }
    .qr-card { background:#fff; border-radius:28px; padding:40px; box-shadow:0 20px 60px rgba(0,0,0,0.12); text-align:center; }
    .qr-card img { width:240px; height:240px; display:block; margin:0 auto; }
    .qr-card .texto { margin-top:28px; font-size:22px; font-weight:900; color:#0D0D0D; line-height:1.4; max-width:400px; }
    .qr-card .subtexto { margin-top:10px; font-size:14px; color:#999; max-width:360px; }
    .qr-card .instrucao { margin-top:20px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:14px; font-weight:700; color:${funcao.cor}; background:${funcao.cor}15; padding:10px 24px; border-radius:40px; }
    .rodape { padding:20px 50px; text-align:center; font-size:11px; color:#ccc; border-top:1px solid #f0f0f0; }
    .rodape-url { font-family:monospace; font-size:10px; color:#ddd; margin-top:4px; word-break:break-all; }
  </style>
</head>
<body>
  <div class="topo">
    ${logoHtml}
    <div class="topo-titulo">
      <div class="icone">${funcao.icone}</div>
      <h1>${funcao.nome}</h1>
    </div>
  </div>
  <div class="centro">
    <div class="qr-card">
      <img src="${qrDataUrl}" alt="QR Code"/>
      <div class="texto">${texto}</div>
      <div class="subtexto">Use a câmera do seu celular ou um leitor de QR Code</div>
      <div class="instrucao">📱 Aponte e escaneie</div>
    </div>
  </div>
  <div class="rodape">
    Simples Manutenção — simplesmanutencao.com.br
    <div class="rodape-url">${url}</div>
  </div>
</body>
</html>`;
  }

  // Modelo 3 — Elegante Dark
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QR Code A4 — ${funcao.nome}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:210mm; min-height:297mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { font-family:'Segoe UI',system-ui,-apple-system,sans-serif; background:#111; color:#fff; display:flex; flex-direction:column; }
    .topo { padding:50px; display:flex; align-items:center; justify-content:space-between; }
    .logo { max-height:60px; max-width:180px; object-fit:contain; }
    .logo-placeholder { width:140px; height:50px; background:rgba(255,255,255,0.06); border:2px dashed rgba(255,255,255,0.15); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:13px; color:rgba(255,255,255,0.3); font-weight:700; }
    .topo-nome { font-size:20px; font-weight:900; color:${funcao.cor}; text-align:right; }
    .centro { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px 50px 40px; }
    .icone-grande { font-size:56px; margin-bottom:16px; }
    .titulo { font-size:32px; font-weight:900; color:#fff; margin-bottom:8px; text-align:center; }
    .linha-cor { width:80px; height:4px; background:${funcao.cor}; border-radius:4px; margin:0 auto 32px; }
    .qr-box { background:#fff; border-radius:24px; padding:28px; display:inline-block; box-shadow:0 0 60px ${funcao.cor}33; }
    .qr-box img { width:220px; height:220px; display:block; }
    .texto-esc { margin-top:32px; font-size:22px; font-weight:800; color:#fff; text-align:center; max-width:480px; line-height:1.5; }
    .texto-sub { margin-top:10px; font-size:14px; color:rgba(255,255,255,0.45); text-align:center; }
    .badge-dark { margin-top:24px; background:${funcao.cor}; color:#0D0D0D; padding:12px 32px; border-radius:40px; font-size:15px; font-weight:900; display:inline-flex; align-items:center; gap:8px; }
    .rodape { padding:24px 50px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; font-size:11px; color:rgba(255,255,255,0.2); }
    .rodape-url { font-family:monospace; font-size:10px; max-width:60%; word-break:break-all; }
  </style>
</head>
<body>
  <div class="topo">
    ${logoHtml}
    <div class="topo-nome">${funcao.nome}</div>
  </div>
  <div class="centro">
    <div class="icone-grande">${funcao.icone}</div>
    <div class="titulo">${funcao.nome}</div>
    <div class="linha-cor"></div>
    <div class="qr-box"><img src="${qrDataUrl}" alt="QR Code"/></div>
    <div class="texto-esc">${texto}</div>
    <div class="texto-sub">Aponte a câmera do seu celular para o código acima</div>
    <div class="badge-dark">📱 Escaneie agora</div>
  </div>
  <div class="rodape">
    <span>Simples Manutenção — simplesmanutencao.com.br</span>
    <span class="rodape-url">${url}</span>
  </div>
</body>
</html>`;
}

// ── Modal de Templates A4 ───────────────────────────────────────────────────
const ModalTemplates: React.FC<{
  funcao: FuncaoManutencao;
  logo: string | null;
  onFechar: () => void;
  onUploadLogo: () => void;
}> = ({ funcao, logo, onFechar, onUploadLogo }) => {
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloId>(1);

  const gerarEImprimir = () => {
    const canvas = document.querySelector(`[data-qr-id="${funcao.id}"]`);
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
    const qrDataUrl = canvas.toDataURL('image/png');
    const url = gerarUrl(funcao);
    const html = gerarTemplateA4(modeloSelecionado, funcao, qrDataUrl, logo, url);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = globalThis.open(blobUrl, '_blank');
    if (!win) return;
    win.onload = () => {
      setTimeout(() => { try { win.print(); } catch { /* user prints manually */ } }, 400);
    };
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  };

  const modelos: { id: ModeloId; nome: string; desc: string; preview: string }[] = [
    { id: 1, nome: 'Corporativo',  desc: 'Fundo branco, linhas limpas e profissionais', preview: '📄' },
    { id: 2, nome: 'Moderno',      desc: 'Fundo colorido com card central destacado',   preview: '🎨' },
    { id: 3, nome: 'Elegante Dark', desc: 'Fundo escuro sofisticado com brilho',          preview: '🌙' },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.templateModal}>
        <button className={styles.modalFechar} onClick={onFechar}><X size={18} /></button>

        {/* Header */}
        <div className={styles.templateHeader}>
          <span style={{ fontSize: 32 }}>{funcao.icone}</span>
          <div>
            <h2 className={styles.templateTitulo}>Modelos A4 — {funcao.nome}</h2>
            <p className={styles.templateSub}>Escolha um modelo e imprima para divulgação</p>
          </div>
        </div>

        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoPreview}>
            {logo
              ? <img src={logo} alt="Logo" className={styles.logoImg} />
              : <div className={styles.logoVazio}><Upload size={20} /> Sem logo</div>
            }
          </div>
          <div className={styles.logoInfo}>
            <p className={styles.logoLabel}>{logo ? 'Logo carregada' : 'Carregue sua logo'}</p>
            <p className={styles.logoDica}>Aparecerá no cabeçalho do modelo A4</p>
            <button className={styles.btnUploadSmall} onClick={onUploadLogo}>
              <Upload size={14} /> {logo ? 'Trocar logo' : 'Enviar logo'}
            </button>
          </div>
        </div>

        {/* Modelos */}
        <div className={styles.modelosGrid}>
          {modelos.map(m => (
            <button
              key={m.id}
              className={`${styles.modeloCard} ${modeloSelecionado === m.id ? styles.modeloCardAtivo : ''}`}
              onClick={() => setModeloSelecionado(m.id)}
              style={modeloSelecionado === m.id ? { borderColor: funcao.cor, background: `${funcao.cor}08` } : {}}
            >
              <span className={styles.modeloPreview}>{m.preview}</span>
              <strong className={styles.modeloNome}>{m.nome}</strong>
              <span className={styles.modeloDesc}>{m.desc}</span>
              {modeloSelecionado === m.id && (
                <span className={styles.modeloCheck} style={{ background: funcao.cor }}>
                  <Check size={14} />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ações */}
        <div className={styles.templateAcoes}>
          <button className={styles.btnGerarA4} onClick={gerarEImprimir} style={{ background: `linear-gradient(135deg, ${funcao.cor}, ${funcao.cor}cc)` }}>
            <Printer size={18} /> Gerar e Imprimir A4
          </button>
          <button className={styles.btnFecharTemplate} onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ── Modal Preview do Formulário ─────────────────────────────────────────
const ModalPreviewForm: React.FC<{
  funcao: FuncaoManutencao;
  onFechar: () => void;
}> = ({ funcao, onFechar }) => {
  const agora = new Date();
  const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const renderBlocoPreview = (bloco: { uid: string; tipo: string; label?: string; obrigatorio: boolean; opcoes?: string[] }) => {
    const def = BLOCOS_DISPONIVEIS.find(d => d.id === bloco.tipo);
    if (!def) return null;
    const label = bloco.label || def.nome;

    switch (bloco.tipo) {
      case 'titulo':
      case 'subtitulo':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label} {bloco.obrigatorio && <span className={styles.pvObg}>*</span>}</label>
            <div className={styles.pvInput}>Digite {def.nome.toLowerCase()}...</div>
          </div>
        );

      case 'texto': case 'descricao': case 'feedback': case 'perguntas': case 'ocorrencia': case 'problema':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label} {bloco.obrigatorio && <span className={styles.pvObg}>*</span>}</label>
            <div className={styles.pvTextarea}>Digite aqui... ou clique em Falar 🎙️</div>
          </div>
        );

      case 'status':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvStatusRow}>
              {['Pendente','Em andamento','Concluído','Cancelado'].map(s => (
                <span key={s} className={styles.pvStatusOpcao}>{s}</span>
              ))}
            </div>
          </div>
        );

      case 'prioridade':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvPrioridadeRow}>
              {[
                { v: 'Baixa', c: '#2e7d32' },
                { v: 'Média', c: '#f57c00' },
                { v: 'Alta', c: '#d84315' },
                { v: 'Urgente', c: '#b71c1c' },
              ].map(p => (
                <span key={p.v} className={styles.pvPrioridade} style={{ borderColor: p.c, color: p.c }}>{p.v}</span>
              ))}
            </div>
          </div>
        );

      case 'avaliacao_estrela':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvEstrelasRow}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={28} color="#d4d4d8" />
              ))}
            </div>
          </div>
        );

      case 'avaliacao_escala':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvEscalaRow}>
              {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                <span key={n} className={styles.pvEscalaBotao}>{n}</span>
              ))}
            </div>
          </div>
        );

      case 'satisfacao':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvSatisfacaoRow}>
              {[{k:'mi',e:'😞'},{k:'i',e:'😕'},{k:'n',e:'😐'},{k:'s',e:'😊'},{k:'ms',e:'😄'}].map(s => (
                <span key={s.k} className={styles.pvSatisfacaoEmoji}>{s.e}</span>
              ))}
            </div>
          </div>
        );

      case 'checklist':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvChecklistLista}>
              {['Item 1','Item 2','Item 3'].map(item => (
                <div key={item} className={styles.pvChecklistItem}>⬜ {item}</div>
              ))}
            </div>
          </div>
        );

      case 'galeria':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvGaleria}>
              <Camera size={32} color="#aaa" />
              <span>Toque para adicionar fotos</span>
            </div>
          </div>
        );

      case 'antes_depois':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvAntesDepois}>
              <div className={styles.pvAntesDepoisItem}><Camera size={24} color="#aaa" /><span>📷 Antes</span></div>
              <div className={styles.pvAntesDepoisItem}><Camera size={24} color="#aaa" /><span>📷 Depois</span></div>
            </div>
          </div>
        );

      case 'horario_inicial':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvTempo}><Play size={16} color="#2e7d32" /> <span>{horaAtual}</span></div>
            <p className={styles.pvTempoDesc}>Preenchido automaticamente ao abrir o chamado</p>
          </div>
        );

      case 'horario_final':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvTempo}><CheckCircle2 size={16} color="#d32f2f" /> <span>Será marcado ao enviar</span></div>
            <p className={styles.pvTempoDesc}>Preenchido automaticamente ao finalizar</p>
          </div>
        );

      case 'tempo_total':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvTempoTimer}><Clock size={18} /> <span>00m 00s</span></div>
            <p className={styles.pvTempoDesc}>Calculado automaticamente</p>
          </div>
        );

      case 'localizacao':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvBtnGPS}>📍 Capturar minha localização</div>
          </div>
        );

      case 'agendar':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvInput}>Selecione data e hora...</div>
          </div>
        );

      case 'assinatura':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvAssinatura}>✍️ Toque aqui para assinar</div>
          </div>
        );

      case 'vencimento':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvInput}>📆 Selecione data de vencimento...</div>
            <div className={styles.pvLembretesRow}>
              {[1,3,7,15,30].map(d => (
                <span key={d} className={styles.pvLembreteChip}>{d}d antes</span>
              ))}
            </div>
          </div>
        );

      case 'kilometragem':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            <div className={styles.pvInput}>Digite a kilometragem atual...</div>
          </div>
        );

      case 'placa': case 'modelo': case 'cor_veiculo': case 'tipo_veiculo':
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label}</label>
            {bloco.opcoes && bloco.opcoes.length > 0
              ? <div className={styles.pvSelect}>Selecione... ▾</div>
              : <div className={styles.pvInput}>Digite {def.nome.toLowerCase()}...</div>
            }
          </div>
        );

      default:
        return (
          <div key={bloco.uid} className={styles.pvCampo}>
            <label className={styles.pvLabel}>{def.icone} {label} {bloco.obrigatorio && <span className={styles.pvObg}>*</span>}</label>
            <div className={styles.pvTextarea}>Preencha este campo... 🎙️</div>
          </div>
        );
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.pvModal}>
        <button className={styles.modalFechar} onClick={onFechar}><X size={18} /></button>

        {/* Header simulando o form real */}
        <div className={styles.pvHeader} style={{ background: funcao.cor }}>
          <div className={styles.pvHeaderTopo}>
            <span className={styles.pvHeaderIcone}>{funcao.icone}</span>
            <div>
              <div className={styles.pvHeaderNome}>{funcao.nome}</div>
              <div className={styles.pvHeaderTimer}><Clock size={13} /> 00m 00s</div>
            </div>
          </div>
          <div className={styles.pvHeaderInicio}>▶ Iniciado às {horaAtual}</div>
        </div>

        {/* Badge de preview */}
        <div className={styles.pvBadge}>
          <Eye size={14} /> Pré-visualização — Este é o formulário que será exibido
        </div>

        {/* Corpo com campos */}
        <div className={styles.pvBody}>
          {/* Responsável sempre presente */}
          <div className={styles.pvCampo}>
            <span className={styles.pvLabel}>👤 Responsável <span className={styles.pvObg}>*</span></span>
            <div className={styles.pvInput}>Nome do responsável...</div>
          </div>

          {/* Blocos configurados */}
          {funcao.blocos.map(bloco => renderBlocoPreview(bloco))}
        </div>

        {/* Footer simulando o form real */}
        <div className={styles.pvFooter}>
          <div className={styles.pvFooterTempo}><Clock size={15} /> 00m 00s</div>
          <div className={styles.pvBtnEnviar}><CheckCircle2 size={18} /> FINALIZAR E ENVIAR</div>
        </div>

        {/* Botão fechar */}
        <div className={styles.pvFecharRow}>
          <button className={styles.btnFecharTemplate} onClick={onFechar}>Fechar pré-visualização</button>
        </div>
      </div>
    </div>
  );
};

const ModalQR: React.FC<{
  funcao: FuncaoManutencao;
  qrRef: React.RefObject<HTMLDivElement>;
  copiado: boolean;
  onFechar: () => void;
  onImprimir: (f: FuncaoManutencao) => void;
  onCopiar: (f: FuncaoManutencao) => void;
}> = ({ funcao, qrRef, copiado, onFechar, onImprimir, onCopiar }) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modal} ref={qrRef}>
      <button className={styles.modalFechar} onClick={onFechar}>
        <X size={18} />
      </button>

      <div className={styles.modalIcone}>{funcao.icone}</div>
      <h2 className={styles.modalNome}>{funcao.nome}</h2>

      <div className={styles.modalQr}>
        <QRCodeCanvas
          value={gerarUrl(funcao)}
          size={240}
          bgColor="#FFFFFF"
          fgColor="#0D0D0D"
          level="H"
        />
      </div>

      {funcao.qrTipo === 'chave' && funcao.qrChave && (
        <div className={styles.modalChave}>🔑 Chave: {funcao.qrChave}</div>
      )}
      <div className={styles.modalUrl}>{gerarUrl(funcao)}</div>

      <div className={styles.modalAcoes}>
        <button className={styles.btnImprimir} onClick={() => onImprimir(funcao)}>
          <Printer size={16} /> Imprimir
        </button>
        <button className={styles.btnCopiar} onClick={() => onCopiar(funcao)}>
          {copiado ? <Check size={16} /> : <Copy size={16} />}
          {copiado ? 'Copiado!' : 'Copiar URL'}
        </button>
      </div>
    </div>
  </div>
);

const QRCodesPage: React.FC = () => {
  const [busca, setBusca] = useState('');
  const [modalAberta, setModalAberta] = useState<FuncaoManutencao | null>(null);
  const [templateAberto, setTemplateAberto] = useState<FuncaoManutencao | null>(null);
  const [previewAberto, setPreviewAberto] = useState<FuncaoManutencao | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem(LOGO_KEY));
  const qrRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const funcoes = useMemo(() => {
    return carregar<FuncaoManutencao[]>(FUNCOES_KEY, [])
      .filter(f => f.ativo && f.qrTipo !== 'nenhum');
  }, []);

  const filtradas = useMemo(() => {
    if (!busca.trim()) return funcoes;
    const termo = busca.toLowerCase();
    return funcoes.filter(f =>
      f.nome.toLowerCase().includes(termo) ||
      f.qrChave?.toLowerCase().includes(termo)
    );
  }, [funcoes, busca]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) { alert('A logo deve ter no máximo 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem(LOGO_KEY, dataUrl);
      setLogo(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const removerLogo = useCallback(() => {
    localStorage.removeItem(LOGO_KEY);
    setLogo(null);
  }, []);

  const abrirUploadLogo = () => fileRef.current?.click();

  const copiarUrl = (funcao: FuncaoManutencao) => {
    navigator.clipboard.writeText(gerarUrl(funcao)).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const imprimirQR = (funcao: FuncaoManutencao) => {
    const canvas = document.querySelector(`[data-qr-id="${funcao.id}"]`)
      ?? qrRef.current?.querySelector('canvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;

    const url = gerarUrl(funcao);
    const imgSrc = canvas.toDataURL('image/png');
    const tipoTexto = TIPO_LABEL[funcao.qrTipo]?.texto ?? funcao.qrTipo;
    const chaveHtml = funcao.qrTipo === 'chave' && funcao.qrChave
      ? `<div class="chave">\uD83D\uDD11 Chave: ${funcao.qrChave}</div>` : '';

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QR Code — ${funcao.nome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; padding: 40px; }
    .page { text-align: center; max-width: 400px; }
    .icone { font-size: 48px; margin-bottom: 8px; }
    h1 { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
    .tipo { font-size: 12px; color: #888; margin-bottom: 24px; }
    img { width: 280px; height: 280px; margin-bottom: 16px; }
    .chave { font-size: 16px; font-weight: 700; color: #555; margin-bottom: 8px; }
    .url { font-size: 10px; color: #aaa; word-break: break-all; margin-bottom: 24px; }
    .rodape { font-size: 11px; color: #ccc; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="icone">${funcao.icone}</div>
    <h1>${funcao.nome}</h1>
    <div class="tipo">QR Code ${tipoTexto}</div>
    <img src="${imgSrc}" alt="QR Code" />
    ${chaveHtml}
    <div class="url">${url}</div>
    <div class="rodape">Simples Manutenção — simplesmanutencao.com.br</div>
  </div>
</body>
</html>`;
    const printBlob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const printBlobUrl = URL.createObjectURL(printBlob);
    const printWin = globalThis.open(printBlobUrl, '_blank');
    if (!printWin) return;
    printWin.onload = () => {
      setTimeout(() => { try { printWin.print(); } catch { /* user prints manually */ } }, 400);
    };
    setTimeout(() => URL.revokeObjectURL(printBlobUrl), 60000);
  };

  const baixarQR = (funcao: FuncaoManutencao) => {
    const canvas = document.querySelector(`[data-qr-id="${funcao.id}"]`)
      ?? qrRef.current?.querySelector('canvas');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;

    const link = document.createElement('a');
    link.download = `qrcode-${funcao.nome.split(/\s+/).join('-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={styles.pagina}>
      {/* Input oculto para upload de logo */}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        style={{ display: 'none' }}
        onChange={handleLogoUpload}
      />

      {/* Cabeçalho */}
      <div className={styles.cabecalho}>
        <div className={styles.cabecalhoIcone}>
          <QrCode size={24} />
        </div>
        <div className={styles.cabecalhoTexto}>
          <h1>QR Codes</h1>
          <p>{funcoes.length} {funcoes.length === 1 ? 'QR Code criado' : 'QR Codes criados'}</p>
        </div>
      </div>

      {/* Logo da empresa */}
      <div className={styles.logoBar}>
        <div className={styles.logoBarPreview}>
          {logo
            ? <img src={logo} alt="Logo" className={styles.logoBarImg} />
            : <div className={styles.logoBarVazio}><Image size={20} /></div>
          }
        </div>
        <div className={styles.logoBarInfo}>
          <strong>{logo ? 'Logo carregada' : 'Logo da empresa'}</strong>
          <span>Usada nos modelos A4 para impressão</span>
        </div>
        <div className={styles.logoBarBtns}>
          <button className={styles.btnUpload} onClick={abrirUploadLogo}>
            <Upload size={15} /> {logo ? 'Trocar' : 'Enviar logo'}
          </button>
          {logo && (
            <button className={styles.btnRemoverLogo} onClick={removerLogo}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Busca */}
      {funcoes.length > 0 && (
        <div className={styles.barraBusca}>
          <Search size={18} color="#aaa" />
          <input
            type="text"
            placeholder="Buscar por nome ou chave..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      )}

      {/* Estado vazio */}
      {funcoes.length === 0 && (
        <div className={styles.vazio}>
          <span>📱</span>
          <strong>Nenhum QR Code criado</strong>
          <p>Crie uma função de manutenção com QR Code na aba Manutenção.</p>
        </div>
      )}

      {/* Sem resultados da busca */}
      {funcoes.length > 0 && filtradas.length === 0 && (
        <div className={styles.vazio}>
          <span>🔍</span>
          <strong>Nenhum resultado encontrado</strong>
          <p>Tente buscar com outro termo.</p>
        </div>
      )}

      {/* Grid de QR Codes */}
      <div className={styles.grid}>
        {filtradas.map(funcao => {
          const tipo = TIPO_LABEL[funcao.qrTipo];
          const url = gerarUrl(funcao);
          return (
            <div key={funcao.id} className={styles.card}>
              {/* Header do card */}
              <div className={styles.cardHeader}>
                <div className={styles.cardIcone} style={{ background: `${funcao.cor}22` }}>
                  {funcao.icone}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardNome}>{funcao.nome}</h3>
                  {tipo && (
                    <span className={`${styles.cardTipo} ${tipo.classe}`}>
                      {tipo.icone} {tipo.texto}
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div className={styles.cardQr}>
                <div className={styles.qrContainer}>
                  <QRCodeCanvas
                    value={url}
                    size={160}
                    bgColor="#FFFFFF"
                    fgColor="#0D0D0D"
                    level="H"
                    data-qr-id={funcao.id}
                  />
                </div>
                {funcao.qrTipo === 'chave' && funcao.qrChave && (
                  <div className={styles.cardChave}>
                    <Key size={14} /> Chave: {funcao.qrChave}
                  </div>
                )}
                <div className={styles.cardUrl}>{url}</div>
              </div>

              {/* Ações */}
              <div className={styles.cardAcoes}>
                <button onClick={() => setModalAberta(funcao)} title="Ampliar">
                  <QrCode size={16} /> Ampliar
                </button>
                <button onClick={() => setPreviewAberto(funcao)} title="Pré-visualizar">
                  <Eye size={16} /> Visualizar
                </button>
                <button onClick={() => setTemplateAberto(funcao)} title="Modelo A4">
                  <FileText size={16} /> Modelo A4
                </button>
                <button onClick={() => imprimirQR(funcao)} title="Imprimir">
                  <Printer size={16} /> Imprimir
                </button>
                <button onClick={() => baixarQR(funcao)} title="Baixar">
                  <Download size={16} /> Baixar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal QR ampliado */}
      {modalAberta && <ModalQR funcao={modalAberta} qrRef={qrRef} copiado={copiado} onFechar={() => setModalAberta(null)} onImprimir={imprimirQR} onCopiar={copiarUrl} />}

      {/* Modal Templates A4 */}
      {templateAberto && <ModalTemplates funcao={templateAberto} logo={logo} onFechar={() => setTemplateAberto(null)} onUploadLogo={abrirUploadLogo} />}

      {/* Modal Preview do Formulário */}
      {previewAberto && <ModalPreviewForm funcao={previewAberto} onFechar={() => setPreviewAberto(null)} />}
    </div>
  );
};

export default QRCodesPage;
