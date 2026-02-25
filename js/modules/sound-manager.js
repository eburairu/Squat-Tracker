import { isStorageAvailable } from '../utils.js';
import { setSoundType } from '../utils.js';

const SOUND_KEY = 'squat-tracker-sound-type'; // sine, triangle, etc.

export const SoundManager = {
  type: 'triangle',
  elements: {
    select: null,
    previewBtn: null
  },

  init() {
    this.load();
    this.apply();
  },

  load() {
    if (isStorageAvailable) {
      const stored = localStorage.getItem(SOUND_KEY);
      if (stored && ['sine', 'triangle', 'square', 'sawtooth'].includes(stored)) {
        this.type = stored;
      }
    }
  },

  save() {
    if (isStorageAvailable) {
      localStorage.setItem(SOUND_KEY, this.type);
    }
  },

  apply() {
    setSoundType(this.type);
    this.updateUI();
  },

  setType(type) {
    if (!['sine', 'triangle', 'square', 'sawtooth'].includes(type)) return;
    this.type = type;
    this.save();
    this.apply();
  },

  bindSettingsUI() {
    this.elements.select = document.getElementById('sound-type-select');
    this.elements.previewBtn = document.getElementById('sound-preview-btn');

    if (this.elements.select) {
      this.elements.select.value = this.type;
      this.elements.select.addEventListener('change', (e) => {
        this.setType(e.target.value);
        this.preview();
      });
    }

    if (this.elements.previewBtn) {
      this.elements.previewBtn.addEventListener('click', () => {
        this.preview();
      });
    }
  },

  updateUI() {
      if (this.elements.select) {
          this.elements.select.value = this.type;
      }
  },

  preview() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = this.type;
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // Slide up

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  }
};
