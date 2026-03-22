import { showToast } from '../utils.js';

export const SafetyTempoGuard = {
  elements: {
    alertContainer: null,
    alertMessage: null,
    applySafeButton: null,
    downInput: null,
    holdInput: null,
    upInput: null,
  },

  init() {
    this.elements.alertContainer = document.getElementById('tempo-guard-alert');
    this.elements.alertMessage = document.getElementById('tempo-guard-message');
    this.elements.applySafeButton = document.getElementById('apply-safe-tempo-btn');

    this.elements.downInput = document.getElementById('down-duration');
    this.elements.holdInput = document.getElementById('hold-duration');
    this.elements.upInput = document.getElementById('up-duration');

    if (!this.elements.alertContainer || !this.elements.downInput) {
      console.warn('SafetyTempoGuard: 必要なDOM要素が見つかりません。');
      return;
    }

    // イベントリスナーの登録
    const checkTempo = () => this.evaluateTempo();

    this.elements.downInput.addEventListener('input', checkTempo);
    this.elements.downInput.addEventListener('change', checkTempo);
    this.elements.holdInput.addEventListener('input', checkTempo);
    this.elements.holdInput.addEventListener('change', checkTempo);
    this.elements.upInput.addEventListener('input', checkTempo);
    this.elements.upInput.addEventListener('change', checkTempo);

    this.elements.applySafeButton.addEventListener('click', () => {
      this.applySafeTempo();
    });

    // 初期評価
    this.evaluateTempo();
  },

  evaluateTempo() {
    const downVal = parseInt(this.elements.downInput.value, 10);
    const holdVal = parseInt(this.elements.holdInput.value, 10);
    const upVal = parseInt(this.elements.upInput.value, 10);

    // 無効な値の場合は評価をスキップ
    if (isNaN(downVal) || isNaN(holdVal) || isNaN(upVal)) {
      this.hideAlert();
      return;
    }

    const totalDuration = downVal + holdVal + upVal;
    let warningMessage = '';

    // 条件判定（優先度順）
    if (downVal === 1) {
      warningMessage = 'しゃがむスピードが速すぎます！膝への負担を減らすため、2秒以上かけてゆっくりしゃがむことを推奨します。';
    } else if (totalDuration <= 3) {
      warningMessage = '動作テンポが速すぎます。フォーム崩れや怪我を防ぐため、1回あたり4秒以上かける設定を推奨します。';
    }

    if (warningMessage) {
      this.showAlert(warningMessage);
    } else {
      this.hideAlert();
    }
  },

  showAlert(message) {
    if (!this.elements.alertContainer) return;
    this.elements.alertMessage.textContent = message;
    this.elements.alertContainer.style.display = 'block';
  },

  hideAlert() {
    if (!this.elements.alertContainer) return;
    this.elements.alertContainer.style.display = 'none';
  },

  applySafeTempo() {
    if (!this.elements.downInput) return;

    this.elements.downInput.value = 2;
    this.elements.holdInput.value = 1;
    this.elements.upInput.value = 1;

    // input, changeイベントを発火させ、他の処理（バリデーションや自動保存）を連動させる
    [this.elements.downInput, this.elements.holdInput, this.elements.upInput].forEach(input => {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    this.hideAlert();
    showToast({ emoji: '🛡️', title: '安全テンポ適用', message: '怪我を防ぐ推奨設定(2-1-1)に変更しました。' });
  }
};