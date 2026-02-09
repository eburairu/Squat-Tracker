import { TensionManager } from './tension-manager.js';

export const ComboSystem = {
  currentCombo: 0,
  maxCombo: 0,
  comboDisplay: null,

  init() {
    this.comboDisplay = document.getElementById('combo-display');
    this.updateUI();
  },

  increment() {
    this.currentCombo++;
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }

    // 10コンボごとにテンションボーナス
    if (this.currentCombo > 0 && this.currentCombo % 10 === 0) {
      if (typeof TensionManager !== 'undefined') {
        TensionManager.add(5);
      }
    }

    this.updateUI();
    this.triggerEffect();
  },

  reset() {
    if (this.currentCombo > 0) {
      this.currentCombo = 0;
      this.updateUI();
    }
  },

  getMultiplier() {
    // 1コンボにつき +1% (0.01)
    // 最大 +50% (1.5倍)
    const bonus = Math.min(this.currentCombo * 0.01, 0.5);
    return 1 + bonus;
  },

  updateUI() {
    if (!this.comboDisplay) return;

    this.comboDisplay.textContent = `${this.currentCombo} Combo!`;

    // コンボが0の場合は非表示
    if (this.currentCombo > 0) {
      this.comboDisplay.classList.add('active');
      this.comboDisplay.style.opacity = '1';
    } else {
      this.comboDisplay.classList.remove('active', 'pulse');
      this.comboDisplay.style.opacity = '0';
    }
  },

  triggerEffect() {
    if (!this.comboDisplay) return;

    // アニメーション再開のためのトリック
    this.comboDisplay.classList.remove('pulse');
    void this.comboDisplay.offsetWidth; // trigger reflow
    this.comboDisplay.classList.add('pulse');
  }
};
