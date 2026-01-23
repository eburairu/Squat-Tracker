// Global variables for audio context and confetti context
let audioContext = null;
let confettiCtx = null;

export const ensureAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

export const playTone = (frequency, duration, options = {}) => {
  ensureAudioContext();
  const now = audioContext.currentTime;
  const startTime = options.startTime ?? now;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = options.type ?? 'triangle';
  oscillator.frequency.setValueAtTime(frequency * 0.96, startTime);
  oscillator.frequency.linearRampToValueAtTime(frequency * 1.08, startTime + duration / 1000);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(options.volume ?? 0.2, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration / 1000);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000 + 0.05);
};

export const beep = (frequency = 659.25, duration = 150) => {
  playTone(frequency, duration, { type: 'triangle', volume: 0.2 });
};

export const playCelebration = () => {
  ensureAudioContext();
  const now = audioContext.currentTime;
  const notes = [880, 1174.66, 1318.51, 1567.98];
  notes.forEach((frequency, index) => {
    playTone(frequency, 180, { startTime: now + index * 0.12, type: 'sine', volume: 0.22 });
  });
  playTone(2093, 260, { startTime: now + 0.1, type: 'triangle', volume: 0.16 });
};

export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const isStorageAvailable = (() => {
  try {
    const testKey = '__squat_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
})();

export const formatDate = (isoString) => {
  if (!isoString) {
    return '--';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

export const getLocalDateKey = (date = new Date()) => {
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDayOfYear = (date = new Date()) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const showToast = ({ emoji, title, message, sound = true }) => {
  const existing = document.querySelectorAll('.achievement-toast');
  const offset = existing.length * 90; // Approx height + gap

  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.style.top = `${20 + offset}px`;
  toast.innerHTML = `
    <div class="toast-icon">${emoji}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  document.body.appendChild(toast);

  if (sound) {
    setTimeout(() => playCelebration(), 300);
    if (typeof window.VoiceCoach !== 'undefined') {
      window.VoiceCoach.speak(`${title}。${message}`);
    }
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.5s ease-in';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
};

export const ensureConfettiContext = (confettiCanvas) => {
  if (!confettiCanvas) {
    return null;
  }
  if (!confettiCtx) {
    confettiCtx = confettiCanvas.getContext('2d');
  }
  return confettiCtx;
};

export const launchConfetti = (confettiCanvas, prefersReducedMotion) => {
  if (!confettiCanvas) {
    return;
  }
  const ctx = ensureConfettiContext(confettiCanvas);
  if (!ctx) {
    return;
  }
  const pixelRatio = window.devicePixelRatio || 1;
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const reduceMotion = (prefersReducedMotion && prefersReducedMotion.matches)
    || document.body.classList.contains('reduced-motion');
  const pieceCount = reduceMotion ? 40 : 120;
  const maxFrames = reduceMotion ? 120 : 240;
  confettiCanvas.width = Math.floor(canvasWidth * pixelRatio);
  confettiCanvas.height = Math.floor(canvasHeight * pixelRatio);
  confettiCanvas.style.width = '100%';
  confettiCanvas.style.height = '100%';
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  confettiCanvas.classList.add('active');
  const pieces = Array.from({ length: pieceCount }).map(() => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * -canvasHeight,
    size: 6 + Math.random() * 6,
    speed: (reduceMotion ? 1 : 2) + Math.random() * (reduceMotion ? 2 : 4),
    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
  }));

  let frame = 0;
  const draw = () => {
    frame += 1;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    pieces.forEach((piece) => {
      piece.y += piece.speed;
      piece.x += Math.sin((piece.y + frame) / 20);
      ctx.fillStyle = piece.color;
      ctx.fillRect(piece.x, piece.y, piece.size, piece.size);
      if (piece.y > canvasHeight) {
        piece.y = -20;
      }
    });
    if (frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      stopConfetti(confettiCanvas);
    }
  };
  draw();
};

export const stopConfetti = (confettiCanvas) => {
  if (!confettiCanvas) {
    return;
  }
  const ctx = ensureConfettiContext(confettiCanvas);
  if (!ctx) {
    return;
  }
  confettiCanvas.classList.remove('active');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
};

export const computeStats = (entries) => {
  const totalWorkouts = entries.length;
  const totalRepsAllTime = entries.reduce((sum, entry) => sum + entry.totalReps, 0);
  const lastEntry = entries[0];
  return {
    totalWorkouts,
    totalRepsAllTime,
    lastWorkoutDate: lastEntry ? lastEntry.date : null,
    lastWorkoutTotalReps: lastEntry ? lastEntry.totalReps : 0,
  };
};

export const computeStreak = (entries, shieldDates = []) => {
  if ((!Array.isArray(entries) || entries.length === 0) && (!Array.isArray(shieldDates) || shieldDates.length === 0)) {
    return 0;
  }
  const dateKeys = new Set(
    (entries || [])
      .map((entry) => getLocalDateKey(new Date(entry.date)))
      .filter((value) => value)
  );
  if (Array.isArray(shieldDates)) {
    shieldDates.forEach(d => dateKeys.add(d));
  }
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = getLocalDateKey(cursor);
    if (!key || !dateKeys.has(key)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
