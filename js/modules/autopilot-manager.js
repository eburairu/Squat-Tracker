import { FortuneManager } from './fortune-manager.js';
import { LoadoutManager } from './loadout-manager.js';
import { SmartMissionRoutine } from './smart-mission-routine.js';
import { showToast, getLocalDateKey } from '../utils.js';

export const AutopilotManager = {
  startOptimalSession(startWorkoutCallback) {
    try {
      // 1. 運試し
      if (FortuneManager.state.lastDrawDate !== getLocalDateKey() || !FortuneManager.state.result) {
        FortuneManager.draw();
      }

      // 2. 最強装備の適用
      LoadoutManager.optimizeLoadout();

      // 3. 最適なメニューの算出と設定
      const routine = SmartMissionRoutine.calculateOptimalRoutine();
      if (routine) {
        const setCountInput = document.getElementById('set-count');
        const repCountInput = document.getElementById('rep-count');

        if (setCountInput && repCountInput) {
          setCountInput.value = routine.sets;
          repCountInput.value = routine.reps;

          setCountInput.dispatchEvent(new Event('input', { bubbles: true }));
          setCountInput.dispatchEvent(new Event('change', { bubbles: true }));
          repCountInput.dispatchEvent(new Event('input', { bubbles: true }));
          repCountInput.dispatchEvent(new Event('change', { bubbles: true }));

          showToast({
            emoji: '🤖',
            title: 'オートパイロット作動',
            message: `ミッション達成に必要な最小回数をセットしました\n（${routine.sets}セット × ${routine.reps}回）`
          });
        }
      } else {
         showToast({
            emoji: '🤖',
            title: 'オートパイロット作動',
            message: 'ミッションは完了済みです。現在の設定で開始します。'
         });
      }

    } catch (e) {
      console.error('AutopilotManager error:', e);
      // エラー発生時も進行を止めない
    }

    // 4. ワークアウトの開始（視覚的フィードバックのため少し遅延）
    setTimeout(() => {
      if (typeof startWorkoutCallback === 'function') {
        startWorkoutCallback();
      }
    }, 600);
  }
};
