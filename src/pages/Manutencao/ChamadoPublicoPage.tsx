import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, PlayCircle, XCircle, ArrowLeft, Wrench } from 'lucide-react';

const API_URL = 'https://api.simplesmanutencao.com.br';

interface ChamadoPublico {
  protocolo: string;
  funcaoNome: string;
  funcaoIcone: string;
  funcaoCor: string;
  status: string;
  responsavel: string;
  criadoEm: number | null;
  horarioInicial: number | null;
  horarioFinal: number | null;
  tempoTotal: number | null;
  osTitulo: string;
  osNumero: string;
  observacoes: string;
  respostas: Record<string, any>;
}

const statusConfig: Record<string, { label: string; cor: string; bg: string; icon: React.ReactNode }> = {
  aberto:        { label: 'Aberto',        cor: '#2563eb', bg: '#dbeafe', icon: <Clock size={16} /> },
  em_andamento:  { label: 'Em andamento',  cor: '#d97706', bg: '#fef3c7', icon: <PlayCircle size={16} /> },
  concluido:     { label: 'Concluído',     cor: '#16a34a', bg: '#dcfce7', icon: <CheckCircle2 size={16} /> },
  cancelado:     { label: 'Cancelado',     cor: '#dc2626', bg: '#fee2e2', icon: <XCircle size={16} /> },
};

function formatarData(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatarTempo(ms: number | null): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

const ChamadoPublicoPage: React.FC = () => {
  const { protocolo } = useParams<{ protocolo: string }>();
  const navigate = useNavigate();
  const [chamado, setChamado] = useState<ChamadoPublico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!protocolo) return;
    fetch(`${API_URL}/chamado/${encodeURIComponent(protocolo)}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.chamado) setChamado(data.chamado);
        else setErro('Chamado não encontrado');
      })
      .catch(() => setErro('Erro ao buscar chamado'))
      .finally(() => setCarregando(false));
  }, [protocolo]);

  const st = chamado ? (statusConfig[chamado.status] || statusConfig.aberto) : statusConfig.aberto;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', padding: '20px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate('/')} style={{ background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} color="#6b7280" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logos/logo.png" alt="" style={{ height: 24, objectFit: 'contain', filter: 'drop-shadow(0 0 1px #000)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Simples Manutenção</span>
          </div>
        </div>

        {carregando && (
          <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Buscando chamado...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {erro && (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <XCircle size={48} color="#dc2626" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>Chamado não encontrado</p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Protocolo: {protocolo}</p>
            <button onClick={() => navigate('/')} style={{ padding: '10px 24px', background: '#f59e0b', color: '#0D0D0D', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Ir para o início
            </button>
          </div>
        )}

        {chamado && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

            {/* Status bar */}
            <div style={{ background: st.bg, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `3px solid ${st.cor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {st.icon}
                <span style={{ fontSize: 14, fontWeight: 800, color: st.cor, textTransform: 'uppercase' }}>{st.label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: st.cor, fontFamily: 'monospace' }}>{chamado.protocolo}</span>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>

              {/* Tipo + Título */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: chamado.funcaoCor || '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {chamado.funcaoIcone || <Wrench size={22} color="#fff" />}
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#1f2937', margin: 0, lineHeight: 1.2 }}>
                    {chamado.osTitulo || chamado.funcaoNome || 'Chamado'}
                  </p>
                  {chamado.funcaoNome && chamado.osTitulo && (
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{chamado.funcaoNome}</p>
                  )}
                </div>
              </div>

              {/* Detalhes */}
              <div style={{ display: 'grid', gap: 12 }}>
                <InfoRow label="Responsável" value={chamado.responsavel} />
                <InfoRow label="Data de abertura" value={formatarData(chamado.criadoEm)} />
                {chamado.horarioFinal && <InfoRow label="Data de conclusão" value={formatarData(chamado.horarioFinal)} />}
                {chamado.tempoTotal && <InfoRow label="Tempo total" value={formatarTempo(chamado.tempoTotal)} />}
                {chamado.osNumero && <InfoRow label="Nº da OS" value={chamado.osNumero} />}
              </div>

              {/* Observações */}
              {chamado.observacoes && (
                <div style={{ marginTop: 16, padding: 14, background: '#f9fafb', borderRadius: 10, border: '1.5px solid #e4e4e7' }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Observações</p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>{chamado.observacoes}</p>
                </div>
              )}

              {/* Respostas do formulário */}
              {Object.keys(chamado.respostas).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>Detalhes do chamado</p>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {Object.entries(chamado.respostas).map(([key, val]) => {
                      if (!val || key.startsWith('_') || typeof val === 'object') return null;
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      return <InfoRow key={key} label={label} value={String(val)} />;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', background: '#f9fafb', borderTop: '1px solid #e4e4e7', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Simples Manutenção · simplesmanutencao.com.br</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
  </div>
);

export default ChamadoPublicoPage;
