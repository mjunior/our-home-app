import React from "react";

const MOTIVATIONAL_QUOTES = [
  "Disciplina financeira e liberdade caminham juntas.",
  "Cada conta paga hoje protege o seu amanha.",
  "Seu dinheiro merece direcao, nao improviso.",
  "Consistencia supera qualquer impulso de gasto.",
  "Quem domina o fluxo, domina as escolhas.",
  "Orcamento claro transforma ansiedade em controle.",
  "Pequenas decisoes diarias constroem patrimonio.",
  "Previsao forte hoje, tranquilidade real depois.",
  "Seu saldo e um reflexo das suas prioridades.",
  "Casa organizada, futuro mais leve.",

  "Prosperidade nasce da clareza sobre para onde o dinheiro vai.",
  "Cada real bem usado fortalece o futuro da familia.",
  "Controle hoje significa liberdade amanha.",
  "Dinheiro bem guiado vira tranquilidade.",
  "Fluxo organizado transforma esforco em patrimonio.",
  "Quem planeja o dinheiro protege a familia.",
  "Prosperidade e feita de pequenas decisoes corretas.",
  "Saldo positivo comeca com escolhas conscientes.",
  "Organizar o dinheiro e cuidar do futuro.",
  "Riqueza familiar se constrói no dia a dia."
];

const VISIBLE_QUOTES = 3;
const QUOTE_DURATION_MS = 3000;
const EXIT_BUFFER_MS = 500;

interface MotivationalSplashProps {
  onDone: () => void;
}

function pickQuotes(seed: number, total: number) {
  const pool = [...MOTIVATIONAL_QUOTES];
  let state = seed;
  const out: string[] = [];

  while (pool.length > 0 && out.length < total) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const index = state % pool.length;
    const [quote] = pool.splice(index, 1);
    if (quote) {
      out.push(quote);
    }
  }

  return out;
}

export function MotivationalSplash({ onDone }: MotivationalSplashProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [closing, setClosing] = React.useState(false);
  const quotes = React.useMemo(() => {
    const seed = Math.floor(Date.now() % 4294967296);
    return pickQuotes(seed, VISIBLE_QUOTES);
  }, []);

  React.useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const timeout = window.setTimeout(onDone, 850);
      return () => window.clearTimeout(timeout);
    }

    const totalDurationMs = quotes.length * QUOTE_DURATION_MS;
    let finished = false;
    let rafId = 0;
    let doneTimeout: number | null = null;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(now - startTime, totalDurationMs);
      setElapsedMs(elapsed);
      const nextQuoteIndex = Math.min(Math.floor(elapsed / QUOTE_DURATION_MS), quotes.length - 1);
      setActiveIndex((current) => (current === nextQuoteIndex ? current : nextQuoteIndex));

      if (elapsed >= totalDurationMs) {
        if (!finished) {
          finished = true;
          setClosing(true);
          doneTimeout = window.setTimeout(onDone, EXIT_BUFFER_MS);
        }
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (doneTimeout !== null) {
        window.clearTimeout(doneTimeout);
      }
    };
  }, [onDone, quotes.length]);

  const totalDurationMs = quotes.length * QUOTE_DURATION_MS;
  const progressPct = Math.max(0, Math.min(100, (elapsedMs / totalDurationMs) * 100));
  const quote = quotes[activeIndex] ?? MOTIVATIONAL_QUOTES[0];

  return (
    <section className={`motivational-splash ${closing ? "is-closing" : ""}`} aria-label="Splash motivacional">
      <div className="motivational-splash__bg">
        <span className="motivational-splash__halo motivational-splash__halo--left" />
        <span className="motivational-splash__halo motivational-splash__halo--right" />
        <span className="motivational-splash__grid" />
      </div>

      <div className="motivational-splash__content">
        <div className="motivational-splash__clover-wrap" aria-hidden="true">
          <svg viewBox="0 0 220 220" className="motivational-splash__clover" role="img">
            <defs>
              <radialGradient id="cloverLeaf" cx="35%" cy="28%" r="76%">
                <stop offset="0%" stopColor="#e5ff8a" />
                <stop offset="58%" stopColor="#b9ea38" />
                <stop offset="100%" stopColor="#68a909" />
              </radialGradient>
              <linearGradient id="cloverStem" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7fce17" />
                <stop offset="100%" stopColor="#2f6e00" />
              </linearGradient>
              <filter id="cloverGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="clover-orbit">
              <path
                className="clover-leaf leaf-top"
                d="M110 66 C96 45,64 54,64 83 C64 107,84 124,110 141 C136 124,156 107,156 83 C156 54,124 45,110 66 Z"
                fill="url(#cloverLeaf)"
                filter="url(#cloverGlow)"
              />
              <path
                className="clover-leaf leaf-right"
                d="M110 66 C96 45,64 54,64 83 C64 107,84 124,110 141 C136 124,156 107,156 83 C156 54,124 45,110 66 Z"
                fill="url(#cloverLeaf)"
                filter="url(#cloverGlow)"
                transform="rotate(90 110 110)"
              />
              <path
                className="clover-leaf leaf-bottom"
                d="M110 66 C96 45,64 54,64 83 C64 107,84 124,110 141 C136 124,156 107,156 83 C156 54,124 45,110 66 Z"
                fill="url(#cloverLeaf)"
                filter="url(#cloverGlow)"
                transform="rotate(180 110 110)"
              />
              <path
                className="clover-leaf leaf-left"
                d="M110 66 C96 45,64 54,64 83 C64 107,84 124,110 141 C136 124,156 107,156 83 C156 54,124 45,110 66 Z"
                fill="url(#cloverLeaf)"
                filter="url(#cloverGlow)"
                transform="rotate(270 110 110)"
              />
              <circle cx="110" cy="110" r="11" fill="#d8f752" opacity="0.98" />
              <path
                className="clover-stem"
                d="M110 147 C126 161, 134 178, 126 196 C118 210, 97 212, 93 200 C90 191, 98 181, 104 173 C109 167, 112 160, 110 151"
                fill="none"
                stroke="url(#cloverStem)"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </g>

            <circle className="clover-spark spark-1" cx="28" cy="96" r="4.5" />
            <circle className="clover-spark spark-2" cx="191" cy="72" r="3.5" />
            <circle className="clover-spark spark-3" cx="184" cy="172" r="4" />
            <circle className="clover-spark spark-4" cx="38" cy="160" r="3" />
          </svg>
        </div>
        <p className="motivational-splash__eyebrow">TREVO - FINANÇAS &amp; FAMILIA</p>
        <h1 key={activeIndex} className="motivational-splash__quote">
          {quote}
        </h1>
        <div className="motivational-splash__meter" role="presentation">
          <span className="motivational-splash__meter-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </section>
  );
}
