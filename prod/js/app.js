import { Phase } from './constants.js';
import {
  ensureAudioContext, beep, playCelebration,
  launchConfetti, stopConfetti, showToast,
  isStorageAvailable, formatDate, getLocalDateKey,
  computeStats, computeStreak
} from './utils.js';

import { VoiceCoach } from './modules/voice-coach.js';
import { WorkoutTimer } from './modules/workout-timer.js';
import { RpgSystem } from './modules/rpg-system.js';
import { InventoryManager } from './modules/inventory-manager.js';
import { BossBattle } from './modules/boss-battle.js';
import { DailyMissionSystem } from './modules/daily-mission.js';
import { AchievementSystem } from './modules/achievement-system.js';
import { DataManager } from './modules/data-manager.js';
import { PresetManager } from './modules/preset-manager.js';
import { generateQuiz } from './modules/quiz.js';
import { renderHeatmap, initHeatmap } from './modules/heatmap.js';

// --- Global DOM Elements ---
const phaseDisplay = document.getElementById('phase-display');
const setDisplay = document.getElementById('set-display');
const repDisplay = document.getElementById('rep-display');
const phaseTimer = document.getElementById('phase-timer');
const phaseHint = document.getElementById('phase-hint');
const quizProblem = document.getElementById('quiz-problem');
const quizAnswer = document.getElementById('quiz-answer');
const quizModeToggle = document.getElementById('quiz-mode-toggle');
const quizModeLabel = document.getElementById('quiz-mode-label');
const quizOptionsContainer = document.getElementById('quiz-options-container');
const quizOptionButtons = document.querySelectorAll('.quiz-option');
const progressBar = document.getElementById('progress-bar');
const statsTotalReps = document.getElementById('stats-total-reps');
const statsTotalWorkouts = document.getElementById('stats-total-workouts');
const statsLastDate = document.getElementById('stats-last-date');
const statsRank = document.getElementById('stats-rank');
const statsSessionReps = document.getElementById('stats-session-reps');
const statsSessionTarget = document.getElementById('stats-session-target');
const historyList = document.getElementById('history-list');
const heatmapContainer = document.getElementById('activity-heatmap');
const historyNote = document.getElementById('history-note');
const themeToggle = document.getElementById('theme-toggle');
const themeStatus = document.getElementById('theme-status');
const voiceToggle = document.getElementById('voice-toggle');
const voiceStatus = document.getElementById('voice-status');

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

const presetSelect = document.getElementById('preset-select');
const savePresetButton = document.getElementById('save-preset-button');
const deletePresetButton = document.getElementById('delete-preset-button');

const sensorToggle = document.getElementById('sensor-toggle');
const sensorCalibrateButton = document.getElementById('sensor-calibrate');
const sensorStatus = document.getElementById('sensor-status');

const confettiCanvas = document.getElementById('confetti');
const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;


// --- Application State ---
const workoutTimer = new WorkoutTimer();
let phaseStart = null;
let phaseDuration = null;
let currentPhase = Phase.IDLE;
let quizMode = 'cooperative'; // 'cooperative' or 'disruptive'
let sessionAttackBonus = 0;
let isQuizAnswered = false;
let isCurrentQuizCorrect = null;
let userSelectedOption = null;
let currentQuiz = null;
let totalSets = 3;
let repsPerSet = 10;
let currentSet = 1;
let currentRep = 1;
let isPaused = false;
let hasPaused = false;
let pausedAt = null;
let workoutStarted = false;
let workoutSaved = false;
let lastCountdownSecond = null;
let userLevel = 1;
let userBaseAp = 1;

let sensorMode = false;
let sensorActive = false;
let sensorBaseline = null;
let sensorThreshold = null;
let lastSensorCounted = false;
let lastOrientationTime = 0;

const HISTORY_KEY = 'squat-tracker-history-v1';
const MAX_HISTORY_ENTRIES = 50;
const THEME_KEY = 'squat-tracker-theme';
const VOICE_COACH_KEY = 'squat-tracker-voice';
const WORKOUT_SETTINGS_KEY = 'squat-tracker-workout-settings';
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

