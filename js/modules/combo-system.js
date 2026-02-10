import { beep } from '../utils.js';

export const ComboSystem = {
  value: 0,
  maxCombo: 0,
  container: null,
  countElement: null,
  labelElement: null,

  init() {
    this.container = document.getElementById('combo-container');
    this.countElement = document.getElementById('combo-count');
    this.labelElement = document.getElementById('combo-label');
    this.value = 0;
    this.updateUI(false);
  },

  increment() {
    this.value++;
    if (this.value > this.maxCombo) {
      this.maxCombo = this.value;
    }

    // Play sound based on combo count
    const pitch = 440 + (this.value * 20);
    if (this.value > 1) {
        beep(Math.min(pitch, 1200), 80, 'sine');
    }

    this.updateUI(true);
  },

  reset() {
    if (this.value >= 5) {
      this.showMissEffect();
      this.value = 0;
      if (this.countElement) this.countElement.textContent = 0;
    } else {
      this.value = 0;
      this.updateUI(false);
    }
  },

  getTensionBonus() {
    return Math.floor(this.value / 10) * 5;
  },

  updateUI(animate) {
    if (!this.container || !this.countElement) return;

    // Visibility
    if (this.value < 2) {
      this.container.classList.remove('active');
    } else {
      this.container.classList.add('active');
    }

    this.countElement.textContent = this.value;

    // Colors
    this.countElement.classList.remove('combo-blue', 'combo-yellow', 'combo-red', 'combo-rainbow');
    if (this.value >= 50) {
      this.countElement.classList.add('combo-rainbow');
    } else if (this.value >= 30) {
      this.countElement.classList.add('combo-red');
    } else if (this.value >= 10) {
      this.countElement.classList.add('combo-yellow');
    } else if (this.value >= 5) {
      this.countElement.classList.add('combo-blue');
    }

    // Animation
    if (animate) {
      this.countElement.classList.remove('combo-pulse');
      void this.countElement.offsetWidth; // Trigger reflow
      this.countElement.classList.add('combo-pulse');
    }
  },

  showMissEffect() {
    if (!this.container || !this.labelElement) return;

    this.labelElement.textContent = "MISS...";
    this.container.classList.add('combo-reset');
    this.container.classList.add('active'); // Force visible

    setTimeout(() => {
        if (this.labelElement) this.labelElement.textContent = "COMBO!";
        if (this.container) {
            this.container.classList.remove('combo-reset');
            // Hide if user hasn't started a new combo
            if (this.value < 2) {
                this.container.classList.remove('active');
            }
        }
    }, 1000);
  }
};
