const phaseDisplay = document.getElementById('phase-display');
const setDisplay = document.getElementById('set-display');
const repDisplay = document.getElementById('rep-display');
const phaseTimer = document.getElementById('phase-timer');
const phaseHint = document.getElementById('phase-hint');
const quizProblem = document.getElementById('quiz-problem');
const quizAnswer = document.getElementById('quiz-answer');
const progressBar = document.getElementById('progress-bar');
const statsTotalReps = document.getElementById('stats-total-reps');
const statsTotalWorkouts = document.getElementById('stats-total-workouts');
const statsLastDate = document.getElementById('stats-last-date');
const statsLastReps = document.getElementById('stats-last-reps');
const statsSessionReps = document.getElementById('stats-session-reps');
const statsSessionTarget = document.getElementById('stats-session-target');
const historyList = document.getElementById('history-list');
const historyNote = document.getElementById('history-note');
const themeToggle = document.getElementById('theme-toggle');
const themeStatus = document.getElementById('theme-status');

const setCountInput = document.getElementById('set-count');
const repCountInput = document.getElementById('rep-count');
const downDurationInput = document.getElementById('down-duration');
const holdDurationInput = document.getElementById('hold-duration');
const upDurationInput = document.getElementById('up-duration');
const restDurationInput = document.getElementById('rest-duration');
const countdownDurationInput = document.getElementById('countdown-duration');

const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');

const sensorToggle = document.getElementById('sensor-toggle');
const sensorCalibrateButton = document.getElementById('sensor-calibrate');
const sensorStatus = document.getElementById('sensor-status');

const confettiCanvas = document.getElementById('confetti');
let confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;

const Phase = {
  IDLE: '待機中',
  COUNTDOWN: 'スタート前',
  DOWN: 'しゃがむ',
  HOLD: 'キープ',
  UP: '立つ',
  REST: '休憩',
  REST_COUNTDOWN: '再開前',
  FINISHED: '終了',
};

let audioContext = null;
let timerId = null;
let phaseStart = null;
let phaseDuration = null;
let currentPhase = Phase.IDLE;
let totalSets = 3;
let repsPerSet = 10;
let currentSet = 1;
let currentRep = 1;
let isPaused = false;
let pausedAt = null;
let timeoutIds = [];
let workoutStarted = false;
let workoutSaved = false;
let lastCountdownSecond = null;
let currentQuiz = null;

let sensorMode = false;
let sensorActive = false;
let sensorBaseline = null;
let sensorThreshold = null;
let lastSensorCounted = false;

const HISTORY_KEY = 'squat-tracker-history-v1';
const MAX_HISTORY_ENTRIES = 50;
const THEME_KEY = 'squat-tracker-theme';
let historyEntries = [];

const phases = [
  { key: Phase.DOWN, duration: () => parseInt(downDurationInput.value, 10) },
  { key: Phase.HOLD, duration: () => parseInt(holdDurationInput.value, 10) },
  { key: Phase.UP, duration: () => parseInt(upDurationInput.value, 10) },
];

const phaseBeepFrequencies = {
  [Phase.DOWN]: 523.25,
  [Phase.HOLD]: 659.25,
  [Phase.UP]: 784,
};

const timesTableRange = { min: 1, max: 9 };

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateQuiz = () => {
  const divisor = getRandomInt(timesTableRange.min, timesTableRange.max);
  const multiplier = getRandomInt(timesTableRange.min, timesTableRange.max);
  return {
    divisor,
    dividend: divisor * multiplier,
    answer: multiplier,
  };
};

