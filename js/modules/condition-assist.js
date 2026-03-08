import { showToast } from '../utils.js';
import { VoiceCoach } from './voice-coach.js';

export const ConditionAssist = (() => {
  let state = {
    hasAssisted: false,
    currentProposal: null,
  };

  let elements = {
    modal: null,
    message: null,
    applyBtn: null,
    skipBtn: null,
  };

  let callbacks = {
    onApply: null,
    onSkip: null,
  };

  const init = ({ onApply, onSkip }) => {
    callbacks.onApply = onApply;
    callbacks.onSkip = onSkip;

    elements.modal = document.getElementById('condition-assist-modal');
    elements.message = document.getElementById('condition-assist-message');
    elements.applyBtn = document.getElementById('apply-assist-btn');
    elements.skipBtn = document.getElementById('skip-assist-btn');

    if (elements.applyBtn) {
      elements.applyBtn.addEventListener('click', () => {
        if (state.currentProposal && callbacks.onApply) {
          callbacks.onApply(state.currentProposal);
          showToast({ emoji: '💆', title: 'アシスト', message: '目標を調整しました。無理せずいきましょう！' });
        }
        closeModal();
      });
    }

    if (elements.skipBtn) {
      elements.skipBtn.addEventListener('click', () => {
        if (callbacks.onSkip) {
          callbacks.onSkip();
        }
        closeModal();
      });
    }
  };

  const reset = () => {
    state.hasAssisted = false;
    state.currentProposal = null;
  };

  const evaluate = (sessionState, performanceData) => {
    // すでにアシスト済みなら発動しない
    if (state.hasAssisted) {
      return false;
    }

    const { totalSets, repsPerSet, currentSet } = sessionState;
    const { cumulativePauseDuration, ghostDiff, quizSessionCorrect, quizSessionTotal } = performanceData;

    // 残りが1セット未満ならアシスト不要
    if (currentSet >= totalSets && totalSets > 1) {
        return false;
    }

    let score = 0;

    // 1. ポーズ時間が長い（10秒 = 10000ms 以上）
    if (cumulativePauseDuration >= 10000) {
      score += 2;
    }

    // 2. ゴーストより大きく遅れている（-5.0% 以下）
    if (ghostDiff !== null && ghostDiff <= -0.05) {
      score += 2;
    }

    // 3. クイズ正答率が低い（50%未満）
    if (quizSessionTotal > 0) {
      const accuracy = quizSessionCorrect / quizSessionTotal;
      if (accuracy < 0.5) {
        score += 1;
      }
    }

    // スコア3以上で提案
    if (score >= 3) {
      let proposal = null;

      // セット数を減らせる場合
      if (totalSets > currentSet) {
        proposal = {
          type: 'reduce_sets',
          newTotalSets: currentSet + 1, // 次のセットで終わりにする
          message: `今日は少しお疲れのようですね。\n無理をせず、目標を「${totalSets}セット」から「${currentSet + 1}セット」に変更しますか？`,
        };
      }
      // セット数が減らせない場合は回数を減らす
      else if (repsPerSet > 5) {
        const newReps = Math.max(5, Math.floor(repsPerSet / 2));
        proposal = {
          type: 'reduce_reps',
          newRepsPerSet: newReps,
          message: `今日は少しお疲れのようですね。\n無理をせず、次セットの目標回数を「${repsPerSet}回」から「${newReps}回」に減らしますか？`,
        };
      }

      if (proposal) {
        state.currentProposal = proposal;
        state.hasAssisted = true;
        return true;
      }
    }

    return false;
  };

  const showModal = () => {
    if (!elements.modal || !state.currentProposal) return;

    elements.message.textContent = state.currentProposal.message;
    elements.modal.classList.add('active');
    elements.modal.setAttribute('aria-hidden', 'false');

    // 音声での案内
    VoiceCoach.speak('今日は少しお疲れのようですね。無理せず、目標を減らしますか？');
  };

  const closeModal = () => {
    if (!elements.modal) return;
    elements.modal.classList.remove('active');
    elements.modal.setAttribute('aria-hidden', 'true');
  };

  return {
    init,
    reset,
    evaluate,
    showModal,
    closeModal,
    // テスト用に内部状態を公開
    _getState: () => state
  };
})();
