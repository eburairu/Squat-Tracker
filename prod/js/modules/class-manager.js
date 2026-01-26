import { showToast, isStorageAvailable } from '../utils.js';

const CLASS_KEY = 'squat-tracker-class';

const ClassManager = {
  classes: [],
  currentClassId: 'novice',
  elements: {
    modal: null,
    triggerBtn: null,
    listContainer: null,
    closeBtn: null,
    currentClassIcon: null
  },

  init(classesData) {
    if (!classesData || !Array.isArray(classesData)) {
      console.error('Invalid classes data');
      return;
    }
    this.classes = classesData;

    // Load saved class
    if (isStorageAvailable) {
      const saved = localStorage.getItem(CLASS_KEY);
      if (saved && this.classes.find(c => c.id === saved)) {
        this.currentClassId = saved;
      }
    }

    // Bind DOM elements (will be called after DOMContentLoaded via init)
    this.elements.modal = document.getElementById('class-modal');
    this.elements.triggerBtn = document.getElementById('open-class-settings');
    this.elements.listContainer = document.getElementById('class-list');
    this.elements.closeBtn = document.getElementById('close-class-modal');
    this.elements.currentClassIcon = document.getElementById('current-class-icon'); // HUD icon

    this.setupEventListeners();
    this.updateUI();
  },

  setupEventListeners() {
    if (this.elements.triggerBtn) {
      this.elements.triggerBtn.addEventListener('click', () => {
        this.renderList();
        this.openModal();
      });
    }

    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // Close on click outside
    if (this.elements.modal) {
      this.elements.modal.addEventListener('click', (e) => {
        if (e.target === this.elements.modal) {
          this.closeModal();
        }
      });
    }
  },

  openModal() {
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

  renderList() {
    if (!this.elements.listContainer) return;

    this.elements.listContainer.innerHTML = '';

    this.classes.forEach(cls => {
      const isSelected = cls.id === this.currentClassId;
      const card = document.createElement('div');
      card.className = `class-card ${isSelected ? 'selected' : ''}`;
      card.dataset.id = cls.id;

      // Calculate effect text
      const effects = [];
      if (cls.modifiers.attackMultiplier > 1.0) {
        effects.push(`攻撃力 x${cls.modifiers.attackMultiplier}`);
      }
      if (cls.modifiers.quizMultiplier > 1.0) {
        effects.push(`クイズボーナス x${cls.modifiers.quizMultiplier}`);
      }
      if (cls.modifiers.criticalRateBonus > 0) {
        effects.push(`クリティカル +${(cls.modifiers.criticalRateBonus * 100).toFixed(0)}%`);
      }
      if (effects.length === 0) effects.push('特殊効果なし');

      card.innerHTML = `
        <div class="class-emoji">${cls.emoji}</div>
        <div class="class-info">
          <div class="class-name">${cls.name}</div>
          <div class="class-desc">${cls.description}</div>
          <div class="class-effects">${effects.join(' / ')}</div>
        </div>
        ${isSelected ? '<div class="class-selected-badge">選択中</div>' : ''}
      `;

      card.addEventListener('click', () => {
        this.changeClass(cls.id);
      });

      this.elements.listContainer.appendChild(card);
    });
  },

  changeClass(id) {
    if (this.currentClassId === id) return;

    const newClass = this.classes.find(c => c.id === id);
    if (!newClass) return;

    this.currentClassId = id;
    if (isStorageAvailable) {
      localStorage.setItem(CLASS_KEY, id);
    }

    this.updateUI();
    this.renderList(); // Update selection state in list

    showToast({
      emoji: newClass.emoji,
      title: 'クラス変更',
      message: `「${newClass.name}」になりました！`
    });

    // Optional: Close modal after selection?
    // For now, keep open so user can see selection state, or close.
    // Let's close it for better UX if it's a single tap selection
    // setTimeout(() => this.closeModal(), 300);
  },

  updateUI() {
    // Update HUD icon if exists
    if (this.elements.currentClassIcon) {
      const cls = this.getCurrentClass();
      if (cls) {
        this.elements.currentClassIcon.textContent = cls.emoji;
        this.elements.currentClassIcon.setAttribute('title', `現在のクラス: ${cls.name}`);
      }
    }
  },

  getCurrentClass() {
    return this.classes.find(c => c.id === this.currentClassId) || this.classes[0];
  },

  getModifiers() {
    const cls = this.getCurrentClass();
    return cls ? cls.modifiers : { attackMultiplier: 1.0, quizMultiplier: 1.0, criticalRateBonus: 0.0 };
  }
};

export { ClassManager };
