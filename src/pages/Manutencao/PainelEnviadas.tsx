import React, { useState, useMemo } from 'react';
import { X, Clock, Filter, Share2, FileDown } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type { ChamadoManutencao } from './types';
import styles from './PainelEnviadas.module.css';

interface Props {
  chamados: ChamadoManutencao[];
  usuarioId: string;
  usuarioRole: string;
  adminId?: string;
  supervisorId?: string;
  onExcluir?: (id: string) => void;
  onCompartilhar?: (c: ChamadoManutencao) => void;
  onImprimir?: (c: ChamadoManutencao) => void;
}

const STATUS_COR: Record<string, string> = {
  aberto:       '#9ca3af',
  em_andamento: '#e65100',
  concluido:    '#2e7d32',
  cancelado:    '#b91c1c',
};

const STATUS_LABEL: Record<string, string> = {
  aberto:       'Aberto',
  em_andamento: 'Em Andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
};

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

const PainelEnviadas: React.FC<Props> = ({
  chamados, usuarioId, usuarioRole, adminId, supervisorId, onExcluir, onCompartilhar, onImprimir
}) => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null);

  // ── Filtrar por hierarquia ────────────────────────────────────────────────
  const chamadosVisiveis = useMemo(() => {
    if (usuarioRole === 'master') return chamados;
    if (usuarioRole === 'administrador') {
      return chamados.filter(c =>
        c.adminId === usuarioId ||
        c.criadoPor === usuarioId ||
        c.supervisorId === supervisorId
      );
    }
    if (usuarioRole === 'supervisor') {
      return chamados.filter(c =>
        c.supervisorId === usuarioId || c.criadoPor === usuarioId
      );
    }
    // funcionário/cliente/morador — só os próprios
    return chamados.filter(c => c.criadoPor === usuarioId);
  }, [chamados, usuarioId, usuarioRole, adminId, supervisorId]);

  // ── Tipos únicos para filtro ──────────────────────────────────────────────
  const tiposUnicos = useMemo(() => {
    const set = new Set(chamadosVisiveis.map(c => c.funcaoNome));
    return Array.from(set);
  }, [chamadosVisiveis]);

  // ── Busca + filtros ───────────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    return chamadosVisiveis.filter(c => {
      if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false;
      if (filtroTipo !== 'todos' && c.funcaoNome !== filtroTipo) return false;
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const texto = [
          c.funcaoNome, c.responsavel, c.criadoPorNome,
          STATUS_LABEL[c.status], c.id,
          formatarDataHora(c.criadoEm),
          Object.values(c.respostas || {}).join(' '),
        ].join(' ').toLowerCase();
        return texto.includes(q);
      }
      return true;
    });
  }, [chamadosVisiveis, busca, filtroStatus, filtroTipo]);

  // ── Contadores ────────────────────────────────────────────────────────────
  const contadores = useMemo(() => ({
    todos:       chamadosVisiveis.length,
    aberto:      chamadosVisiveis.filter(c => c.status === 'aberto').length,
    em_andamento:chamadosVisiveis.filter(c => c.status === 'em_andamento').length,
    concluido:   chamadosVisiveis.filter(c => c.status === 'concluido').length,
    cancelado:   chamadosVisiveis.filter(c => c.status === 'cancelado').length,
  }), [chamadosVisiveis]);

  return (
    <div className={styles.painel}>

      {/* Título do painel conforme role */}
      <div className={styles.painelTitulo}>
        <span className={styles.painelIcone}>📥</span>
        <div>
          <h2 className={styles.painelH2}>Chamados Enviados</h2>
          <p className={styles.painelSubtitulo}>
            {usuarioRole === 'master'       && 'Visão master — todos os chamados de todas as empresas'}
            {usuarioRole === 'administrador' && 'Visão administrador — todos os chamados da sua empresa'}
            {usuarioRole === 'supervisor'   && 'Visão supervisor — chamados da sua equipe'}
            {usuarioRole === 'funcionario'  && 'Seus chamados enviados'}
          </p>
        </div>
      </div>

      {/* Busca inteligente */}
      <div className={styles.buscaWrapper}>
        <span className={styles.buscaIcone}>🔍</span>
        <input
          className={styles.buscaInput}
          placeholder="Buscar por tipo, responsável, status, data, observações..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        {busca && (
          <button className={styles.buscaLimpar} onClick={() => setBusca('')}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filtros de status */}
      <div className={styles.filtrosBar}>
        {[
          { key: 'todos',        label: `Todos (${contadores.todos})` },
          { key: 'aberto',       label: `Abertos (${contadores.aberto})` },
          { key: 'em_andamento', label: `Em Andamento (${contadores.em_andamento})` },
          { key: 'concluido',    label: `Concluídos (${contadores.concluido})` },
          { key: 'cancelado',    label: `Cancelados (${contadores.cancelado})` },
        ].map(f => (
          <button
            key={f.key}
            className={`${styles.filtroBotao} ${filtroStatus === f.key ? styles.filtroBotaoAtivo : ''}`}
            onClick={() => setFiltroStatus(f.key)}
          >{f.label}</button>
        ))}
      </div>

      {/* Filtro por tipo */}
      {tiposUnicos.length > 1 && (
        <div className={styles.filtrosBar} style={{ marginTop: -6 }}>
          <Filter size={14} style={{ color: 'var(--cor-texto-secundario)', alignSelf: 'center', flexShrink: 0 }} />
          <button
            className={`${styles.filtroBotao} ${filtroTipo === 'todos' ? styles.filtroBotaoAtivo : ''}`}
            onClick={() => setFiltroTipo('todos')}
          >Todos os tipos</button>
          {tiposUnicos.map(t => (
            <button
              key={t}
              className={`${styles.filtroBotao} ${filtroTipo === t ? styles.filtroBotaoAtivo : ''}`}
              onClick={() => setFiltroTipo(t)}
            >{t}</button>
          ))}
        </div>
      )}

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className={styles.vazio}>
          <span className={styles.vazioIcone}>📭</span>
          <p>Nenhum chamado encontrado</p>
          {busca && <p style={{ fontSize: 14 }}>Tente outros termos na busca</p>}
        </div>
      ) : (
        <div className={styles.lista}>
          {filtrados.map(c => {
            const aberto = expandido === c.id;
            return (
              <div key={c.id} className={styles.card}>
                <button
                  className={styles.cardHeader}
                  onClick={() => setExpandido(aberto ? null : c.id)}
                  style={{ borderLeft: `5px solid ${STATUS_COR[c.status] || '#9ca3af'}` }}
                >
                  <div className={styles.cardTopo}>
                    <div className={styles.cardTipo}>
                      <span className={styles.cardIcone}>{c.funcaoIcone}</span>
                      <div>
                        <div className={styles.cardNomeTipo}>{c.funcaoNome}</div>
                        <div className={styles.cardData}>{formatarDataHora(c.criadoEm)}</div>
                      </div>
                    </div>
                    <div className={styles.cardDireita}>
                      <span
                        className={styles.statusBadge}
                        style={{ background: STATUS_COR[c.status], color: '#fff' }}
                      >
                        {STATUS_LABEL[c.status]}
                      </span>
                      <span className={styles.expandirIcone}>{aberto ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  <div className={styles.cardInfo}>
                    <span className={styles.cardInfoItem}>
                      👤 <strong>{c.responsavel}</strong>
                    </span>
                    {c.tempoTotal && (
                      <span className={styles.cardInfoItem}>
                        <Clock size={13} /> {formatarTempo(c.tempoTotal)}
                      </span>
                    )}
                    {c.criadoPorNome && c.criadoPorNome !== c.responsavel && (
                      <span className={styles.cardInfoItem}>
                        📋 {c.criadoPorNome}
                      </span>
                    )}
                  </div>
                </button>

                {/* Detalhes expandidos */}
                {aberto && (
                  <div className={styles.cardDetalhes}>
                    <div className={styles.detalheGrid}>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheLabel}>ID do chamado</span>
                        <span className={styles.detalheValor} style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.id}</span>
                      </div>
                      {!!c.horarioInicial && (
                        <div className={styles.detalheItem}>
                          <span className={styles.detalheLabel}>▶ Horário inicial</span>
                          <span className={styles.detalheValor}>{formatarDataHora(c.horarioInicial)}</span>
                        </div>
                      )}
                      {c.horarioFinal && (
                        <div className={styles.detalheItem}>
                          <span className={styles.detalheLabel}>⏹ Horário final</span>
                          <span className={styles.detalheValor}>{formatarDataHora(c.horarioFinal)}</span>
                        </div>
                      )}
                      {c.tempoTotal && (
                        <div className={styles.detalheItem}>
                          <span className={styles.detalheLabel}>⏱ Tempo total</span>
                          <span className={styles.detalheValor} style={{ fontWeight: 900, color: '#FF8F00' }}>
                            {formatarTempo(c.tempoTotal)}
                          </span>
                        </div>
                      )}
                      {c.localizacao && (
                        <div className={styles.detalheItem}>
                          <span className={styles.detalheLabel}>📍 Local</span>
                          <span className={styles.detalheValor} style={{ fontSize: 12 }}>
                            {c.localizacao.endereco || `${c.localizacao.lat.toFixed(5)}, ${c.localizacao.lng.toFixed(5)}`}
                          </span>
                        </div>
                      )}
                      {c.localizacao && (
                        <div className={styles.detalheItem}>
                          <span className={styles.detalheLabel}>🗺️ Mapa</span>
                          <a
                            href={`https://www.google.com/maps?q=${c.localizacao.lat},${c.localizacao.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', textDecoration: 'underline' }}
                          >
                            Abrir no mapa ↗
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Respostas dos campos */}
                    {Object.keys(c.respostas || {}).length > 0 && (
                      <div className={styles.respostas}>
                        {/* Manutenção Livre — itens com descrição e fotos */}
                        {c.funcaoId === 'livre' && Array.isArray((c.respostas as any)?.itens) ? (
                          <>
                            <p className={styles.respostasLabel}>Itens registrados:</p>
                            {(c.respostas as any).itens.map((item: { id?: string; descricao: string; fotos: string[] }, idx: number) => (
                              <div key={item.id || idx} style={{ background: '#f8f9fa', borderRadius: 10, padding: '10px 14px', marginBottom: 8, borderLeft: '3px solid #6366f1' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>Item {idx + 1}</span>
                                {item.descricao && <p style={{ margin: '4px 0 0', fontSize: 14, color: '#1f2937' }}>{item.descricao}</p>}
                                {item.fotos?.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                    {item.fotos.map((f: string, fi: number) => (
                                      <button key={f} type="button" onClick={() => setFotoExpandida(f)} style={{ padding:0, border:'none', background:'none', cursor:'zoom-in' }}>
                                        <img src={f} alt={`Item ${idx + 1} foto ${fi + 1}`}
                                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', transition: 'transform 0.15s' }}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        ) : (
                          <>
                            <p className={styles.respostasLabel}>Respostas do formulário:</p>
                            {Object.entries(c.respostas).map(([uid, val]) => (
                              val !== undefined && val !== '' && val !== null ? (
                                <div key={uid} className={styles.respostaItem}>
                                  <span className={styles.respostaValor}>
                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </span>
                                </div>
                              ) : null
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {/* QR Code */}
                    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 16px', background:'#f9fafb', borderRadius:12, border:'1.5px solid #e4e4e7', margin:'10px 0 8px' }}>
                      <QRCodeCanvas
                        value={`${globalThis.location.origin}/manutencao/form?chamado=${c.id}`}
                        size={64}
                        level="M"
                        style={{ borderRadius:6, flexShrink:0 }}
                      />
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        <span style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px' }}>QR Code do Chamado</span>
                        <span style={{ fontSize:12, color:'#9ca3af', lineHeight:1.3 }}>{c.protocolo}</span>
                      </div>
                    </div>

                    {/* Botões de ação */}
                    <div className={styles.cardAcoes} style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {onCompartilhar && (
                        <button
                          onClick={() => onCompartilhar(c)}
                          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(37,211,102,0.12)', border:'1.5px solid rgba(37,211,102,0.4)', borderRadius:10, color:'#16a34a', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit' }}
                          title="Compartilhar via WhatsApp"
                        >
                          <Share2 size={16} /> Compartilhar
                        </button>
                      )}
                      {onImprimir && (
                        <button
                          onClick={() => onImprimir(c)}
                          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(220,38,38,0.08)', border:'1.5px solid rgba(220,38,38,0.3)', borderRadius:10, color:'#dc2626', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit' }}
                          title="Gerar PDF"
                        >
                          <FileDown size={16} /> PDF
                        </button>
                      )}
                      {onExcluir && (
                        <button
                          className={styles.btnExcluir}
                          onClick={() => { if (confirm('Excluir este chamado?')) onExcluir(c.id); }}
                        >
                          🗑 Excluir
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox para foto expandida */}
      {fotoExpandida && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setFotoExpandida(null)}
            style={{ position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'zoom-out' }}
            aria-label="Fechar foto"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => setFotoExpandida(null)}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 2,
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, fontSize: 22, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
          <img
            src={fotoExpandida}
            alt="Foto expandida"
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              borderRadius: 12, objectFit: 'contain',
              position: 'relative', zIndex: 1,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PainelEnviadas;
