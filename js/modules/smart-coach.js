import { STORAGE_KEYS } from '../constants.js';

export const SmartCoach = {
  containerId: 'smart-coach-container',

  init() {
    this.checkAndSuggest();
  },

  checkAndSuggest() {
    if (!this.shouldShowToday()) {
      return;
    }

    const historyRaw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!historyRaw) return;

    let historyEntries = [];
    try {
      historyEntries = JSON.parse(historyRaw);
    } catch (e) {
      console.warn('Failed to parse history entries for SmartCoach', e);
      return;
    }

    if (!Array.isArray(historyEntries) || historyEntries.length === 0) {
      return; // 履歴がない場合は提案しない
    }

    const suggestion = this.analyzeHistory(historyEntries);
    if (suggestion) {
      this.renderBanner(suggestion);
    }
  },

  shouldShowToday() {
    const lastSuggestRaw = localStorage.getItem(STORAGE_KEYS.COACH_SUGGEST);
    if (!lastSuggestRaw) return true;

    const todayStr = new Date().toDateString();
    return lastSuggestRaw !== todayStr;
  },

  markAsShownToday() {
    localStorage.setItem(STORAGE_KEYS.COACH_SUGGEST, new Date().toDateString());
  },

  analyzeHistory(entries) {
    // 直近の記録を取得
    const recentEntries = entries.slice(0, 3);
    if (recentEntries.length < 3) {
      return null; // 履歴が足りない場合は提案しない
    }

    // 簡易的な判定ロジック: 直近3回連続で同じ回数をこなしているか？
    const firstRepCount = recentEntries[0].totalReps;
    const isConsecutiveSame = recentEntries.every(entry => entry.totalReps === firstRepCount && firstRepCount > 0);

    // 連続で高負荷（例：50回以上）をこなしている場合はRecoveryを提案
    const isConsistentlyHigh = recentEntries.every(entry => entry.totalReps >= 50);

    if (isConsistentlyHigh) {
      return {
        type: 'recovery',
        message: '連日高負荷のトレーニングお疲れ様です！今日は筋肉を休ませるために、アクティブリカバリー（休養）モードで軽く身体を動かしませんか？',
        action: 'リカバリーモードをONにする',
        apply: () => {
          const recoveryToggle = document.getElementById('active-recovery-toggle');
          if (recoveryToggle && !recoveryToggle.checked) {
            recoveryToggle.click(); // 安全のためDOMイベント経由で発火させる
          } else if (window.ActiveRecovery) {
            window.ActiveRecovery.toggle(true);
          }
        }
      };
    }

    if (isConsecutiveSame) {
      const currentSets = recentEntries[0].totalSets || 3;
      const currentRepsPerSet = recentEntries[0].repsPerSet || Math.floor(firstRepCount / currentSets);

      const newSets = currentSets;
      const newRepsPerSet = currentRepsPerSet + 2; // 負荷を少し上げる

      return {
        type: 'overload',
        message: `最近調子が良さそうですね！前回と同じ回数を安定してこなせています。今日は少しだけ負荷を上げて「${newSets}セット × ${newRepsPerSet}回」に挑戦してみませんか？`,
        action: '提案を適用する',
        apply: () => {
          const setCountInput = document.getElementById('set-count');
          const repCountInput = document.getElementById('rep-count');
          if (setCountInput && repCountInput) {
            setCountInput.value = newSets;
            repCountInput.value = newRepsPerSet;
            setCountInput.dispatchEvent(new Event('input', { bubbles: true }));
            setCountInput.dispatchEvent(new Event('change', { bubbles: true }));
            repCountInput.dispatchEvent(new Event('input', { bubbles: true }));
            repCountInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      };
    }

    return null;
  },

  renderBanner(suggestion) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="smart-coach-banner active">
        <div class="smart-coach-header">
          <span class="smart-coach-icon">🧑‍🏫</span>
          <strong>スマートコーチからの提案</strong>
          <button class="smart-coach-close" aria-label="閉じる">&times;</button>
        </div>
        <div class="smart-coach-body">
          <p>${suggestion.message}</p>
          <button class="btn primary small smart-coach-apply">${suggestion.action}</button>
        </div>
      </div>
    `;

    const closeBtn = container.querySelector('.smart-coach-close');
    const applyBtn = container.querySelector('.smart-coach-apply');

    closeBtn.addEventListener('click', () => {
      this.closeBanner(container);
    });

    applyBtn.addEventListener('click', () => {
      suggestion.apply();
      this.closeBanner(container);

      // トースト通知（showToastがあれば）
      if (typeof window.showToast === 'function') {
        window.showToast({
           emoji: '✅',
           title: 'コーチの提案を適用',
           message: 'メニューがセットされました！今日も頑張りましょう。'
        });
      }
    });
  },

  closeBanner(container) {
    const banner = container.querySelector('.smart-coach-banner');
    if (banner) {
      banner.classList.remove('active');
      setTimeout(() => {
        container.innerHTML = '';
      }, 300); // CSSトランジションの完了を待つ
    }
    this.markAsShownToday();
  }
};