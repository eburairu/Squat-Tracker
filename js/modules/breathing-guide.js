import { STORAGE_KEYS, Phase } from '../constants.js';
import { isStorageAvailable } from '../utils.js';

export class BreathingGuide {
  static isEnabled = false;
  static textElement = null;
  static circleElement = null;

  static init(toggleElement) {
    this.textElement = document.getElementById('breathing-guide-text');
    this.circleElement = document.getElementById('breathing-circle');

    if (!toggleElement) return;

    // Load from storage
    if (isStorageAvailable) {
      const stored = localStorage.getItem(STORAGE_KEYS.BREATHING_GUIDE);
      this.isEnabled = stored === 'true';
    }

    // Set initial toggle state
    toggleElement.checked = this.isEnabled;
    this.updateVisibility();

    // Listen for toggle changes
    toggleElement.addEventListener('change', (e) => {
      this.isEnabled = e.target.checked;
      if (isStorageAvailable) {
        localStorage.setItem(STORAGE_KEYS.BREATHING_GUIDE, String(this.isEnabled));
      }
      this.updateVisibility();
    });
  }

  static updateVisibility() {
    if (!this.textElement || !this.circleElement) return;

    if (this.isEnabled) {
      this.textElement.style.display = 'block';
      this.circleElement.style.display = 'block';
    } else {
      this.textElement.style.display = 'none';
      this.circleElement.style.display = 'none';
      this.resetAnimation();
    }
  }

  static resetAnimation() {
    if (!this.circleElement || !this.textElement) return;
    this.circleElement.classList.remove('inhale', 'hold', 'exhale');
    this.textElement.textContent = '';
  }

  static updatePhase(phase) {
    if (!this.isEnabled || !this.circleElement || !this.textElement) return;

    // Reset previous classes
    this.circleElement.classList.remove('inhale', 'hold', 'exhale');

    switch (phase) {
      case Phase.DOWN:
        // しゃがむときは吸う
        this.textElement.textContent = '吸って…';
        this.circleElement.classList.add('inhale');
        break;
      case Phase.HOLD:
        // キープ時は止める
        this.textElement.textContent = '止めて…';
        this.circleElement.classList.add('hold');
        break;
      case Phase.UP:
        // 立つときは吐く
        this.textElement.textContent = '吐いて…';
        this.circleElement.classList.add('exhale');
        break;
      default:
        // それ以外のフェーズでは表示をクリア
        this.textElement.textContent = '';
        break;
    }
  }
}
