import { getLocalDateKey, isStorageAvailable, showToast } from '../utils.js';

const FORTUNES = [
  { id: 'excellent', name: '大吉', weight: 10, effect: { attack: 1.5, exp: 1.5, tension: 0 }, emoji: '🌸', message: '絶好調！攻撃力と経験値が1.5倍！' },
  { id: 'great',     name: '中吉', weight: 25, effect: { attack: 1.2, exp: 1.2, tension: 0 }, emoji: '✨', message: '好調です。攻撃力と経験値が1.2倍！' },
  { id: 'good',      name: '小吉', weight: 30, effect: { attack: 1.1, exp: 1.0, tension: 0 }, emoji: '👍', message: 'まずまず。攻撃力が少しアップ！' },
  { id: 'lucky',     name: '吉',   weight: 25, effect: { attack: 1.0, exp: 1.0, tension: 20 }, emoji: '🍀', message: 'ラッキー！テンションボーナスGET！' },
  { id: 'normal',    name: '末吉', weight: 10, effect: { attack: 1.0, exp: 1.0, tension: 0 }, emoji: '🍵', message: '平常心でいきましょう。' }
];

const STORAGE_KEY = 'squat-tracker-fortune';

export const FortuneManager = {
  state: {
    lastDrawDate: null,
    result: null
  },

  init() {
    this.loadState();
    this.checkReset();
    this.renderButton(); // Initial render for the button in stat-grid
    this.setupModal();
  },

  loadState() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = parsed;
      }
    } catch (e) {
      console.error('Failed to load fortune state', e);
    }
  },

  saveState() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      // Ignore
    }
  },

  checkReset() {
    const today = getLocalDateKey();
    if (this.state.lastDrawDate !== today) {
      this.state.lastDrawDate = null;
      this.state.result = null;
      // We don't save here, only on draw.
      // But if we wanted to clear storage explicitly we could.
      // Keeping it in memory is enough until next draw.
    }
  },

  draw() {
    if (this.state.lastDrawDate === getLocalDateKey() && this.state.result) {
      return this.state.result;
    }

    const totalWeight = FORTUNES.reduce((sum, f) => sum + f.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = FORTUNES[FORTUNES.length - 1];

    for (const f of FORTUNES) {
      random -= f.weight;
      if (random <= 0) {
        selected = f;
        break;
      }
    }

    this.state.lastDrawDate = getLocalDateKey();
    this.state.result = selected;
    this.saveState();
    this.updateUI();

    showToast({
      emoji: selected.emoji,
      title: `運勢: ${selected.name}`,
      message: selected.message,
      sound: true
    });

    return selected;
  },

  getMultiplier(type) {
    // Check date validity first
    this.checkReset();

    if (!this.state.result) {
      return type === 'tension' ? 0 : 1.0;
    }

    const effect = this.state.result.effect;
    if (type === 'attack') return effect.attack || 1.0;
    if (type === 'exp') return effect.exp || 1.0;
    if (type === 'tension') return effect.tension || 0;

    return 1.0;
  },

  // --- UI Handling ---

  renderButton() {
    const container = document.querySelector('.stat-grid');
    if (!container) return;

    let card = document.getElementById('fortune-status-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'fortune-status-card';
      card.className = 'stat-card clickable';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', '本日の運勢');
      card.innerHTML = `
        <span class="stat-label">運勢</span>
        <span id="fortune-icon" class="stat-value" style="font-size: 2rem; line-height: 1;">🥠</span>
        <span id="fortune-text" class="stat-unit">運試し</span>
      `;

      // Insert before the last item or specific position
      // Inserting at the end for now
      container.appendChild(card);

      card.addEventListener('click', () => this.openModal());
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openModal();
        }
      });
    }

    this.updateButtonState();
  },

  updateButtonState() {
    const icon = document.getElementById('fortune-icon');
    const text = document.getElementById('fortune-text');
    if (!icon || !text) return;

    if (this.state.result) {
      icon.textContent = this.state.result.emoji;
      text.textContent = this.state.result.name;
    } else {
      icon.textContent = '🥠';
      text.textContent = '運試し';
    }
  },

  setupModal() {
    // Modal HTML should be injected or exist in index.html
    // For now assuming it exists based on plan, but we can also inject it if missing
    // Plan says "UI Implementation (HTML)" is next step, so we wait for elements to exist
    // But we can attach listeners if they exist.

    // We will call this again or use delegation if elements are dynamic.
    const modal = document.getElementById('fortune-modal');
    if (!modal) return;

    const closeButtons = modal.querySelectorAll('[data-close]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
  },

  openModal() {
    const modal = document.getElementById('fortune-modal');
    if (!modal) return;

    this.updateModalContent();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  },

  closeModal() {
    const modal = document.getElementById('fortune-modal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  },

  updateModalContent() {
    const body = document.getElementById('fortune-modal-body');
    if (!body) return;

    this.checkReset();

    if (this.state.result) {
      // Show Result
      const r = this.state.result;
      let effectText = '';
      if (r.effect.attack > 1.0) effectText += `<div>⚔️ 攻撃力 x${r.effect.attack}</div>`;
      if (r.effect.exp > 1.0) effectText += `<div>📚 経験値 x${r.effect.exp}</div>`;
      if (r.effect.tension > 0) effectText += `<div>🔥 テンション +${r.effect.tension}%</div>`;
      if (!effectText) effectText = '<div>特に効果はありませんが、良い一日を！</div>';

      body.innerHTML = `
        <div class="fortune-result-display">
          <div class="fortune-result-icon">${r.emoji}</div>
          <h3 class="fortune-result-name">${r.name}</h3>
          <p class="fortune-result-message">${r.message}</p>
          <div class="fortune-result-effects">
            ${effectText}
          </div>
        </div>
      `;
    } else {
      // Show Draw Button
      body.innerHTML = `
        <div class="fortune-draw-container">
          <div class="fortune-box-icon">🗳️</div>
          <p>1日1回、運勢を占って<br>ボーナス効果をゲットしましょう！</p>
          <button id="fortune-draw-button" class="btn primary">おみくじを引く</button>
        </div>
      `;

      const btn = document.getElementById('fortune-draw-button');
      if (btn) {
        btn.addEventListener('click', () => {
           // Animation simulation
           const container = document.querySelector('.fortune-draw-container');
           container.innerHTML = '<div class="fortune-shaking">🗳️</div><p>ガラガラ...</p>';

           setTimeout(() => {
             this.draw();
             this.updateModalContent(); // Re-render with result
             this.updateButtonState();  // Update header card
           }, 1000);
        });
      }
    }
  },

  updateUI() {
    this.updateButtonState();
    // If modal is open, update it too? Usually updateModalContent is called on open.
  }
};
