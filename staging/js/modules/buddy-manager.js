import { MONSTERS } from '../constants.js';
import { isStorageAvailable, showToast, playCelebration } from '../utils.js';

const STORAGE_KEY = 'squat-tracker-buddy';
const DROP_RATE = 0.05; // 5%
const DEFAULT_BASE_DAMAGE = 3;

export const BuddyManager = (() => {
  let state = {
    buddies: [], // Array of { id, name, emoji, level, exp, baseDamage, acquiredAt }
    currentBuddyId: null
  };
  let evolutionData = {};

  const load = () => {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.buddies = parsed.buddies || [];
        state.currentBuddyId = parsed.currentBuddyId || null;
        migrate();
      }
    } catch (e) {
      console.error('Failed to load buddy state', e);
    }
  };

  const migrate = () => {
    let changed = false;
    state.buddies.forEach(buddy => {
      if (typeof buddy.exp === 'undefined') {
        buddy.exp = 0;
        changed = true;
      }
      if (typeof buddy.baseDamage === 'undefined') {
        buddy.baseDamage = DEFAULT_BASE_DAMAGE;
        changed = true;
      }
    });
    if (changed) save();
  };

  const save = () => {
    if (!isStorageAvailable) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const init = (evoData = {}) => {
    evolutionData = evoData;
    load();
  };

  const checkDrop = (monsterIndex) => {
    const monster = MONSTERS[monsterIndex];
    if (!monster) return false;

    // Use name as ID for stability (or pre-defined ID if available)
    // Here we use name as ID for simplicity as per existing logic
    const buddyId = monster.name;

    // Already owned?
    if (state.buddies.some(b => b.id === buddyId)) {
      return false;
    }

    if (Math.random() < DROP_RATE) {
      addBuddy(monster, buddyId);
      return true;
    }

    return false;
  };

  const addBuddy = (monster, buddyId) => {
    const newBuddy = {
      id: buddyId,
      name: monster.name,
      emoji: monster.emoji,
      level: 1,
      exp: 0,
      baseDamage: DEFAULT_BASE_DAMAGE,
      acquiredAt: Date.now()
    };

    state.buddies.push(newBuddy);

    // Auto equip if it's the first buddy
    if (state.buddies.length === 1) {
      state.currentBuddyId = newBuddy.id;
    }

    save();

    showToast({
      emoji: '🤝',
      title: 'バディ獲得！',
      message: `${monster.emoji} ${monster.name} が仲間になった！`,
      sound: true
    });
  };

  const equipBuddy = (buddyId) => {
    if (state.currentBuddyId === buddyId) {
      return;
    }

    // Verify ownership
    if (!state.buddies.some(b => b.id === buddyId)) return;

    state.currentBuddyId = buddyId;
    save();
  };

  const unequipBuddy = () => {
      state.currentBuddyId = null;
      save();
  };

  const getDamageBonus = () => {
    if (!state.currentBuddyId) return 0;
    const buddy = state.buddies.find(b => b.id === state.currentBuddyId);
    if (!buddy) return 0;

    const base = buddy.baseDamage || DEFAULT_BASE_DAMAGE;
    return base + (buddy.level * 2);
  };

  const getBuddyList = () => {
    return [...state.buddies];
  };

  const getCurrentBuddy = () => {
    if (!state.currentBuddyId) return null;
    return state.buddies.find(b => b.id === state.currentBuddyId) || null;
  };

  const getRequiredExp = (level) => {
    return level * 50;
  };

  const evolve = (buddy) => {
    // Look up by original ID (which might be the name)
    // However, if we change ID upon evolution, we need to track lineage or use the current ID as key
    const currentId = buddy.id;
    const evo = evolutionData[currentId];

    if (!evo) return false;

    const oldName = buddy.name;
    const oldEmoji = buddy.emoji;

    // Update Buddy Props
    // We CHANGE the ID to the next form's ID to prevent duplicate acquisition of lower forms if dropped again?
    // Spec says: "Already owned? if (state.buddies.some(b => b.id === buddyId)) return false;"
    // If we evolve Slime -> King Slime (ID: king_slime), then user no longer has "Slime".
    // So Slime can drop again. This is acceptable (user can raise another slime).

    buddy.id = evo.nextId;
    buddy.name = evo.nextName;
    buddy.emoji = evo.nextEmoji;
    buddy.level = 1;
    buddy.exp = 0;
    buddy.baseDamage = (buddy.baseDamage || DEFAULT_BASE_DAMAGE) + evo.baseDamageBonus;
    buddy.acquiredAt = Date.now(); // Update acquired time? Maybe keep original? Let's update to sort by newness.

    // Update current equipped ID if this buddy was equipped
    if (state.currentBuddyId === currentId) {
      state.currentBuddyId = evo.nextId;
    }

    showToast({
        emoji: '✨',
        title: '進化！',
        message: `${oldName} ${oldEmoji} は\n${buddy.name} ${buddy.emoji} に進化した！`,
        sound: true
    });
    playCelebration();

    return true;
  };

  const addExp = (amount) => {
    if (!state.currentBuddyId) return null;
    const buddy = state.buddies.find(b => b.id === state.currentBuddyId);
    if (!buddy) return null;

    buddy.exp += amount;
    let leveledUp = false;
    let evolved = false;

    // Check Level Up
    // Use while loop to handle multiple level ups at once
    while (true) {
        const reqExp = getRequiredExp(buddy.level);
        if (buddy.exp >= reqExp) {
            buddy.exp -= reqExp;
            buddy.level++;
            leveledUp = true;

            // Check Evolution
            // Evolution happens immediately upon reaching level
            if (evolutionData[buddy.id] && buddy.level >= evolutionData[buddy.id].targetLevel) {
                const success = evolve(buddy);
                if (success) {
                    evolved = true;
                    // Reset level up flag as evolution "resets" level to 1 (conceptually different from level up)
                    // But for the caller, we might want to know something happened.
                    // Evolution effectively ends the loop as level becomes 1 and exp 0
                    break;
                }
            }
        } else {
            break;
        }
    }

    save();
    return { leveledUp, evolved, buddy };
  };

  return {
    init,
    checkDrop,
    equipBuddy,
    unequipBuddy,
    getDamageBonus,
    getBuddyList,
    getCurrentBuddy,
    addExp,
    getRequiredExp,
    // For testing
    _reset: () => {
        state = { buddies: [], currentBuddyId: null };
        save();
    },
    _forceAdd: (monsterIndex) => {
        const m = MONSTERS[monsterIndex];
        if(m) addBuddy(m, m.name);
    },
    _getState: () => state
  };
})();
