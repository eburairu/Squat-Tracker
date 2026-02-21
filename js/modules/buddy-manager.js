import { MONSTERS } from '../constants.js';
import { isStorageAvailable, showToast } from '../utils.js';

const STORAGE_KEY = 'squat-tracker-buddy';
const DROP_RATE = 0.05; // 5%
const BASE_DAMAGE = 3;

export const BuddyManager = (() => {
  let state = {
    buddies: [], // Array of { id, name, emoji, level, exp, acquiredAt }
    currentBuddyId: null
  };

  const load = () => {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.buddies = parsed.buddies || [];
        state.currentBuddyId = parsed.currentBuddyId || null;
      }
    } catch (e) {
      console.error('Failed to load buddy state', e);
    }
  };

  const save = () => {
    if (!isStorageAvailable) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const init = () => {
    load();
  };

  const checkDrop = (monsterIndex) => {
    const monster = MONSTERS[monsterIndex];
    if (!monster) return false;

    // Use name as ID for stability
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

    return BASE_DAMAGE + (buddy.level * 2);
  };

  const getBuddyList = () => {
    return [...state.buddies];
  };

  const getCurrentBuddy = () => {
    if (!state.currentBuddyId) return null;
    return state.buddies.find(b => b.id === state.currentBuddyId) || null;
  };

  return {
    init,
    checkDrop,
    equipBuddy,
    unequipBuddy,
    getDamageBonus,
    getBuddyList,
    getCurrentBuddy,
    // For testing
    _reset: () => {
        state = { buddies: [], currentBuddyId: null };
        save();
    },
    _forceAdd: (monsterIndex) => {
        const m = MONSTERS[monsterIndex];
        if(m) addBuddy(m, m.name);
    }
  };
})();
