import { SmartMissionRoutine } from './smart-mission-routine.js';
import { LoadoutManager } from './loadout-manager.js';
import { BossBattle } from './boss-battle.js';
import { DataManager } from './data-manager.js';
import { ClassManager } from './class-manager.js';
import { TitleManager } from './title-manager.js';
import { showToast } from '../utils.js';

export const DailyDirector = {
  elements: {
    container: null,
    setsEl: null,
    repsEl: null,
    messageEl: null,
    startBtn: null
  },

  state: {
    recommendedSets: 3,
    recommendedReps: 10,
    message: ''
  },

  init() {
    this.elements.container = document.getElementById('daily-director-container');
    this.elements.setsEl = document.getElementById('director-sets');
    this.elements.repsEl = document.getElementById('director-reps');
    this.elements.messageEl = document.getElementById('director-message');
    this.elements.startBtn = document.getElementById('director-start-btn');

    if (this.elements.startBtn) {
      this.elements.startBtn.addEventListener('click', () => {
        this.applyAndStart();
      });
    }
  },

  /**
   * 推奨メニューを計算し、画面に表示する
   */
  evaluateAndShow() {
    if (!this.elements.container) return;

    // 1. ミッションから必要最小回数を取得
    const missionRoutine = SmartMissionRoutine.calculateOptimalRoutine();

    // 2. 過去の履歴からベース負荷を計算（SmartPlannerのロジックを参考）
    let baseSets = 3;
    let baseReps = 10;
    const history = (DataManager && DataManager.data && DataManager.data.history) ? DataManager.data.history : [];

    if (history.length > 0) {
      const recent = history.slice(0, 3);
      const sumReps = recent.reduce((acc, entry) => acc + (entry.totalReps || 0), 0);
      const avgTotal = Math.floor(sumReps / recent.length);
      // 平均回数が少なすぎる場合は補正
      const adjustedTotal = Math.max(avgTotal, 10);

      if (adjustedTotal <= 15) {
         baseSets = 2;
      } else if (adjustedTotal > 30) {
         baseSets = 4;
      }
      baseReps = Math.max(5, Math.ceil(adjustedTotal / baseSets));
    }

    // 3. ボスのHPから必要ダメージを推定
    let neededForBoss = 0;
    if (BossBattle.state && BossBattle.state.currentMonster) {
       // 雑な推定：現在のベース攻撃力
       const baseAp = 1; // 基礎
       const classMod = ClassManager.getModifiers().attack;
       const titleMod = TitleManager.getActiveSynergies().reduce((sum, syn) => sum + (syn.effects.attack || 0), 0);
       // 装備ボーナスはここでは不確定（最強装備を適用「前」なので）だが、最小値として扱う
       const estimatedAp = baseAp + classMod + titleMod;

       const remainingHp = BossBattle.state.currentMonster.currentHp;
       // 1発あたり推定APダメージとして何回必要か
       const estimatedRepsForBoss = Math.ceil(remainingHp / Math.max(1, estimatedAp));
       neededForBoss = estimatedRepsForBoss;
    }

    // 4. メニューの決定
    let finalSets = baseSets;
    let finalReps = baseReps;
    let message = '日々の継続が力になります。いつものペースで。';

    if (missionRoutine) {
       // ミッションがある場合はミッション優先（上限クリップあり）
       finalSets = missionRoutine.sets;
       finalReps = missionRoutine.reps;
       message = '未達成のミッションとビンゴをクリアするのに最適なメニューです。';

       // ボスも倒せそうな場合
       if (neededForBoss > 0 && neededForBoss <= (finalSets * finalReps)) {
          message = 'このメニューでミッション達成とボス撃破が同時に狙えます！';
       } else if (neededForBoss > 0 && neededForBoss <= (finalSets * finalReps) * 1.5) {
          // 少し頑張れば倒せる
          const extraTotal = neededForBoss;
          let extraSets = Math.ceil(extraTotal / finalReps);
          if (extraSets <= 5) {
             finalSets = extraSets;
             message = 'あと少し頑張ればボスを倒せます！ミッションと共に撃破しましょう。';
          }
       }
    } else {
       // ミッション完了済み
       if (neededForBoss > 0 && neededForBoss <= 50) {
          // ボスが倒せそうな範囲ならボス討伐メニュー
          const total = neededForBoss;
          finalSets = Math.max(1, Math.min(5, Math.ceil(total / 10)));
          finalReps = Math.max(5, Math.ceil(total / finalSets));
          message = 'ミッションは完了済みです。今日はボスを倒し切りましょう！';
       } else {
          message = 'ミッションは全て完了しています！現状維持のメニューです。';
       }
    }

    // 上限・下限の安全措置
    this.state.recommendedSets = Math.max(1, Math.min(10, finalSets));
    this.state.recommendedReps = Math.max(1, Math.min(50, finalReps));
    this.state.message = message;

    // 描画
    this.elements.setsEl.textContent = this.state.recommendedSets;
    this.elements.repsEl.textContent = this.state.recommendedReps;
    this.elements.messageEl.textContent = this.state.message;

    // 表示
    this.elements.container.style.display = 'block';
  },

  /**
   * 推奨メニューをフォームに適用し、最強装備に着替えてワークアウトを開始する
   */
  applyAndStart() {
    // 1. フォームへの適用
    const setCountInput = document.getElementById('set-count');
    const repCountInput = document.getElementById('rep-count');

    if (setCountInput && repCountInput) {
      setCountInput.value = this.state.recommendedSets;
      repCountInput.value = this.state.recommendedReps;

      setCountInput.dispatchEvent(new Event('input', { bubbles: true }));
      setCountInput.dispatchEvent(new Event('change', { bubbles: true }));
      repCountInput.dispatchEvent(new Event('input', { bubbles: true }));
      repCountInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 2. 最強装備の適用
    if (typeof LoadoutManager.optimizeLoadout === 'function') {
      LoadoutManager.optimizeLoadout(false); // false = don't show toast to avoid spam
    }

    // 3. スタートボタンのクリック（app.js側のロジックに乗せる）
    const startBtn = document.getElementById('start-button');
    if (startBtn) {
       showToast({
          emoji: '⚡️',
          title: 'Daily Director',
          message: '最適メニューと最強装備を適用して開始します！'
       });

       // パネルを非表示にする（邪魔にならないように）
       if (this.elements.container) {
          this.elements.container.style.display = 'none';
       }

       // 少し遅延させてからスタート（Toastを見せるため）
       setTimeout(() => {
          startBtn.click();
       }, 500);
    }
  }
};
