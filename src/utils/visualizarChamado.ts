import type { ChamadoManutencao } from '../pages/Manutencao/types';
import QRCode from 'qrcode';

function fmtData(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtTempo(ms?: number) {
  if (!ms) return '—';
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s` : `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

const STATUS: Record<string, { label: string; cor: string; bg: string }> = {
  aberto:       { label: 'Aberto',       cor: '#455a64', bg: '#eceff1' },
  em_andamento: { label: 'Em Andamento', cor: '#e65100', bg: '#fff3e0' },
  concluido:    { label: 'Concluído',    cor: '#2e7d32', bg: '#e8f5e9' },
  cancelado:    { label: 'Cancelado',    cor: '#b71c1c', bg: '#ffebee' },
};

export async function visualizarChamado(c: ChamadoManutencao) {
  const st = STATUS[c.status] || STATUS.aberto;
  const logo = localStorage.getItem('sm_logo_empresa') || '';
  const qrUrl = `${globalThis.location.origin}/chamado/${c.protocolo}`;

  // Generate QR code as data URL before opening window
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 320, margin: 2 });
  } catch (_) { /* ignore */ }

  // Build respostas HTML
  let respostasHtml = '';
  const entries = Object.entries(c.respostas || {});
  if (entries.length > 0) {
    respostasHtml = '<div class="section"><div class="section-title">📝 Respostas do Formulário</div>';
    entries.forEach(([, val]) => {
      if (val === '' || val === null || val === undefined) return;
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0].descricao !== undefined) {
        val.forEach((item: any, idx: number) => {
          respostasHtml += `<div class="resp-item"><div class="resp-badge">Item ${idx + 1}</div>`;
          if (item.descricao) respostasHtml += `<div class="resp-texto">${item.descricao}</div>`;
          if (item.fotos?.length) {
            respostasHtml += '<div class="fotos-row">';
            item.fotos.forEach((f: string) => {
              respostasHtml += `<img src="${f}" class="resp-foto" />`;
            });
            respostasHtml += '</div>';
          }
          respostasHtml += '</div>';
        });
      } else if (typeof val === 'string' && val.startsWith('data:image')) {
        respostasHtml += `<div class="resp-item"><img src="${val}" style="max-width:200px;border-radius:10px;border:1px solid #e5e7eb;" /></div>`;
      } else if (Array.isArray(val) && val.some((v: any) => typeof v === 'string' && v.startsWith('data:image'))) {
        respostasHtml += '<div class="resp-item"><div class="fotos-row">';
        val.forEach((v: any) => {
          if (typeof v === 'string' && v.startsWith('data:image'))
            respostasHtml += `<img src="${v}" class="resp-foto" />`;
        });
        respostasHtml += '</div></div>';
      } else {
        const texto = typeof val === 'object' ? JSON.stringify(val) : String(val);
        respostasHtml += `<div class="resp-item"><div class="resp-texto">${texto}</div></div>`;
      }
    });
    respostasHtml += '</div>';
  }

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.funcaoNome} — ${c.protocolo}</title>
<style>
  @page { size: A4; margin: 16mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; color: #1a1a1a; padding: 24px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 794px; margin: 0 auto; background: #fff; border-radius: 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); overflow: hidden; }

  /* Actions bar - hidden on print */
  .actions-bar { display: flex; gap: 10px; justify-content: center; padding: 16px 24px; background: #f9fafb; border-bottom: 1.5px solid #e5e7eb; }
  .action-btn { display: flex; align-items: center; gap: 8px; padding: 10px 22px; border: none; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
  .btn-print { background: linear-gradient(135deg, #FFD600, #FF8F00); color: #0D0D0D; }
  .btn-share { background: #25D366; color: #fff; }
  .btn-link { background: #2563eb; color: #fff; }
  .btn-close { background: #f3f4f6; color: #6b7280; border: 1.5px solid #d1d5db; }
  .copied-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: #fff; padding: 10px 24px; border-radius: 12px; font-size: 14px; font-weight: 800; z-index: 9999; box-shadow: 0 4px 20px rgba(16,185,129,0.4); display: none; }

  /* Header */
  .header { background: linear-gradient(135deg, #FFD600 0%, #FF8F00 100%); padding: 28px 32px; display: flex; align-items: center; gap: 20px; }
  .header-logo { max-height: 56px; max-width: 180px; object-fit: contain; }
  .header-icon { font-size: 48px; line-height: 1; }
  .header-info { flex: 1; }
  .header-title { font-size: 26px; font-weight: 900; color: #0D0D0D; line-height: 1.2; }
  .header-meta { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
  .badge-proto { font-family: monospace; font-size: 12px; font-weight: 700; color: #7a3500; background: rgba(255,255,255,0.55); padding: 4px 14px; border-radius: 8px; }
  .badge-status { padding: 5px 16px; border-radius: 20px; font-weight: 800; font-size: 12px; color: #fff; background: ${st.cor}; letter-spacing: 0.3px; }

  /* Content */
  .content { padding: 28px 32px; }

  /* Detail grid */
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
  .detail-card { background: #f9fafb; border-radius: 12px; padding: 14px 18px; border-left: 4px solid #FFD600; }
  .detail-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #9ca3af; margin-bottom: 4px; }
  .detail-value { font-size: 15px; font-weight: 700; color: #111; }
  .detail-value.highlight { font-size: 20px; font-weight: 900; color: #FF8F00; font-family: monospace; }

  /* Sections */
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 14px; }
  .obs-box { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 16px 18px; font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap; }
  .loc-box { background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 14px 18px; }
  .loc-text { font-size: 14px; font-weight: 600; color: #0369a1; }
  .loc-link { font-size: 12px; color: #2563eb; text-decoration: underline; margin-top: 4px; display: inline-block; }

  /* Respostas */
  .resp-item { background: #f9fafb; border-radius: 12px; padding: 12px 16px; margin-bottom: 10px; border-left: 4px solid #6366f1; }
  .resp-badge { font-size: 10px; font-weight: 900; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .resp-texto { font-size: 14px; color: #1f2937; line-height: 1.5; }
  .fotos-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
  .resp-foto { width: 140px; height: 105px; object-fit: cover; border-radius: 10px; border: 1.5px solid #e5e7eb; }

  /* QR Code */
  .qr-section { text-align: center; margin: 28px 0; padding: 24px; background: #f9fafb; border-radius: 16px; border: 1.5px solid #e4e4e7; }
  .qr-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 12px; }
  .qr-proto { font-size: 12px; color: #9ca3af; margin-top: 10px; font-family: monospace; font-weight: 700; }
  .qr-url { font-size: 10px; color: #2563eb; word-break: break-all; margin-top: 4px; }

  /* Footer */
  .footer { text-align: center; font-size: 11px; color: #9ca3af; padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #fafafa; }
  .footer strong { color: #6b7280; }

  /* Print */
  @media print {
    body { padding: 0; background: #fff; }
    .page { box-shadow: none; border-radius: 0; }
    .actions-bar { display: none !important; }
    .copied-toast { display: none !important; }
  }

  /* Mobile */
  @media (max-width: 600px) {
    body { padding: 8px; }
    .header { padding: 20px; gap: 14px; }
    .header-title { font-size: 20px; }
    .content { padding: 20px; }
    .detail-grid { grid-template-columns: 1fr; }
    .actions-bar { flex-wrap: wrap; padding: 12px 16px; }
    .action-btn { flex: 1; min-width: 120px; justify-content: center; }
  }
</style>
</head>
<body>

<div id="toast" class="copied-toast">✅ Link copiado!</div>

<div class="page">

  <!-- Actions bar -->
  <div class="actions-bar">
    <button class="action-btn btn-print" onclick="window.print()">🖨️ Imprimir / PDF</button>
    <button class="action-btn btn-link" onclick="copiarLink()">🔗 Copiar Link</button>
    <button class="action-btn btn-share" onclick="compartilhar()">📤 Compartilhar</button>
    <button class="action-btn btn-close" onclick="window.close()">✕ Fechar</button>
  </div>

  <!-- Header -->
  <div class="header">
    ${logo ? `<img src="${logo}" class="header-logo" alt="Logo" />` : `<div class="header-icon">${c.funcaoIcone}</div>`}
    <div class="header-info">
      <div class="header-title">${c.funcaoNome}</div>
      <div class="header-meta">
        <span class="badge-proto"># ${c.protocolo}</span>
        <span class="badge-status">${st.label}</span>
        ${c.numero ? `<span class="badge-proto">${String(c.numero).padStart(4, '0')}</span>` : ''}
      </div>
    </div>
  </div>

  <div class="content">

    <!-- Details grid -->
    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-label">👤 Responsável</div>
        <div class="detail-value">${c.responsavel}${c.responsavelCargo ? ` — ${c.responsavelCargo}` : ''}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">📋 Criado por</div>
        <div class="detail-value">${c.criadoPorNome}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">▶ Horário Inicial</div>
        <div class="detail-value">${fmtData(c.horarioInicial)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">⏹ Horário Final</div>
        <div class="detail-value">${c.horarioFinal ? fmtData(c.horarioFinal) : 'Em aberto'}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">⏱ Tempo Total</div>
        <div class="detail-value highlight">${fmtTempo(c.tempoTotal)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">📅 Criado em</div>
        <div class="detail-value">${fmtData(c.criadoEm)}</div>
      </div>
    </div>

    <!-- Observações -->
    ${c.observacoes ? `
    <div class="section">
      <div class="section-title">📝 Observações</div>
      <div class="obs-box">${c.observacoes}</div>
    </div>` : ''}

    <!-- Localização -->
    ${c.localizacao ? `
    <div class="section">
      <div class="section-title">📍 Localização</div>
      <div class="loc-box">
        <div class="loc-text">${c.localizacao.endereco || `${c.localizacao.lat.toFixed(5)}, ${c.localizacao.lng.toFixed(5)}`}</div>
        <a href="https://www.google.com/maps?q=${c.localizacao.lat},${c.localizacao.lng}" target="_blank" class="loc-link">🗺️ Abrir no Google Maps ↗</a>
      </div>
    </div>` : ''}

    <!-- Respostas -->
    ${respostasHtml}

    <!-- QR Code -->
    <div class="qr-section">
      <div class="qr-title">📱 QR Code do Chamado</div>
      ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:160px;height:160px;border-radius:10px;" alt="QR Code" />` : '<div style="width:160px;height:160px;background:#f3f4f6;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px;">QR indisponível</div>'}
      <div class="qr-proto">QR Code · ${c.protocolo}</div>
      <div class="qr-url">${qrUrl}</div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    Documento gerado pelo <strong>Simples Manutenção</strong> · ${new Date().toLocaleString('pt-BR')}
  </div>

</div>

<script>
  var chamadoUrl = '${qrUrl}';

  function copiarLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(chamadoUrl).then(function() { showToast(); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = chamadoUrl; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      showToast();
    }
  }
  function showToast() {
    var t = document.getElementById('toast');
    t.style.display = 'block';
    setTimeout(function() { t.style.display = 'none'; }, 2000);
  }
  function compartilhar() {    if (navigator.share) {
      navigator.share({ title: '${c.funcaoNome.replace(/'/g, "\\'")}', text: 'Chamado ${c.protocolo}', url: chamadoUrl });
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent('🛠️ ${c.funcaoNome.replace(/'/g, "\\'")}\\n# ${c.protocolo}\\n👤 ${c.responsavel.replace(/'/g, "\\'")}\\n\\n🔗 ' + chamadoUrl), '_blank');
    }
  }</script>
</body></html>`;

  const janela = globalThis.open('', '_blank', 'width=860,height=900');
  if (janela) { janela.document.write(html); janela.document.close(); }
}
