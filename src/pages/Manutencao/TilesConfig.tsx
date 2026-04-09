import React, { useState, useCallback } from 'react';
import { Settings, X, RotateCcw, Plus, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { PinConfig } from '../../components/PinProtecao';
import css from './TilesConfig.module.css';

/* ══════════════════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════════════════ */
export type LayoutTipo = 'simples' | 'glass' | 'bento' | 'list' | 'dock' | 'dash';

export interface CardCor {
  bg: string;
  bg2: string;
  texto: string;
  grad: boolean;
}

export interface TilesPrefs {
  layout: LayoutTipo;
  cores: CardCor[];       // 5 cards fixos
  presetAtivo: string;
}

interface TileFixo {
  id: string;
  icone: string | React.ReactNode;
  nome: string;
  desc: string;
  acao: string;
}

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'sm_tiles_prefs';
const VISIBILITY_KEY = 'sm_tiles_ocultos_master';

/* IDs dos tiles fixos que o master pode ocultar */
const TILE_VISIBILITY_OPTIONS = [
  { id: 'personalizar', label: '➕ Personalizar Manutenção' },
  { id: 'livre',        label: '📋 Manutenção Livre' },
  { id: 'checklist',    label: '📝 Checklist' },
  { id: 'os',           label: '📋 Ordem de Serviço' },
  { id: 'funcionarios', label: '👥 Funcionários' },
  { id: 'maquinas',     label: '⚙️ Cadastro de Máquinas' },
  { id: 'custom',       label: '🎨 Manutenções Personalizadas' },
];

export function carregarTilesOcultos(): string[] {
  try { return JSON.parse(localStorage.getItem(VISIBILITY_KEY) || '[]'); } catch { return []; }
}

export function salvarTilesOcultos(ids: string[]) {
  localStorage.setItem(VISIBILITY_KEY, JSON.stringify(ids));
}

const LAYOUTS: { id: LayoutTipo; nome: string }[] = [
  { id: 'simples', nome: 'Simples' },
  { id: 'glass',   nome: 'Glass\nScroll' },
  { id: 'bento',   nome: 'Bento\nGrid' },
  { id: 'list',    nome: 'Lista\nElegante' },
  { id: 'dock',    nome: 'Dock\nIcons' },
  { id: 'dash',    nome: 'Dashboard\nCards' },
];

const CORES_PADRAO: CardCor[] = [
  { bg: '#FFD600', bg2: '#FF8F00', texto: '#0D0D0D', grad: true },   // Personalizar
  { bg: '#1565C0', bg2: '#0D47A1', texto: '#ffffff', grad: true },   // Manut. Livre
  { bg: '#2E7D32', bg2: '#1B5E20', texto: '#ffffff', grad: true },   // Checklist
  { bg: '#E65100', bg2: '#BF360C', texto: '#ffffff', grad: true },   // OS
  { bg: '#4A148C', bg2: '#311B92', texto: '#ffffff', grad: true },   // Funcionários
];

const PRESETS: Record<string, { nome: string; dots: string[]; cores: CardCor[] }> = {
  simples: {
    nome: 'Simples',
    dots: ['#FFD600', '#1565C0', '#E65100'],
    cores: [
      { bg: '#FFD600', bg2: '#FF8F00', texto: '#0D0D0D', grad: true },   // Personalizar
      { bg: '#1565C0', bg2: '#0D47A1', texto: '#ffffff', grad: true },   // Manut. Livre
      { bg: '#2E7D32', bg2: '#1B5E20', texto: '#ffffff', grad: true },   // Checklist
      { bg: '#E65100', bg2: '#BF360C', texto: '#ffffff', grad: true },   // OS
      { bg: '#4A148C', bg2: '#311B92', texto: '#ffffff', grad: true },   // Funcionários
    ],
  },
  original: {
    nome: 'Original',
    dots: ['#FFD600', '#0D0D0D', '#FF8F00'],
    cores: [
      { bg: '#FFD600', bg2: '#FF8F00', texto: '#0D0D0D', grad: true },   // Personalizar
      { bg: '#0D0D0D', bg2: '#1A1A1A', texto: '#FFD600', grad: false },  // Manut. Livre
      { bg: '#FF8F00', bg2: '#E65100', texto: '#0D0D0D', grad: true },   // Checklist
      { bg: '#1A1A1A', bg2: '#0D0D0D', texto: '#FF8F00', grad: true },   // OS
      { bg: '#FFD600', bg2: '#FFC107', texto: '#0D0D0D', grad: true },   // Funcionários
    ],
  },
  oceano: {
    nome: 'Oceano',
    dots: ['#6366f1', '#0ea5e9', '#06b6d4'],
    cores: [
      { bg: '#6366f1', bg2: '#4f46e5', texto: '#ffffff', grad: true },
      { bg: '#0f172a', bg2: '#1a1a2e', texto: '#22d3ee', grad: false },
      { bg: '#0ea5e9', bg2: '#0284c7', texto: '#ffffff', grad: true },
      { bg: '#1e293b', bg2: '#0f172a', texto: '#a5b4fc', grad: true },
      { bg: '#06b6d4', bg2: '#0891b2', texto: '#ffffff', grad: true },
    ],
  },
  aurora: {
    nome: 'Aurora',
    dots: ['#8b5cf6', '#ec4899', '#c026d3'],
    cores: [
      { bg: '#8b5cf6', bg2: '#7c3aed', texto: '#ffffff', grad: true },
      { bg: '#1a1025', bg2: '#120a1a', texto: '#e879f9', grad: false },
      { bg: '#ec4899', bg2: '#db2777', texto: '#ffffff', grad: true },
      { bg: '#1a1025', bg2: '#0f0815', texto: '#c4b5fd', grad: true },
      { bg: '#c026d3', bg2: '#a21caf', texto: '#ffffff', grad: true },
    ],
  },
  fogo: {
    nome: 'Fogo',
    dots: ['#f59e0b', '#ef4444', '#ea580c'],
    cores: [
      { bg: '#f59e0b', bg2: '#d97706', texto: '#1c1210', grad: true },
      { bg: '#1c1210', bg2: '#120c0a', texto: '#fbbf24', grad: false },
      { bg: '#ef4444', bg2: '#dc2626', texto: '#ffffff', grad: true },
      { bg: '#1c1210', bg2: '#120c0a', texto: '#f59e0b', grad: true },
      { bg: '#ea580c', bg2: '#c2410c', texto: '#ffffff', grad: true },
    ],
  },
  esmeralda: {
    nome: 'Esmeralda',
    dots: ['#10b981', '#3b82f6', '#14b8a6'],
    cores: [
      { bg: '#10b981', bg2: '#059669', texto: '#ffffff', grad: true },
      { bg: '#0a1a14', bg2: '#061210', texto: '#34d399', grad: false },
      { bg: '#3b82f6', bg2: '#2563eb', texto: '#ffffff', grad: true },
      { bg: '#0f1f1a', bg2: '#0a1510', texto: '#6ee7b7', grad: true },
      { bg: '#14b8a6', bg2: '#0d9488', texto: '#ffffff', grad: true },
    ],
  },
  obsidian: {
    nome: 'Obsidian',
    dots: ['#f1f5f9', '#64748b', '#334155'],
    cores: [
      { bg: '#f1f5f9', bg2: '#cbd5e1', texto: '#0f172a', grad: true },
      { bg: '#0f172a', bg2: '#1a1a2e', texto: '#e2e8f0', grad: false },
      { bg: '#334155', bg2: '#1e293b', texto: '#e2e8f0', grad: true },
      { bg: '#1e293b', bg2: '#0f172a', texto: '#cbd5e1', grad: true },
      { bg: '#64748b', bg2: '#475569', texto: '#ffffff', grad: true },
    ],
  },
  sunrise: {
    nome: 'Sunrise',
    dots: ['#fbbf24', '#0ea5e9', '#38bdf8'],
    cores: [
      { bg: '#fbbf24', bg2: '#f59e0b', texto: '#0c1220', grad: true },
      { bg: '#0c1220', bg2: '#0a0e1a', texto: '#fbbf24', grad: false },
      { bg: '#0ea5e9', bg2: '#0284c7', texto: '#ffffff', grad: true },
      { bg: '#0c4a6e', bg2: '#0c1a30', texto: '#7dd3fc', grad: true },
      { bg: '#38bdf8', bg2: '#0ea5e9', texto: '#0c1220', grad: true },
    ],
  },
};

const PREFS_PADRAO: TilesPrefs = {
  layout: 'simples',
  cores: CORES_PADRAO,
  presetAtivo: 'simples',
};

const TILES_FIXOS: TileFixo[] = [
  { id: 'personalizar', icone: '➕', nome: 'Personalizar Manutenção', desc: 'Crie campos e categorias', acao: '+ Criar' },
  { id: 'livre',        icone: '📋', nome: 'Manutenção Livre',       desc: 'Registro rápido sem template', acao: '+ Registrar' },
  { id: 'checklist',    icone: '📝', nome: 'Checklist',              desc: 'Listas de verificação', acao: '+ Acessar' },
  { id: 'os',           icone: '📋', nome: 'Ordem de Serviço',       desc: 'Gerencie ordens de serviço', acao: '+ Abrir' },
  { id: 'funcionarios', icone: '👥', nome: 'Funcionários',           desc: 'Equipes e tarefas', acao: '+ Acessar' },
];

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════ */
function carregarPrefs(): TilesPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return PREFS_PADRAO;
    const p = JSON.parse(raw) as Record<string, unknown>;
    const layoutRaw = (p.layout as string) || 'simples';
    let layoutValido: LayoutTipo = 'simples';
    if (layoutRaw !== 'grid' && ['simples','glass','bento','list','dock','dash'].includes(layoutRaw)) {
      layoutValido = layoutRaw as LayoutTipo;
    }
    return {
      layout: layoutValido,
      cores: Array.isArray(p.cores) && p.cores.length === 5 ? p.cores : CORES_PADRAO,
      presetAtivo: (p.presetAtivo as string) || 'original',
    };
  } catch { return PREFS_PADRAO; }
}