const updateQuizDisplay = (phaseKey) => {
  if (!quizProblem || !quizAnswer) {
    return;
  }
  if (phaseKey === Phase.DOWN) {
    currentQuiz = generateQuiz();
  }
  if (phaseKey === Phase.DOWN || phaseKey === Phase.HOLD) {
    const quiz = currentQuiz ?? generateQuiz();
    currentQuiz = quiz;
    quizProblem.textContent = `問題: ${quiz.dividend} ÷ ${quiz.divisor} = ?`;
    quizAnswer.textContent = '答え: --';
    return;
  }
  if (phaseKey === Phase.UP && currentQuiz) {
    quizProblem.textContent = `問題: ${currentQuiz.dividend} ÷ ${currentQuiz.divisor} = ?`;
    quizAnswer.textContent = `答え: ${currentQuiz.answer}`;
    return;
  }
  quizProblem.textContent = '問題: --';
  quizAnswer.textContent = '答え: --';
};

const isCountdownPhase = (phaseKey) => phaseKey === Phase.COUNTDOWN || phaseKey === Phase.REST_COUNTDOWN;

const playTone = (frequency, duration, options = {}) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
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

const beep = (frequency = 659.25, duration = 150) => {
  playTone(frequency, duration, { type: 'triangle', volume: 0.2 });
};

const playCelebration = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = audioContext.currentTime;
  const notes = [880, 1174.66, 1318.51, 1567.98];
  notes.forEach((frequency, index) => {
    playTone(frequency, 180, { startTime: now + index * 0.12, type: 'sine', volume: 0.22 });
  });
  playTone(2093, 260, { startTime: now + 0.1, type: 'triangle', volume: 0.16 });
};

const ensureConfettiContext = () => {
  if (!confettiCanvas) {
    return null;
  }
  if (!confettiCtx) {
    confettiCtx = confettiCanvas.getContext('2d');
  }
  return confettiCtx;
};

const isStorageAvailable = (() => {
  try {
    const testKey = '__squat_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
})();

const getPreferredTheme = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (themeToggle) {
    themeToggle.checked = isDark;
  }
  if (themeStatus) {
    themeStatus.textContent = isDark ? 'ダーク' : 'ライト';
  }
};

const persistTheme = (theme) => {
  if (!isStorageAvailable) {
    return;
  }
  localStorage.setItem(THEME_KEY, theme);
};

const initializeTheme = () => {
  const stored = isStorageAvailable ? localStorage.getItem(THEME_KEY) : null;
  const theme = stored || getPreferredTheme();
  applyTheme(theme);
};

const sanitizeHistoryEntries = (data) => {
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const id = typeof entry.id === 'string' ? entry.id : null;
      const date = typeof entry.date === 'string' ? entry.date : null;
      const totalSets = Number(entry.totalSets);
      const repsPerSet = Number(entry.repsPerSet);
      const totalReps = Number(entry.totalReps);
      if (!id || !date || !Number.isFinite(totalSets) || !Number.isFinite(repsPerSet) || !Number.isFinite(totalReps)) {
        return null;
      }
      const durations = entry.durations && typeof entry.durations === 'object' ? entry.durations : {};
      return {
        id,
        date,
        totalSets,
        repsPerSet,
        totalReps,
        durations: {
          down: Number(durations.down) || 0,
          hold: Number(durations.hold) || 0,
          up: Number(durations.up) || 0,
          rest: Number(durations.rest) || 0,
          countdown: Number(durations.countdown) || 0,
        },
      };
    })
    .filter(Boolean);
};

const loadHistoryEntries = () => {
  if (!isStorageAvailable) {
    return [];
  }
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeHistoryEntries(parsed);
    if (sanitized.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
      saveHistoryEntries(sanitized);
    }
    return sanitized;
  } catch (error) {
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
};

const saveHistoryEntries = (entries) => {
  if (!isStorageAvailable) {
    return false;
  }
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    return false;
  }
};

