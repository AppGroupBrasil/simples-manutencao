import type { Checklist } from '../pages/Checklist/types';
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

export async function visualizarChecklist(cl: Checklist) {
  const total = cl.itens.length;
  const feitos = cl.itens.filter(i => i.status !== 'pendente').length;
  const probs = cl.itens.filter(i => i.status === 'problema').length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
  const qrUrl = `${globalThis.location.origin}/checklist-preencher/${cl.id}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 320, margin: 2 });
  } catch (_) { /* ignore */ }

  const statusIcon: Record<string, string> = { concluido: '✓', problema: '⚠', pendente: '○' };
  const statusCor: Record<string, string> = { concluido: '#16a34a', problema: '#d97706', pendente: '#9ca3af' };
  const statusLabel: Record<string, string> = { ativo: 'Ativo', em_andamento: 'Em Andamento', concluido: 'Concluído' };
  const statusCorBadge: Record<string, string> = { ativo: '#2563eb', em_andamento: '#e65100', concluido: '#2e7d32' };

  const itensHtml = cl.itens.map((it, idx) => {
    const fotosStr = it.problema?.fotos?.length
      ? it.problema.fotos.map((f: string) => `<img src="${f}" class="item-foto" />`).join('')
      : '';
    const fotosHtml = fotosStr ? `<div class="item-fotos">${fotosStr}</div>` : '';
    return `
    <div class="item-row">
      <div class="item-num" style="color:${statusCor[it.status]}">${statusIcon[it.status]}</div>
      <div class="item-content">
        <div class="item-texto ${it.status === 'concluido' ? 'riscado' : ''}">${it.texto}</div>
        ${it.problema?.descricao ? `<div class="item-problema">${it.problema.descricao}</div>` : ''}
        ${fotosHtml}
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Checklist — ${cl.protocolo}</title>
<style>
  @page { size: A4; margin: 16mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; color: #1a1a1a; padding: 24px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 794px; margin: 0 auto; background: #fff; border-radius: 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); overflow: hidden; }

  .actions-bar { display: flex; gap: 10px; justify-content: center; padding: 16px 24px; background: #f9fafb; border-bottom: 1.5px solid #e5e7eb; }
  .action-btn { display: flex; align-items: center; gap: 8px; padding: 10px 22px; border: none; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit; transition: all 0.2s; }
  .action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
  .btn-print { background: linear-gradient(135deg, #FFD600, #FF8F00); color: #0D0D0D; }
  .btn-share { background: #25D366; color: #fff; }
  .btn-link { background: #2563eb; color: #fff; }
  .btn-close { background: #f3f4f6; color: #6b7280; border: 1.5px solid #d1d5db; }
  .copied-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: #fff; padding: 10px 24px; border-radius: 12px; font-size: 14px; font-weight: 800; z-index: 9999; box-shadow: 0 4px 20px rgba(16,185,129,0.4); display: none; }

  .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 28px 32px; display: flex; align-items: center; gap: 20px; }
  .header-icon { font-size: 48px; line-height: 1; }
  .header-info { flex: 1; }
  .header-title { font-size: 24px; font-weight: 900; color: #fff; line-height: 1.2; }
  .header-meta { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
  .badge-proto { font-family: monospace; font-size: 12px; font-weight: 700; color: #065f46; background: rgba(255,255,255,0.55); padding: 4px 14px; border-radius: 8px; }
  .badge-status { padding: 5px 16px; border-radius: 20px; font-weight: 800; font-size: 12px; color: #fff; background: ${statusCorBadge[cl.status] || '#2563eb'}; }

  .content { padding: 28px 32px; }

  /* Progress */
  .progress-section { margin-bottom: 24px; }
  .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .progress-label { font-size: 13px; font-weight: 800; color: #374151; }
  .progress-value { font-size: 14px; font-weight: 900; color: ${pct === 100 ? '#16a34a' : '#e65100'}; }
  .progress-bar { height: 12px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 10px; background: ${probs > 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #22c55e, #16a34a)'}; transition: width 0.3s; }
  .progress-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 14px; }
  .stat-card { background: #f9fafb; border-radius: 12px; padding: 12px; text-align: center; border-left: 4px solid #10b981; }
  .stat-num { font-size: 22px; font-weight: 900; }
  .stat-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }

  /* Details grid */
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
  .detail-card { background: #f9fafb; border-radius: 12px; padding: 14px 18px; border-left: 4px solid #10b981; }
  .detail-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #9ca3af; margin-bottom: 4px; }
  .detail-value { font-size: 15px; font-weight: 700; color: #111; }

  /* Items */
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 14px; }
  .item-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
  .item-num { font-size: 20px; font-weight: 900; flex-shrink: 0; line-height: 1.4; }
  .item-content { flex: 1; }
  .item-texto { font-size: 14px; font-weight: 600; color: #111; line-height: 1.4; }
  .item-texto.riscado { text-decoration: line-through; color: #6b7280; }
  .item-problema { margin-top: 6px; font-size: 12px; color: #92400e; background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 0 8px 8px 0; }
  .item-fotos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .item-foto { width: 120px; height: 90px; object-fit: cover; border-radius: 10px; border: 1.5px solid #e5e7eb; }

  /* QR */
  .qr-section { text-align: center; margin: 28px 0; padding: 24px; background: #f9fafb; border-radius: 16px; border: 1.5px solid #e4e4e7; }
  .qr-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 12px; }
  .qr-proto { font-size: 12px; color: #9ca3af; margin-top: 10px; font-family: monospace; font-weight: 700; }
  .qr-url { font-size: 10px; color: #2563eb; word-break: break-all; margin-top: 4px; }

  .footer { text-align: center; font-size: 11px; color: #9ca3af; padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #fafafa; }
  .footer strong { color: #6b7280; }

  @media print {
    body { padding: 0; background: #fff; }
    .page { box-shadow: none; border-radius: 0; }
    .actions-bar { display: none !important; }
    .copied-toast { display: none !important; }
  }
  @media (max-width: 600px) {
    body { padding: 8px; }
    .header { padding: 20px; gap: 14px; }
    .header-title { font-size: 20px; }
    .content { padding: 20px; }
    .detail-grid, .progress-stats { grid-template-columns: 1fr; }
    .actions-bar { flex-wrap: wrap; padding: 12px 16px; }
    .action-btn { flex: 1; min-width: 120px; justify-content: center; }
  }
</style>
</head>
<body>

<div id="toast" class="copied-toast">✅ Link copiado!</div>

<div class="page">
  <div class="actions-bar">
    <button class="action-btn btn-print" onclick="window.print()">🖨️ Imprimir / PDF</button>
    <button class="action-btn btn-link" onclick="copiarLink()">🔗 Copiar Link</button>
    <button class="action-btn btn-share" onclick="compartilhar()">📤 Compartilhar</button>
    <button class="action-btn btn-close" onclick="window.close()">✕ Fechar</button>
  </div>

  <div class="header">
    <div class="header-icon">✅</div>
    <div class="header-info">
      <div class="header-title">${cl.titulo}</div>
      <div class="header-meta">
        <span class="badge-proto"># ${cl.protocolo}</span>
        <span class="badge-status">${statusLabel[cl.status] || cl.status}</span>
        <span class="badge-proto">${cl.tipo === 'livre' ? '📋 Livre' : '📌 Atribuído'}</span>
      </div>
    </div>
  </div>

  <div class="content">

    <!-- Progresso -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">📊 Progresso</span>
        <span class="progress-value">${feitos}/${total} (${pct}%)</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="progress-stats">
        <div class="stat-card">
          <div class="stat-num" style="color:#16a34a">${cl.itens.filter(i => i.status === 'concluido').length}</div>
          <div class="stat-label">Concluídos</div>
        </div>
        <div class="stat-card" style="border-color:#f59e0b">
          <div class="stat-num" style="color:#d97706">${probs}</div>
          <div class="stat-label">Problemas</div>
        </div>
        <div class="stat-card" style="border-color:#9ca3af">
          <div class="stat-num" style="color:#6b7280">${cl.itens.filter(i => i.status === 'pendente').length}</div>
          <div class="stat-label">Pendentes</div>
        </div>
      </div>
    </div>

    <!-- Detalhes -->
    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-label">👤 Responsável</div>
        <div class="detail-value">${cl.responsavelNome || cl.criadoPorNome}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">📋 Criado por</div>
        <div class="detail-value">${cl.criadoPorNome}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">📅 Criado em</div>
        <div class="detail-value">${fmtData(cl.criadoEm)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">⏱ Tempo Total</div>
        <div class="detail-value" style="font-weight:900;color:#e65100;font-family:monospace;font-size:18px">${fmtTempo(cl.tempoTotal)}</div>
      </div>
    </div>

    ${cl.localizacao ? `
    <div class="section">
      <div class="section-title">📍 Localização</div>
      <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:14px 18px;">
        <div style="font-size:14px;font-weight:600;color:#0369a1;">${cl.localizacao.endereco || `${cl.localizacao.lat.toFixed(5)}, ${cl.localizacao.lng.toFixed(5)}`}</div>
        <a href="https://www.google.com/maps?q=${cl.localizacao.lat},${cl.localizacao.lng}" target="_blank" style="font-size:12px;color:#2563eb;text-decoration:underline;margin-top:4px;display:inline-block;">🗺️ Abrir no Google Maps ↗</a>
      </div>
    </div>` : ''}

    <!-- Itens -->
    <div class="section">
      <div class="section-title">📋 Itens do Checklist (${total})</div>
      ${itensHtml}
    </div>

    <!-- QR Code -->
    <div class="qr-section">
      <div class="qr-title">📱 QR Code — Preencher Checklist</div>
      ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:160px;height:160px;border-radius:10px;" alt="QR Code" />` : '<div style="width:160px;height:160px;background:#f3f4f6;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px;">QR indisponível</div>'}
      <div class="qr-proto">QR Code · ${cl.protocolo}</div>
      <div class="qr-url">${qrUrl}</div>
    </div>

  </div>

  <div class="footer">
    Documento gerado pelo <strong>Simples Manutenção</strong> · ${new Date().toLocaleString('pt-BR')}
  </div>
</div>

<script>
  var checklistUrl = '${qrUrl}';
  function copiarLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(checklistUrl).then(function() { showToast(); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = checklistUrl; document.body.appendChild(ta);
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
  function compartilhar() {
    if (navigator.share) {
      navigator.share({ title: '${cl.titulo.replace(/'/g, "\\'")}', text: 'Checklist ${cl.protocolo}', url: checklistUrl });
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent('✅ ${cl.titulo.replace(/'/g, "\\'")}\\n# ${cl.protocolo}\\n\\n🔗 ' + checklistUrl), '_blank');
    }
  }
</script>
</body></html>`;

  const janela = globalThis.open('', '_blank', 'width=860,height=900');
  if (janela) { janela.document.write(html); janela.document.close(); }
}
