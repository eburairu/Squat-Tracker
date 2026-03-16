import { showToast } from '../utils.js';

export const SmartPlanner = {
  elements: {
    button: null,
    modal: null,
    modalContent: null,
    closeButton: null,
    planContainer: null,
    conditionSlider: null,
    moodSlider: null,
    conditionVal: null,
    moodVal: null,
  },
  onApplyCallback: null,
  currentData: null,

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

          <div class="condition-survey" style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div class="survey-group" style="margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label for="smart-condition-slider" style="margin: 0; font-weight: bold;">今日の体調は？</label>
                <span id="smart-condition-val" style="font-size: 1.5rem;">😐</span>
              </div>
              <input type="range" id="smart-condition-slider" min="1" max="5" value="3" step="1" style="width: 100%;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                <span>悪い</span>
                <span>普通</span>
                <span>絶好調</span>
              </div>
            </div>
            <div class="survey-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label for="smart-mood-slider" style="margin: 0; font-weight: bold;">今日の気分は？</label>
                <span id="smart-mood-val" style="font-size: 1.5rem;">😐</span>
              </div>
              <input type="range" id="smart-mood-slider" min="1" max="5" value="3" step="1" style="width: 100%;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                <span>乗らない</span>
                <span>普通</span>
                <span>最高</span>
              </div>
            </div>
          </div>

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
    this.elements.conditionSlider = modal.querySelector('#smart-condition-slider');
    this.elements.moodSlider = modal.querySelector('#smart-mood-slider');
    this.elements.conditionVal = modal.querySelector('#smart-condition-val');
    this.elements.moodVal = modal.querySelector('#smart-mood-val');

    // アンケートイベントのバインド
    const updateSurveyValues = () => {
      const emojis = { 1: '😫', 2: '🙁', 3: '😐', 4: '🙂', 5: '🤩' };
      if (this.elements.conditionSlider && this.elements.conditionVal) {
        this.elements.conditionVal.textContent = emojis[this.elements.conditionSlider.value] || '😐';
      }
      if (this.elements.moodSlider && this.elements.moodVal) {
        this.elements.moodVal.textContent = emojis[this.elements.moodSlider.value] || '😐';
      }
      this.updatePlans();
    };

    if (this.elements.conditionSlider) {
      this.elements.conditionSlider.addEventListener('input', updateSurveyValues);
    }
    if (this.elements.moodSlider) {
      this.elements.moodSlider.addEventListener('input', updateSurveyValues);
    }

    // 閉じるイベントのバインド
    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close') || e.target.classList.contains('modal-overlay')) {
        this.close();
      }
    });
  },

  show(historyEntries, bossState, userLevel, userBaseAp) {
    // スライダー変更時の再計算のために現在のデータを保存
    this.currentData = { historyEntries, bossState, userLevel, userBaseAp };

    // 開いたときにスライダーをデフォルト値にリセット
    if (this.elements.conditionSlider) this.elements.conditionSlider.value = 3;
    if (this.elements.moodSlider) this.elements.moodSlider.value = 3;
    if (this.elements.conditionVal) this.elements.conditionVal.textContent = '😐';
    if (this.elements.moodVal) this.elements.moodVal.textContent = '😐';

    this.updatePlans();

    this.elements.modal.classList.add('active');
    this.elements.modal.setAttribute('aria-hidden', 'false');
  },

  updatePlans() {
    if (!this.currentData) return;
    const { historyEntries, bossState, userLevel, userBaseAp } = this.currentData;

    // UIから現在の体調と気分の値を取得
    let condition = 3;
    let mood = 3;
    if (this.elements.conditionSlider) {
      condition = parseInt(this.elements.conditionSlider.value, 10);
    }
    if (this.elements.moodSlider) {
      mood = parseInt(this.elements.moodSlider.value, 10);
    }

    const plans = this.analyzeAndGenerate(historyEntries, bossState, userLevel, userBaseAp, condition, mood);
    this.renderPlans(plans);
  },

  close() {
    if (this.elements.modal) {
      this.elements.modal.classList.remove('active');
      this.elements.modal.setAttribute('aria-hidden', 'true');
    }
  },

  analyzeAndGenerate(historyEntries, bossState, userLevel, userBaseAp, condition = 3, mood = 3) {
    // 1. 基礎負荷の計算 (合計回数)
    let baseLoad = 30; // デフォルト: 3セット * 10回

    if (historyEntries && historyEntries.length > 0) {
      // 直近3セッションの平均を使用
      const recent = historyEntries.slice(0, 3);
      const sum = recent.reduce((acc, entry) => acc + (entry.totalReps || 0), 0);
      baseLoad = Math.floor(sum / recent.length);
    }

    // 2. 体調・気分の乗数を適用
    const averageScore = (condition + mood) / 2;
    // 乗数の範囲は 0.6 (スコア 1) から 1.4 (スコア 5)
    const multiplier = 1.0 + (averageScore - 3) * 0.2;

    baseLoad = Math.floor(baseLoad * multiplier);

    // 最小負荷を保証
    baseLoad = Math.max(baseLoad, 10);

    const plans = [];

    // --- 挑戦プラン ---
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

    // --- 維持プラン ---
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

    // --- 軽めプラン ---
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
    // ロジック: 可能であれば1セットあたりの回数を20以下に保ち、セット数は5以下に保つ。
    // Squat Trackerはインターバルベース。

    // デフォルト戦略: セット数を3前後に保つ。
    let sets = 3;
    let reps = Math.ceil(totalReps / sets);

    if (reps > 30) {
      sets = 4;
      reps = Math.ceil(totalReps / sets);
    }
    if (reps > 30) {
      sets = 5;
    }

    // 合計回数が非常に少ない場合、セット数を減らす
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