const computeStats = (entries) => {
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

const formatDate = (isoString) => {
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

const updateHistoryNote = () => {
  if (!historyNote) {
    return;
  }
  historyNote.textContent = isStorageAvailable
    ? '最新の記録を最大5件表示します。'
    : 'この端末では履歴の自動保存が利用できません。';
};

const renderStats = () => {
  if (!statsTotalReps || !statsTotalWorkouts || !statsLastDate || !statsLastReps) {
    return;
  }
  const stats = computeStats(historyEntries);
  statsTotalReps.textContent = stats.totalRepsAllTime.toLocaleString('ja-JP');
  statsTotalWorkouts.textContent = stats.totalWorkouts.toLocaleString('ja-JP');
  statsLastDate.textContent = stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate) : '--';
  statsLastReps.textContent = stats.lastWorkoutDate ? stats.lastWorkoutTotalReps.toLocaleString('ja-JP') : '--';
};

const renderHistory = () => {
  if (!historyList) {
    return;
  }
  historyList.textContent = '';
  if (historyEntries.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'history-empty';
    emptyItem.textContent = 'まだ記録がありません';
    historyList.appendChild(emptyItem);
    return;
  }
  historyEntries.slice(0, 5).forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const date = document.createElement('div');
    date.className = 'history-date';
    date.textContent = formatDate(entry.date);

    const meta = document.createElement('div');
    meta.className = 'history-meta';
    meta.textContent = `${entry.totalSets}セット × ${entry.repsPerSet}回`;

    const total = document.createElement('div');
    total.className = 'history-total';
    total.textContent = `${entry.totalReps}回`;

    item.append(date, meta, total);
    historyList.appendChild(item);
  });
};

const getPlannedTargetReps = () => {
  const sets = Number.parseInt(setCountInput.value, 10);
  const reps = Number.parseInt(repCountInput.value, 10);
  if (!Number.isFinite(sets) || !Number.isFinite(reps)) {
    return 0;
  }
  return Math.max(sets, 0) * Math.max(reps, 0);
};

const getSessionTargetReps = () => (workoutStarted ? totalSets * repsPerSet : getPlannedTargetReps());

const getCompletedReps = () => {
  if (!workoutStarted) {
    return 0;
  }
  const completed = (currentSet - 1) * repsPerSet + (currentRep - 1);
  return Math.max(Math.min(completed, getSessionTargetReps()), 0);
};

const updateSessionStats = () => {
  if (!statsSessionReps || !statsSessionTarget) {
    return;
  }
  statsSessionReps.textContent = getCompletedReps().toLocaleString('ja-JP');
  statsSessionTarget.textContent = getSessionTargetReps().toLocaleString('ja-JP');
};

const createHistoryEntry = () => {
  const durations = {
    down: Number.parseInt(downDurationInput.value, 10),
    hold: Number.parseInt(holdDurationInput.value, 10),
    up: Number.parseInt(upDurationInput.value, 10),
    rest: Number.parseInt(restDurationInput.value, 10),
    countdown: Number.parseInt(countdownDurationInput.value, 10),
  };
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toISOString(),
    totalSets,
    repsPerSet,
    totalReps: totalSets * repsPerSet,
    durations,
  };
};

const recordWorkout = () => {
  if (workoutSaved) {
    return;
  }
  const entry = createHistoryEntry();
  historyEntries = [entry, ...historyEntries].slice(0, MAX_HISTORY_ENTRIES);
  saveHistoryEntries(historyEntries);
  workoutSaved = true;
  renderStats();
  renderHistory();
};

const runTests = () => {
  const sample = sanitizeHistoryEntries([
    {
      id: '1',
      date: '2024-01-02T00:00:00.000Z',
      totalSets: 3,
      repsPerSet: 10,
      totalReps: 30,
      durations: { down: 2, hold: 1, up: 1, rest: 30, countdown: 5 },
    },
  ]);
  console.assert(sample.length === 1, 'sanitizeHistoryEntries should keep valid entries');
  console.assert(computeStats(sample).totalRepsAllTime === 30, 'computeStats should sum reps');
  console.assert(formatDate('2024-01-02T00:00:00.000Z') === '2024/01/02', 'formatDate should format date');
  console.log('Test run completed.');
};

