import { showToast, playCelebration } from '../utils.js';
import { TensionManager } from './tension-manager.js';

const SkillManager = {
  elements: {
    container: null,
    button: null,
    icon: null,
    name: null
  },

  state: {
    currentSkill: null, // Skill Definition
    isUsed: false,      // Used in this session?
    activeEffects: new Map() // type -> value
  },

  init() {
    this.elements.container = document.getElementById('skill-button-container');
    // Button will be created dynamically or expected to exist
    this.createButtonStructure();
    this.reset();
  },

  createButtonStructure() {
    if (!this.elements.container) return;

    this.elements.container.innerHTML = `
      <button id="skill-trigger-button" class="skill-button" disabled aria-label="スキル発動">
        <span class="skill-icon"></span>
        <span class="skill-name">No Skill</span>
        <span class="skill-badge">SKILL</span>
      </button>
    `;

    this.elements.button = document.getElementById('skill-trigger-button');
    this.elements.icon = this.elements.button.querySelector('.skill-icon');
    this.elements.name = this.elements.button.querySelector('.skill-name');

    this.elements.button.addEventListener('click', () => {
      this.activate();
    });
  },

  loadSkill(skillDef) {
    this.state.currentSkill = skillDef;
    this.state.isUsed = false;
    this.state.activeEffects.clear();
    this.updateUI();
  },

  reset() {
    this.state.currentSkill = null;
    this.state.isUsed = false;
    this.state.activeEffects.clear();
    this.updateUI();
  },

  updateUI() {
    const { button, icon, name, container } = this.elements;
    if (!button || !container) return;

    const skill = this.state.currentSkill;

    if (!skill) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    icon.textContent = skill.emoji;
    name.textContent = skill.name;

    // If an effect is active, prioritize active styling
    if (this.state.activeEffects.size > 0) {
      button.classList.add('active');
      button.classList.remove('used');
      name.textContent = `${skill.name} (発動中)`;
      button.disabled = true;
    } else if (this.state.isUsed) {
      button.disabled = true;
      button.classList.add('used');
      button.classList.remove('active');
      name.textContent = `${skill.name} (済)`;
    } else {
      button.disabled = false;
      button.classList.remove('used');
      button.classList.remove('active');
    }
  },

  activate() {
    if (this.state.isUsed || !this.state.currentSkill) return;

    const skill = this.state.currentSkill;
    this.state.isUsed = true;

    // Play sound/effect (handled by showToast via utils.js)

    showToast({
      emoji: skill.emoji,
      title: 'スキル発動！',
      message: `${skill.name}: ${skill.description}`,
      sound: true
    });

    // Apply Effect
    switch (skill.type) {
      case 'recover_tension':
        TensionManager.add(skill.value);
        break;

      case 'buff_attack_set':
        this.state.activeEffects.set(skill.type, skill.value);
        break;

      case 'auto_quiz_win':
        this.state.activeEffects.set(skill.type, skill.value);
        break;

      case 'next_crit_drop':
        this.state.activeEffects.set(skill.type, skill.value);
        break;

      default:
        console.warn('Unknown skill type:', skill.type);
    }

    this.updateUI();
  },

  // --- Effect Queries ---

  getAttackMultiplier() {
    if (this.state.activeEffects.has('buff_attack_set')) {
      return this.state.activeEffects.get('buff_attack_set');
    }
    return 1.0;
  },

  shouldAutoWinQuiz() {
    return this.state.activeEffects.has('auto_quiz_win');
  },

  consumeQuizEffect() {
    if (this.state.activeEffects.has('auto_quiz_win')) {
      this.state.activeEffects.delete('auto_quiz_win');
      this.updateUI(); // Remove active status
    }
  },

  shouldCritAndDrop() {
     return this.state.activeEffects.has('next_crit_drop');
  },

  consumeCritDropEffect() {
    if (this.state.activeEffects.has('next_crit_drop')) {
      const val = this.state.activeEffects.get('next_crit_drop');
      this.state.activeEffects.delete('next_crit_drop');
      this.updateUI();
      return val; // Return drop multiplier
    }
    return 1;
  },

  // --- Lifecycle Hooks ---

  onSetFinished() {
    // Clear set-based buffs
    if (this.state.activeEffects.has('buff_attack_set')) {
      this.state.activeEffects.delete('buff_attack_set');
      showToast({ title: '効果終了', message: 'スキル効果が切れました。' });
      this.updateUI();
    }
  }
};

export { SkillManager };