function salvarPrefs(p: TilesPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function bgStyle(c: CardCor) {
  return c.grad ? `linear-gradient(145deg, ${c.bg}, ${c.bg2})` : c.bg;
}

function isLight(hex: string) {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.substring(0, 2), 16);
  const g = Number.parseInt(h.substring(2, 4), 16);
  const b = Number.parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ══════════════════════════════════════════════════════════════════════════
   HOOK — usar em ManutencaoPage
══════════════════════════════════════════════════════════════════════════ */
export function useTilesPrefs() {
  const [prefs, setPrefs] = useState<TilesPrefs>(carregarPrefs);

  const atualizar = useCallback((update: Partial<TilesPrefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...update };
      salvarPrefs(next);
      return next;
    });
  }, []);

  return { prefs, atualizar };
}

/* ══════════════════════════════════════════════════════════════════════════
   BOTÃO ENGRENAGEM
══════════════════════════════════════════════════════════════════════════ */
export function GearButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button className={css.gearBtn} onClick={onClick} title="Configurar layout e cores">
      <Settings size={18} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL DE CONFIGURAÇÃO
══════════════════════════════════════════════════════════════════════════ */
export function TilesConfigModal({
  prefs,
  onUpdate,
  onClose,
  isMaster,
}: Readonly<{
  prefs: TilesPrefs;
  onUpdate: (p: Partial<TilesPrefs>) => void;
  onClose: () => void;
  isMaster?: boolean;
}>) {
  const [local, setLocal] = useState<TilesPrefs>({ ...prefs, cores: prefs.cores.map(c => ({ ...c })) });
  const [ocultos, setOcultos] = useState<string[]>(carregarTilesOcultos);

  const setLayout = (l: LayoutTipo) => {
    setLocal(prev => ({ ...prev, layout: l }));
  };

  const aplicarPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setLocal(prev => ({
      ...prev,
      cores: preset.cores.map(c => ({ ...c })),
      presetAtivo: key,
    }));
  };

  const setCor = (idx: number, campo: keyof CardCor, valor: string | boolean) => {
    setLocal(prev => {
      const novas = prev.cores.map(c => ({ ...c }));
      (novas[idx] as Record<string, string | boolean>)[campo] = valor;
      return { ...prev, cores: novas, presetAtivo: '' };
    });
  };

  const salvar = () => {
    onUpdate(local);
    if (isMaster) salvarTilesOcultos(ocultos); // isMaster aqui = master ou admin
    onClose();
  };

  const toggleOculto = (id: string) => {
    setOcultos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const resetar = () => {
    setLocal({ ...PREFS_PADRAO, cores: PREFS_PADRAO.cores.map(c => ({ ...c })) });
  };

  return (
    <div className={css.cfgOverlay} role="dialog" aria-modal="true" aria-label="Configurar layout e cores">
      <button type="button" className={css.cfgBackdrop} onClick={onClose} onKeyDown={e => e.key === 'Escape' && onClose()} aria-label="Fechar configuração" tabIndex={-1} />
      <div className={css.cfgModal}>        <div className={css.cfgHeader}>
          <span className={css.cfgTitulo}>
            <Settings size={20} /> Configurar Layout
          </span>
          <button className={css.cfgFechar} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={css.cfgBody}>
          {/* Layout */}
          <div className={css.cfgSecao}>
            <span className={css.cfgSecaoTitulo}>Escolha o Layout</span>
            <div className={css.cfgLayouts}>
              {LAYOUTS.map(l => (
                <button
                  key={l.id}
                  className={`${css.cfgLayoutBtn} ${local.layout === l.id ? css.cfgLayoutAtivo : ''}`}
                  onClick={() => setLayout(l.id)}
                >
                  <div className={css.cfgLayoutMini}>
                    {l.id === 'simples' && (
                      <div className={css.miniSimples}>
                        <span /><span /><span /><span /><span />
                      </div>
                    )}
                    {l.id === 'glass' && (
                      <div className={css.miniGlass}>
                        <span /><span /><span /><span />
                      </div>
                    )}
                    {l.id === 'bento' && (
                      <div className={css.miniBento}>
                        <span /><span /><span />
                      </div>
                    )}
                    {l.id === 'list' && (
                      <div className={css.miniList}>
                        <span /><span /><span /><span />
                      </div>
                    )}
                    {l.id === 'dock' && (
                      <div className={css.miniDock}>
                        <span /><span /><span /><span /><span />
                      </div>
                    )}
                    {l.id === 'dash' && (
                      <div className={css.miniDash}>
                        <span /><span /><span /><span /><span />
                      </div>
                    )}
                  </div>
                  <span className={css.cfgLayoutNome}>{l.nome.split('\n').map((t, i) => <React.Fragment key={`${l.id}-${t}`}>{i > 0 && <br />}{t}</React.Fragment>)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className={css.cfgSecao}>
            <span className={css.cfgSecaoTitulo}>Paletas de Cores</span>
            <div className={css.cfgPresets}>
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  className={`${css.cfgPresetBtn} ${local.presetAtivo === key ? css.cfgPresetAtivo : ''}`}
                  onClick={() => aplicarPreset(key)}
                >
                  {p.dots.map((d) => (
                    <span key={d} className={css.cfgPresetDot} style={{ background: d }} />
                  ))}
                  <span className={css.cfgPresetNome}>{p.nome}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cores individuais */}
          <div className={css.cfgSecao}>
            <span className={css.cfgSecaoTitulo}>Cores dos Cards</span>
            <div className={css.cfgCards}>
              {TILES_FIXOS.map((tile, i) => (
                <div key={tile.id} className={css.cfgCardRow}>
                  <div className={css.cfgCardInfo}>
                    <span className={css.cfgCardDot} style={{ background: bgStyle(local.cores[i]), color: local.cores[i].texto }}>
                      {typeof tile.icone === 'string' ? tile.icone : ''}
                    </span>
                    <span className={css.cfgCardNome}>{tile.nome}</span>
                  </div>
                  <div className={css.cfgColorPickers}>
                    <div className={css.cfgColorField}>
                      <span className={css.cfgColorLabel}>Fundo</span>
                      <input type="color" className={css.cfgColorInput} value={local.cores[i].bg} onChange={e => setCor(i, 'bg', e.target.value)} />
                    </div>
                    {local.cores[i].grad && (
                      <div className={css.cfgColorField}>
                        <span className={css.cfgColorLabel}>Fundo 2</span>
                        <input type="color" className={css.cfgColorInput} value={local.cores[i].bg2} onChange={e => setCor(i, 'bg2', e.target.value)} />
                      </div>
                    )}
                    <div className={css.cfgColorField}>
                      <span className={css.cfgColorLabel}>Texto</span>
                      <input type="color" className={css.cfgColorInput} value={local.cores[i].texto} onChange={e => setCor(i, 'texto', e.target.value)} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#9ca3af', cursor: 'pointer' }}>
                      <input type="checkbox" checked={local.cores[i].grad} onChange={e => setCor(i, 'grad', e.target.checked)} style={{ accentColor: '#FFD600' }} />{' '}
                      Grad
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visibilidade dos tiles (só master) */}
          {isMaster && (
            <div className={css.cfgSecao}>
              <span className={css.cfgSecaoTitulo}>👁️ Visibilidade para Usuários</span>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 10px', lineHeight: 1.5 }}>
                Oculte seções que os usuários não precisam ver. Tiles ocultos ficam invisíveis para todos exceto o Master.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TILE_VISIBILITY_OPTIONS.map(opt => {
                  const visivel = !ocultos.includes(opt.id);
                  return (
                    <button key={opt.id} type="button" onClick={() => toggleOculto(opt.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        border: `1.5px solid ${visivel ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        background: visivel ? '#f0fdf4' : '#fef2f2',
                        transition: 'all 0.2s',
                      }}>
                      {visivel
                        ? <Eye size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                        : <EyeOff size={16} style={{ color: '#dc2626', flexShrink: 0 }} />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: visivel ? '#15803d' : '#991b1b', flex: 1, textAlign: 'left' }}>
                        {opt.label}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: visivel ? '#16a34a' : '#dc2626', background: visivel ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: 6 }}>
                        {visivel ? 'VISÍVEL' : 'OCULTO'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PIN de Proteção */}
          {isMaster && (
            <div className={css.cfgSecao}>
              <span className={css.cfgSecaoTitulo}>🔒 PIN de Proteção</span>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 10px', lineHeight: 1.5 }}>
                Defina um PIN de 4 dígitos para proteger ações de edição e exclusão.
              </p>
              <PinConfig />
            </div>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className={css.cfgResetBtn} onClick={resetar} style={{ flex: 1 }}>
              <RotateCcw size={14} /> Resetar Padrão
            </button>
            <button
              onClick={salvar}
              style={{
                flex: 2, padding: '12px 20px', border: 'none', borderRadius: 12,
                background: 'linear-gradient(135deg, #FFD600, #FF8F00)',
                color: '#0D0D0D', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(255,183,0,0.3)',
              }}
            >
              ✓ Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   RENDERIZADORES DE TILES POR LAYOUT
══════════════════════════════════════════════════════════════════════════ */

interface TileRenderProps {
  readonly idx: number;
  readonly cor: CardCor;
  readonly icone: React.ReactNode;
  readonly nome: string;
  readonly acao: string;
  readonly desc: string;
  readonly onClick: () => void;
  readonly onHelp?: () => void;
}

/* Renderiza um tile no layout Glass Scroll */
function TileGlass({ idx: _idx, cor, icone, nome, acao, desc: _desc, onClick, onHelp }: TileRenderProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button className={css.tileGlass} style={{
        background: cor.grad
          ? `linear-gradient(160deg, ${hexToRgba(cor.bg, 0.18)}, ${hexToRgba(cor.bg2, 0.08)})`
          : hexToRgba(cor.bg, 0.12),
        borderColor: hexToRgba(cor.bg, 0.12),
        color: cor.grad ? cor.bg : cor.texto,
      }} onClick={onClick}>
        <div className={css.tileGlassGlow} style={{ background: cor.bg }} />
        <span className={css.tileGlassIcone} style={{
          background: hexToRgba(cor.bg, 0.12),
          borderColor: hexToRgba(cor.bg, 0.18),
        }}>{icone}</span>
        <span className={css.tileGlassNome}>{nome}</span>
        <span className={css.tileGlassAction} style={{
          background: hexToRgba(cor.bg, 0.12),
          borderColor: hexToRgba(cor.bg, 0.18),
        }}>{acao}</span>
      </button>
      {onHelp && (
        <button onClick={e => { e.stopPropagation(); onHelp(); }} className={css.tileHelp}
          style={{ background: hexToRgba(cor.bg, 0.15), borderColor: hexToRgba(cor.bg, 0.25), color: cor.bg }}>?</button>
      )}
    </div>
  );
}

/* Renderiza um tile no layout Grid (original) */
function TileGrid({ idx: _idx, cor, icone, nome, acao, desc: _desc, onClick, onHelp }: TileRenderProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        style={{
          background: bgStyle(cor), color: cor.texto, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '32px 16px 24px', border: 'none', borderRadius: 20,
          cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.2s',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', height: 190,
          position: 'relative', overflow: 'hidden', fontFamily: 'inherit',
        }}
        onClick={onClick}
      >
        <span style={{ fontSize: 52, lineHeight: 1, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))', position: 'relative', zIndex: 1 }}>{icone}</span>
        <span style={{ fontSize: 16, fontWeight: 900, textAlign: 'center', lineHeight: 1.3, letterSpacing: 0.2, position: 'relative', zIndex: 1 }}>{nome}</span>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontSize: 11, fontWeight: 800, background: 'rgba(0,0,0,0.15)', padding: '6px 14px',
          borderRadius: 20, letterSpacing: 0.8, textTransform: 'uppercase' as const,
          position: 'relative', zIndex: 1, minWidth: 100,
        }}><Plus size={14} /> {acao.replace('+ ', '')}</span>
      </button>
      {onHelp && (
        <button onClick={e => { e.stopPropagation(); onHelp(); }} className={css.tileHelp}
          style={{ background: isLight(cor.bg) ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)',
                   borderColor: isLight(cor.bg) ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)',
                   color: cor.texto }}>?</button>
      )}
    </div>
  );
}

/* Renderiza um tile no layout Bento */
function TileBento({ idx, cor, icone, nome, desc, acao, onClick, onHelp }: TileRenderProps) {
  const isBig = idx === 0;
  return (
    <div style={{ position: 'relative' }} className={isBig ? css.tileBentoBig : ''}>
      <button className={css.tileBento} style={{ background: bgStyle(cor), color: cor.texto }} onClick={onClick}>
        <div className={css.tileBentoTop}>
          <span className={css.tileBentoIcone} style={{ background: isLight(cor.bg) && !cor.grad ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)' }}>{icone}</span>
          {onHelp && (
            <button onClick={e => { e.stopPropagation(); onHelp(); }} className={css.tileHelp}
              style={{ position: 'static', background: isLight(cor.bg) ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                       borderColor: isLight(cor.bg) ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)', color: cor.texto }}>?</button>
          )}
        </div>
        <span className={css.tileBentoNome}>{nome}</span>
        {isBig && <span className={css.tileBentoDesc}>{desc}</span>}
        <span className={css.tileBentoBtn} style={{ color: cor.texto }}>{acao}</span>
        {!isBig && <div className={css.tileBentoStripe} style={{ background: cor.texto, opacity: 0.4 }} />}
      </button>
    </div>
  );
}

/* Renderiza um tile no layout Lista */
function TileList({ idx: _idx, cor, icone, nome, acao: _acao, desc, onClick, onHelp }: TileRenderProps) {
  return (
    <button className={css.tileList} style={{ background: `linear-gradient(90deg, ${hexToRgba(cor.bg, 0.1)}, transparent)` }} onClick={onClick}>
      <div className={css.tileListBar} style={{ background: cor.bg }} />
      <span className={css.tileListIcone} style={{ background: hexToRgba(cor.bg, 0.15), color: cor.bg }}>{icone}</span>
      <div className={css.tileListInfo}>
        <div className={css.tileListNome} style={{ color: cor.bg }}>{nome}</div>
        <div className={css.tileListDesc}>{desc}</div>
      </div>
      <div className={css.tileListArrow}><ChevronRight size={16} /></div>
      {onHelp && (
        <button onClick={e => { e.stopPropagation(); onHelp(); }} className={css.tileHelp}
          style={{ background: hexToRgba(cor.bg, 0.15), borderColor: hexToRgba(cor.bg, 0.25), color: cor.bg }}>?</button>
      )}
    </button>
  );
}

/* Renderiza um tile no layout Dock */
function TileDock({ idx: _idx, cor, icone, nome, acao: _acao, desc: _desc, onClick, onHelp: _onHelp }: TileRenderProps) {
  return (
    <button className={css.tileDock} onClick={onClick}>
      <span className={css.tileDockIcone} style={{ background: bgStyle(cor), color: isLight(cor.bg) ? '#0D0D0D' : '#fff' }}>{icone}</span>
      <span className={css.tileDockNome} style={{ color: cor.bg }}>{nome}</span>
      <span className={css.tileDockDot} style={{ background: cor.bg }} />
    </button>
  );
}

/* Renderiza um tile no layout Dashboard */
function TileDash({ idx: _idx, cor, icone, nome, acao, desc: _desc, onClick, onHelp }: TileRenderProps) {
  return (
    <button className={css.tileDash} style={{ borderColor: hexToRgba(cor.bg, 0.15) }} onClick={onClick}>
      <div className={css.tileDashRibbon} style={{ background: bgStyle(cor) }} />
      <span className={css.tileDashIcone} style={{ background: hexToRgba(cor.bg, 0.12), color: cor.bg }}>{icone}</span>
      <span className={css.tileDashNome} style={{ color: cor.bg }}>{nome}</span>
      <span className={css.tileDashAction}>{acao} →</span>
      {onHelp && (
        <button onClick={e => { e.stopPropagation(); onHelp(); }} className={css.tileHelp}
          style={{ background: hexToRgba(cor.bg, 0.12), borderColor: hexToRgba(cor.bg, 0.2), color: cor.bg }}>?</button>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — Renderiza os tiles no layout escolhido
══════════════════════════════════════════════════════════════════════════ */
export interface TileAction {
  icone: React.ReactNode;
  nome: string;
  desc: string;
  acao: string;
  onClick: () => void;
  onHelp?: () => void;
  visivel: boolean;
}

export function TilesRenderer({
  tiles,
  prefs,
}: Readonly<{
  tiles: TileAction[];
  prefs: TilesPrefs;
}>) {
  const { layout, cores } = prefs;
  const visibles = tiles.filter(t => t.visivel);

  const renderTile = (tile: TileAction, idx: number) => {
    const cor = cores[idx] || CORES_PADRAO[idx] || CORES_PADRAO[0];
    const props: TileRenderProps = {
      idx,
      cor,
      icone: tile.icone,
      nome: tile.nome,
      desc: tile.desc,
      acao: tile.acao,
      onClick: tile.onClick,
      onHelp: tile.onHelp,
    };

    switch (layout) {
      case 'glass': return <TileGlass key={idx} {...props} />;
      case 'bento': return <TileBento key={idx} {...props} />;
      case 'list':  return <TileList  key={idx} {...props} />;
      case 'dock':  return <TileDock  key={idx} {...props} />;
      case 'dash':  return <TileDash  key={idx} {...props} />;
      default:      return <TileGrid  key={idx} {...props} />;
    }
  };

  const containerClass = {
    simples: '',
    glass: css.tilesGlass,
    bento: css.tilesBento,
    list: css.tilesList,
    dock: css.tilesDock,
    dash: css.tilesDash,
  }[layout] || '';

  // For 'simples' we re-use the existing tilesGrid class from parent
  if (layout === 'simples') {
    return <>{visibles.map((t, i) => renderTile(t, i))}</>;
  }

  return (
    <div className={containerClass}>
      {visibles.map((t, i) => renderTile(t, i))}
    </div>
  );
}
