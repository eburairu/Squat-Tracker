import { playCelebration, beep } from '../utils.js';

class MeditationSystemImpl {
  constructor() {
    this.isActive = false;
    this.focusPoints = 0;
    this.animationFrameId = null;
    this.startTime = null;
    this.cycleDuration = 4000; // 4 seconds per breath cycle
    this.targetScale = 0.66; // 100px target / 150px outer ring = ~0.66

    // DOM Elements
    this.container = null;
    this.circleArea = null;
    this.breatheRing = null;
    this.feedbackText = null;
    this.focusDisplay = null;
  }

  init() {
    this.container = document.getElementById('meditation-container');
    this.circleArea = document.getElementById('meditation-circle-area');
    this.breatheRing = document.getElementById('meditation-breathe-ring');
    this.feedbackText = document.getElementById('meditation-feedback');
    this.focusDisplay = document.getElementById('meditation-focus-points');

    if (this.circleArea) {
      this.circleArea.addEventListener('pointerdown', (e) => this.handleTap(e));
    }
  }

  start(restDurationMs) {
    if (!this.container) return;

    this.isActive = true;
    this.focusPoints = 0;
    this.updateFocusDisplay();

    // Set container to visible
    this.container.style.display = 'flex';
    this.container.setAttribute('aria-hidden', 'false');

    this.startTime = performance.now();
    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    if (!this.isActive) return { attackBonus: 0, tensionBonus: 0 };

    this.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.container) {
      this.container.style.display = 'none';
      this.container.setAttribute('aria-hidden', 'true');
    }

    // Calculate bonuses based on focus points
    // Rule: Every 10 points = +1 AP, +2% Tension (Adjust as needed for balance)
    const attackBonus = Math.floor(this.focusPoints / 10);
    const tensionBonus = Math.floor(this.focusPoints / 5);

    this.focusPoints = 0; // Reset for next time

    return { attackBonus, tensionBonus };
  }

  loop(currentTime) {
    if (!this.isActive) return;

    const elapsed = currentTime - this.startTime;
    // Calculate progress within current cycle (0.0 to 1.0)
    const cycleProgress = (elapsed % this.cycleDuration) / this.cycleDuration;

    // Animate ring from 1.0 down to ~0.5, then back to 1.0 using a sine wave
    // Sine input: 0 to 2PI. Output: -1 to 1.
    const rawSine = Math.sin(cycleProgress * Math.PI * 2);
    // Map -1 to 1 into our scale range: say 0.4 to 1.0
    const minScale = 0.4;
    const maxScale = 1.0;
    const range = maxScale - minScale;

    // (rawSine + 1) / 2 makes it 0 to 1
    const currentScale = minScale + ((rawSine + 1) / 2) * range;

    if (this.breatheRing) {
      this.breatheRing.style.transform = `scale(${currentScale})`;
    }

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  handleTap(e) {
    if (!this.isActive || !this.breatheRing) return;
    e.preventDefault();

    // Get current scale from style
    const transformStr = this.breatheRing.style.transform;
    const match = transformStr.match(/scale\(([^)]+)\)/);

    if (match && match[1]) {
      const currentScale = parseFloat(match[1]);
      const diff = Math.abs(currentScale - this.targetScale);

      this.showFeedback(diff);
    }
  }

  showFeedback(diff) {
    if (!this.feedbackText) return;

    // Reset animation
    this.feedbackText.classList.remove('show-perfect', 'show-good', 'show-miss');
    void this.feedbackText.offsetWidth; // Trigger reflow

    let pointsEarned = 0;

    if (diff <= 0.05) {
      this.feedbackText.textContent = 'Perfect!';
      this.feedbackText.classList.add('show-perfect');
      pointsEarned = 10;
      beep(1046, 100); // High pitch C6
    } else if (diff <= 0.15) {
      this.feedbackText.textContent = 'Good';
      this.feedbackText.classList.add('show-good');
      pointsEarned = 5;
      beep(784, 100); // G5
    } else {
      this.feedbackText.textContent = 'Miss';
      this.feedbackText.classList.add('show-miss');
      pointsEarned = 0;
      beep(200, 100); // Low pitch
    }

    if (pointsEarned > 0) {
      this.focusPoints += pointsEarned;
      this.updateFocusDisplay();
    }
  }

  updateFocusDisplay() {
    if (this.focusDisplay) {
      this.focusDisplay.textContent = this.focusPoints;
    }
  }
}

export const MeditationSystem = new MeditationSystemImpl();
