import { loadJson } from './resource-loader.js';
import { VoiceCoach } from './voice-coach.js';
import { getRandomInt } from '../utils.js';

export const CommentaryManager = {
  enabled: false,
  lines: {},
  lastSpokenTime: {},
  queue: [],
  isSpeaking: false,
  cooldowns: {
    start: 0,
    combo_small: 15000,
    combo_medium: 20000,
    combo_large: 30000,
    critical: 10000,
    pinch: 20000,
    boss_damage_50: 60000, // Once per battle ideally, but long cooldown works
    boss_damage_20: 60000,
    win: 0,
    lose: 0
  },
  priorities: {
    start: 2,
    combo_small: 1,
    combo_medium: 1,
    combo_large: 2,
    critical: 1,
    pinch: 2,
    boss_damage_50: 3,
    boss_damage_20: 3,
    win: 4,
    lose: 4
  },

  async init() {
    try {
      this.lines = await loadJson('js/data/commentary-lines.json');
      // console.log('CommentaryManager initialized');
    } catch (e) {
      console.error('Failed to load commentary lines', e);
      this.enabled = false;
    }
  },

  setEnabled(value) {
    this.enabled = value;
    if (!value) {
      this.queue = [];
      this.isSpeaking = false;
    }
  },

  notify(eventType, data = {}) {
    if (!this.enabled || !this.lines[eventType]) return;

    // Check cooldown
    const now = Date.now();
    const lastTime = this.lastSpokenTime[eventType] || 0;
    const cooldown = this.cooldowns[eventType] || 5000;

    if (now - lastTime < cooldown) {
      return;
    }

    // Determine specific line key based on data if needed (e.g. combo count)
    let key = eventType;
    if (eventType === 'combo') {
      const count = data.count || 0;
      if (count >= 100) key = 'combo_large';
      else if (count >= 50) key = 'combo_medium';
      else if (count >= 10) key = 'combo_small';
      else return; // Ignore small combos
    }

    // Re-check cooldown for specific key if it changed
    if (key !== eventType) {
       const specificLastTime = this.lastSpokenTime[key] || 0;
       const specificCooldown = this.cooldowns[key] || 10000;
       if (now - specificLastTime < specificCooldown) return;
    }

    // Select random line
    const patterns = this.lines[key];
    if (!patterns || patterns.length === 0) return;
    const text = patterns[getRandomInt(0, patterns.length - 1)];

    // Add to queue
    const priority = this.priorities[key] || 1;
    this.speak(text, priority, key);
  },

  speak(text, priority, key) {
    if (!text) return;

    // Simple priority logic:
    // If priority is high (>=3), interrupt or speak immediately.
    // If low, add to queue.

    // For now, we utilize VoiceCoach.speak directly which cancels previous utterance.
    // So "High Priority" means we just call speak().
    // "Low Priority" means we only call speak() if not already speaking?
    // VoiceCoach doesn't expose 'speaking' state easily without more complex handling.

    // We will trust VoiceCoach to handle the speech synthesis queue or cancellation.
    // But to avoid spamming, we use our own cooldowns (handled in notify).

    // Update last spoken time
    this.lastSpokenTime[key] = Date.now();

    // Add prefix to distinguish commentary? No, just speak naturally.
    VoiceCoach.speak(text);
  }
};
