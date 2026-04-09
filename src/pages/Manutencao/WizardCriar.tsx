import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Plus, Trash2, MoreHorizontal, Check, QrCode, Lock, Globe, SkipForward, Send, MessageCircle, Search } from 'lucide-react';
import MicButton from '../../components/MicButton';
import { QRCodeCanvas } from 'qrcode.react';
import { BLOCOS_DISPONIVEIS, CATEGORIAS_BLOCOS, NOMES_SUGESTOES, EMOJIS_DISPONIVEIS, CORES_DISPONIVEIS } from './constants';
import type { FuncaoManutencao, BlocoSelecionado } from './types';
import styles from './WizardCriar.module.css';

interface Props {
  funcaoEditar?: FuncaoManutencao;
  onConcluir: (funcao: FuncaoManutencao) => void;
  onCancelar: () => void;
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function gerarChave() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

const TOTAL_ETAPAS = 6;

const WizardCriar: React.FC<Props> = ({ onConcluir, onCancelar }) => {
  const [etapa, setEtapa] = useState(1);

  // Etapa 1 — Nome
  const [nome, setNome] = useState('');
  const [nomeCustom, setNomeCustom] = useState('');
  const [modoCustom, setModoCustom] = useState(false);

  // Etapa 2 — Ícone e cor
  const [icone, setIcone] = useState('🔧');
  const [cor, setCor] = useState('#FFD600');

  // Etapa 3 — Blocos do formulário
  const [blocosSelecionados, setBlocosSelecionados] = useState<BlocoSelecionado[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('basico');

  // Etapa 4 — Configurar dropdowns
  const [blocoEditando, setBlocoEditando] = useState<string | null>(null);
  const [novaOpcao, setNovaOpcao] = useState('');

  // Etapa 5 — QR Code
  const [qrTipo, setQrTipo] = useState<FuncaoManutencao['qrTipo']>('nenhum');

  // Modal solicitar função
  const [modalSolicitar, setModalSolicitar] = useState(false);
  const [previewBloco, setPreviewBloco] = useState<string | null>(null);
  const [solTitulo,      setSolTitulo]      = useState('');
  const [solDescricao,   setSolDescricao]   = useState('');
  const [solWhatsapp,    setSolWhatsapp]    = useState('');

  const enviarSolicitacao = () => {
    if (!solTitulo.trim()) { alert('Informe o título da solicitação.'); return; }
    const linhas = [
      '🛠️ *Solicitação — Simples Manutenção*',
      '',
      `📌 *Título:* ${solTitulo}`,
      solDescricao ? `📝 *Descrição:* ${solDescricao}` : '',
      solWhatsapp  ? `📱 *Meu WhatsApp:* ${solWhatsapp}` : '',
    ].filter(Boolean);
    const texto = linhas.join('\n');
    window.open(`https://wa.me/5511933284364?text=${encodeURIComponent(texto)}`, '_blank');
    setModalSolicitar(false);
    setSolTitulo(''); setSolDescricao(''); setSolWhatsapp('');
  };
  const [qrChave] = useState(gerarChave());

  // ── Navegação ────────────────────────────────────────────────────────────

  const nomeAtual = modoCustom ? nomeCustom : nome;

  const podeAvancar = () => {
    if (etapa === 1) return nomeAtual.trim().length > 0;
    if (etapa === 2) return true;
    if (etapa === 3) return blocosSelecionados.length > 0;
    return true;
  };

  const avancar = () => {
    if (!podeAvancar()) return;
    // Pula etapa 4 se não tiver blocos com dropdown
    if (etapa === 3 && !blocosSelecionados.some(b => {
      const def = BLOCOS_DISPONIVEIS.find(d => d.id === b.tipo);
      return def?.temDropdown;
    })) {
      setEtapa(5);
    } else {
      setEtapa(e => Math.min(e + 1, TOTAL_ETAPAS));
    }
  };

  const voltar = () => {
    if (etapa === 5 && !blocosSelecionados.some(b => {
      const def = BLOCOS_DISPONIVEIS.find(d => d.id === b.tipo);
      return def?.temDropdown;
    })) {
      setEtapa(3);
    } else {
      setEtapa(e => Math.max(e - 1, 1));
    }
  };

  // ── Ações de blocos ──────────────────────────────────────────────────────

  const toggleBloco = (tipoId: string) => {
    const novo: BlocoSelecionado = {
      uid: gerarId(),
      tipo: tipoId,
      obrigatorio: false,
      opcoes: [],
    };
    setBlocosSelecionados(prev => [...prev, novo]);
  };

  const removerBloco = (uid: string) => {
    setBlocosSelecionados(prev => prev.filter(b => b.uid !== uid));
  };

  const adicionarOpcao = (uid: string) => {
    if (!novaOpcao.trim()) return;
    setBlocosSelecionados(prev => prev.map(b =>
      b.uid === uid ? { ...b, opcoes: [...(b.opcoes || []), novaOpcao.trim()] } : b
    ));
    setNovaOpcao('');
  };

  const removerOpcao = (uid: string, idx: number) => {
    setBlocosSelecionados(prev => prev.map(b =>
      b.uid === uid ? { ...b, opcoes: b.opcoes?.filter((_, i) => i !== idx) } : b
    ));
  };

  // ── Concluir ─────────────────────────────────────────────────────────────

  const concluir = () => {
    const funcao: FuncaoManutencao = {
      id: gerarId(),
      nome: nomeAtual.trim(),
      icone,
      cor,
      blocos: blocosSelecionados,
      qrTipo,
      qrChave: qrTipo === 'chave' ? qrChave : undefined,
      criadoPor: '',
      criadoEm: Date.now(),
      ativo: true,
    };
    onConcluir(funcao);
  };

  // ── QR URL ───────────────────────────────────────────────────────────────
  const qrUrl = `${window.location.origin}/manutencao/form?chave=${qrChave}`;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.overlay}>

      {/* Modal solicitar função */}
      {modalSolicitar && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:480, boxShadow:'0 24px 80px rgba(0,0,0,0.35)', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#FFD600,#FF8F00)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:32 }}>💡</span>
                <div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'#0D0D0D' }}>Solicitar Função</h2>
                  <p style={{ margin:'2px 0 0', fontSize:12, color:'rgba(13,13,13,0.7)', fontWeight:600 }}>Sem custo adicional</p>
                </div>
              </div>
              <button onClick={() => setModalSolicitar(false)} style={{ background:'rgba(0,0,0,0.15)', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Corpo */}
            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

              {/* Título */}
              <div>
                <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:6 }}>Título da solicitação *</label>
                <input
                  value={solTitulo}
                  onChange={e => setSolTitulo(e.target.value)}
                  placeholder="Ex: Inspeção de equipamentos, Ordem de serviço..."
                  style={{ width:'100%', padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                  autoFocus
                />
              </div>

              {/* Descrição + mic */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px' }}>Descrição</label>
                  <MicButton onResult={texto => setSolDescricao(prev => (prev ? prev + ' ' : '') + texto)} />
                </div>
                <textarea
                  value={solDescricao}
                  onChange={e => setSolDescricao(e.target.value)}
                  placeholder="Descreva o que você precisa... ou use o microfone 🎙️"
                  rows={3}
                  style={{ width:'100%', padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, outline:'none', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }}
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:6 }}>Seu WhatsApp</label>
                <input
                  value={solWhatsapp}
                  onChange={e => setSolWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  type="tel"
                  style={{ width:'100%', padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                />
              </div>
            </div>

            {/* Rodapé */}
            <div style={{ padding:'14px 24px', borderTop:'1px solid #e4e4e7', display:'flex', gap:10, justifyContent:'flex-end', background:'#fafafa' }}>
              <button onClick={() => setModalSolicitar(false)} style={{ padding:'11px 20px', background:'none', border:'2px solid #e4e4e7', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', color:'#6b7280', fontFamily:'inherit' }}>
                Cancelar
              </button>
              <button onClick={enviarSolicitacao} style={{ display:'flex', alignItems:'center', gap:6, padding:'11px 24px', background:'#25D366', border:'none', borderRadius:10, fontSize:14, fontWeight:900, color:'#fff', cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(37,211,102,0.4)' }}>
                <Send size={16} /> Enviar via WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}

      <div className={styles.wizard}>

        {/* Header */}
        <div className={styles.wizardHeader}>
          <div className={styles.wizardHeaderTopo}>
            <div className={styles.wizardTitulo}>
              <span className={styles.wizardIconeHeader}>🛠️</span>
              <span>
                {etapa === 1 && <><strong>1</strong> — Criar nova função</>}
                {etapa === 2 && <><strong>2</strong> — Escolha o ícone e a cor</>}
                {etapa === 3 && <><strong>3</strong> — Monte sua manutenção</>}
                {etapa === 4 && <><strong>4</strong> — Configure os campos com lista</>}
                {etapa === 5 && <><strong>5</strong> — Formas de acesso</>}
                {etapa === 6 && <><strong>6</strong> — Resumo da manutenção</>}
              </span>
            </div>
            <button className={styles.fecharBtn} onClick={onCancelar}>
              <X size={22} />
            </button>
          </div>

          {/* Barra de progresso */}
          <div className={styles.progressBar}>
            {[1,2,3,4,5,6].map(n => (
              <div
                key={n}
                className={`${styles.progressStep} ${etapa >= n ? styles.progressStepAtivo : ''} ${etapa === n ? styles.progressStepAtual : ''}`}
              >
                {etapa > n ? <Check size={12} /> : n}
              </div>
            ))}
            <div className={styles.progressLinha}>
              <div className={styles.progressLinhaFill} style={{ width: `${((etapa - 1) / 5) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className={styles.wizardBody}>

          {/* ── Etapa 1: Nome ─────────────────────────────────────────── */}
          {etapa === 1 && (
            <div className={styles.etapa}>
              <div className={styles.etapaPergunta}>
                Como você quer chamar essa função?
              </div>
              <p className={styles.etapaHint}>Escolha uma opção ou escreva o seu próprio nome</p>

              <div className={styles.sugestoesGrid}>
                {NOMES_SUGESTOES.map(s => (
                  <button
                    key={s.nome}
                    className={`${styles.sugestaoBtn} ${nome === s.nome && !modoCustom ? styles.sugestaoBtnAtivo : ''}`}
                    onClick={() => { setNome(s.nome); setIcone(s.icone); setModoCustom(false); }}
                  >
                    <span className={styles.sugestaoIcone}>{s.icone}</span>
                    <span className={styles.sugestaoNome}>{s.nome}</span>
                  </button>
                ))}
                <button
                  className={`${styles.sugestaoBtn} ${nome === 'Ordem de Serviço' && !modoCustom ? styles.sugestaoBtnAtivo : ''}`}
                  onClick={() => { setNome('Ordem de Serviço'); setIcone('📋'); setModoCustom(false); }}
                >
                  <span className={styles.sugestaoIcone}>📋</span>
                  <span className={styles.sugestaoNome}>Ordem de Serviço</span>
                </button>
                <button
                  className={`${styles.sugestaoBtn} ${modoCustom ? styles.sugestaoBtnAtivo : ''}`}
                  onClick={() => { setModoCustom(true); setNome(''); }}
                >
                  <span className={styles.sugestaoIcone}>✏️</span>
                  <span className={styles.sugestaoNome}>Personalize</span>
                </button>
              </div>

              {modoCustom && (
                <input
                  className={styles.inputCustom}
                  placeholder="Digite o nome da função..."
                  value={nomeCustom}
                  onChange={e => setNomeCustom(e.target.value)}
                  autoFocus
                />
              )}

              {nomeAtual && (
                <div className={styles.previewNome}>
                  Será criado: <strong>{nomeAtual}</strong>
                </div>
              )}

              <div className={styles.bannerSolicitar}>
                <span className={styles.bannerSolicitarIcone}>💡</span>
                <div className={styles.bannerSolicitarTexto}>
                  <strong>Precisa de uma nova função?</strong>
                  <span>Solicite aqui! Desenvolvemos sem nenhum custo adicional e entregamos em poucas horas.</span>
                </div>
                <button className={styles.btnSolicitar} onClick={() => setModalSolicitar(true)}>
                  <MessageCircle size={15} /> Solicitar
                </button>
              </div>
            </div>
          )}

          {/* ── Etapa 2: Ícone e cor ──────────────────────────────────── */}
          {etapa === 2 && (
            <div className={styles.etapa}>
              <div className={styles.etapaPergunta}>
                Escolha um ícone e uma cor para <strong>{nomeAtual}</strong>
              </div>

              {/* Preview */}
              <div className={styles.previewTile} style={{ background: cor }}>
                <span className={styles.previewTileIcone}>{icone}</span>
                <span className={styles.previewTileNome}>{nomeAtual}</span>
              </div>

              <div className={styles.secaoConfig}>
                <label className={styles.secaoLabel}>Ícone</label>
                <div className={styles.emojiGrid}>
                  {EMOJIS_DISPONIVEIS.map(e => (
                    <button
                      key={e}
                      className={`${styles.emojiBtn} ${icone === e ? styles.emojiBtnAtivo : ''}`}
                      style={icone === e ? { background: cor, color: '#0D0D0D' } : {}}
                      onClick={() => setIcone(e)}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <div className={styles.secaoConfig}>
                <label className={styles.secaoLabel}>Cor</label>
                <div className={styles.coresGrid}>
                  {CORES_DISPONIVEIS.map(c => (
                    <button
                      key={c}
                      className={`${styles.corBtn} ${cor === c ? styles.corBtnAtivo : ''}`}
                      style={{ background: c }}
                      onClick={() => setCor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Etapa 3: Blocos ───────────────────────────────────────── */}
          {etapa === 3 && (
            <div className={styles.etapa}>
              <div className={styles.etapaPergunta}>
                O que vai conter na <strong>{nomeAtual}</strong>?
              </div>
              <p className={styles.etapaHint}>Clique nas categorias para ver outros tipos de itens</p>

              {/* Categorias */}
              <div className={styles.categoriasBar}>
                {CATEGORIAS_BLOCOS.map(cat => (
                  <button
                    key={cat.id}
                    className={`${styles.catBtn} ${categoriaAtiva === cat.id ? styles.catBtnAtivo : ''}`}
                    style={categoriaAtiva === cat.id ? { background: cat.cor, color: '#fff', borderColor: cat.cor } : {}}
                    onClick={() => setCategoriaAtiva(cat.id)}
                  >{cat.label}</button>
                ))}
              </div>

              {/* Grid de blocos */}
              <div className={styles.blocosGrid}>
                {BLOCOS_DISPONIVEIS.filter(b => b.categoria === categoriaAtiva).map(bloco => {
                  const qtd = blocosSelecionados.filter(b => b.tipo === bloco.id).length;
                  return (
                    <div key={bloco.id} style={{ position:'relative' }}>
                      <button
                        className={`${styles.blocoBtn} ${qtd > 0 ? styles.blocoBtnSelecionado : ''}`}
                        onClick={() => toggleBloco(bloco.id)}
                        style={{ width:'100%' }}
                      >
                        <span className={styles.blocoIcone}>{bloco.icone}</span>
                        <span className={styles.blocoNome}>{bloco.nome}</span>
                        {bloco.temDropdown && <span className={styles.blocoTag}>⋯</span>}
                        {qtd > 0 && <span className={styles.blocoCheck}>{qtd > 1 ? qtd : '✓'}</span>}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewBloco(bloco.id); }}
                        className={styles.blocoLupa}
                        title="Ver exemplo"
                      >
                        <Search size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Selecionados */}
              {blocosSelecionados.length > 0 && (
                <div className={styles.selecionadosList}>
                  <p className={styles.selecionadosLabel}>Adicionados ({blocosSelecionados.length}):</p>
                  <div className={styles.selecionadosChips}>
                    {blocosSelecionados.map(b => {
                      const def = BLOCOS_DISPONIVEIS.find(d => d.id === b.tipo)!;
                      return (
                        <span key={b.uid} className={styles.chip}>
                          {def.icone} {def.nome}
                          <button className={styles.chipRemover} onClick={() => removerBloco(b.uid)}>×</button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Banner solicitar */}
              <div className={styles.bannerSolicitar}>
                <span className={styles.bannerSolicitarIcone}>💡</span>
                <div className={styles.bannerSolicitarTexto}>
                  <strong>Precisa de um ícone ou função específica?</strong>
                  <span>Solicite por aqui que fazemos para você sem nenhum custo adicional.</span>
                </div>
                <button className={styles.btnSolicitar} onClick={() => setModalSolicitar(true)}>
                  <MessageCircle size={15} /> Solicitar
                </button>
              </div>
            </div>
          )}

          {/* ── Etapa 4: Configurar dropdowns ─────────────────────────── */}
          {etapa === 4 && (
            <div className={styles.etapa}>
              <div className={styles.etapaPergunta}>
                Cadastre as opções dos campos com menu suspenso
              </div>
              <p className={styles.etapaHint}>
                Esses itens vão aparecer para o funcionário escolher no campo
              </p>

              {blocosSelecionados.filter(b => {
                const def = BLOCOS_DISPONIVEIS.find(d => d.id === b.tipo);
                return def?.temDropdown;
              }).map(b => {
                const def = BLOCOS_DISPONIVEIS.find(d => d.id === b.tipo)!;
                const aberto = blocoEditando === b.uid;
                return (
                  <div key={b.uid} className={styles.dropdownCard}>
                    <button
                      className={styles.dropdownCardHeader}
                      onClick={() => setBlocoEditando(aberto ? null : b.uid)}
                    >
                      <span>{def.icone} {def.nome}</span>
                      <div className={styles.dropdownHeaderRight}>
                        <span className={styles.dropdownCount}>{b.opcoes?.length || 0} opções</span>
                        <MoreHorizontal size={18} />
                      </div>
                    </button>
                    {aberto && (
                      <div className={styles.dropdownCardBody}>
                        <div className={styles.dropdownInputRow}>
                          <input
                            className={styles.dropdownInput}
                            placeholder={`Adicionar opção para ${def.nome}...`}
                            value={novaOpcao}
                            onChange={e => setNovaOpcao(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && adicionarOpcao(b.uid)}
                          />
                          <button className={styles.dropdownAddBtn} onClick={() => adicionarOpcao(b.uid)}>
                            <Plus size={18} />
                          </button>
                        </div>
                        <div className={styles.dropdownOpcoes}>
                          {(b.opcoes || []).map((op, i) => (
                            <div key={i} className={styles.dropdownOpcao}>
                              <span>{op}</span>
                              <button onClick={() => removerOpcao(b.uid, i)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {(b.opcoes?.length || 0) === 0 && (
                            <p className={styles.dropdownVazio}>Nenhuma opção adicionada ainda</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Etapa 5: QR Code ──────────────────────────────────────── */}
          {etapa === 5 && (
            <div className={styles.etapa}>
              <div className={styles.etapaPergunta}>
                Como esse formulário vai ser acessado?
              </div>
              <p className={styles.etapaHint}>
                O QR Code permite abrir o formulário direto pela câmera do celular
              </p>

              <div className={styles.qrOpcoes}>
                <button
                  className={`${styles.qrOpcao} ${qrTipo === 'chave' ? styles.qrOpcaoAtivo : ''}`}
                  onClick={() => setQrTipo('chave')}
                >
                  <QrCode size={32} />
                  <strong>QR Code com Chave</strong>
                  <span>Gera um QR Code com código único — mais seguro</span>
                </button>
                <button
                  className={`${styles.qrOpcao} ${qrTipo === 'publico' ? styles.qrOpcaoAtivo : ''}`}
                  onClick={() => setQrTipo('publico')}
                >
                  <Globe size={32} />
                  <strong>QR Code Público</strong>
                  <span>Qualquer pessoa escaneia, sem precisar de login</span>
                </button>
                <button
                  className={`${styles.qrOpcao} ${qrTipo === 'privado' ? styles.qrOpcaoAtivo : ''}`}
                  onClick={() => setQrTipo('privado')}
                >
                  <Lock size={32} />
                  <strong>QR Code Privado</strong>
                  <span>Só quem está logado no sistema pode acessar</span>
                </button>
                <button
                  className={`${styles.qrOpcao} ${styles.qrOpcaoSistema} ${qrTipo === 'nenhum' ? styles.qrOpcaoAtivo : ''}`}
                  onClick={() => setQrTipo('nenhum')}
                >
                  <SkipForward size={32} />
                  <strong>Acesso pelo Sistema</strong>
                  <span>Sem QR Code — o funcionário abre direto pelo menu do sistema</span>
                </button>
              </div>

              {qrTipo !== 'nenhum' && (
                <div className={styles.qrPreview}>
                  <QRCodeCanvas
                    value={qrTipo === 'chave' ? qrUrl : `${window.location.origin}/manutencao/form?id=preview`}
                    size={160}
                    bgColor="#FFFFFF"
                    fgColor="#0D0D0D"
                    level="H"
                  />
                  {qrTipo === 'chave' && (
                    <div className={styles.qrChave}>
                      🔑 Chave: <strong>{qrChave}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Etapa 6: Revisão ──────────────────────────────────────── */}
          {etapa === 6 && (
            <div className={styles.etapa}>
              <div className={styles.etapaPergunta}>
                Tudo pronto! Confira o resumo
              </div>

              <div className={styles.revisaoCard}>
                <div className={styles.revisaoTile} style={{ background: cor }}>
                  <span style={{ fontSize: 48 }}>{icone}</span>
                  <span style={{ fontSize: 20, fontWeight: 900 }}>{nomeAtual}</span>
                </div>

                <div className={styles.revisaoItens}>
                  <div className={styles.revisaoItem}>
                    <span className={styles.revisaoLabel}>📋 Campos no formulário</span>
                    <span className={styles.revisaoValor}>{blocosSelecionados.length} itens</span>
                  </div>
                  <div className={styles.revisaoItem}>
                    <span className={styles.revisaoLabel}>📱 QR Code</span>
                    <span className={styles.revisaoValor}>
                      {qrTipo === 'nenhum' ? 'Sem QR Code' :
                       qrTipo === 'publico' ? '🌐 Público' :
                       qrTipo === 'privado' ? '🔒 Privado' : `🔑 Com chave (${qrChave})`}
                    </span>
                  </div>
                </div>

                <div className={styles.revisaoBlocos}>
                  {blocosSelecionados.map(b => {
                    const def = BLOCOS_DISPONIVEIS.find(d => d.id === b.tipo)!;
                    return (
                      <span key={b.uid} className={styles.revisaoChip}>
                        {def.icone} {def.nome}
                      </span>
                    );
                  })}
                </div>

                {qrTipo !== 'nenhum' && (
                  <div className={styles.revisaoQr}>
                    <QRCodeCanvas
                      value={qrTipo === 'chave' ? qrUrl : `${window.location.origin}/manutencao/form`}
                      size={130}
                      bgColor="#FFFFFF"
                      fgColor="#0D0D0D"
                      level="H"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com navegação */}
        <div className={styles.wizardFooter}>
          <button className={styles.btnVoltar} onClick={etapa === 1 ? onCancelar : voltar}>
            <ChevronLeft size={18} />
            {etapa === 1 ? 'Cancelar' : 'Voltar'}
          </button>

          <span className={styles.etapaIndicador}>{etapa} de {TOTAL_ETAPAS}</span>

          {etapa < TOTAL_ETAPAS ? (
            <button
              className={styles.btnAvancar}
              onClick={avancar}
              disabled={!podeAvancar()}
            >
              Avançar <ChevronRight size={18} />
            </button>
          ) : (
            <button className={styles.btnConcluir} onClick={concluir}>
              <Check size={18} /> Criar Função
            </button>
          )}
        </div>
      </div>

      {/* Modal preview bloco */}
      {previewBloco && <ModalPreviewBloco blocoId={previewBloco} onFechar={() => setPreviewBloco(null)} />}
    </div>
  );
};

// ── Preview de cada bloco ──────────────────────────────────────────────────
const PREVIEW_EXEMPLOS: Record<string, { titulo: string; conteudo: React.ReactNode }> = {
  titulo: {
    titulo: 'Título',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📝 Título</label>
        <input readOnly value="Manutenção do Ar Condicionado" style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:15, background:'#f9fafb', color:'#111' }} />
      </div>
    ),
  },
  subtitulo: {
    titulo: 'Sub-título',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📄 Sub-título</label>
        <input readOnly value="Sala de reuniões — 3º andar" style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, background:'#f9fafb', color:'#555' }} />
      </div>
    ),
  },
  texto: {
    titulo: 'Texto',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📃 Texto</label>
        <textarea readOnly value="O equipamento apresentou falha no compressor. Necessário substituição da peça e revisão geral do sistema." style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, background:'#f9fafb', color:'#111', minHeight:80, resize:'none' }} />
      </div>
    ),
  },
  descricao: {
    titulo: 'Descrição',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📋 Descrição</label>
        <textarea readOnly value="Descrição detalhada do serviço realizado: Foi feita a troca do filtro, limpeza das serpentinas e recarga de gás R410A. Teste de funcionamento aprovado." style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, background:'#f9fafb', color:'#111', minHeight:100, resize:'none' }} />
      </div>
    ),
  },
  galeria: {
    titulo: 'Galeria de Fotos',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🖼️ Galeria de Fotos</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {['📸','🏗️','🔧','🔩','⚡','🛠️'].map((e, i) => (
            <div key={i} style={{ aspectRatio:'1', background:'#f3f4f6', border:'2px dashed #d1d5db', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{e}</div>
          ))}
        </div>
        <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center' }}>Toque para adicionar fotos</p>
      </div>
    ),
  },
  antes_depois: {
    titulo: 'Antes e Depois',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🔄 Antes e Depois</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
            <div style={{ width:'100%', aspectRatio:'4/3', background:'#fef2f2', border:'2px dashed #fca5a5', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>📷</div>
            <span style={{ fontSize:12, fontWeight:800, color:'#dc2626' }}>ANTES</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
            <div style={{ width:'100%', aspectRatio:'4/3', background:'#f0fdf4', border:'2px dashed #86efac', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>📷</div>
            <span style={{ fontSize:12, fontWeight:800, color:'#16a34a' }}>DEPOIS</span>
          </div>
        </div>
      </div>
    ),
  },
  checklist: {
    titulo: 'Checklist',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>✅ Checklist</label>
        {['Verificar pressão do sistema', 'Limpar filtros', 'Testar funcionamento', 'Registrar temperatura'].map((item, i) => (
          <label key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: i < 2 ? '#f0fdf4' : '#f9fafb', border: i < 2 ? '2px solid #86efac' : '2px solid #e4e4e7', borderRadius:10, cursor:'default' }}>
            <div style={{ width:22, height:22, borderRadius:6, background: i < 2 ? '#16a34a' : '#fff', border: i < 2 ? 'none' : '2px solid #d1d5db', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, fontWeight:900 }}>{i < 2 ? '✓' : ''}</div>
            <span style={{ fontSize:14, fontWeight:600, color:'#111', textDecoration: i < 2 ? 'line-through' : 'none' }}>{item}</span>
          </label>
        ))}
      </div>
    ),
  },
  assinatura: {
    titulo: 'Assinatura Digital',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>✍️ Assinatura Digital</label>
        <div style={{ width:'100%', height:120, background:'#fafafa', border:'2px dashed #d1d5db', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <svg width="180" height="60" viewBox="0 0 180 60"><path d="M10 45 Q30 10 60 35 T110 25 T160 40" fill="none" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round"/></svg>
          <span style={{ position:'absolute', bottom:8, fontSize:10, color:'#aaa' }}>Assine aqui com o dedo ou mouse</span>
        </div>
      </div>
    ),
  },
  status: {
    titulo: 'Status',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🔵 Status</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {[{ v:'Aberta', c:'#455a64' }, { v:'Em Execução', c:'#e65100' }, { v:'Finalizado', c:'#2e7d32' }, { v:'Reaberta', c:'#7b1fa2' }].map((s, i) => (
            <button key={i} style={{ padding:'8px 14px', borderRadius:10, border: i === 1 ? `2px solid ${s.c}` : '2px solid #e4e4e7', background: i === 1 ? s.c : '#f9fafb', color: i === 1 ? '#fff' : '#6b7280', fontSize:13, fontWeight:800, cursor:'default' }}>{s.v}</button>
          ))}
        </div>
      </div>
    ),
  },
  prioridade: {
    titulo: 'Prioridade',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>⚠️ Prioridade</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {[{ v:'Baixa', c:'#2e7d32' }, { v:'Média', c:'#f57c00' }, { v:'Alta', c:'#d84315' }, { v:'Urgente', c:'#b71c1c' }].map((p, i) => (
            <button key={i} style={{ padding:'8px 14px', borderRadius:10, border: i === 2 ? `2px solid ${p.c}` : '2px solid #e4e4e7', background: i === 2 ? p.c : '#f9fafb', color: i === 2 ? '#fff' : '#6b7280', fontSize:13, fontWeight:800, cursor:'default' }}>{p.v}</button>
          ))}
        </div>
      </div>
    ),
  },
  avaliacao_estrela: {
    titulo: 'Avaliação Estrela (1-5)',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>⭐ Avaliação</label>
        <div style={{ display:'flex', gap:6 }}>
          {[1,2,3,4,5].map(n => (
            <span key={n} style={{ fontSize:32, cursor:'default', filter: n <= 4 ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
          ))}
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:'#f57c00' }}>4 de 5 estrelas</span>
      </div>
    ),
  },
  avaliacao_escala: {
    titulo: 'Avaliação Escala (0-10)',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📊 Escala (0-10)</label>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} style={{ width:32, height:32, borderRadius:8, border: n === 8 ? '2px solid #1a73e8' : '2px solid #e4e4e7', background: n === 8 ? '#1a73e8' : '#f9fafb', color: n === 8 ? '#fff' : '#6b7280', fontSize:13, fontWeight:800, cursor:'default' }}>{n}</button>
          ))}
        </div>
      </div>
    ),
  },
  satisfacao: {
    titulo: 'Pesquisa de Satisfação',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>😊 Satisfação</label>
        <div style={{ display:'flex', justifyContent:'space-around' }}>
          {['😡','😕','😐','🙂','😍'].map((e, i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:36, filter: i === 3 ? 'none' : 'grayscale(0.6) opacity(0.5)', cursor:'default' }}>{e}</span>
              <span style={{ fontSize:10, fontWeight:700, color: i === 3 ? '#16a34a' : '#aaa' }}>{['Péssimo','Ruim','Regular','Bom','Ótimo'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  perguntas: {
    titulo: 'Perguntas e Respostas',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>💬 Perguntas e Respostas</label>
        <div style={{ background:'#f0f0ff', border:'2px solid #c7d2fe', borderRadius:12, padding:14 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#4338ca' }}>Qual o problema encontrado?</p>
          <p style={{ margin:'6px 0 0', fontSize:13, color:'#111' }}>Vazamento na tubulação do banheiro do 2º andar.</p>
        </div>
      </div>
    ),
  },
  avisos: {
    titulo: 'Avisos',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🔔 Aviso</label>
        <div style={{ background:'#fffbeb', border:'2px solid #fcd34d', borderRadius:12, padding:14, display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:24 }}>⚠️</span>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#92400e' }}>Área interditada para manutenção. Previsão de conclusão: 48 horas.</p>
        </div>
      </div>
    ),
  },
  comunicados: {
    titulo: 'Comunicados',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📢 Comunicado</label>
        <div style={{ background:'#eff6ff', border:'2px solid #93c5fd', borderRadius:12, padding:14 }}>
          <p style={{ margin:0, fontSize:14, fontWeight:800, color:'#1d4ed8' }}>📢 Manutenção programada</p>
          <p style={{ margin:'6px 0 0', fontSize:13, color:'#111' }}>O elevador social ficará em manutenção no dia 25/03. Use o elevador de serviço.</p>
        </div>
      </div>
    ),
  },
  feedback: {
    titulo: 'Feedback',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>💡 Feedback</label>
        <textarea readOnly value="O serviço foi realizado rapidamente e o técnico foi muito educado. Recomendo!" style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, background:'#f9fafb', color:'#111', minHeight:70, resize:'none' }} />
      </div>
    ),
  },
  documentos: {
    titulo: 'Documentos',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📁 Documentos</label>
        {['📄 Nota fiscal.pdf — 245 KB', '📄 Laudo técnico.pdf — 1.2 MB'].map((d, i) => (
          <div key={i} style={{ padding:'10px 14px', background:'#f9fafb', border:'2px solid #e4e4e7', borderRadius:10, fontSize:13, fontWeight:600, color:'#111' }}>{d}</div>
        ))}
        <button style={{ padding:'10px', background:'#eff6ff', border:'2px dashed #93c5fd', borderRadius:10, fontSize:13, fontWeight:700, color:'#2563eb', cursor:'default' }}>+ Anexar documento</button>
      </div>
    ),
  },
  urgencias: {
    titulo: 'Reportar Urgências',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🚨 Urgência</label>
        <div style={{ background:'#fef2f2', border:'2px solid #fca5a5', borderRadius:12, padding:14 }}>
          <p style={{ margin:0, fontSize:14, fontWeight:900, color:'#dc2626' }}>🚨 URGENTE</p>
          <p style={{ margin:'6px 0 0', fontSize:13, color:'#111' }}>Vazamento de gás detectado na cozinha. Área evacuada e aguardando equipe técnica.</p>
        </div>
      </div>
    ),
  },
  agendar: {
    titulo: 'Agendar Serviço Extra',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📅 Agendamento</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#888' }}>DATA</span>
            <input readOnly value="25/03/2026" style={{ padding:'10px', border:'2px solid #e4e4e7', borderRadius:10, fontSize:14, background:'#f9fafb' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#888' }}>HORA</span>
            <input readOnly value="14:30" style={{ padding:'10px', border:'2px solid #e4e4e7', borderRadius:10, fontSize:14, background:'#f9fafb' }} />
          </div>
        </div>
      </div>
    ),
  },
  controle_ponto: {
    titulo: 'Controle de Ponto',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🕐 Controle de Ponto</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:10, padding:12, textAlign:'center' }}>
            <span style={{ fontSize:10, fontWeight:800, color:'#16a34a' }}>ENTRADA</span>
            <p style={{ margin:'4px 0 0', fontSize:18, fontWeight:900, color:'#111' }}>08:00</p>
          </div>
          <div style={{ background:'#fef2f2', border:'2px solid #fca5a5', borderRadius:10, padding:12, textAlign:'center' }}>
            <span style={{ fontSize:10, fontWeight:800, color:'#dc2626' }}>SAÍDA</span>
            <p style={{ margin:'4px 0 0', fontSize:18, fontWeight:900, color:'#111' }}>17:30</p>
          </div>
        </div>
      </div>
    ),
  },
  sla: {
    titulo: 'SLA — Tempo de Resposta',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>⏰ SLA</label>
        <div style={{ background:'#fffbeb', border:'2px solid #fcd34d', borderRadius:12, padding:14, textAlign:'center' }}>
          <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#92400e' }}>Prazo máximo</p>
          <p style={{ margin:'6px 0 0', fontSize:28, fontWeight:900, color:'#f59e0b' }}>24h</p>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#92400e' }}>Restam 18h 45min</p>
        </div>
      </div>
    ),
  },
  ocorrencia: {
    titulo: 'Informar Ocorrência',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📸 Ocorrência</label>
        <textarea readOnly value="Vidro trincado na janela do hall do 5º andar. Possível impacto externo." style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, background:'#f9fafb', color:'#111', minHeight:60, resize:'none' }} />
        <div style={{ width:80, height:60, background:'#f3f4f6', border:'2px dashed #d1d5db', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📷</div>
      </div>
    ),
  },
  problema: {
    titulo: 'Problema de Manutenção',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🔧 Problema</label>
        <textarea readOnly value="Motor da bomba d'água com ruído anormal e superaquecimento. Necessita troca de rolamento." style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:14, background:'#f9fafb', color:'#111', minHeight:70, resize:'none' }} />
      </div>
    ),
  },
  localizacao: {
    titulo: 'Localização GPS',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📍 Localização GPS</label>
        <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:12, padding:14 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#16a34a' }}>📍 Localização capturada</p>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#111' }}>Rua das Flores, 123 — Centro, São Paulo - SP</p>
          <p style={{ margin:'4px 0 0', fontSize:11, color:'#888' }}>-23.5505, -46.6333</p>
        </div>
      </div>
    ),
  },
  horario_inicial: {
    titulo: 'Horário Inicial',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>▶️ Horário Inicial</label>
        <div style={{ background:'#eff6ff', border:'2px solid #93c5fd', borderRadius:12, padding:14, textAlign:'center' }}>
          <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#2563eb' }}>Início registrado automaticamente</p>
          <p style={{ margin:'6px 0 0', fontSize:24, fontWeight:900, color:'#111' }}>22/03/26, 14:30</p>
        </div>
      </div>
    ),
  },
  horario_final: {
    titulo: 'Horário Final',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>⏹️ Horário Final</label>
        <div style={{ background:'#fef2f2', border:'2px solid #fca5a5', borderRadius:12, padding:14, textAlign:'center' }}>
          <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#dc2626' }}>Fim registrado ao finalizar</p>
          <p style={{ margin:'6px 0 0', fontSize:24, fontWeight:900, color:'#111' }}>22/03/26, 16:45</p>
        </div>
      </div>
    ),
  },
  tempo_total: {
    titulo: 'Tempo Total Percorrido',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>⏱️ Tempo Total</label>
        <div style={{ background:'linear-gradient(135deg,#FFD600,#FF8F00)', borderRadius:12, padding:16, textAlign:'center' }}>
          <p style={{ margin:0, fontSize:12, fontWeight:800, color:'rgba(0,0,0,0.5)' }}>Tempo total de execução</p>
          <p style={{ margin:'6px 0 0', fontSize:32, fontWeight:900, color:'#0D0D0D' }}>02h 15m 30s</p>
        </div>
      </div>
    ),
  },
  vencimento: {
    titulo: 'Agenda de Vencimentos',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>📅 Vencimento</label>
        <div style={{ background:'#fff3e0', border:'2px solid #ffcc80', borderRadius:12, padding:14, textAlign:'center' }}>
          <p style={{ margin:0, fontSize:13, fontWeight:800, color:'#e65100' }}>Vence em</p>
          <p style={{ margin:'4px 0 0', fontSize:28, fontWeight:900, color:'#e65100' }}>5 dias</p>
          <p style={{ margin:'6px 0 0', fontSize:11, color:'#bf360c' }}>Lembretes: 7d, 3d, 1d antes</p>
        </div>
      </div>
    ),
  },
  kilometragem: {
    titulo: 'Kilometragem',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🛣️ Kilometragem</label>
        <input readOnly value="45.230 km" style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:18, fontWeight:900, background:'#f9fafb', color:'#111', textAlign:'center' }} />
      </div>
    ),
  },
  placa: {
    titulo: 'Placa',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🚗 Placa do Veículo</label>
        <input readOnly value="ABC-1D23" style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:20, fontWeight:900, background:'#f9fafb', color:'#111', textAlign:'center', letterSpacing:4 }} />
      </div>
    ),
  },
  modelo: {
    titulo: 'Modelo',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🚙 Modelo do Veículo</label>
        <input readOnly value="Fiat Strada Freedom 1.3" style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:15, background:'#f9fafb', color:'#111' }} />
      </div>
    ),
  },
  cor_veiculo: {
    titulo: 'Cor do Veículo',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🎨 Cor do Veículo</label>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[{ n:'Branco', c:'#f5f5f5' }, { n:'Preto', c:'#222' }, { n:'Prata', c:'#bbb' }, { n:'Vermelho', c:'#dc2626' }].map((cor, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', border: i === 0 ? '2px solid #1a73e8' : '2px solid #e4e4e7', borderRadius:10, cursor:'default' }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background: cor.c, border:'1px solid #ddd' }} />
              <span style={{ fontSize:13, fontWeight:700, color:'#111' }}>{cor.n}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  tipo_veiculo: {
    titulo: 'Tipo de Veículo',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🚛 Tipo de Veículo</label>
        <select disabled style={{ padding:'12px 14px', border:'2px solid #e4e4e7', borderRadius:12, fontSize:15, background:'#f9fafb', color:'#111' }}>
          <option>Caminhonete</option>
          <option>Sedan</option>
          <option>Caminhão</option>
        </select>
      </div>
    ),
  },
  edicao_imagem: {
    titulo: 'Edição de Imagem',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>🖊️ Edição de Imagem</label>
        <div style={{ position:'relative', width:'100%', aspectRatio:'4/3', background:'#f3f4f6', borderRadius:14, border:'2px solid #e4e4e7', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {/* Imagem de fundo simulada */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #e8eaed 25%, #d1d5db 50%, #e8eaed 75%)', opacity:0.5 }} />
          <span style={{ fontSize:40, position:'absolute', top:'20%', left:'30%' }}>🏗️</span>
          {/* Círculo vermelho */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 200 150">
            <ellipse cx="120" cy="55" rx="35" ry="25" fill="none" stroke="#ef4444" strokeWidth="3" />
            {/* Seta apontando */}
            <line x1="50" y1="120" x2="90" y2="70" stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrowPrev)" />
            <defs><marker id="arrowPrev" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6"/></marker></defs>
            {/* Texto de anotação */}
            <text x="20" y="138" fill="#ef4444" fontSize="11" fontWeight="bold">Verificar aqui!</text>
          </svg>
        </div>
        {/* Barra de ferramentas simulada */}
        <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
          {[
            { icone:'✏️', label:'Desenho' },
            { icone:'↗', label:'Seta' },
            { icone:'T', label:'Texto' },
            { icone:'▭', label:'Retângulo' },
            { icone:'○', label:'Círculo' },
            { icone:'⌫', label:'Borracha' },
          ].map((f, i) => (
            <div key={i} style={{ padding:'6px 10px', background: i === 4 ? '#1a73e8' : '#f3f4f6', color: i === 4 ? '#fff' : '#374151', borderRadius:8, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:4, border: i === 4 ? 'none' : '1px solid #e4e4e7' }}>
              <span>{f.icone}</span> {f.label}
            </div>
          ))}
        </div>
        <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center' }}>Tire uma foto e marque detalhes com seta, círculo, texto e mais</p>
      </div>
    ),
  },
  servicos_valores: {
    titulo: 'Serviços e Valores',
    conteudo: (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:800, color:'#6b7280', textTransform:'uppercase' }}>💰 Serviços e Valores</label>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#6b7280' }}>Mostrar preços</span>
          <div style={{ width:42, height:22, borderRadius:12, background:'#0D47A1', position:'relative' }}>
            <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:22, transition:'left 0.2s' }} />
          </div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, border:'1px solid #e4e4e7', borderRadius:10, overflow:'hidden' }}>
          <thead>
            <tr style={{ background:'#0D47A1', color:'#fff' }}>
              <th style={{ padding:'6px 8px', textAlign:'left', fontSize:10, fontWeight:800 }}>Qtd</th>
              <th style={{ padding:'6px 8px', textAlign:'left', fontSize:10, fontWeight:800 }}>Descrição</th>
              <th style={{ padding:'6px 8px', textAlign:'right', fontSize:10, fontWeight:800 }}>Preço Un.</th>
              <th style={{ padding:'6px 8px', textAlign:'right', fontSize:10, fontWeight:800 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom:'1px solid #e4e4e7' }}>
              <td style={{ padding:'6px 8px' }}>2</td>
              <td style={{ padding:'6px 8px' }}>Troca de rolamento</td>
              <td style={{ padding:'6px 8px', textAlign:'right' }}>R$ 85,00</td>
              <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700 }}>R$ 170,00</td>
            </tr>
            <tr style={{ borderBottom:'1px solid #e4e4e7' }}>
              <td style={{ padding:'6px 8px' }}>1</td>
              <td style={{ padding:'6px 8px' }}>Mão de obra</td>
              <td style={{ padding:'6px 8px', textAlign:'right' }}>R$ 250,00</td>
              <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700 }}>R$ 250,00</td>
            </tr>
            <tr style={{ background:'#f0f4ff', fontWeight:900 }}>
              <td colSpan={3} style={{ padding:'8px', textAlign:'right', color:'#0D47A1', fontSize:11 }}>TOTAL</td>
              <td style={{ padding:'8px', textAlign:'right', color:'#0D47A1', fontSize:14, fontWeight:900 }}>R$ 420,00</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center' }}>Tabela de serviços com preços — toggle para ativar/desativar valores</p>
      </div>
    ),
  },
};

const ModalPreviewBloco: React.FC<{ blocoId: string; onFechar: () => void }> = ({ blocoId, onFechar }) => {
  const preview = PREVIEW_EXEMPLOS[blocoId];
  const def = BLOCOS_DISPONIVEIS.find(b => b.id === blocoId);
  if (!preview || !def) return null;

  return (
    <div onClick={onFechar} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:24, padding:24, width:'100%', maxWidth:420, boxShadow:'0 24px 80px rgba(0,0,0,0.3)', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:28 }}>{def.icone}</span>
            <div>
              <h3 style={{ margin:0, fontSize:17, fontWeight:900, color:'#0D0D0D' }}>{preview.titulo}</h3>
              <p style={{ margin:'2px 0 0', fontSize:12, color:'#9ca3af' }}>{def.descricao}</p>
            </div>
          </div>
          <button onClick={onFechar} style={{ background:'#f3f4f6', border:'none', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#6b7280' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ background:'#fafafa', border:'2px solid #e4e4e7', borderRadius:16, padding:18 }}>
          <p style={{ margin:'0 0 12px', fontSize:10, fontWeight:800, color:'#FF8F00', textTransform:'uppercase', letterSpacing:1 }}>Exemplo de como aparece no formulário</p>
          {preview.conteudo}
        </div>

        <button onClick={onFechar} style={{ width:'100%', marginTop:16, padding:'12px', background:'linear-gradient(135deg,#FFD600,#FF8F00)', border:'none', borderRadius:12, fontSize:14, fontWeight:900, color:'#0D0D0D', cursor:'pointer' }}>
          Fechar
        </button>
      </div>
    </div>
  );
};

export default WizardCriar;