const updateDisplays = () => {
  setDisplay.textContent = `${currentSet} / ${totalSets}`;
  repDisplay.textContent = `${currentRep} / ${repsPerSet}`;
  phaseDisplay.textContent = currentPhase;
  updateSessionStats();
};

const updateTimerUI = () => {
  if (!phaseDuration) {
    phaseTimer.textContent = '--';
    progressBar.style.width = '0%';
    return;
  }
  const elapsed = Math.min(Date.now() - phaseStart, phaseDuration);
  const remaining = Math.max(phaseDuration - elapsed, 0);
  phaseTimer.textContent = String(Math.ceil(remaining / 1000)).padStart(2, '0');
  progressBar.style.width = `${(elapsed / phaseDuration) * 100}%`;
};

const initializeHistory = () => {
  historyEntries = loadHistoryEntries();
  renderStats();
  renderHistory();
  updateHistoryNote();
  updateSessionStats();
};

const setPhase = (phaseKey, durationSeconds, hint) => {
  currentPhase = phaseKey;
  phaseDuration = durationSeconds * 1000;
  phaseStart = Date.now();
  phaseHint.textContent = hint;
  updateQuizDisplay(phaseKey);
  updateDisplays();
  updateTimerUI();
  lastCountdownSecond = null;
  if (!isCountdownPhase(phaseKey)) {
    const phaseFrequency = phaseBeepFrequencies[phaseKey];
    beep(phaseFrequency ?? 880);
  }
};

const nextRepOrSet = () => {
  if (currentRep < repsPerSet) {
    currentRep += 1;
    startPhaseCycle();
    return;
  }
  if (currentSet < totalSets) {
    currentSet += 1;
    currentRep = 1;
    startRest();
    return;
  }
  finishWorkout();
};

const startPhaseCycle = () => {
  const [downPhase, holdPhase, upPhase] = phases;
  setPhase(Phase.DOWN, downPhase.duration(), '2秒かけてしゃがみます');
  schedulePhase(() => {
    setPhase(Phase.HOLD, holdPhase.duration(), '1秒キープ');
    schedulePhase(() => {
      setPhase(Phase.UP, upPhase.duration(), '1秒で立ちます');
      schedulePhase(() => {
        nextRepOrSet();
      }, upPhase.duration());
    }, holdPhase.duration());
  }, downPhase.duration());
};

const schedulePhase = (callback, durationSeconds) => {
  const timeoutId = setTimeout(() => {
    if (isPaused) {
      timerId = { callback, durationSeconds };
      return;
    }
    callback();
  }, durationSeconds * 1000);
  timeoutIds.push(timeoutId);
};

const startCountdown = (label, callback) => {
  const countdownSeconds = parseInt(countdownDurationInput.value, 10);
  setPhase(Phase.COUNTDOWN, countdownSeconds, label);
  schedulePhase(callback, countdownSeconds);
};

const startRest = () => {
  const restSeconds = parseInt(restDurationInput.value, 10);
  setPhase(Phase.REST, restSeconds, '休憩中');
  schedulePhase(() => {
    setPhase(Phase.REST_COUNTDOWN, parseInt(countdownDurationInput.value, 10), '再開までカウントダウン');
    schedulePhase(() => {
      startPhaseCycle();
    }, parseInt(countdownDurationInput.value, 10));
  }, restSeconds);
};

const finishWorkout = () => {
  currentPhase = Phase.FINISHED;
  phaseDuration = null;
  phaseHint.textContent = 'お疲れさまでした！';
  updateQuizDisplay(Phase.FINISHED);
  updateDisplays();
  phaseTimer.textContent = '00';
  progressBar.style.width = '100%';
  playCelebration();
  recordWorkout();
  launchConfetti();
};