// --- History Logic ---

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

// --- Theme Logic ---

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

// --- Main UI Updates ---

const updateHistoryNote = () => {
  if (!historyNote) {
    return;
  }
  historyNote.textContent = isStorageAvailable
    ? '最新の記録を最大5件表示します。'
    : 'この端末では履歴の自動保存が利用できません。';
};

const renderStats = () => {
  if (!statsTotalReps || !statsTotalWorkouts || !statsLastDate || !statsRank) {
    return;
  }
  const stats = computeStats(historyEntries);
  statsTotalReps.textContent = stats.totalRepsAllTime.toLocaleString('ja-JP');
  statsTotalWorkouts.textContent = stats.totalWorkouts.toLocaleString('ja-JP');
  statsLastDate.textContent = stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate) : '--';

  // Use Level and AP instead of Rank
  userLevel = RpgSystem.calculateLevel(stats.totalRepsAllTime);
  userBaseAp = RpgSystem.calculateAttackPower(userLevel);
  statsRank.textContent = `Lv.${userLevel} (AP:${userBaseAp})`;
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
  if (currentPhase === Phase.FINISHED) {
    return getSessionTargetReps();
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

const updateActionButtonStates = () => {
  if (!startButton || !pauseButton) {
    return;
  }
  startButton.setAttribute('aria-pressed', workoutStarted ? 'true' : 'false');
  pauseButton.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
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

const updateDisplays = () => {
  setDisplay.textContent = `${currentSet} / ${totalSets}`;
  repDisplay.textContent = `${currentRep} / ${repsPerSet}`;
  phaseDisplay.textContent = currentPhase;
  updateSessionStats();
};

const performAttack = () => {
  const weaponBonus = typeof InventoryManager !== 'undefined' ? InventoryManager.getAttackBonus() : 0;

  // Use critical flag from current quiz if available
  const forceCritical = currentQuiz && currentQuiz.isCritical;

  const totalAttackPower = userBaseAp + weaponBonus + sessionAttackBonus;
  const damage = RpgSystem.calculateDamage(totalAttackPower, forceCritical);
  BossBattle.damage(damage.amount, damage.isCritical);

  // Reset session bonus after attack
  sessionAttackBonus = 0;
};

const setPhase = (phaseKey, durationSeconds, hint) => {
  currentPhase = phaseKey;
  phaseDuration = durationSeconds * 1000;
  phaseStart = Date.now();
  phaseHint.textContent = hint;

  updateQuizAndTimerDisplay(phaseKey);

  updateDisplays();
  updateTimerUI();
  lastCountdownSecond = null;

  const isCountdownPhase = (p) => p === Phase.COUNTDOWN || p === Phase.REST_COUNTDOWN;

  if (!isCountdownPhase(phaseKey)) {
    const phaseFrequency = phaseBeepFrequencies[phaseKey];
    beep(phaseFrequency ?? 880);

    if (phaseKey === Phase.DOWN) VoiceCoach.speak('しゃがんで');
    else if (phaseKey === Phase.HOLD) VoiceCoach.speak('キープ');
    else if (phaseKey === Phase.UP) VoiceCoach.speak('立って');
    else if (phaseKey === Phase.REST) VoiceCoach.speak('休憩です。深呼吸しましょう');
  }
};

const nextRepOrSet = () => {
  // Disruptive mode penalty: if answered incorrectly, repeat the rep
  if (quizMode === 'disruptive' && isCurrentQuizCorrect === false) {
    isCurrentQuizCorrect = null; // Reset for the next attempt
    showToast({ emoji: '⚠️', title: 'ペナルティ！', message: '同じ回をやり直します。' });
    startPhaseCycle();
    return;
  }

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
        performAttack();
        nextRepOrSet();
      }, upPhase.duration());
    }, holdPhase.duration());
  }, downPhase.duration());
};

const schedulePhase = (callback, durationSeconds) => {
  workoutTimer.schedule(durationSeconds, callback);
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
  renderHeatmap(historyEntries, heatmapContainer);
};

