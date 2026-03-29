import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Shield, ShieldOff, Pencil, Trash2,
  Users, CheckCircle, XCircle, Building2, Wifi, RefreshCw,
} from 'lucide-react';
import { useAuth, Usuario } from '../../contexts/AuthContext';
import styles from './Dashboard.module.css';

const TRIAL_API = 'https://api.simplesmanutencao.com.br';
const API_KEY   = 'simples-api-key-2024';

type Aba    = 'clientes' | 'ips';
type Filtro = 'todos' | 'ativos' | 'bloqueados';

interface IPRecord {
  ip: string;
  emails: string[];
  registradoEm: number;
  bloqueado: boolean;
  diasRegistrado: number;
  trialExpirado: boolean;
}

interface ModalEditar { tipo: 'editar'; cliente: Usuario; }
interface ModalExcluir { tipo: 'excluir'; cliente: Usuario; }
type ModalState = ModalEditar | ModalExcluir | null;

function inicialNome(nome: string) {
  const p = nome.trim().split(' ');
  return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase();
}

function diasCadastrado(ts?: number) {
  if (!ts) return null;
  const dias = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  if (dias === 0) return 'cadastrado hoje';
  if (dias === 1) return '1 dia cadastrado';
  return `${dias} dias cadastrado`;
}

function contarRegistros(adminId: string, chave: string): number {
  try {
    const dados = JSON.parse(localStorage.getItem(chave) || '[]');
    return dados.filter((item: any) => item.adminId === adminId || item.criadoPor === adminId).length;
  } catch { return 0; }
}

