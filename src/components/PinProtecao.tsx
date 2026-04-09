import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PIN de Proteção (4 dígitos) — Edição / Exclusão
   localStorage key: sm_pin_protecao
   ═══════════════════════════════════════════════════════════════ */

const LS_PIN = 'sm_pin_protecao';

/** Verifica se já existe um PIN definido */
export function pinDefinido(): boolean {
  return !!(localStorage.getItem(LS_PIN) || '').trim();
}

/** Salva o PIN */
function salvarPin(pin: string) {
  localStorage.setItem(LS_PIN, pin);
}

/** Verifica se o PIN digitado está correto */
function verificarPin(pin: string): boolean {
  return pin === (localStorage.getItem(LS_PIN) || '');
}

/* ── Hook: usePin ─────────────────────────────────────────────── */

type PinCallback = () => void;

export function usePin() {
  const [aberto, setAberto] = useState(false);
  const callbackRef = useRef<PinCallback | null>(null);

  /** Solicita PIN antes de executar a ação */
  const pedirPin = useCallback((acao: PinCallback) => {
    if (!pinDefinido()) {
      // Sem PIN configurado — executa direto
      acao();
      return;
    }
    callbackRef.current = acao;
    setAberto(true);
  }, []);

  const onSucesso = useCallback(() => {
    setAberto(false);
    callbackRef.current?.();
    callbackRef.current = null;
  }, []);

  const onFechar = useCallback(() => {
    setAberto(false);
    callbackRef.current = null;
  }, []);

  return { aberto, pedirPin, onSucesso, onFechar };
}

/* ── Componente: PinModal ─────────────────────────────────────── */

