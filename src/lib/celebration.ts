type ToneConfig = {
  frequency: number;
  durationMs: number;
  type?: OscillatorType;
  gain?: number;
  delayMs?: number;
};

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtor();
  }
  if (sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

function playTone(audio: AudioContext, config: ToneConfig) {
  const now = audio.currentTime + (config.delayMs ?? 0) / 1000;
  const oscillator = audio.createOscillator();
  const gainNode = audio.createGain();
  oscillator.type = config.type ?? "triangle";
  oscillator.frequency.setValueAtTime(config.frequency, now);

  const gain = config.gain ?? 0.18;
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.durationMs / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + config.durationMs / 1000 + 0.02);
}

export function playCashRegisterSound() {
  try {
    if (typeof window !== "undefined") {
      const sample = new Audio("/sounds/cash-register.mp3");
      sample.volume = 0.75;
      void sample.play();
      return;
    }
  } catch {
    // fallback below
  }

  const audio = getAudioContext();
  if (!audio) return;
  try {
    playTone(audio, { frequency: 880, durationMs: 110, type: "square", gain: 0.12 });
    playTone(audio, { frequency: 1320, durationMs: 130, type: "triangle", gain: 0.14, delayMs: 70 });
    playTone(audio, { frequency: 1040, durationMs: 220, type: "sine", gain: 0.1, delayMs: 150 });
  } catch {
    // ignore playback issues
  }
}

export function playCheerSound() {
  try {
    if (typeof window !== "undefined") {
      const sample = new Audio("/sounds/invoice-cheer.mp3");
      sample.volume = 0.78;
      void sample.play();
      return;
    }
  } catch {
    // fallback below
  }

  const audio = getAudioContext();
  if (!audio) return;
  try {
    playTone(audio, { frequency: 440, durationMs: 220, type: "sawtooth", gain: 0.08 });
    playTone(audio, { frequency: 554, durationMs: 260, type: "sawtooth", gain: 0.08, delayMs: 80 });
    playTone(audio, { frequency: 659, durationMs: 320, type: "sawtooth", gain: 0.08, delayMs: 150 });
    playTone(audio, { frequency: 784, durationMs: 350, type: "triangle", gain: 0.09, delayMs: 220 });
    playTone(audio, { frequency: 988, durationMs: 300, type: "triangle", gain: 0.08, delayMs: 340 });
  } catch {
    // ignore playback issues
  }
}

type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
};

export function launchConfettiCanvas() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const colors = ["#22d3ee", "#c2ea45", "#34d399", "#fbbf24", "#f87171", "#60a5fa"];
  const particles: ConfettiParticle[] = [];
  const spawnBurst = (originX: number, originY: number, total: number) => {
    for (let index = 0; index < total; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7.5;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6.2,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)] ?? "#22d3ee",
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      });
    }
  };

  const burstPlan = [
    { delay: 0, x: canvas.width * 0.5, y: canvas.height * 0.28, total: 95 },
    { delay: 120, x: canvas.width * 0.32, y: canvas.height * 0.32, total: 85 },
    { delay: 230, x: canvas.width * 0.68, y: canvas.height * 0.3, total: 85 },
    { delay: 360, x: canvas.width * 0.5, y: canvas.height * 0.22, total: 95 },
  ];

  burstPlan.forEach((burst) => {
    window.setTimeout(() => spawnBurst(burst.x, burst.y, burst.total), burst.delay);
  });

  const gravity = 0.22;
  const drag = 0.992;
  const maxFrames = 170;
  let frame = 0;

  const render = () => {
    frame += 1;
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const particle of particles) {
      particle.vx *= drag;
      particle.vy = particle.vy * drag + gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6);
      context.restore();
    }

    if (frame < maxFrames) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(render);
}