const finishWorkout = () => {
  currentPhase = Phase.FINISHED;
  phaseDuration = null;
  isPaused = false;
  phaseHint.textContent = 'お疲れさまでした！';
  updateQuizAndTimerDisplay(Phase.FINISHED);
  updateDisplays();
  phaseTimer.textContent = '00';
  progressBar.style.width = '100%';
  playCelebration();
  VoiceCoach.speak('お疲れ様でした！ナイスファイト');
  recordWorkout();

  const settings = {
    setCount: setCountInput.value,
    repCount: repCountInput.value,
    downDuration: downDurationInput.value,
    holdDuration: holdDurationInput.value,
    upDuration: upDurationInput.value,
    restDuration: restDurationInput.value,
    countdownDuration: countdownDurationInput.value,
  };
  AchievementSystem.check({
    type: 'finish',
    settings,
    sensorMode,
    hasPaused,
    historyEntries // Pass history entries for checks
  });

  DailyMissionSystem.check({
    type: 'finish',
    totalReps: totalSets * repsPerSet,
    totalSets: totalSets
  });

  launchConfetti(confettiCanvas, prefersReducedMotion);
  updateActionButtonStates();
};

const tick = () => {
  if (!phaseDuration || isPaused) {
    return;
  }
  updateTimerUI();
  const isCountdownPhase = (p) => p === Phase.COUNTDOWN || p === Phase.REST_COUNTDOWN;

  if (isCountdownPhase(currentPhase)) {
    const elapsed = Math.min(Date.now() - phaseStart, phaseDuration);
    const remaining = Math.max(phaseDuration - elapsed, 0);
    const remainingSeconds = Math.ceil(remaining / 1000);
    if (remainingSeconds !== lastCountdownSecond) {
      lastCountdownSecond = remainingSeconds;
      beep(988, 140);
      if (remainingSeconds <= 3 && remainingSeconds >= 1) {
        VoiceCoach.speak(String(remainingSeconds));
      }
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
  ensureAudioContext();
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
  updateActionButtonStates();
  updateSessionStats();
  VoiceCoach.speak('準備して。スタートします');
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
    hasPaused = true;
    pausedAt = Date.now();
    phaseHint.textContent = '一時停止中';
    pauseButton.textContent = '再開';
    workoutTimer.pause();
  } else {
    const pausedDuration = Date.now() - pausedAt;
    phaseStart += pausedDuration;
    pauseButton.textContent = '一時停止';
    workoutTimer.resume();
  }
  updateActionButtonStates();
};

const resetWorkout = () => {
  workoutTimer.cancel();
  phaseDuration = null;
  currentPhase = Phase.IDLE;
  updateQuizAndTimerDisplay(Phase.IDLE);
  sessionAttackBonus = 0; // リセット時にボーナスもクリア
  currentSet = 1;
  currentRep = 1;
  isPaused = false;
  hasPaused = false;
  workoutStarted = false;
  workoutSaved = false;
  startButton.disabled = false;
  startButton.textContent = 'スタート';
  pauseButton.textContent = '一時停止';
  updateActionButtonStates();
  phaseTimer.textContent = '05';
  phaseHint.textContent = 'スタートまでカウントダウン';
  phaseDisplay.textContent = '待機中';
  progressBar.style.width = '0%';
  updateDisplays();
  stopConfetti(confettiCanvas);
};

// --- Inputs & Settings Logic ---

const validateInput = (input) => {
  const isValid = input.checkValidity() && input.value !== '';
  if (isValid) {
    input.classList.remove('input-error');
  } else {
    input.classList.add('input-error');
  }
  return isValid;
};

const areAllInputsValid = () => {
  const inputs = [
    setCountInput,
    repCountInput,
    downDurationInput,
    holdDurationInput,
    upDurationInput,
    restDurationInput,
    countdownDurationInput,
  ];
  return inputs.every((input) => validateInput(input));
};

const updateStartButtonAvailability = () => {
  const valid = areAllInputsValid();
  if (!workoutStarted) {
    startButton.disabled = !valid;
  }
};

const saveWorkoutSettings = () => {
  if (!isStorageAvailable) return;
  if (!areAllInputsValid()) return;

  const settings = {
    setCount: setCountInput.value,
    repCount: repCountInput.value,
    downDuration: downDurationInput.value,
    holdDuration: holdDurationInput.value,
    upDuration: upDurationInput.value,
    restDuration: restDurationInput.value,
    countdownDuration: countdownDurationInput.value,
  };

  try {
    localStorage.setItem(WORKOUT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    // Ignore errors
  }
};

const loadWorkoutSettings = () => {
  if (!isStorageAvailable) return;

  try {
    const raw = localStorage.getItem(WORKOUT_SETTINGS_KEY);
    if (!raw) return;

    const settings = JSON.parse(raw);
    if (!settings || typeof settings !== 'object') return;

    if (settings.setCount) setCountInput.value = settings.setCount;
    if (settings.repCount) repCountInput.value = settings.repCount;
    if (settings.downDuration) downDurationInput.value = settings.downDuration;
    if (settings.holdDuration) holdDurationInput.value = settings.holdDuration;
    if (settings.upDuration) upDurationInput.value = settings.upDuration;
    if (settings.restDuration) restDurationInput.value = settings.restDuration;
    if (settings.countdownDuration) countdownDurationInput.value = settings.countdownDuration;
  } catch (error) {
    // Ignore errors
  }
};

const initializeWorkoutSettings = () => {
  loadWorkoutSettings();

  const inputs = [
    setCountInput,
    repCountInput,
    downDurationInput,
    holdDurationInput,
    upDurationInput,
    restDurationInput,
    countdownDurationInput,
  ];

  inputs.forEach((input) => {
    if (input) {
      input.addEventListener('input', () => {
        validateInput(input);
        updateStartButtonAvailability();
      });
      input.addEventListener('change', () => {
        if (validateInput(input)) {
          saveWorkoutSettings();
        }
        updateStartButtonAvailability();
      });
    }
    if (input) {
      validateInput(input);
    }
  });
  updateStartButtonAvailability();
};

const initializePresets = () => {
  // Pass DOM elements to PresetManager
  PresetManager.init({
    presetSelect,
    savePresetButton,
    deletePresetButton,
    // Note: PresetManager logic listens to presetSelect change and updates DOM directly
    // OR we should listen here?
    // In original code, there was a listener in initializePresets.
    // Let's attach listeners here or delegate to PresetManager completely.
    // The original code passed values to inputs.
  });

  // Re-attach listeners for inputs filling
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      const name = presetSelect.value;
      PresetManager.updateButtons();
      if (!name) return;

      const preset = PresetManager.getPreset(name);
      if (preset && preset.settings) {
        const s = preset.settings;
        if (s.setCount) setCountInput.value = s.setCount;
        if (s.repCount) repCountInput.value = s.repCount;
        if (s.downDuration) downDurationInput.value = s.downDuration;
        if (s.holdDuration) holdDurationInput.value = s.holdDuration;
        if (s.upDuration) upDurationInput.value = s.upDuration;
        if (s.restDuration) restDurationInput.value = s.restDuration;
        if (s.countdownDuration) countdownDurationInput.value = s.countdownDuration;

        // Trigger input events to validate and save current settings
        setCountInput.dispatchEvent(new Event('input'));
        setCountInput.dispatchEvent(new Event('change'));
      }
    });
  }

  if (savePresetButton) {
    savePresetButton.addEventListener('click', () => {
      const name = prompt('プリセット名を入力してください', presetSelect.value || '');
      if (name) {
        const settings = {
          setCount: setCountInput.value,
          repCount: repCountInput.value,
          downDuration: downDurationInput.value,
          holdDuration: holdDurationInput.value,
          upDuration: upDurationInput.value,
          restDuration: restDurationInput.value,
          countdownDuration: countdownDurationInput.value,
        };
        PresetManager.addPreset(name, settings);
      }
    });
  }

  if (deletePresetButton) {
    deletePresetButton.addEventListener('click', () => {
      const name = presetSelect.value;
      if (!name) return;
      if (confirm(`プリセット「${name}」を削除しますか？`)) {
        PresetManager.deletePreset(name);
      }
    });
  }
};

