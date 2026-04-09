import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FormChamado from './FormChamado';
import type { FuncaoManutencao, ChamadoManutencao } from './types';

const FUNCOES_KEY  = 'manutencao_funcoes_v2';
const CHAMADOS_KEY = 'manutencao_chamados_v2';

function carregar<T>(key: string, padrao: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : padrao; }
  catch { return padrao; }
}

const FormPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [enviado, setEnviado] = useState(false);

  const chave     = params.get('chave');
  const id        = params.get('id');
  const chamadoId = params.get('chamado');

  // Se veio com chamado=, carrega o chamado existente
  const chamadoExistente = useMemo<ChamadoManutencao | null>(() => {
    if (!chamadoId) return null;
    const todos: ChamadoManutencao[] = carregar(CHAMADOS_KEY, []);
    return todos.find(c => c.id === chamadoId) || null;
  }, [chamadoId]);

  const funcao = useMemo<FuncaoManutencao | null>(() => {
    const funcoes: FuncaoManutencao[] = carregar(FUNCOES_KEY, []);
    // Se veio de um chamado existente, busca pela funcaoId do chamado
    if (chamadoExistente) return funcoes.find(f => f.id === chamadoExistente.funcaoId) || null;
    if (chave) return funcoes.find(f => f.qrChave === chave) || null;
    if (id)    return funcoes.find(f => f.id === id) || null;
    return null;
  }, [chave, id, chamadoExistente]);

  const handleEnviar = (chamado: ChamadoManutencao) => {
    const existentes: ChamadoManutencao[] = carregar(CHAMADOS_KEY, []);
    try {
      if (chamadoExistente) {
        // Atualiza o chamado existente com as respostas preenchidas
        const atualizados = existentes.map(c =>
          c.id === chamadoExistente.id
            ? { ...c, respostas: chamado.respostas, localizacao: chamado.localizacao, status: 'concluido' as const, horarioFinal: Date.now(), tempoTotal: Date.now() - c.horarioInicial }
            : c
        );
        localStorage.setItem(CHAMADOS_KEY, JSON.stringify(atualizados));
      } else {
        localStorage.setItem(CHAMADOS_KEY, JSON.stringify([chamado, ...existentes]));
      }
    } catch {
      // localStorage quota exceeded — try saving without signature images
      try {
        const limpar = (resp: any): any => {
          if (!resp || typeof resp !== 'object') return resp;
          const clean: Record<string, any> = {};
          for (const [k, v] of Object.entries(resp)) {
            if (typeof v === 'string' && v.startsWith('data:image') && v.length > 5000) {
              clean[k] = '(assinatura)';
            } else if (typeof v === 'object' && v !== null) {
              clean[k] = limpar(v);
            } else {
              clean[k] = v;
            }
          }
          return clean;
        };
        const chamadoSlim = { ...chamado, respostas: limpar(chamado.respostas) };
        if (chamadoExistente) {
          const atualizados = existentes.map(c =>
            c.id === chamadoExistente.id
              ? { ...c, respostas: chamadoSlim.respostas, localizacao: chamado.localizacao, status: 'concluido' as const, horarioFinal: Date.now(), tempoTotal: Date.now() - c.horarioInicial }
              : c
          );
          localStorage.setItem(CHAMADOS_KEY, JSON.stringify(atualizados));
        } else {
          localStorage.setItem(CHAMADOS_KEY, JSON.stringify([chamadoSlim, ...existentes]));
        }
      } catch { /* still fails — continue anyway */ }
    }
    setEnviado(true);
  };

  const handleCancelar = () => {
    navigate('/manutencao');
  };

  if (!funcao && !chamadoExistente) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', gap:16, padding:20, textAlign:'center' }}>
        <span style={{ fontSize:64 }}>🔍</span>
        <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'var(--cor-texto,#111)' }}>
          Formulário não encontrado
        </h2>
        <p style={{ margin:0, fontSize:14, color:'var(--cor-texto-secundario,#888)', maxWidth:360 }}>
          O link pode estar incorreto ou o formulário foi removido. Verifique o QR Code e tente novamente.
        </p>
        <button
          onClick={() => navigate('/manutencao')}
          style={{ marginTop:8, padding:'12px 28px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:15, fontWeight:800, color:'#0D0D0D', cursor:'pointer', fontFamily:'inherit' }}
        >
          Ir para Manutenção
        </button>
      </div>
    );
  }

  /* ── Visualização de chamado livre (sem funcao cadastrada) ─────────── */
  if (!funcao && chamadoExistente) {
    const itens = Array.isArray((chamadoExistente.respostas as any)?.itens)
      ? (chamadoExistente.respostas as any).itens as Array<{ descricao: string; fotos: string[] }>
      : [];
    const fmtData = (ts: number) => new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    const fmtTempo = (ms?: number) => {
      if (!ms) return '—';
      const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
      return h > 0 ? `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s` : `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
    };
    const STATUS_COR: Record<string,string> = { aberto:'#9ca3af', em_andamento:'#e65100', concluido:'#2e7d32', cancelado:'#b91c1c' };
    const STATUS_LABEL: Record<string,string> = { aberto:'Aberto', em_andamento:'Em Andamento', concluido:'Concluído', cancelado:'Cancelado' };

    return (
      <div style={{ maxWidth:540, margin:'0 auto', padding:20 }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#FFD600,#FF8F00)', borderRadius:16, padding:'20px 24px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:40 }}>{chamadoExistente.funcaoIcone}</span>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'#0D0D0D' }}>{chamadoExistente.funcaoNome}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(0,0,0,0.6)' }}>
              {chamadoExistente.protocolo}
            </div>
          </div>
          <span style={{ marginLeft:'auto', padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:800, color:'#fff', background: STATUS_COR[chamadoExistente.status] || '#9ca3af' }}>
            {STATUS_LABEL[chamadoExistente.status] || chamadoExistente.status}
          </span>
        </div>

        {/* Detalhes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', borderLeft:'4px solid #FFD600' }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', color:'#888', marginBottom:4 }}>Responsável</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#111' }}>{chamadoExistente.responsavel}</div>
          </div>
          <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', borderLeft:'4px solid #FFD600' }}>
            <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', color:'#888', marginBottom:4 }}>Data</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#111' }}>{fmtData(chamadoExistente.criadoEm)}</div>
          </div>
          {chamadoExistente.tempoTotal && (
            <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', borderLeft:'4px solid #FF8F00' }}>
              <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', color:'#888', marginBottom:4 }}>Tempo total</div>
              <div style={{ fontSize:16, fontWeight:900, color:'#FF8F00', fontFamily:'monospace' }}>{fmtTempo(chamadoExistente.tempoTotal)}</div>
            </div>
          )}
          {chamadoExistente.localizacao?.endereco && (
            <div style={{ background:'#f9fafb', borderRadius:10, padding:'12px 14px', borderLeft:'4px solid #FFD600' }}>
              <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', color:'#888', marginBottom:4 }}>Local</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>{chamadoExistente.localizacao.endereco}</div>
            </div>
          )}
        </div>

        {/* Itens registrados */}
        {itens.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', color:'#6366f1', marginBottom:10 }}>
              📋 {itens.length} item(s) registrado(s)
            </div>
            {itens.map((item, idx) => (
              <div key={`${item.descricao}-${item.fotos?.[0] ?? idx}`} style={{ background:'#f8f9fa', borderRadius:12, padding:'12px 14px', marginBottom:10, borderLeft:'3px solid #6366f1' }}>
                <span style={{ fontSize:11, fontWeight:800, color:'#6366f1', textTransform:'uppercase' }}>Item {idx + 1}</span>
                {item.descricao && <p style={{ margin:'4px 0 0', fontSize:14, color:'#1f2937', lineHeight:1.5 }}>{item.descricao}</p>}
                {item.fotos?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                    {item.fotos.map((f, fi) => (
                      <img key={f} src={f} alt={`Item ${idx+1} foto ${fi+1}`}
                        style={{ width:100, height:100, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/manutencao')}
          style={{ width:'100%', marginTop:8, padding:'14px 28px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:15, fontWeight:800, color:'#0D0D0D', cursor:'pointer', fontFamily:'inherit' }}
        >
          Voltar para Manutenção
        </button>
      </div>
    );
  }

  if (enviado) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', gap:16, padding:20, textAlign:'center' }}>
        <span style={{ fontSize:64 }}>✅</span>
        <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'#16a34a' }}>
          Formulário enviado com sucesso!
        </h2>
        <p style={{ margin:0, fontSize:14, color:'var(--cor-texto-secundario,#888)', maxWidth:360 }}>
          Suas informações foram registradas. O responsável será notificado.
        </p>
        <button
          onClick={() => navigate('/manutencao')}
          style={{ marginTop:8, padding:'12px 28px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:15, fontWeight:800, color:'#0D0D0D', cursor:'pointer', fontFamily:'inherit' }}
        >
          Voltar para Manutenção
        </button>
      </div>
    );
  }

  return (
    <div>
      {chamadoExistente && (
        <div style={{ background:'linear-gradient(135deg,#FFD600,#FF8F00)', padding:'16px 20px', display:'flex', alignItems:'center', gap:12, borderRadius:'0 0 16px 16px' }}>
          <span style={{ fontSize:28 }}>{chamadoExistente.funcaoIcone}</span>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:'#0D0D0D' }}>{chamadoExistente.funcaoNome}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(0,0,0,0.6)' }}>
              {chamadoExistente.protocolo} · Responsável: {chamadoExistente.responsavel}
            </div>
          </div>
        </div>
      )}
      <FormChamado
        funcao={funcao!}
        usuarioId={chamadoExistente?.responsavelId || usuario?.id || ''}
        usuarioNome={chamadoExistente?.responsavel || usuario?.nome || ''}
        usuarioRole={usuario?.role || 'funcionario'}
        adminId={chamadoExistente?.adminId || usuario?.adminId}
        supervisorId={chamadoExistente?.supervisorId || usuario?.supervisorId}
        onEnviar={handleEnviar}
        onCancelar={handleCancelar}
      />
    </div>
  );
};

export default FormPage;
