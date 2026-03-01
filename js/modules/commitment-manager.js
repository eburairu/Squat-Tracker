import { STORAGE_KEYS } from '../constants.js';
import { showToast, formatDate } from '../utils.js';

export const CommitmentManager = {
  state: {
    targetTimestamp: null,
    createdTimestamp: null,
    status: 'none' // none, pending, fulfilled, broken
  },
  elements: {
    modal: null,
    statusDisplay: null,
    options: null
  },

  init() {
    this.elements.modal = document.getElementById('commitment-modal');
    this.elements.statusDisplay = document.getElementById('commitment-status');
    this.elements.options = document.querySelectorAll('.commitment-btn');

    this.loadState();
    this.setupEventListeners();
    this.render();

    // 定期的な表示更新
    setInterval(() => this.render(), 60000);
  },

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMMITMENT);
      if (raw) {
        this.state = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load commitment state', e);
    }
  },

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMITMENT, JSON.stringify(this.state));
    } catch (e) {
      // Ignore
    }
  },

  setupEventListeners() {
    if (this.elements.options) {
      this.elements.options.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const type = e.currentTarget.dataset.type;
          this.setCommitment(type);
          this.closeModal();
        });
      });
    }
  },

  showModal() {
    if (this.elements.modal) {
      this.elements.modal.classList.add('active');
      this.elements.modal.setAttribute('aria-hidden', 'false');
    }
  },

  closeModal() {
    if (this.elements.modal) {
      this.elements.modal.classList.remove('active');
      this.elements.modal.setAttribute('aria-hidden', 'true');
    }
  },

  setCommitment(type) {
    const now = new Date();
    let targetDate = new Date();

    if (type === 'tomorrow') {
      targetDate.setDate(now.getDate() + 1);
      targetDate.setHours(23, 59, 59, 999);
    } else if (type === 'day-after') {
      targetDate.setDate(now.getDate() + 2);
      targetDate.setHours(23, 59, 59, 999);
    } else {
      // Skip or clear
      this.state = { targetTimestamp: null, createdTimestamp: null, status: 'none' };
      this.saveState();
      this.render();
      showToast({ emoji: '👋', title: '誓約なし', message: '気が向いたらまた設定してください。' });
      return;
    }

    this.state = {
      targetTimestamp: targetDate.getTime(),
      createdTimestamp: Date.now(),
      status: 'pending'
    };
    this.saveState();
    this.render();

    showToast({
      emoji: '🤝',
      title: '契約成立',
      message: `${formatDate(targetDate.toISOString())} までにトレーニングしましょう！`
    });
  },

  // ワークアウト開始時に呼び出し、ボーナス/ペナルティを確定させる
  checkAndResolve() {
    if (this.state.status !== 'pending' || !this.state.targetTimestamp) {
      return null;
    }

    const now = Date.now();

    // ターゲット日時以前なら成功
    if (now <= this.state.targetTimestamp) {
        this.state.status = 'fulfilled';
        this.saveState();
        this.render();
        return { status: 'fulfilled', bonus: 1.1 };
    } else {
        // ターゲット日時を過ぎているなら失敗
        this.state.status = 'broken';
        this.saveState();
        this.render();
        return { status: 'broken', penalty: 0.2 };
    }
  },

  // 起動時に呼び出し、放置による期限切れをチェックする（ペナルティ適用）
  checkExpiration() {
    if (this.state.status !== 'pending' || !this.state.targetTimestamp) {
      return null;
    }
    const now = Date.now();
    if (now > this.state.targetTimestamp) {
       this.state.status = 'broken';
       this.saveState();
       this.render();
       return { status: 'broken', penalty: 0.2 };
    }
    return null;
  },

  // 解決済みの状態をクリアする（ボーナス適用後など）
  clear() {
      this.state = { targetTimestamp: null, createdTimestamp: null, status: 'none' };
      this.saveState();
      this.render();
  },

  render() {
    if (!this.elements.statusDisplay) return;

    if (this.state.status === 'pending' && this.state.targetTimestamp) {
        const now = Date.now();
        const diff = this.state.targetTimestamp - now;

        this.elements.statusDisplay.style.display = 'flex';
        this.elements.statusDisplay.className = 'commitment-status active';

        let timeText = '';
        if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);
            if (days > 0) {
                timeText = `残り ${days}日 ${hours % 24}時間`;
            } else {
                timeText = `残り ${hours}時間`;
            }
        } else {
            timeText = '期限切れ...';
            this.elements.statusDisplay.classList.add('broken');
        }

        this.elements.statusDisplay.innerHTML = `
            <span class="label">Next Goal</span>
            <span class="timer">${timeText}</span>
        `;
    } else {
        this.elements.statusDisplay.style.display = 'none';
    }
  }
};
