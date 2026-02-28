import { isStorageAvailable, showToast, playCelebration } from '../utils.js';
import { MONSTERS } from '../constants.js';
import { BuddyManager } from './buddy-manager.js';

/**
 * EggManager
 * タマゴの取得、進捗管理、孵化ロジックを管理するモジュール
 */
export const EggManager = (() => {
  const STORAGE_KEY = 'squat-tracker-egg';

  // 初期状態のタマゴ
  const DEFAULT_EGG = {
    id: 'egg-initial',
    type: 'basic',
    requiredReps: 50,
    currentReps: 0,
    status: 'incubating' // 'incubating' | 'ready' | 'hatched'
  };

  let currentEgg = null;
  let elements = {};

  /**
   * 状態を保存する
   */
  const save = () => {
    if (isStorageAvailable) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentEgg));
    }
  };

  /**
   * 状態を読み込む
   */
  const load = () => {
    if (isStorageAvailable) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          currentEgg = JSON.parse(stored);
          return;
        }
      } catch (e) {
        console.error('Failed to load egg data', e);
      }
    }
    // データがないか壊れている場合は初期タマゴをセット
    currentEgg = { ...DEFAULT_EGG, id: 'egg-' + Date.now() };
    save();
  };

  /**
   * 新しいタマゴを生成する
   * @param {number} overflowReps - 前のタマゴからの繰り越し回数
   */
  const generateNewEgg = (overflowReps = 0) => {
    // 必要な回数を50〜150の間でランダムに設定（ゲームバランス）
    const nextRequired = 50 + Math.floor(Math.random() * 100);
    currentEgg = {
      id: 'egg-' + Date.now(),
      type: 'basic',
      requiredReps: nextRequired,
      currentReps: Math.min(overflowReps, nextRequired),
      status: 'incubating'
    };

    // 繰り越しですでに孵化可能になっている場合
    if (currentEgg.currentReps >= currentEgg.requiredReps) {
      currentEgg.status = 'ready';
    }
    save();
  };

  /**
   * UI要素のバインドと初期描画
   */
  const bindUI = () => {
    elements = {
      container: document.getElementById('egg-container'),
      icon: document.getElementById('egg-icon'),
      progressText: document.getElementById('egg-progress-text'),
      progressBarFill: document.getElementById('egg-progress-fill'),
      modal: document.getElementById('egg-hatch-modal'),
      modalClose: document.getElementById('egg-modal-close'),
      hatchBtn: document.getElementById('egg-hatch-btn'),
      rewardText: document.getElementById('egg-reward-text')
    };

    if (elements.container) {
      elements.container.addEventListener('click', () => {
        if (currentEgg.status === 'ready') {
          showHatchModal();
        } else {
          showToast({ emoji: '🥚', title: 'タマゴ育成中', message: `あと${currentEgg.requiredReps - currentEgg.currentReps}回のスクワットで孵化します！` });
        }
      });
    }

    if (elements.hatchBtn) {
      elements.hatchBtn.addEventListener('click', hatch);
    }

    if (elements.modalClose) {
      elements.modalClose.addEventListener('click', closeModal);
    }
  };

  /**
   * UIの更新
   */
  const updateUI = () => {
    if (!elements.container) return;

    const { currentReps, requiredReps, status } = currentEgg;

    // プログレスバーの更新
    const progressPercent = Math.min((currentReps / requiredReps) * 100, 100);
    if (elements.progressBarFill) {
      elements.progressBarFill.style.width = `${progressPercent}%`;
    }
    if (elements.progressText) {
      elements.progressText.textContent = `${currentReps} / ${requiredReps}`;
    }

    // アイコンの更新（進捗に応じてヒビが入るなどの視覚効果を絵文字で表現）
    if (elements.icon) {
      if (status === 'ready') {
        elements.icon.textContent = '🐣'; // 孵化直前
        elements.icon.classList.add('egg-ready-animation');
      } else {
        elements.icon.classList.remove('egg-ready-animation');
        if (progressPercent >= 80) {
          elements.icon.textContent = '🥚✨';
        } else if (progressPercent >= 50) {
          elements.icon.textContent = '🥚💥'; // 代わりのヒビ表現
        } else {
          elements.icon.textContent = '🥚';
        }
      }
    }

    if (status === 'ready') {
      elements.container.classList.add('ready');
    } else {
      elements.container.classList.remove('ready');
    }
  };

  /**
   * モーダルを表示する
   */
  const showHatchModal = () => {
    if (!elements.modal) return;
    elements.modal.classList.add('active');
    elements.modal.setAttribute('aria-hidden', 'false');

    // 初期の見た目をタマゴにする
    if (elements.rewardText) {
      elements.rewardText.innerHTML = '<div class="egg-hatch-animation">🐣</div><p>タマゴが孵化しそうです...</p>';
    }

    if (elements.hatchBtn) {
      elements.hatchBtn.style.display = 'block';
      elements.hatchBtn.textContent = '割る！';
    }
  };

  /**
   * モーダルを閉じる
   */
  const closeModal = () => {
    if (!elements.modal) return;
    elements.modal.classList.remove('active');
    elements.modal.setAttribute('aria-hidden', 'true');
  };

  /**
   * 孵化処理（報酬の決定とUI更新）
   */
  const hatch = () => {
    if (currentEgg.status !== 'ready') return;

    // 報酬を決定 (MONSTERS からランダムなバディを付与するか、経験値を付与する)
    const isNewBuddy = Math.random() < 0.7; // 70%の確率で新しいバディ
    let rewardTextHtml = '';

    if (isNewBuddy) {
      // 最初のいくつかの基本モンスターから選ぶ（ボスなどを除く）
      const basicMonsters = MONSTERS.slice(0, 5);
      const randomMonster = basicMonsters[Math.floor(Math.random() * basicMonsters.length)];

      // BuddyManagerの内部API(_forceAdd等)は使わず、checkDrop相当の付与を行うか、
      // ここでは仕様上「既存のバディリストからランダムに1体を獲得」するため、
      // BuddyManagerに直接バディを追加するメソッドがない場合は、内部の_forceAddを使うか、
      // 一旦「タマゴからの付与」として _forceAdd を呼び出す。
      // (本来は addBuddy を公開するべきだが、今回は既存関数を利用)
      const monsterIndex = MONSTERS.findIndex(m => m.name === randomMonster.name);
      if (monsterIndex !== -1) {
         BuddyManager._forceAdd(monsterIndex);
      }

      rewardTextHtml = `
        <div class="egg-hatch-result-animation">${randomMonster.emoji}</div>
        <h3>おめでとう！</h3>
        <p>新しいバディ <strong>${randomMonster.name}</strong> が誕生しました！</p>
      `;
    } else {
      // 現在のバディに経験値ボーナス
      const expBonus = 50;
      const currentBuddy = BuddyManager.getCurrentBuddy();
      if (currentBuddy) {
        BuddyManager.addExp(expBonus);
        rewardTextHtml = `
          <div class="egg-hatch-result-animation">✨</div>
          <h3>おめでとう！</h3>
          <p>装備中のバディに <strong>経験値 ${expBonus}</strong> が付与されました！</p>
        `;
      } else {
        // バディ未装備の場合は適当なモンスターを付与
        const firstMonster = MONSTERS[0];
        BuddyManager._forceAdd(0);
        rewardTextHtml = `
          <div class="egg-hatch-result-animation">${firstMonster.emoji}</div>
          <h3>おめでとう！</h3>
          <p>初めてのバディ <strong>${firstMonster.name}</strong> が誕生しました！</p>
        `;
      }
    }

    playCelebration();

    if (elements.rewardText) {
      elements.rewardText.innerHTML = rewardTextHtml;
    }

    if (elements.hatchBtn) {
      elements.hatchBtn.style.display = 'none';
    }

    // 状態を更新して次のタマゴをセット
    const overflowReps = currentEgg.currentReps - currentEgg.requiredReps;
    currentEgg.status = 'hatched';
    save();

    // 次のタマゴを生成（超過分を繰り越し）
    setTimeout(() => {
      generateNewEgg(overflowReps > 0 ? overflowReps : 0);
      updateUI();
    }, 2000); // すぐに切り替わらないよう少し待つ
  };

  /**
   * 進捗を追加する
   * @param {number} reps - 追加するスクワット回数
   */
  const addProgress = (reps) => {
    if (typeof reps !== 'number' || reps <= 0) return;
    if (currentEgg.status === 'hatched') return; // すでに孵化している場合は何もしない（通常ありえないが念のため）

    currentEgg.currentReps += reps;

    if (currentEgg.currentReps >= currentEgg.requiredReps) {
      currentEgg.status = 'ready';
      // もしワークアウト完了時に孵化可能になったら自動でモーダルを開くことも可能
      // setTimeout(() => showHatchModal(), 1000);
    }

    save();
    updateUI();
  };

  /**
   * 現在のタマゴの状態を取得する
   */
  const getEggStatus = () => {
    return { ...currentEgg };
  };

  /**
   * 初期化
   */
  const init = () => {
    load();
    bindUI();
    updateUI();
  };

  return {
    init,
    addProgress,
    getEggStatus,
    showHatchModal // 外部（テスト等）から呼べるように
  };
})();