function formatarDataHora(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function DashboardPage() {
  const { usuario, listarAdmins, bloquearAdmin, desbloquearAdmin, excluirAdmin, editarAdmin } = useAuth();
  const navigate = useNavigate();

  // ── aba ────────────────────────────────────────────────
  const [aba, setAba] = useState<Aba>('clientes');

  // ── clientes ───────────────────────────────────────────
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [filtro, setFiltro]     = useState<Filtro>('todos');
  const [busca, setBusca]       = useState('');
  const [modal, setModal]       = useState<ModalState>(null);
  const [editForm, setEditForm] = useState({ nome: '', email: '', plano: '' });

  // ── IPs ────────────────────────────────────────────────
  const [ips, setIps]             = useState<IPRecord[]>([]);
  const [ipsLoading, setIpsLoading] = useState(false);
  const [ipsErro, setIpsErro]     = useState('');
  const [buscaIp, setBuscaIp]     = useState('');

  // Só master acessa
  useEffect(() => {
    if (usuario && usuario.role !== 'master') navigate('/manutencao', { replace: true });
  }, [usuario, navigate]);

  const recarregarClientes = () => setClientes(listarAdmins());
  useEffect(() => { recarregarClientes(); }, []);

  // ── carregar IPs ───────────────────────────────────────
  const carregarIPs = async () => {
    setIpsLoading(true);
    setIpsErro('');
    try {
      const resp = await fetch(`${TRIAL_API}/trial/list`, {
        headers: { 'x-api-key': API_KEY },
      });
      if (!resp.ok) throw new Error('Erro na API');
      const data = await resp.json();
      setIps(data.ips || []);
    } catch {
      setIpsErro('Não foi possível conectar à API de trial. Verifique se o container está rodando.');
    } finally {
      setIpsLoading(false);
    }
  };

  useEffect(() => { if (aba === 'ips') carregarIPs(); }, [aba]);

  async function desbloquearIP(ip: string) {
    try {
      await fetch(`${TRIAL_API}/trial/unblock`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ ip }),
      });
      carregarIPs();
    } catch {
      setIpsErro('Falha ao desbloquear IP.');
    }
  }

  async function bloquearIPManual(ip: string) {
    try {
      await fetch(`${TRIAL_API}/trial/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ ip }),
      });
      carregarIPs();
    } catch {
      setIpsErro('Falha ao bloquear IP.');
    }
  }

  // ── filtros clientes ───────────────────────────────────
  const filtrados = clientes.filter(c => {
    const okFiltro =
      filtro === 'todos' ||
      (filtro === 'ativos'     && !c.bloqueado) ||
      (filtro === 'bloqueados' &&  c.bloqueado);
    const okBusca =
      !busca ||
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(busca.toLowerCase());
    return okFiltro && okBusca;
  });

  const ipsFiltrados = ips.filter(r =>
    !buscaIp ||
    r.ip.includes(buscaIp) ||
    r.emails.some(e => e.includes(buscaIp.toLowerCase()))
  );

  const totalAtivos    = clientes.filter(c => !c.bloqueado).length;
  const totalBloq      = clientes.filter(c =>  c.bloqueado).length;
  const totalIndividual = clientes.filter(c => c.plano === 'individual').length;
  const totalEmpresa    = clientes.filter(c => c.plano === 'empresa' || !c.plano).length;

  function abrirEditar(c: Usuario) {
    setEditForm({ nome: c.nome, email: c.email ?? '', plano: c.plano ?? 'empresa' });
    setModal({ tipo: 'editar', cliente: c });
  }

  function salvarEditar() {
    if (modal?.tipo !== 'editar') return;
    editarAdmin(modal.cliente.id, {
      nome:  editForm.nome.trim(),
      email: editForm.email.trim().toLowerCase(),
      plano: editForm.plano as 'individual' | 'empresa',
    });
    recarregarClientes();
    setModal(null);
  }

  function confirmarExcluir() {
    if (modal?.tipo !== 'excluir') return;
    excluirAdmin(modal.cliente.id);
    recarregarClientes();
    setModal(null);
  }

  function toggleBloquear(c: Usuario) {
    if (c.bloqueado) desbloquearAdmin(c.id);
    else bloquearAdmin(c.id);
    recarregarClientes();
  }

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>⚡ Master</div>
          <h1>Dashboard de Clientes</h1>
          <p>Gerencie todos os condomínios e empresas cadastradas no sistema</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 4px' }}>Logado como</p>
          <p style={{ color: '#FFD600', fontWeight: 800, margin: 0 }}>{usuario?.nome}</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}><Building2 size={12} style={{ display:'inline', marginRight:4 }} />Total clientes</span>
          <span className={styles.statNum}>{clientes.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}><CheckCircle size={12} style={{ display:'inline', marginRight:4 }} />Ativos</span>
          <span className={`${styles.statNum} ${styles.statNumAtiv}`}>{totalAtivos}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}><XCircle size={12} style={{ display:'inline', marginRight:4 }} />Bloqueados</span>
          <span className={`${styles.statNum} ${styles.statNumBloq}`}>{totalBloq}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}><Users size={12} style={{ display:'inline', marginRight:4 }} />Empresa / Individual</span>
          <span className={styles.statNum}>{totalEmpresa} / {totalIndividual}</span>
        </div>
      </div>

      {/* ── Abas ── */}
      <div className={styles.toolbar} style={{ marginBottom: 20 }}>
        <button
          className={`${styles.filterBtn} ${aba === 'clientes' ? styles.filterBtnAtivo : ''}`}
          onClick={() => setAba('clientes')}
        >
          <Building2 size={14} style={{ display:'inline', marginRight:5 }} />Clientes
        </button>
        <button
          className={`${styles.filterBtn} ${aba === 'ips' ? styles.filterBtnAtivo : ''}`}
          onClick={() => setAba('ips')}
        >
          <Wifi size={14} style={{ display:'inline', marginRight:5 }} />Controle de Trial (IPs)
        </button>
      </div>

      {/* ══════════════════════ ABA CLIENTES ══════════════════════ */}
      {aba === 'clientes' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Buscar por nome ou e-mail..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            {(['todos', 'ativos', 'bloqueados'] as Filtro[]).map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filtro === f ? styles.filterBtnAtivo : ''}`}
                onClick={() => setFiltro(f)}
              >
                {(() => {
                  if (f === 'todos') { return 'Todos'; }
                  if (f === 'ativos') { return '✓ Ativos'; }
                  return '✗ Bloqueados';
                })()}
              </button>
            ))}
          </div>

          {filtrados.length === 0 ? (
            <div className={styles.listaVazia}>
              <Building2 size={48} strokeWidth={1} />
              <p>{clientes.length === 0 ? 'Nenhum cliente cadastrado ainda.' : 'Nenhum resultado para essa busca.'}</p>
            </div>
          ) : (
            filtrados.map(c => {
              const chamados = contarRegistros(c.id, 'manutencao_chamados_v2');
              const funcoes  = contarRegistros(c.id, 'manutencao_funcoes_v2');
              return (
                <div key={c.id} className={`${styles.clienteCard} ${c.bloqueado ? styles.clienteCardBloq : ''}`}>
                  <div className={`${styles.clienteAvatar} ${c.bloqueado ? styles.clienteAvatarBloq : ''}`}>
                    {c.bloqueado ? '🔒' : inicialNome(c.nome)}
                  </div>
                  <div className={styles.clienteInfo}>
                    <p className={styles.clienteNome}>{c.nome}</p>
                    <p className={styles.clienteEmail}>{c.email ?? c.login}</p>
                    <div className={styles.clienteMeta}>
                      <span className={`${styles.badge} ${c.bloqueado ? styles.badgeBloqueado : styles.badgeAtivo}`}>
                        {c.bloqueado ? '✗ Bloqueado' : '✓ Ativo'}
                      </span>
                      <span className={`${styles.badge} ${styles.badgePlano}`}>
                        {c.plano === 'individual' ? '👤 Individual' : '🏢 Empresa'}
                      </span>
                      {diasCadastrado(c.cadastradoEm) && (
                        <span className={`${styles.badge} ${styles.badgeData}`}>
                          🗓 {diasCadastrado(c.cadastradoEm)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.clienteStats}>
                    <div className={styles.clienteStatItem}>
                      <span className={styles.clienteStatNum}>{chamados}</span>
                      <span>chamados</span>
                    </div>
                    <div className={styles.clienteStatItem}>
                      <span className={styles.clienteStatNum}>{funcoes}</span>
                      <span>funções</span>
                    </div>
                  </div>
                  <div className={styles.acoes}>
                    <button className={`${styles.btnAcao} ${styles.btnEditar}`} onClick={() => abrirEditar(c)}>
                      <Pencil size={13} /> Editar
                    </button>
                    <button
                      className={`${styles.btnAcao} ${c.bloqueado ? styles.btnDesbloquear : styles.btnBloquear}`}
                      onClick={() => toggleBloquear(c)}
                    >
                      {c.bloqueado ? <><ShieldOff size={13} /> Desbloquear</> : <><Shield size={13} /> Bloquear</>}
                    </button>
                    <button className={`${styles.btnAcao} ${styles.btnExcluir}`} onClick={() => setModal({ tipo: 'excluir', cliente: c })}>
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {/* ══════════════════════ ABA IPs ══════════════════════ */}
      {aba === 'ips' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Buscar por IP ou e-mail..."
                value={buscaIp}
                onChange={e => setBuscaIp(e.target.value)}
              />
            </div>
            <button className={styles.filterBtn} onClick={carregarIPs} disabled={ipsLoading}>
              <RefreshCw size={14} style={{ display:'inline', marginRight:5 }} />
              {ipsLoading ? 'Carregando...' : 'Atualizar'}
            </button>
          </div>

          {ipsErro && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:12, padding:'14px 18px', color:'#b91c1c', fontSize:13, marginBottom:16 }}>
              ⚠️ {ipsErro}
            </div>
          )}

          {!ipsErro && ipsFiltrados.length === 0 && !ipsLoading && (
            <div className={styles.listaVazia}>
              <Wifi size={48} strokeWidth={1} />
              <p>{ips.length === 0 ? 'Nenhum IP registrado ainda.' : 'Nenhum resultado para essa busca.'}</p>
            </div>
          )}

          {ipsFiltrados.map(r => (
            <div key={r.ip} className={`${styles.clienteCard} ${r.bloqueado ? styles.clienteCardBloq : ''}`}>
              <div className={`${styles.clienteAvatar} ${r.bloqueado ? styles.clienteAvatarBloq : ''}`}
                style={{ fontSize: 12, fontWeight: 900, background: r.trialExpirado ? 'linear-gradient(135deg,#fca5a5,#ef4444)' : undefined, color: r.trialExpirado ? '#fff' : undefined }}>
                {(() => {
                  if (r.bloqueado) { return '🔒'; }
                  if (r.trialExpirado) { return '⏰'; }
                  return '🌐';
                })()}
              </div>

              <div className={styles.clienteInfo}>
                <p className={styles.clienteNome} style={{ fontFamily: 'monospace', fontSize: 15 }}>{r.ip}</p>
                <p className={styles.clienteEmail}>
                  {r.emails.length > 0 ? r.emails.join(', ') : 'Nenhum e-mail registrado'}
                </p>
                <div className={styles.clienteMeta}>
                  <span className={`${styles.badge} ${r.bloqueado ? styles.badgeBloqueado : styles.badgeAtivo}`}>
                    {r.bloqueado ? '✗ Bloqueado' : '✓ Liberado'}
                  </span>
                  {r.trialExpirado && !r.bloqueado && (
                    <span className={`${styles.badge} ${styles.badgeBloqueado}`}>⏰ Trial expirado</span>
                  )}
                  <span className={`${styles.badge} ${styles.badgeData}`}>
                    🗓 {r.diasRegistrado === 0 ? 'registrado hoje' : `${r.diasRegistrado} dias`}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeData}`}>
                    {formatarDataHora(r.registradoEm)}
                  </span>
                </div>
              </div>

              <div className={styles.acoes}>
                {r.bloqueado || r.trialExpirado ? (
                  <button className={`${styles.btnAcao} ${styles.btnDesbloquear}`} onClick={() => desbloquearIP(r.ip)}>
                    <ShieldOff size={13} /> Liberar trial
                  </button>
                ) : (
                  <button className={`${styles.btnAcao} ${styles.btnBloquear}`} onClick={() => bloquearIPManual(r.ip)}>
                    <Shield size={13} /> Bloquear
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Modal Editar ── */}
      {modal?.tipo === 'editar' && (
        <div className={styles.overlay}>
          <button type="button" onClick={() => setModal(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar" tabIndex={-1} />
          <div className={styles.modal} style={{ position:'relative', zIndex:1 }}>
            <h2 className={styles.modalTitulo}>Editar cliente</h2>
            <p className={styles.modalSub}>Altere os dados do cliente abaixo.</p>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="edit-nome">Nome</label>
              <input id="edit-nome" className={styles.formInput} value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="edit-email">E-mail</label>
              <input id="edit-email" className={styles.formInput} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="edit-plano">Plano</label>
              <select id="edit-plano" className={styles.formSelect} value={editForm.plano} onChange={e => setEditForm(f => ({ ...f, plano: e.target.value }))}>
                <option value="empresa">Empresa — R$ 199/mês</option>
                <option value="individual">Individual — R$ 99/mês</option>
              </select>
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.btnCancelar} onClick={() => setModal(null)}>Cancelar</button>
              <button className={styles.btnConfirmar} onClick={salvarEditar}>Salvar alterações</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Excluir ── */}
      {modal?.tipo === 'excluir' && (
        <div className={styles.overlay}>
          <button type="button" onClick={() => setModal(null)} style={{ position:'absolute', inset:0, background:'transparent', border:'none', cursor:'default' }} aria-label="Fechar" tabIndex={-1} />
          <div className={styles.modal} style={{ position:'relative', zIndex:1 }}>
            <h2 className={styles.modalTitulo}>Excluir cliente</h2>
            <p className={styles.modalSub}>
              Tem certeza que deseja excluir <strong>{modal.cliente.nome}</strong>? Isso removerá o cliente e todos os seus funcionários. Esta ação não pode ser desfeita.
            </p>
            <div className={styles.modalBtns}>
              <button className={styles.btnCancelar} onClick={() => setModal(null)}>Cancelar</button>
              <button className={`${styles.btnConfirmar} ${styles.btnConfirmarPerigo}`} onClick={confirmarExcluir}>
                Excluir permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
