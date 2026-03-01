import { STORAGE_KEYS } from '../constants.js';
import { WORLD_MAP } from '../data/world-map.js';
import { isStorageAvailable } from '../utils.js';

const ROUTES = {
  NORMAL: {
    id: 'normal',
    name: '王道',
    emoji: '🛡️',
    description: 'バランスの取れた標準的なルート。<br>初心者にもおすすめ。',
    modifiers: { hp: 1.0, exp: 1.0, drop: 1.0 },
    styleClass: 'route-normal'
  },
  HARD: {
    id: 'hard',
    name: '修羅の道',
    emoji: '🔥',
    description: '敵は手強いが見返りも大きい。<br><span class="modifier-tag">敵HP x1.5 / EXP x1.5</span>',
    modifiers: { hp: 1.5, exp: 1.5, drop: 1.2 },
    styleClass: 'route-hard'
  },
  EASY: {
    id: 'easy',
    name: '裏道',
    emoji: '🍀',
    description: '敵は弱いが実入りは少ない。<br><span class="modifier-tag">敵HP x0.8 / EXP x0.8</span>',
    modifiers: { hp: 0.8, exp: 0.8, drop: 1.0 },
    styleClass: 'route-easy'
  }
};

export const AdventureSystem = (() => {
  let state = {
    currentAreaIndex: 0,
    currentNodeIndex: 0,
    currentRouteId: 'normal',
    routeModifiers: { hp: 1.0, exp: 1.0, drop: 1.0 }
  };

  const elements = {
    background: null,
    status: null,
    modal: null,
    routeCardsContainer: null
  };

  let onStateChangeCallback = null;
  let onRouteSelectedCallback = null;

  const load = () => {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADVENTURE);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.currentAreaIndex = Number(parsed.currentAreaIndex) || 0;
        state.currentNodeIndex = Number(parsed.currentNodeIndex) || 0;
        // Migration support
        state.currentRouteId = parsed.currentRouteId || 'normal';
        state.routeModifiers = parsed.routeModifiers || { hp: 1.0, exp: 1.0, drop: 1.0 };
      }
    } catch (e) {
      console.error('Failed to load adventure state', e);
    }
  };

  const save = () => {
    if (!isStorageAvailable) return;
    localStorage.setItem(STORAGE_KEYS.ADVENTURE, JSON.stringify(state));
  };

  const init = (options = {}) => {
    onStateChangeCallback = options.onStateChange || null;
    elements.background = document.getElementById('adventure-background');
    elements.status = document.getElementById('adventure-status');
    elements.modal = document.getElementById('route-selection-modal');
    elements.routeCardsContainer = document.getElementById('route-cards-container');

    load();
    render();
  };

  const getCurrentArea = () => {
    const index = state.currentAreaIndex % WORLD_MAP.length;
    return WORLD_MAP[index];
  };

  const getProgress = () => {
    const area = getCurrentArea();
    return {
      areaIndex: state.currentAreaIndex,
      nodeIndex: state.currentNodeIndex,
      totalNodes: area.totalNodes,
      areaName: area.name,
      theme: area.theme,
      routeId: state.currentRouteId
    };
  };

  const getRouteModifiers = () => {
    return state.routeModifiers;
  };

  const advance = () => {
    const area = getCurrentArea();
    state.currentNodeIndex++;

    let areaCleared = false;
    if (state.currentNodeIndex >= area.totalNodes) {
      // エリアクリア！
      state.currentNodeIndex = 0;
      state.currentAreaIndex++;
      areaCleared = true;
    }

    save();
    render();
    notifyChange();

    return {
      areaCleared,
      currentArea: getCurrentArea()
    };
  };

  const notifyChange = () => {
    if (onStateChangeCallback) {
      onStateChangeCallback(getProgress());
    }
  };

  const render = () => {
    const { background, status } = elements;
    const progress = getProgress();

    if (background) {
      background.style.background = progress.theme.background;
    }

    if (status) {
      const total = progress.totalNodes;
      const current = progress.nodeIndex;
      const safeTotal = total > 1 ? total - 1 : 1;
      const pct = Math.min(100, Math.max(0, (current / safeTotal) * 100));

      let nodesHtml = '';
      for (let i = 0; i < total; i++) {
        let className = 'adventure-node';
        if (i < current) className += ' cleared';
        if (i === current) className += ' active';
        nodesHtml += `<div class="${className}"></div>`;
      }

      status.innerHTML = `
        <div class="adventure-info">
          <div class="adventure-area-name">
            <span>🗺️</span> ${progress.areaName} <small>(Area ${progress.areaIndex + 1})</small>
          </div>
          <div class="adventure-steps">Step ${current + 1} / ${total}</div>
        </div>
        <div class="adventure-progress-track">
          ${nodesHtml}
          <div class="adventure-avatar" style="left: ${pct}%">🏃</div>
        </div>
      `;
    }
  };

  const showRouteSelection = (callback) => {
    onRouteSelectedCallback = callback;
    if (!elements.modal || !elements.routeCardsContainer) {
      console.warn('Route selection modal elements missing');
      // UIがない場合はデフォルト挙動としてコールバックを即実行
      if (callback) callback();
      return;
    }

    // Render Cards
    elements.routeCardsContainer.innerHTML = '';
    Object.values(ROUTES).forEach(route => {
      const card = document.createElement('button');
      card.className = `route-card ${route.styleClass}`;
      card.innerHTML = `
        <div class="route-emoji">${route.emoji}</div>
        <div class="route-name">${route.name}</div>
        <div class="route-desc">${route.description}</div>
        <button class="route-btn">この道を行く</button>
      `;
      card.onclick = () => selectRoute(route.id);
      elements.routeCardsContainer.appendChild(card);
    });

    // Show Modal
    elements.modal.style.display = 'flex';
    elements.modal.classList.add('active');
    elements.modal.setAttribute('aria-hidden', 'false');
  };

  const selectRoute = (routeId) => {
    const route = Object.values(ROUTES).find(r => r.id === routeId) || ROUTES.NORMAL;

    state.currentRouteId = route.id;
    state.routeModifiers = route.modifiers;
    save();

    // Hide Modal
    if (elements.modal) {
      elements.modal.classList.remove('active');
      elements.modal.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        elements.modal.style.display = 'none';
      }, 300);
    }

    if (onRouteSelectedCallback) {
      onRouteSelectedCallback();
      onRouteSelectedCallback = null;
    }
  };

  const reset = () => {
    state = {
      currentAreaIndex: 0,
      currentNodeIndex: 0,
      currentRouteId: 'normal',
      routeModifiers: { hp: 1.0, exp: 1.0, drop: 1.0 }
    };
    save();
    render();
    notifyChange();
  };

  return {
    init,
    getCurrentArea,
    getProgress,
    getRouteModifiers,
    advance,
    showRouteSelection,
    selectRoute, // テスト用に公開
    reset,
    render
  };
})();