const initializeVoiceCoach = () => {
  VoiceCoach.init();
  if (!voiceToggle || !voiceStatus) return;

  const stored = isStorageAvailable ? localStorage.getItem(VOICE_COACH_KEY) : null;
  const enabled = stored === 'true';

  voiceToggle.checked = enabled;
  VoiceCoach.setEnabled(enabled);
  voiceStatus.textContent = enabled ? 'ON' : 'OFF';
};

const applyReducedMotionPreference = () => {
  if (!prefersReducedMotion) {
    return;
  }
  document.body.classList.toggle('reduced-motion', prefersReducedMotion.matches);
};


// --- Initialization ---

const initializeHistory = () => {
  historyEntries = loadHistoryEntries();
  renderStats();
  renderHistory();
  initHeatmap(heatmapContainer);
  renderHeatmap(historyEntries, heatmapContainer);
  updateHistoryNote();
  updateSessionStats();
};

const handleOrientation = (event) => {
  if (!sensorMode || !sensorActive) {
    return;
  }

  // Throttle sensor updates to ~20Hz (50ms) to reduce CPU usage and battery drain
  const now = Date.now();
  if (now - lastOrientationTime < 50) {
    return;
  }
  lastOrientationTime = now;

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
    performAttack();
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


// --- Quiz Logic ---

const updateQuizAndTimerDisplay = (phaseKey) => {
  // Common reset for non-active phases if needed, but we handle specific phases below.

  if (phaseKey === Phase.DOWN) {
    // New Quiz Phase
    currentQuiz = generateQuiz();
    isQuizAnswered = false;
    isCurrentQuizCorrect = null;
    userSelectedOption = null;

    quizProblem.textContent = `問題: ${currentQuiz.problemText}`;

    // Enable buttons and show options
    quizOptionButtons.forEach((btn, index) => {
      btn.textContent = currentQuiz.options[index];
      btn.disabled = false;
      btn.classList.remove('correct', 'incorrect', 'selected');
    });

    if (currentQuiz.isCritical) {
      quizProblem.classList.add('critical-quiz');
    } else {
      quizProblem.classList.remove('critical-quiz');
    }
  } else if (phaseKey === Phase.HOLD) {
    // Keep showing the problem and options
    // Nothing to change, maintain state
  } else if (phaseKey === Phase.UP) {
    // Answer Reveal Phase
    if (currentQuiz) {
      quizProblem.textContent = `問題: ${currentQuiz.problemText}`;
      quizAnswer.textContent = `答え: ${currentQuiz.correctAnswer}`;

      // Grading Logic
      const isCorrect = userSelectedOption !== null && Number(userSelectedOption) === currentQuiz.correctAnswer;
      isCurrentQuizCorrect = isCorrect;

      quizOptionButtons.forEach(btn => {
        const val = Number(btn.textContent);
        if (val === currentQuiz.correctAnswer) {
          btn.classList.add('correct');
        } else if (btn.classList.contains('selected')) {
          btn.classList.add('incorrect');
        }
        btn.disabled = true;
      });

      if (isCorrect) {
        if (quizMode === 'cooperative') {
          sessionAttackBonus += 1;
          showToast({ emoji: '⚔️', title: 'Bonus', message: `攻撃ボーナス +1 (現在: ${sessionAttackBonus})` });
        } else {
          showToast({ emoji: '⭕', title: '正解！', message: 'Nice!' });
        }
      } else {
        if (userSelectedOption === null) {
          showToast({ emoji: '❌', title: '不正解！', message: '回答が選択されませんでした。' });
        } else {
          if (quizMode === 'disruptive') {
            showToast({ emoji: '❌', title: '不正解！', message: '次のスクワットはカウントされません！' });
          } else {
            showToast({ emoji: '❌', title: '不正解！', message: '残念！' });
          }
        }
      }
    }
  } else {
    // Idle, Rest, Finished
    quizAnswer.textContent = '答え: --';
    quizProblem.textContent = '問題: --';
    quizProblem.classList.remove('critical-quiz');

    // Show disabled placeholder buttons
    quizOptionButtons.forEach(btn => {
      btn.textContent = '--';
      btn.disabled = true;
      btn.classList.remove('correct', 'incorrect', 'selected');
    });
  }
  // Ensure container is always visible (controlled by CSS)
  quizOptionsContainer.style.display = '';
};

const handleQuizAnswer = (selectedOption, button) => {
  if (!currentQuiz) return;

  userSelectedOption = selectedOption;

  quizOptionButtons.forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
};


// --- Event Listeners Setup ---

const timerInterval = setInterval(tick, 100);

if (quizModeToggle) {
  quizModeToggle.addEventListener('change', (event) => {
    if (event.target.checked) {
      quizMode = 'disruptive';
      quizModeLabel.textContent = 'お邪魔';
    } else {
      quizMode = 'cooperative';
      quizModeLabel.textContent = '協力';
    }
  });
}

quizOptionButtons.forEach(button => {
  button.addEventListener('click', () => {
    handleQuizAnswer(button.textContent, button);
  });
});

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
    if (typeof AchievementSystem !== 'undefined') {
      AchievementSystem.notify('theme_change');
    }
  });
}

