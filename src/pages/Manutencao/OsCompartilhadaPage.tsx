import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiBuscarLinkOS } from '../../utils/api';
import type { ChamadoManutencao } from './types';

const CHAMADOS_KEY = 'manutencao_chamados_v2';

const OsCompartilhadaPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [msg, setMsg] = useState('Abrindo ordem de serviço…');
  const token = params.get('t') || '';

  useEffect(() => {
    if (!token) { setMsg('Link inválido.'); return; }
    if (!usuario) return;
    apiBuscarLinkOS(token)
      .then(({ chamado, deNome }) => {
        const c = chamado as unknown as ChamadoManutencao;
        let lista: ChamadoManutencao[] = [];
        try { lista = JSON.parse(localStorage.getItem(CHAMADOS_KEY) || '[]'); } catch { /* ok */ }
        const idx = lista.findIndex(x => x.id === c.id);
        const marcado: ChamadoManutencao = {
          ...c,
          compartilhadoCom: Array.from(new Set([...(c.compartilhadoCom || []), usuario.id])),
          compartilhadoPor: deNome,
        };
        if (idx >= 0) {
          lista[idx] = { ...lista[idx], compartilhadoCom: marcado.compartilhadoCom, compartilhadoPor: deNome };
        } else {
          lista.unshift(marcado);
        }
        localStorage.setItem(CHAMADOS_KEY, JSON.stringify(lista));
        navigate('/meus-chamados', { replace: true });
      })
      .catch(() => setMsg('Link inválido ou expirado.'));
  }, [token, usuario, navigate]);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f4f5', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'32px 40px', boxShadow:'0 12px 40px rgba(0,0,0,0.12)', textAlign:'center', maxWidth:380 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🛠️</div>
        <p style={{ margin:0, fontSize:16, fontWeight:800, color:'#0D0D0D' }}>{msg}</p>
      </div>
    </div>
  );
};

export default OsCompartilhadaPage;
