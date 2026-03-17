import { STORAGE_KEYS, MONSTERS } from '../constants.js';
import { isStorageAvailable, showToast, playCelebration } from '../utils.js';
import { BuddyManager } from './buddy-manager.js';

export const EggManager = (() => {
  let state = {
    currentReps: 0,
    requiredReps: 100,
    hatchedCount: 0
  };

  const load = () => {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EGG);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.currentReps === 'number') state.currentReps = parsed.currentReps;
        if (typeof parsed.requiredReps === 'number') state.requiredReps = parsed.requiredReps;
        if (typeof parsed.hatchedCount === 'number') state.hatchedCount = parsed.hatchedCount;
      }
    } catch (e) {
      console.error('Failed to load egg state', e);
    }
  };

  const save = () => {
    if (!isStorageAvailable) return;
    localStorage.setItem(STORAGE_KEYS.EGG, JSON.stringify(state));
  };

  const render = () => {
    const tracker = document.getElementById('egg-tracker');
    if (!tracker) return;

    const emojiEl = document.getElementById('egg-emoji');
    const progressBar = document.getElementById('egg-progress-bar');
    const progressText = document.getElementById('egg-progress-text');

    if (emojiEl) {
      // 孵化回数に応じて少し見た目を変えたりも可能だが今回は固定
      emojiEl.textContent = '🥚';
    }

    if (progressBar && progressText) {
      const percent = Math.min((state.currentReps / state.requiredReps) * 100, 100);
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${state.currentReps} / ${state.requiredReps}`;
    }
  };

  const hatch = () => {
    // ランダムなモンスターを選ぶ
    const monsterKeys = Object.keys(MONSTERS);
    const randomIndex = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];

    // BuddyManagerのテスト用強制追加メソッドを使って追加
    BuddyManager._forceAdd(randomIndex);
    const monster = MONSTERS[randomIndex];

    state.hatchedCount += 1;

    // UI Animation
    const tracker = document.getElementById('egg-tracker');
    const emojiEl = document.getElementById('egg-emoji');
    if (tracker && emojiEl) {
      emojiEl.classList.remove('hatching');
      // リフローを強制してアニメーションを再トリガー
      void emojiEl.offsetWidth;
      emojiEl.classList.add('hatching');
    }

    showToast({
      emoji: '🐣',
      title: '卵が孵った！',
      message: `バディの卵から ${monster.emoji} ${monster.name} が生まれた！\n装備画面から確認しよう。`,
      sound: true
    });
    playCelebration();
  };

  const init = () => {
    load();
    render();
  };

  const addReps = (amount) => {
    if (amount <= 0) return;

    state.currentReps += amount;

    // 複数回孵化する可能性を考慮してwhileで回す
    while (state.currentReps >= state.requiredReps) {
      state.currentReps -= state.requiredReps;
      hatch();
    }

    save();
    render();
  };

  return {
    init,
    addReps,
    // テスト・デバッグ用
    _getState: () => state,
    _reset: () => {
      state = { currentReps: 0, requiredReps: 100, hatchedCount: 0 };
      save();
      render();
    }
  };
})();