interface PinModalProps {
  aberto: boolean;
  onSucesso: () => void;
  onFechar: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ aberto, onSucesso, onFechar }) => {
  const [digitos, setDigitos] = useState(['', '', '', '']);
  const [erro, setErro] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset ao abrir
  useEffect(() => {
    if (aberto) {
      setDigitos(['', '', '', '']);
      setErro(false);
      setTentativas(0);
      setTimeout(() => inputsRef.current[0]?.focus(), 80);
    }
  }, [aberto]);

  if (!aberto) return null;

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const novos = [...digitos];
    novos[idx] = val;
    setDigitos(novos);
    setErro(false);

    if (val && idx < 3) {
      inputsRef.current[idx + 1]?.focus();
    }

    // Verificar quando 4 dígitos preenchidos
    if (val && idx === 3) {
      const pin = novos.join('');
      if (pin.length === 4) {
        if (verificarPin(pin)) {
          onSucesso();
        } else {
          setErro(true);
          setTentativas(t => t + 1);
          setTimeout(() => {
            setDigitos(['', '', '', '']);
            inputsRef.current[0]?.focus();
          }, 600);
        }
      }
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digitos[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === 'Escape') onFechar();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (text.length === 4) {
      e.preventDefault();
      const novos = text.split('');
      setDigitos(novos);
      if (verificarPin(text)) {
        onSucesso();
      } else {
        setErro(true);
        setTentativas(t => t + 1);
        setTimeout(() => {
          setDigitos(['', '', '', '']);
          inputsRef.current[0]?.focus();
        }, 600);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, animation: 'fadeIn 0.2s',
    }} onClick={onFechar}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '32px 28px',
        maxWidth: 360, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.25s',
      }} onClick={e => e.stopPropagation()}>

        {/* Ícone */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg,#FFD600,#FF8F00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 28,
        }}>🔒</div>

        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#0D0D0D' }}>
          Digite o PIN
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>
          Insira o PIN de 4 dígitos para autorizar esta ação
        </p>

        {/* 4 inputs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          {digitos.map((d, i) => (
            <input
              key={i}
              ref={el => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              style={{
                width: 52, height: 60, textAlign: 'center',
                fontSize: 26, fontWeight: 900, fontFamily: 'monospace',
                borderRadius: 14,
                border: `2.5px solid ${erro ? '#ef4444' : d ? '#f59e0b' : '#e5e7eb'}`,
                background: erro ? '#fef2f2' : '#f9fafb',
                outline: 'none', caretColor: '#f59e0b',
                transition: 'border-color 0.2s, background 0.2s',
                color: '#0D0D0D',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = erro ? '#ef4444' : '#f59e0b'; e.currentTarget.style.background = '#fffbeb'; }}
              onBlur={e => { e.currentTarget.style.borderColor = erro ? '#ef4444' : d ? '#f59e0b' : '#e5e7eb'; e.currentTarget.style.background = erro ? '#fef2f2' : '#f9fafb'; }}
              autoComplete="off"
            />
          ))}
        </div>

        {/* Erro */}
        {erro && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10,
            padding: '8px 14px', marginBottom: 16, fontSize: 13, fontWeight: 700, color: '#dc2626',
          }}>
            ❌ PIN incorreto {tentativas > 1 ? `(${tentativas}ª tentativa)` : ''}
          </div>
        )}

        {/* Cancelar */}
        <button onClick={onFechar} style={{
          width: '100%', padding: '12px', background: '#f3f4f6',
          border: '1.5px solid #e5e7eb', borderRadius: 12,
          fontSize: 14, fontWeight: 700, color: '#6b7280', cursor: 'pointer',
        }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

/* ── Componente: PinConfig ─────────────────────────────────────
   Botão + modal para Definir / Alterar / Remover PIN
   Usar em páginas de configuração (ex: ManutencaoPage gear modal)
   ─────────────────────────────────────────────────────────────── */

interface PinConfigProps {
  style?: React.CSSProperties;
}

export const PinConfig: React.FC<PinConfigProps> = ({ style }) => {
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState<'definir' | 'alterar' | 'remover'>('definir');
  const [pinAtual, setPinAtual] = useState(['', '', '', '']);
  const [pinNovo, setPinNovo] = useState(['', '', '', '']);
  const [pinConfirmar, setPinConfirmar] = useState(['', '', '', '']);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const refAtual = useRef<(HTMLInputElement | null)[]>([]);
  const refNovo = useRef<(HTMLInputElement | null)[]>([]);
  const refConfirmar = useRef<(HTMLInputElement | null)[]>([]);

  const jaTem = pinDefinido();

  const abrir = () => {
    setModo(jaTem ? 'alterar' : 'definir');
    setPinAtual(['', '', '', '']);
    setPinNovo(['', '', '', '']);
    setPinConfirmar(['', '', '', '']);
    setErro('');
    setSucesso('');
    setAberto(true);
  };

  const handleDigitar = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const n = [...arr]; n[idx] = val; setArr(n);
    setErro(''); setSucesso('');
    if (val && idx < 3) refs.current[idx + 1]?.focus();
  };

  const handleBack = (arr: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>, idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !arr[idx] && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'Escape') setAberto(false);
  };

  const renderInputs = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, autoFocus?: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
      {arr.map((d, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
          value={d} onChange={e => handleDigitar(arr, setArr, refs, i, e.target.value)}
          onKeyDown={e => handleBack(arr, refs, i, e)}
          autoFocus={autoFocus && i === 0}
          autoComplete="off"
          style={{
            width: 44, height: 50, textAlign: 'center', fontSize: 22, fontWeight: 900,
            fontFamily: 'monospace', borderRadius: 12,
            border: `2px solid ${d ? '#f59e0b' : '#e5e7eb'}`, background: '#f9fafb',
            outline: 'none', caretColor: '#f59e0b', color: '#0D0D0D',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.background = '#fffbeb'; }}
          onBlur={e => { e.currentTarget.style.borderColor = d ? '#f59e0b' : '#e5e7eb'; e.currentTarget.style.background = '#f9fafb'; }}
        />
      ))}
    </div>
  );

  const salvar = () => {
    const novo = pinNovo.join('');
    const confirmar = pinConfirmar.join('');

    if (modo === 'alterar' || modo === 'remover') {
      const atual = pinAtual.join('');
      if (atual.length !== 4) { setErro('Digite o PIN atual completo.'); return; }
      if (!verificarPin(atual)) { setErro('PIN atual incorreto.'); return; }
    }

    if (modo === 'remover') {
      localStorage.removeItem(LS_PIN);
      setSucesso('PIN removido com sucesso!');
      setTimeout(() => setAberto(false), 1200);
      return;
    }

    if (novo.length !== 4) { setErro('Digite o novo PIN completo (4 dígitos).'); return; }
    if (novo !== confirmar) { setErro('Os PINs não coincidem.'); return; }

    salvarPin(novo);
    setSucesso(modo === 'definir' ? 'PIN definido com sucesso!' : 'PIN alterado com sucesso!');
    setTimeout(() => setAberto(false), 1200);
  };

  return (
    <>
      <button type="button" onClick={abrir} style={{
        width: '100%', padding: '12px 16px',
        background: jaTem ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'linear-gradient(135deg,#FFD600,#FF8F00)',
        border: 'none', borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 14, fontWeight: 900,
        color: jaTem ? '#fff' : '#0D0D0D',
        ...style,
      }}>
        🔒 {jaTem ? 'Alterar / Remover PIN' : 'Definir PIN de Proteção'}
      </button>

      {aberto && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setAberto(false)}>
          <div style={{
            background: '#fff', borderRadius: 24, padding: '28px 24px',
            maxWidth: 400, width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                {modo === 'definir' ? 'Definir PIN de Proteção' : modo === 'alterar' ? 'Alterar PIN' : 'Remover PIN'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                O PIN será exigido para editar e excluir registros
              </p>
            </div>

            {/* Abas alterar/remover */}
            {jaTem && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {(['alterar', 'remover'] as const).map(m => (
                  <button key={m} type="button" onClick={() => { setModo(m); setErro(''); setSucesso(''); setPinAtual(['','','','']); setPinNovo(['','','','']); setPinConfirmar(['','','','']); }}
                    style={{
                      flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 800,
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      background: modo === m ? '#fffbeb' : '#f3f4f6',
                      color: modo === m ? '#b45309' : '#9ca3af',
                      borderBottom: modo === m ? '2px solid #f59e0b' : '2px solid transparent',
                    }}>
                    {m === 'alterar' ? '🔄 Alterar' : '🗑️ Remover'}
                  </button>
                ))}
              </div>
            )}

            {/* PIN Atual (alterar/remover) */}
            {(modo === 'alterar' || modo === 'remover') && (
              <>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>PIN Atual</div>
                {renderInputs(pinAtual, setPinAtual, refAtual, true)}
              </>
            )}

            {/* Novo PIN (definir/alterar) */}
            {(modo === 'definir' || modo === 'alterar') && (
              <>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>
                  {modo === 'definir' ? 'Novo PIN (4 dígitos)' : 'Novo PIN'}
                </div>
                {renderInputs(pinNovo, setPinNovo, refNovo, modo === 'definir')}
                <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>Confirmar PIN</div>
                {renderInputs(pinConfirmar, setPinConfirmar, refConfirmar)}
              </>
            )}

            {/* Mensagens */}
            {erro && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '8px 14px', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                ❌ {erro}
              </div>
            )}
            {sucesso && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '8px 14px', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                ✅ {sucesso}
              </div>
            )}

            {/* Botões */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={salvar} style={{
                flex: 1, padding: '12px',
                background: modo === 'remover' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#FFD600,#FF8F00)',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: 'pointer',
                color: modo === 'remover' ? '#fff' : '#0D0D0D',
              }}>
                {modo === 'definir' ? '💾 Definir PIN' : modo === 'alterar' ? '💾 Salvar' : '🗑️ Remover PIN'}
              </button>
              <button type="button" onClick={() => setAberto(false)} style={{
                padding: '12px 20px', background: '#f3f4f6', border: '1.5px solid #e5e7eb',
                borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#6b7280', cursor: 'pointer',
              }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
