import React, { useEffect, useMemo, useState } from 'react';
import { Share2, Send, X, Check, Users } from 'lucide-react';
import { apiListUsers, apiCompartilharOS, apiGerarLinkOS } from '../../utils/api';
import type { ChamadoManutencao } from './types';

interface UsuarioApi {
  id: string;
  nome: string;
  cargo?: string;
  role: string;
}

function rotulosUsuarios(usuarios: UsuarioApi[]): Record<string, string> {
  const contagem: Record<string, number> = {};
  for (const u of usuarios) {
    const primeiro = u.nome.trim().split(/\s+/)[0].toLowerCase();
    contagem[primeiro] = (contagem[primeiro] || 0) + 1;
  }
  const rotulos: Record<string, string> = {};
  for (const u of usuarios) {
    const partes = u.nome.trim().split(/\s+/);
    const primeiro = partes[0];
    rotulos[u.id] = contagem[primeiro.toLowerCase()] > 1 && partes[1]
      ? `${primeiro} ${partes[1]}`
      : primeiro;
  }
  return rotulos;
}

const CompartilharModal: React.FC<{
  chamado: ChamadoManutencao;
  usuarioId: string;
  textoWhatsApp: string;
  onFechar: () => void;
}> = ({ chamado, usuarioId, textoWhatsApp, onFechar }) => {
  const [usuarios, setUsuarios] = useState<UsuarioApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    apiListUsers()
      .then((r: { usuarios: UsuarioApi[] }) => {
        setUsuarios((r.usuarios || []).filter(u => u.id !== usuarioId));
      })
      .catch(() => setErro('Não foi possível carregar os funcionários. Verifique a conexão.'))
      .finally(() => setCarregando(false));
  }, [usuarioId]);

  const rotulos = useMemo(() => rotulosUsuarios(usuarios), [usuarios]);
  const todosSelecionados = usuarios.length > 0 && selecionados.size === usuarios.length;

  const toggle = (id: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  const toggleTodos = () => {
    setSelecionados(todosSelecionados ? new Set() : new Set(usuarios.map(u => u.id)));
  };

  const enviarNoApp = async () => {
    if (selecionados.size === 0) { setErro('Selecione ao menos um funcionário'); return; }
    setEnviando(true); setErro('');
    try {
      await apiCompartilharOS(chamado, Array.from(selecionados));
      setEnviado(true);
      setTimeout(onFechar, 1400);
    } catch {
      setErro('Falha ao enviar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const enviarWhatsApp = async () => {
    setEnviando(true); setErro('');
    try {
      const { url } = await apiGerarLinkOS(chamado);
      const texto = `${textoWhatsApp}\n\n📲 Abrir no aplicativo: ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
      onFechar();
    } catch {
      setErro('Falha ao gerar o link. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const btnBase: React.CSSProperties = {
    padding: '12px 18px', borderRadius: 14, fontSize: 15, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: 6,
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:24, padding:28, width:'100%', maxWidth:480, boxShadow:'0 24px 80px rgba(0,0,0,0.3)', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Share2 size={24} color="#FF8F00" />
            <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:'#0D0D0D' }}>Compartilhar OS</h2>
          </div>
          <button onClick={onFechar} aria-label="Fechar"
            style={{ background:'none', border:'none', cursor:'pointer', padding:6, color:'#6b7280' }}>
            <X size={22} />
          </button>
        </div>
        <p style={{ margin:'0 0 18px', fontSize:13, color:'#71717a' }}>
          {chamado.funcaoNome} · {chamado.protocolo}
        </p>

        {enviado ? (
          <div style={{ padding:'28px 16px', textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:8 }}>✅</div>
            <p style={{ margin:0, fontSize:16, fontWeight:800, color:'#15803d' }}>Enviado! A OS aparecerá no aplicativo de cada um.</p>
          </div>
        ) : (
          <>
            <label style={{ fontSize:12, fontWeight:800, color:'#6b7280', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Enviar para quem?
            </label>

            {carregando ? (
              <p style={{ fontSize:14, color:'#71717a' }}>Carregando funcionários…</p>
            ) : usuarios.length === 0 ? (
              <div style={{ padding:'12px 16px', background:'#fef9c3', borderRadius:10, fontSize:13, color:'#854d0e', fontWeight:600 }}>
                ⚠️ Nenhum outro usuário cadastrado na equipe.
              </div>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:8 }}>
                <button onClick={toggleTodos}
                  style={{ ...btnBase,
                    border: todosSelecionados ? '2px solid #FF8F00' : '2px dashed #d4d4d8',
                    background: todosSelecionados ? 'linear-gradient(135deg,#FFD600,#FF8F00)' : '#fafafa',
                    color:'#0D0D0D' }}>
                  <Users size={16} /> Todos
                </button>
                {usuarios.map(u => {
                  const sel = selecionados.has(u.id);
                  return (
                    <button key={u.id} onClick={() => { toggle(u.id); setErro(''); }}
                      style={{ ...btnBase,
                        border: sel ? '2px solid #FF8F00' : '2px solid #e4e4e7',
                        background: sel ? '#FFF7E0' : '#fff',
                        color:'#0D0D0D' }}>
                      {sel && <Check size={15} color="#FF8F00" />}
                      {rotulos[u.id]}
                    </button>
                  );
                })}
              </div>
            )}

            {erro && <p style={{ margin:'6px 0 0', fontSize:13, color:'#dc2626', fontWeight:700 }}>{erro}</p>}

            <button onClick={enviarNoApp} disabled={enviando || usuarios.length === 0}
              style={{ width:'100%', marginTop:18, padding:'14px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:14, fontSize:15, fontWeight:900, color:'#0D0D0D', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: enviando ? 0.6 : 1 }}>
              <Send size={18} /> {enviando ? 'Enviando…' : `Enviar no aplicativo${selecionados.size > 0 ? ` (${selecionados.size})` : ''}`}
            </button>

            <button onClick={enviarWhatsApp} disabled={enviando}
              style={{ width:'100%', marginTop:10, padding:'13px', background:'#25D366', border:'none', borderRadius:14, fontSize:14, fontWeight:900, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: enviando ? 0.6 : 1 }}>
              💬 Enviar link pelo WhatsApp
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CompartilharModal;
