const phaseDisplay = document.getElementById('phase-display');
const setDisplay = document.getElementById('set-display');
const repDisplay = document.getElementById('rep-display');
const phaseTimer = document.getElementById('phase-timer');
const phaseHint = document.getElementById('phase-hint');
const progressBar = document.getElementById('progress-bar');

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
const confettiCtx = confettiCanvas.getContext('2d');

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

let sensorMode = false;
let sensorActive = false;
let sensorBaseline = null;
let sensorThreshold = null;
let lastSensorCounted = false;

const phases = [
  { key: Phase.DOWN, duration: () => parseInt(downDurationInput.value, 10) },
  { key: Phase.HOLD, duration: () => parseInt(holdDurationInput.value, 10) },
  { key: Phase.UP, duration: () => parseInt(upDurationInput.value, 10) },
];

const beep = (frequency = 880, duration = 150) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.2;
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
  }, duration);
};

const updateDisplays = () => {
  setDisplay.textContent = `${currentSet} / ${totalSets}`;
  repDisplay.textContent = `${currentRep} / ${repsPerSet}`;
  phaseDisplay.textContent = currentPhase;
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

const setPhase = (phaseKey, durationSeconds, hint) => {
  currentPhase = phaseKey;
  phaseDuration = durationSeconds * 1000;
  phaseStart = Date.now();
  phaseHint.textContent = hint;
  updateDisplays();
  updateTimerUI();
  beep();
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
  updateDisplays();
  phaseTimer.textContent = '00';
  progressBar.style.width = '100%';
  beep(440, 400);
  launchConfetti();
};

const tick = () => {
  if (!phaseDuration || isPaused) {
    return;
  }
  updateTimerUI();
  if (Date.now() - phaseStart >= phaseDuration) {
    updateTimerUI();
  }
};

const startWorkout = () => {
  totalSets = parseInt(setCountInput.value, 10);
  repsPerSet = parseInt(repCountInput.value, 10);
  currentSet = 1;
  currentRep = 1;
  isPaused = false;
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
  currentSet = 1;
  currentRep = 1;
  isPaused = false;
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
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiCanvas.classList.add('active');
  const pieces = Array.from({ length: 120 }).map(() => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * -confettiCanvas.height,
    size: 6 + Math.random() * 6,
    speed: 2 + Math.random() * 4,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
  }));

  let frame = 0;
  const draw = () => {
    frame += 1;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    pieces.forEach((piece) => {
      piece.y += piece.speed;
      piece.x += Math.sin((piece.y + frame) / 20);
      confettiCtx.fillStyle = piece.color;
      confettiCtx.fillRect(piece.x, piece.y, piece.size, piece.size);
      if (piece.y > confettiCanvas.height) {
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
  confettiCanvas.classList.remove('active');
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
};

updateDisplays();
