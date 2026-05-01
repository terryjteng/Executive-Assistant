import { useState, useRef } from 'react';

type Props = {
  onTranscript: (text: string) => void;
  title?: string;
};

export default function MicButton({ onTranscript, title = 'Speak to fill' }: Props) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  const SR = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

  if (!SR) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onTranscript(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      className={`mic-btn${listening ? ' mic-btn-active' : ''}`}
      onClick={toggle}
      title={listening ? 'Stop listening' : title}
      aria-label={listening ? 'Stop listening' : title}
    >
      {listening ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="4" y="4" width="8" height="8" rx="1.5"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 7.5a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 13.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5.5 15.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}
