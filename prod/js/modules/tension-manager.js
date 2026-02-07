import { showToast } from '../utils.js';

export const TensionManager = {
  value: 0,
  maxValue: 100,
  isActive: false,
  boostDuration: 30000, // 30秒
  timerId: null,

  // DOM要素
  valueElement: null,
  barElement: null,
  containerElement: null,

  init() {
    this.valueElement = document.getElementById('tension-value');
    this.barElement = document.getElementById('tension-bar');
    this.containerElement = document.getElementById('tension-container');
    this.updateUI();
  },

  add(amount) {
    if (this.isActive) {
      return; // ブースト中は増加させない
    }

    this.value = Math.min(this.value + amount, this.maxValue);
    this.updateUI();

    if (this.value >= this.maxValue) {
      this.activate();
    }
  },

  activate() {
    if (this.isActive) return;

    this.isActive = true;
    document.body.classList.add('boost-mode');

    showToast({
      emoji: '🔥',
      title: 'BOOST START!',
      message: '30秒間、攻撃力1.5倍！'
    });

    if (this.timerId) clearTimeout(this.timerId);

    this.timerId = setTimeout(() => {
      this.deactivate();
    }, this.boostDuration);

    this.updateUI();
  },

  deactivate() {
    this.isActive = false;
    this.value = 0;
    document.body.classList.remove('boost-mode');

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    // オプション: 終了通知
    // showToast({ emoji: '💨', title: 'Boost End', message: '通常モードに戻ります' });

    this.updateUI();
  },

  reset() {
    this.deactivate();
  },

  updateUI() {
    if (!this.valueElement || !this.barElement) return;

    const percentage = Math.floor((this.value / this.maxValue) * 100);

    this.valueElement.textContent = this.isActive ? 'BOOST!' : `${percentage}%`;
    this.barElement.style.width = `${percentage}%`;

    if (this.isActive) {
      this.barElement.parentElement.classList.add('boost-active-track');
    } else {
      this.barElement.parentElement.classList.remove('boost-active-track');
    }
  },

  getMultiplier() {
    return this.isActive ? 1.5 : 1.0;
  }
};