const tick = () => {
  if (!phaseDuration || isPaused) {
    return;
  }
  updateTimerUI();
  if (isCountdownPhase(currentPhase)) {
    const elapsed = Math.min(Date.now() - phaseStart, phaseDuration);
    const remaining = Math.max(phaseDuration - elapsed, 0);
    const remainingSeconds = Math.ceil(remaining / 1000);
    if (remainingSeconds !== lastCountdownSecond) {
      lastCountdownSecond = remainingSeconds;
      beep(988, 140);
    }
  }
  if (Date.now() - phaseStart >= phaseDuration) {
    updateTimerUI();
  }
};

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
};

const validateWorkoutInputs = () => {
  const totalSetsValue = parsePositiveInt(setCountInput.value);
  const repsPerSetValue = parsePositiveInt(repCountInput.value);
  const downSeconds = parsePositiveInt(downDurationInput.value);
  const holdSeconds = parsePositiveInt(holdDurationInput.value);
  const upSeconds = parsePositiveInt(upDurationInput.value);
  const restSeconds = parsePositiveInt(restDurationInput.value);
  const countdownSeconds = parsePositiveInt(countdownDurationInput.value);

  if (
    !totalSetsValue
    || !repsPerSetValue
    || !downSeconds
    || !holdSeconds
    || !upSeconds
    || !restSeconds
    || !countdownSeconds
  ) {
    phaseHint.textContent = '入力値が不正です。セット数・回数・各秒数は1以上で入力してください。';
    return null;
  }

  return {
    totalSetsValue,
    repsPerSetValue,
  };
};

const startWorkout = () => {
  if (workoutStarted || currentPhase !== Phase.IDLE) {
    return;
  }
  const validatedInputs = validateWorkoutInputs();
  if (!validatedInputs) {
    return;
  }
  totalSets = validatedInputs.totalSetsValue;
  repsPerSet = validatedInputs.repsPerSetValue;
  currentSet = 1;
  currentRep = 1;
  isPaused = false;
  workoutStarted = true;
  workoutSaved = false;
  startButton.disabled = true;
  startButton.textContent = '進行中';
  updateSessionStats();
  startCountdown('スタートまでカウントダウン', () => {
    startPhaseCycle();
  });
};

const pauseWorkout = () => {
  if (currentPhase === Phase.IDLE || currentPhase === Phase.FINISHED) {
    return;
  }
  isPaused = !isPaused;
  if (isPaused) {
    pausedAt = Date.now();
    phaseHint.textContent = '一時停止中';
    pauseButton.textContent = '再開';
  } else {
    const pausedDuration = Date.now() - pausedAt;
    phaseStart += pausedDuration;
    pauseButton.textContent = '一時停止';
    if (timerId) {
      const { callback, durationSeconds } = timerId;
      timerId = null;
      schedulePhase(callback, durationSeconds);
    }
  }
};

const resetWorkout = () => {
  timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  timeoutIds = [];
  phaseDuration = null;
  currentPhase = Phase.IDLE;
  updateQuizDisplay(Phase.IDLE);
  currentSet = 1;
  currentRep = 1;
  isPaused = false;
  workoutStarted = false;
  workoutSaved = false;
  startButton.disabled = false;
  startButton.textContent = 'スタート';
  pauseButton.textContent = '一時停止';
  phaseTimer.textContent = '05';
  phaseHint.textContent = 'スタートまでカウントダウン';
  progressBar.style.width = '0%';
  updateDisplays();
  stopConfetti();
};

const timerInterval = setInterval(tick, 100);

startButton.addEventListener('click', () => {
  if (sensorMode) {
    sensorStatus.textContent = 'センサーモードではタイマーを併用できます。';
  }
  startWorkout();
});

pauseButton.addEventListener('click', pauseWorkout);
resetButton.addEventListener('click', resetWorkout);
setCountInput.addEventListener('input', updateSessionStats);
repCountInput.addEventListener('input', updateSessionStats);
if (themeToggle) {
  themeToggle.addEventListener('change', (event) => {
    const theme = event.target.checked ? 'dark' : 'light';
    applyTheme(theme);
    persistTheme(theme);
  });
}

