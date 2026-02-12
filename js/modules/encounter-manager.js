import { loadJson } from './resource-loader.js';
import { InventoryManager } from './inventory-manager.js';
import { TensionManager } from './tension-manager.js';
import { showToast } from '../utils.js';

export const EncounterManager = (() => {
  let encounters = [];
  let currentEncounter = null;
  let context = {};

  const init = async (ctx) => {
    context = ctx || {};
    try {
      const data = await loadJson('js/data/encounters.json');
      if (Array.isArray(data)) {
        encounters = data;
      }
    } catch (e) {
      console.error('Failed to load encounters:', e);
    }
  };

  const checkEncounter = (probability = 0.2) => {
    // 確率は0.0〜1.0
    if (Math.random() < probability) {
      triggerRandomEncounter();
      return true;
    }
    return false;
  };

  const triggerRandomEncounter = () => {
    if (!encounters || encounters.length === 0) return;
    const encounter = encounters[Math.floor(Math.random() * encounters.length)];
    triggerEncounter(encounter);
  };

  const triggerEncounter = (encounter) => {
    currentEncounter = encounter;
    if (context.onPause) context.onPause();
    renderModal(encounter);
  };

  const renderModal = (encounter) => {
    const modal = document.getElementById('encounter-modal');
    const title = document.getElementById('encounter-title');
    const desc = document.getElementById('encounter-desc');
    const choicesContainer = document.getElementById('encounter-choices');
    const emoji = document.getElementById('encounter-emoji');

    if (!modal || !title || !desc || !choicesContainer) return;

    title.textContent = encounter.title;
    desc.textContent = encounter.description;
    if (emoji) emoji.textContent = encounter.emoji || '❓';

    choicesContainer.innerHTML = '';
    encounter.choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'btn secondary encounter-choice-btn';
      btn.textContent = choice.text;
      btn.onclick = () => resolveChoice(index);
      choicesContainer.appendChild(btn);
    });

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  };

  const resolveChoice = (index) => {
    if (!currentEncounter) return;
    const choice = currentEncounter.choices[index];

    let result = choice.result;

    // ランダム結果の処理
    if (result.type === 'random' && result.outcomes) {
       const totalWeight = result.outcomes.reduce((sum, item) => sum + item.weight, 0);
       let random = Math.random() * totalWeight;
       for (const outcome of result.outcomes) {
         if (random < outcome.weight) {
           // deep copy to avoid modifying original data
           result = JSON.parse(JSON.stringify(outcome));
           result.type = 'fixed';
           break;
         }
         random -= outcome.weight;
       }
    }

    applyResult(result);
    closeModal();
  };

  const applyResult = (result) => {
    if (!result) return;

    const message = result.message || '';

    if (result.reward) {
      const reward = result.reward;

      if (reward.type === 'weapon') {
        const weapon = addRandomWeapon(reward.rarity || 'N');
        if (weapon) {
           showToast({ emoji: '⚔️', title: '武器獲得！', message: `${weapon.name}を手に入れた！` });
        } else {
           showToast({ emoji: '📦', title: '空っぽ...', message: 'めぼしいものはなかった。' });
        }
      } else if (reward.type === 'exp') {
         showToast({ emoji: '✨', title: '経験値獲得', message: `経験値を得た！（${reward.amount} EXP）` });
      } else if (reward.type === 'tension') {
        TensionManager.add(reward.amount);
        const direction = reward.amount > 0 ? '上がった' : '下がった';
        showToast({ emoji: '⚡', title: 'テンション変化', message: `テンションが${direction}！` });
      } else if (reward.type === 'buff_attack') {
        if (context.onApplyBonus) {
           context.onApplyBonus(reward.value);
           showToast({ emoji: '💪', title: '攻撃力アップ', message: `攻撃力が ${reward.value} 上がった！` });
        }
      }
    } else if (message) {
       showToast({ emoji: '📝', title: 'イベント', message: message });
    }
  };

  const addRandomWeapon = (rarity) => {
    if (!InventoryManager.weaponsData) return null;
    const allWeapons = Object.values(InventoryManager.weaponsData);
    const candidates = allWeapons.filter(w => {
        if (rarity === 'N') return w.rarity === 1;
        if (rarity === 'R') return w.rarity === 2;
        if (rarity === 'SR') return w.rarity >= 3;
        return true;
    });

    if (candidates.length === 0) return null;
    const weapon = candidates[Math.floor(Math.random() * candidates.length)];
    InventoryManager.addWeapon(weapon.id);
    return weapon;
  };

  const closeModal = () => {
    const modal = document.getElementById('encounter-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (context.onResume) context.onResume();
    currentEncounter = null;
  };

  return {
    init,
    checkEncounter,
    triggerEncounter
  };
})();
