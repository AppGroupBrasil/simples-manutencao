import React, { useState, useRef, useEffect } from 'react';
import styles from './MicButton.module.css';

interface Props {
  onResult: (texto: string) => void;
}

const MicButton: React.FC<Props> = ({ onResult }) => {
  const [gravando, setGravando]     = useState(false);
  const [suportado, setSuportado]   = useState(true);
  const [erro, setErro]             = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSuportado(false);
  }, []);

  const toggleGravacao = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (gravando) {
      recognitionRef.current?.stop();
      return;
    }

    setErro('');
    const recognition = new SR();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend  = () => setGravando(false);
    recognition.onerror = (e: any) => {
      setGravando(false);
      if (e.error !== 'no-speech') setErro('Microfone sem permissão');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setGravando(true);
  };

  if (!suportado) return null;

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.btn} ${gravando ? styles.gravando : ''}`}
        onClick={toggleGravacao}
        title={gravando ? 'Parar gravação' : 'Falar para preencher'}
      >
        <span className={styles.iconeWrap}>
          {/* Microfone SVG customizado */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="9"  y1="22" x2="15" y2="22" />
          </svg>
          {gravando && <span className={styles.pulse} />}
        </span>
        <span className={styles.label}>
          {gravando ? 'Ouvindo…' : 'Falar'}
        </span>
      </button>
      {erro && <span className={styles.erro}>{erro}</span>}
    </div>
  );
};

export default MicButton;