const handleOrientation = (event) => {
  if (!sensorMode || !sensorActive) {
    return;
  }
  const beta = event.beta;
  if (beta === null || beta === undefined) {
    sensorStatus.textContent = '角度データを取得できません。';
    return;
  }
  if (sensorBaseline === null) {
    sensorBaseline = beta;
    sensorThreshold = beta - 60;
    sensorStatus.textContent = `基準角度を記録しました: ${Math.round(beta)}°`;
  }

  const depthReached = beta <= sensorThreshold;
  if (depthReached && !lastSensorCounted) {
    lastSensorCounted = true;
    currentRep = Math.min(currentRep + 1, repsPerSet);
    repDisplay.textContent = `${currentRep} / ${repsPerSet}`;
    updateSessionStats();
    beep(700, 120);
    if (currentRep >= repsPerSet) {
      nextRepOrSet();
      lastSensorCounted = false;
    }
  }

  if (!depthReached) {
    lastSensorCounted = false;
  }
};

const enableSensor = async () => {
  if (typeof DeviceOrientationEvent === 'undefined') {
    sensorStatus.textContent = 'この端末ではセンサーを利用できません。';
    sensorToggle.checked = false;
    sensorMode = false;
    return;
  }
  if (DeviceOrientationEvent.requestPermission) {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission !== 'granted') {
      sensorStatus.textContent = 'センサー利用が許可されませんでした。';
      sensorToggle.checked = false;
      sensorMode = false;
      return;
    }
  }
  sensorMode = true;
  sensorActive = true;
  sensorBaseline = null;
  sensorThreshold = null;
  lastSensorCounted = false;
  sensorCalibrateButton.disabled = false;
  sensorStatus.textContent = 'センサー準備完了。逆さまに固定してしゃがむとカウントされます。';
  window.addEventListener('deviceorientation', handleOrientation);
};

const disableSensor = () => {
  sensorMode = false;
  sensorActive = false;
  sensorBaseline = null;
  sensorThreshold = null;
  lastSensorCounted = false;
  sensorCalibrateButton.disabled = true;
  sensorStatus.textContent = '未使用';
  window.removeEventListener('deviceorientation', handleOrientation);
};

sensorToggle.addEventListener('change', (event) => {
  if (event.target.checked) {
    enableSensor();
  } else {
    disableSensor();
  }
});

sensorCalibrateButton.addEventListener('click', () => {
  sensorBaseline = null;
  sensorThreshold = null;
  lastSensorCounted = false;
  sensorStatus.textContent = '角度を再計測します。逆さまに固定して数秒待ってください。';
});

const launchConfetti = () => {
  if (!confettiCanvas) {
    return;
  }
  const ctx = ensureConfettiContext();
  if (!ctx) {
    return;
  }
  const pixelRatio = window.devicePixelRatio || 1;
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  confettiCanvas.width = Math.floor(canvasWidth * pixelRatio);
  confettiCanvas.height = Math.floor(canvasHeight * pixelRatio);
  confettiCanvas.style.width = '100%';
  confettiCanvas.style.height = '100%';
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  confettiCanvas.classList.add('active');
  const pieces = Array.from({ length: 120 }).map(() => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * -canvasHeight,
    size: 6 + Math.random() * 6,
    speed: 2 + Math.random() * 4,
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
    if (frame < 240) {
      requestAnimationFrame(draw);
    } else {
      stopConfetti();
    }
  };
  draw();
};

const stopConfetti = () => {
  if (!confettiCanvas) {
    return;
  }
  const ctx = ensureConfettiContext();
  if (!ctx) {
    return;
  }
  confettiCanvas.classList.remove('active');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
};

runTests();
initializeTheme();
initializeHistory();
updateDisplays();