if (voiceToggle) {
  voiceToggle.addEventListener('change', (event) => {
    const enabled = event.target.checked;
    VoiceCoach.setEnabled(enabled);
    if (voiceStatus) {
      voiceStatus.textContent = enabled ? 'ON' : 'OFF';
    }
    if (isStorageAvailable) {
      localStorage.setItem(VOICE_COACH_KEY, String(enabled));
    }
    // モバイルの制限解除のため、ユーザー操作時に空の音声を再生しておく
    if (enabled) {
      VoiceCoach.speak('');
    }
  });
}

if (prefersReducedMotion) {
  prefersReducedMotion.addEventListener('change', applyReducedMotionPreference);
}

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented) {
    return;
  }
  const key = event.key;
  if (key !== ' ' && key !== 'Enter') {
    return;
  }
  const target = event.target;
  if (target instanceof HTMLElement) {
    const tagName = target.tagName;
    if (
      tagName === 'INPUT'
      || tagName === 'TEXTAREA'
      || tagName === 'SELECT'
      || tagName === 'BUTTON'
      || target.isContentEditable
    ) {
      return;
    }
  }
  event.preventDefault();
  if (currentPhase === Phase.IDLE && !workoutStarted) {
    startWorkout();
    return;
  }
  if (currentPhase !== Phase.FINISHED) {
    pauseWorkout();
  }
});

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


// --- Bootstrap ---

applyReducedMotionPreference();
initializeTheme();
initializeVoiceCoach();
initializeWorkoutSettings();
initializePresets();
initializeHistory();

AchievementSystem.init({
  onHistoryTabSelected: () => {
    requestAnimationFrame(() => renderHeatmap(historyEntries, heatmapContainer));
  }
});
DataManager.init();
InventoryManager.init();
DailyMissionSystem.init();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BossBattle.init());
} else {
  BossBattle.init();
}

updateQuizAndTimerDisplay(Phase.IDLE);
updateDisplays();
updateActionButtonStates();


// --- Expose for Tests (Window) ---
if (typeof window !== 'undefined') {
  window.BossBattle = BossBattle;
  window.InventoryManager = InventoryManager;
  window.DailyMissionSystem = DailyMissionSystem;
  window.AchievementSystem = AchievementSystem;
  window.RpgSystem = RpgSystem;
  window.generateQuiz = generateQuiz;
  window.finishWorkout = finishWorkout;
  window.showToast = showToast;
  window.VoiceCoach = VoiceCoach;
  window.updateStartButtonAvailability = updateStartButtonAvailability;
}
