import React, { useRef, useState, useEffect } from 'react';
import styles from './EditorImagem.module.css';

type Ferramenta = 'desenho' | 'seta' | 'texto' | 'retangulo' | 'circulo' | 'borracha';

interface Props {
  imagemSrc: string;
  onSalvar: (imagemEditada: string) => void;
  onCancelar: () => void;
}

const CORES = ['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#a855f7','#ffffff','#0f172a'];
const ESPESSURAS = [3, 6, 12];

const EditorImagem: React.FC<Props> = ({ imagemSrc, onSalvar, onCancelar }) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);

  const [ferramenta, setFerramenta] = useState<Ferramenta>('desenho');
  const [cor,        setCor]        = useState('#ef4444');
  const [espessura,  setEspessura]  = useState(6);
  const [podeDesfazer, setPodeDesfazer] = useState(false);

  // Refs internos (não causam re-render)
  const desenhando  = useRef(false);
  const inicio      = useRef({ x: 0, y: 0 });
  const ultimaPos   = useRef({ x: 0, y: 0 });
  const snapRef     = useRef<ImageData | null>(null);
  const historicoRef = useRef<ImageData[]>([]);

  // ── Carrega imagem no canvas ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      historicoRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      setPodeDesfazer(false);
    };
    img.src = imagemSrc;
  }, [imagemSrc]);

  // ── Coordenadas ajustadas ao scale do canvas ───────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    let cx: number, cy: number;
    if ('touches' in e) {
      const t = e.touches[0] ?? (e as React.TouchEvent).changedTouches[0];
      cx = t.clientX; cy = t.clientY;
    } else {
      cx = (e as React.MouseEvent).clientX;
      cy = (e as React.MouseEvent).clientY;
    }
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  };

  // ── Contexto com a ferramenta configurada ─────────────────────────────────
  const ctx = () => {
    const c = canvasRef.current!.getContext('2d')!;
    c.strokeStyle = ferramenta === 'borracha' ? '#fff' : cor;
    c.fillStyle   = ferramenta === 'borracha' ? '#fff' : cor;
    c.lineWidth   = ferramenta === 'borracha' ? espessura * 5 : espessura;
    c.lineCap     = 'round';
    c.lineJoin    = 'round';
    return c;
  };

  // ── Histórico ─────────────────────────────────────────────────────────────
  const salvarEstado = () => {
    const canvas = canvasRef.current!;
    const snap   = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    historicoRef.current = [...historicoRef.current.slice(-24), snap];
    setPodeDesfazer(historicoRef.current.length > 1);
  };

  const desfazer = () => {
    const hist = historicoRef.current;
    if (hist.length <= 1) return;
    historicoRef.current = hist.slice(0, -1);
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.putImageData(hist[hist.length - 2], 0, 0);
    setPodeDesfazer(historicoRef.current.length > 1);
  };

  // ── Seta ──────────────────────────────────────────────────────────────────
  const desenharSeta = (c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const head = Math.max(18, espessura * 4);
    const ang  = Math.atan2(y2 - y1, x2 - x1);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
    c.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
    c.closePath();
    c.fill();
  };

  // ── Restaurar snapshot para preview de formas ─────────────────────────────
  const restaurarSnap = () => {
    if (snapRef.current) {
      canvasRef.current!.getContext('2d')!.putImageData(snapRef.current, 0, 0);
    }
  };

  // ── Início do toque/clique ────────────────────────────────────────────────
  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    desenhando.current = true;
    inicio.current   = pos;
    ultimaPos.current = pos;

    if (ferramenta === 'texto') {
      desenhando.current = false;
      const texto = window.prompt('Digite o texto:');
      if (texto?.trim()) {
        const c = ctx();
        c.font = `bold ${espessura * 7}px Arial, sans-serif`;
        c.shadowColor   = 'rgba(0,0,0,0.6)';
        c.shadowBlur    = 4;
        c.fillText(texto, pos.x, pos.y);
        c.shadowBlur    = 0;
        salvarEstado();
      }
      return;
    }

    if (ferramenta === 'seta' || ferramenta === 'retangulo' || ferramenta === 'circulo') {
      const canvas = canvasRef.current!;
      snapRef.current = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (ferramenta === 'desenho' || ferramenta === 'borracha') {
      const c = ctx();
      c.beginPath();
      c.moveTo(pos.x, pos.y);
    }
  };

  // ── Movimento ─────────────────────────────────────────────────────────────
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!desenhando.current) return;
    const pos = getPos(e);
    const c   = ctx();

    if (ferramenta === 'desenho' || ferramenta === 'borracha') {
      c.beginPath();
      c.moveTo(ultimaPos.current.x, ultimaPos.current.y);
      c.lineTo(pos.x, pos.y);
      c.stroke();
      ultimaPos.current = pos;
      return;
    }

    // Formas: restaura snap e desenha preview
    restaurarSnap();

    if (ferramenta === 'seta') {
      desenharSeta(c, inicio.current.x, inicio.current.y, pos.x, pos.y);
    } else if (ferramenta === 'retangulo') {
      c.strokeRect(inicio.current.x, inicio.current.y, pos.x - inicio.current.x, pos.y - inicio.current.y);
    } else if (ferramenta === 'circulo') {
      const rx = Math.abs(pos.x - inicio.current.x) / 2;
      const ry = Math.abs(pos.y - inicio.current.y) / 2;
      const cx = inicio.current.x + (pos.x - inicio.current.x) / 2;
      const cy = inicio.current.y + (pos.y - inicio.current.y) / 2;
      c.beginPath();
      c.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      c.stroke();
    }
  };

  // ── Fim ───────────────────────────────────────────────────────────────────
  const onEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!desenhando.current) return;
    desenhando.current = false;
    snapRef.current    = null;
    salvarEstado();
  };

  const handleSalvar = () => {
    const canvas = canvasRef.current!;
    onSalvar(canvas.toDataURL('image/jpeg', 0.85));
  };

  const FERRAMENTAS: { id: Ferramenta; icone: string; label: string }[] = [
    { id: 'desenho',   icone: '✏️',  label: 'Desenho livre' },
    { id: 'seta',      icone: '↗',   label: 'Seta' },
    { id: 'texto',     icone: 'T',   label: 'Texto' },
    { id: 'retangulo', icone: '▭',   label: 'Retângulo' },
    { id: 'circulo',   icone: '○',   label: 'Círculo / Elipse' },
    { id: 'borracha',  icone: '⌫',   label: 'Borracha' },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.editor}>

        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className={styles.toolbar}>

          {/* Ferramentas */}
          <div className={styles.toolGrupo}>
            {FERRAMENTAS.map(f => (
              <button
                key={f.id}
                className={`${styles.toolBtn} ${ferramenta === f.id ? styles.toolBtnAtivo : ''}`}
                onClick={() => setFerramenta(f.id)}
                title={f.label}
              >
                <span className={styles.toolIcone}>{f.icone}</span>
                <span className={styles.toolLabel}>{f.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.separador} />

          {/* Cores */}
          <div className={styles.toolGrupo}>
            {CORES.map(c => (
              <button
                key={c}
                className={`${styles.corBtn} ${cor === c ? styles.corBtnAtivo : ''}`}
                style={{ background: c, borderColor: cor === c ? '#fff' : 'transparent' }}
                onClick={() => setCor(c)}
                title={c}
              />
            ))}
          </div>

          <div className={styles.separador} />

          {/* Espessura */}
          <div className={styles.toolGrupo}>
            {ESPESSURAS.map(t => (
              <button
                key={t}
                className={`${styles.espBtn} ${espessura === t ? styles.espBtnAtivo : ''}`}
                onClick={() => setEspessura(t)}
                title={`Espessura ${t}`}
              >
                <span
                  style={{
                    display: 'block',
                    width: t === 3 ? 4 : t === 6 ? 8 : 14,
                    height: t === 3 ? 4 : t === 6 ? 8 : 14,
                    background: cor,
                    borderRadius: '50%',
                  }}
                />
              </button>
            ))}
          </div>

          <div className={styles.separador} />

          {/* Desfazer */}
          <button
            className={styles.undoBtn}
            onClick={desfazer}
            disabled={!podeDesfazer}
            title="Desfazer (Ctrl+Z)"
          >
            ↩ Desfazer
          </button>
        </div>

        {/* ── Canvas ────────────────────────────────────────────────────── */}
        <div className={styles.canvasWrap} ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={onStart}
            onMouseMove={onMove}
            onMouseUp={onEnd}
            onMouseLeave={onEnd}
            onTouchStart={onStart}
            onTouchMove={onMove}
            onTouchEnd={onEnd}
            style={{
              cursor:
                ferramenta === 'texto'   ? 'text'      :
                ferramenta === 'borracha'? 'cell'       :
                'crosshair',
            }}
          />
        </div>

        {/* ── Rodapé ────────────────────────────────────────────────────── */}
        <div className={styles.rodape}>
          <button className={styles.btnCancelar} onClick={onCancelar}>Cancelar</button>
          <button className={styles.btnSalvar}   onClick={handleSalvar}>✓ Usar esta imagem</button>
        </div>

      </div>
    </div>
  );
};

export default EditorImagem;
