import { showToast } from '../utils.js';

export const SmartPlanner = {
  elements: {
    button: null,
    modal: null,
    modalContent: null,
    closeButton: null,
    planContainer: null,
  },
  onApplyCallback: null,

  init({ buttonId, onApply }) {
    this.elements.button = document.getElementById(buttonId);
    this.onApplyCallback = onApply;

    if (this.elements.button) {
      this.elements.button.addEventListener('click', () => {
        // App.js should pass the current data
        // We will trigger a custom event or rely on App.js to call show()
        // Here we just prevent default if it's a form button
      });
    }

    this.createModal();
  },

  createModal() {
    // Check if modal already exists
    if (document.getElementById('smart-plan-modal')) {
      this.elements.modal = document.getElementById('smart-plan-modal');
      this.elements.modalContent = this.elements.modal.querySelector('.modal-body');
      this.elements.closeButton = this.elements.modal.querySelector('.close-modal');
      this.elements.planContainer = document.getElementById('smart-plan-container');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'smart-plan-modal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="modal-overlay" tabindex="-1" data-close></div>
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="smart-plan-title">
        <div class="modal-header">
          <h2 id="smart-plan-title">本日の推奨メニュー</h2>
          <button class="ghost small close-modal" aria-label="閉じる" data-close>✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">あなたの履歴と現在の状況から、最適なプランを提案します。</p>
          <div id="smart-plan-container" class="smart-plan-container">
            <!-- Plans will be injected here -->
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    this.elements.modal = modal;
    this.elements.modalContent = modal.querySelector('.modal-body');
    this.elements.closeButton = modal.querySelector('.close-modal');
    this.elements.planContainer = modal.querySelector('#smart-plan-container');

    // Bind Close Events
    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close') || e.target.classList.contains('modal-overlay')) {
        this.close();
      }
    });
  },

  show(historyEntries, bossState, userLevel, userBaseAp) {
    const plans = this.analyzeAndGenerate(historyEntries, bossState, userLevel, userBaseAp);
    this.renderPlans(plans);
    this.elements.modal.classList.add('active');
    this.elements.modal.setAttribute('aria-hidden', 'false');
  },

  close() {
    if (this.elements.modal) {
      this.elements.modal.classList.remove('active');
      this.elements.modal.setAttribute('aria-hidden', 'true');
    }
  },

  analyzeAndGenerate(historyEntries, bossState, userLevel, userBaseAp) {
    // 1. Calculate Base Load (Total Reps)
    let baseLoad = 30; // Default: 3 sets * 10 reps

    if (historyEntries && historyEntries.length > 0) {
      // Use average of last 3 sessions
      const recent = historyEntries.slice(0, 3);
      const sum = recent.reduce((acc, entry) => acc + (entry.totalReps || 0), 0);
      baseLoad = Math.floor(sum / recent.length);
    }

    // Ensure minimum load
    baseLoad = Math.max(baseLoad, 10);

    const plans = [];

    // --- Challenge Plan ---
    const challengeLoad = Math.ceil(baseLoad * 1.2);
    const challengeSets = this.calculateSets(challengeLoad);
    const challengeReps = Math.ceil(challengeLoad / challengeSets);

    let challengeMsg = '自分を超えろ！レベルアップのチャンス！';
    if (bossState && bossState.currentMonster) {
      // Estimate damage: AP * TotalReps (Very rough estimate, ignoring combos/crits)
      const estimatedDamage = userBaseAp * challengeLoad;
      if (bossState.currentMonster.currentHp <= estimatedDamage * 1.5) {
        challengeMsg = 'ボス撃破まであと少し！一気に決めよう！';
      }
    }

    plans.push({
      type: 'challenge',
      icon: '🔥',
      title: '挑戦',
      sets: challengeSets,
      reps: challengeReps,
      total: challengeSets * challengeReps,
      message: challengeMsg,
      description: `高負荷 (${Math.round(challengeLoad / baseLoad * 100)}%)`
    });

    // --- Maintain Plan ---
    const maintainLoad = baseLoad;
    const maintainSets = this.calculateSets(maintainLoad);
    const maintainReps = Math.ceil(maintainLoad / maintainSets);

    plans.push({
      type: 'maintain',
      icon: '⚖️',
      title: '維持',
      sets: maintainSets,
      reps: maintainReps,
      total: maintainSets * maintainReps,
      message: 'いつものペースで着実に積み重ねましょう。',
      description: `標準 (${Math.round(maintainLoad / baseLoad * 100)}%)`
    });

    // --- Light Plan ---
    const lightLoad = Math.ceil(baseLoad * 0.7);
    const lightSets = this.calculateSets(lightLoad);
    const lightReps = Math.ceil(lightLoad / lightSets);

    plans.push({
      type: 'light',
      icon: '🌱',
      title: '軽め',
      sets: lightSets,
      reps: lightReps,
      total: lightSets * lightReps,
      message: '無理せず、まずは体を慣らしましょう。',
      description: `軽量 (${Math.round(lightLoad / baseLoad * 100)}%)`
    });

    return plans;
  },

  calculateSets(totalReps) {
    // Logic: Keep reps per set <= 20 if possible, but sets <= 5
    // If totalReps is small (e.g. 10), 1 set is fine? No, default to at least 2 or 3 sets for interval training.
    // Squat Tracker is interval based.

    // Default strategy: Try to keep sets around 3.
    let sets = 3;
    let reps = Math.ceil(totalReps / sets);

    if (reps > 30) {
      sets = 4;
      reps = Math.ceil(totalReps / sets);
    }
    if (reps > 30) {
      sets = 5;
    }

    // If total reps is very low (e.g. < 15), reduce sets
    if (totalReps < 15) {
      sets = 2;
    }
    if (totalReps < 10) {
      sets = 1;
    }

    return sets;
  },

  renderPlans(plans) {
    if (!this.elements.planContainer) return;

    this.elements.planContainer.innerHTML = '';

    plans.forEach(plan => {
      const card = document.createElement('div');
      card.className = `smart-plan-card plan-${plan.type}`;
      card.innerHTML = `
        <div class="plan-icon">${plan.icon}</div>
        <div class="plan-content">
          <h3 class="plan-title">${plan.title} <span class="plan-tag">${plan.description}</span></h3>
          <div class="plan-stats">
            <span class="plan-stat-value">${plan.sets}</span> セット ×
            <span class="plan-stat-value">${plan.reps}</span> 回
            <span class="plan-total">(計 ${plan.total})</span>
          </div>
          <p class="plan-message">${plan.message}</p>
        </div>
        <button class="btn secondary small plan-select-btn">適用</button>
      `;

      const btn = card.querySelector('.plan-select-btn');
      btn.addEventListener('click', () => {
        this.applyPlan(plan);
      });

      this.elements.planContainer.appendChild(card);
    });
  },

  applyPlan(plan) {
    if (this.onApplyCallback) {
      this.onApplyCallback({
        setCount: plan.sets,
        repCount: plan.reps
      });
    }
    this.close();
    showToast({ emoji: plan.icon, title: 'プラン適用', message: `「${plan.title}」プランをセットしました！` });
  }
};
