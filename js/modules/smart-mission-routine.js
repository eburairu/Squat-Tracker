import { DailyMissionSystem } from './daily-mission.js';
import { BingoManager } from './bingo-manager.js';
import { showToast } from '../utils.js';

export const SmartMissionRoutine = {
  calculateOptimalRoutine() {
    let targetReps = 0;
    let targetSets = 0;

    // Daily Mission の未達成分を抽出
    if (DailyMissionSystem.state && Array.isArray(DailyMissionSystem.state.missions)) {
      DailyMissionSystem.state.missions.forEach(mission => {
        if (!mission.completed) {
          const remaining = mission.target - mission.current;
          if (remaining > 0) {
            if (mission.type === 'total_reps') {
              targetReps = Math.max(targetReps, remaining);
            } else if (mission.type === 'total_sets') {
              targetSets = Math.max(targetSets, remaining);
            }
          }
        }
      });
    }

    // Bingo の未達成分を抽出
    if (BingoManager.state && Array.isArray(BingoManager.state.cells)) {
      BingoManager.state.cells.forEach(cell => {
        if (!cell.completed) {
          const remaining = cell.target - cell.current;
          if (remaining > 0) {
            if (cell.type === 'total_reps') {
              targetReps = Math.max(targetReps, remaining);
            } else if (cell.type === 'total_calories') {
                // total_calories の target は 0.5 rep として計算されている前提。
                // したがって必要回数 = target / 0.5 = target * 2
                // すでに消費した calories(current) も回数に換算
                const repsForCalories = Math.ceil(remaining * 2);
                targetReps = Math.max(targetReps, repsForCalories);
            }
          }
        }
      });
    }

    // すべて達成済みの場合
    if (targetReps <= 0 && targetSets <= 0) {
      return null;
    }

    // デフォルトの設定（Target Setsが指定されていない場合）
    if (targetSets === 0) {
      targetSets = 3;
    }

    // Target Repsが指定されていない場合（セット数ミッションのみ残っている等）
    if (targetReps === 0) {
      targetReps = targetSets * 10; // デフォルト1セット10回として計算
    }

    let repsPerSet = Math.ceil(targetReps / targetSets);

    // 1セットあたりの回数が5回未満になる場合はセット数を減らすか、1セット5回に調整する
    if (repsPerSet < 5 && targetSets > 1) {
        // DailyMission で targetSets の下限が固定されている場合、セット数は減らせないので、1セットあたりの回数を最低5にする
        repsPerSet = 5;
    }

    // 1セットあたりの回数が多すぎる(50回を超える)場合の補正
    while (repsPerSet > 50) {
      targetSets += 1;
      repsPerSet = Math.ceil(targetReps / targetSets);
    }

    // HTML input の制約に対するクリッピング
    const finalSets = Math.max(1, Math.min(10, targetSets));
    const finalReps = Math.max(1, Math.min(50, repsPerSet));

    return { sets: finalSets, reps: finalReps };
  },

  apply() {
    const routine = this.calculateOptimalRoutine();

    if (!routine) {
      showToast({
        emoji: '🎉',
        title: 'すべて達成済み',
        message: 'デイリーミッションとビンゴはすべてクリアしています！'
      });
      return;
    }

    const setCountInput = document.getElementById('set-count');
    const repCountInput = document.getElementById('rep-count');

    if (setCountInput && repCountInput) {
      setCountInput.value = routine.sets;
      repCountInput.value = routine.reps;

      // React / アプリ側の更新イベントを発火させる
      setCountInput.dispatchEvent(new Event('input', { bubbles: true }));
      setCountInput.dispatchEvent(new Event('change', { bubbles: true }));
      repCountInput.dispatchEvent(new Event('input', { bubbles: true }));
      repCountInput.dispatchEvent(new Event('change', { bubbles: true }));

      showToast({
        emoji: '🎯',
        title: 'ミッション一括設定',
        message: `ミッション達成に必要な最小回数を設定しました\n（${routine.sets}セット × ${routine.reps}回）`
      });

      // 画面のワークアウトカードまでスクロールする
      const workoutCard = document.querySelector('.workout-card');
      if (workoutCard) {
        workoutCard.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },

  init() {
    const button = document.getElementById('smart-mission-routine-button');
    if (button) {
      button.addEventListener('click', () => {
        this.apply();
      });
    }
  }
};
