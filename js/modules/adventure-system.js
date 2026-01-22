import { WORLD_MAP } from '../data/world-map.js';
import { isStorageAvailable } from '../utils.js';

const STORAGE_KEY = 'squat-tracker-adventure';

export const AdventureSystem = (() => {
  let state = {
    currentAreaIndex: 0,
    currentNodeIndex: 0
  };

  const elements = {
    background: null,
    status: null
  };

  let onStateChangeCallback = null;

  const load = () => {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.currentAreaIndex = Number(parsed.currentAreaIndex) || 0;
        state.currentNodeIndex = Number(parsed.currentNodeIndex) || 0;
      }
    } catch (e) {
      console.error('Failed to load adventure state', e);
    }
  };

  const save = () => {
    if (!isStorageAvailable) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const init = (options = {}) => {
    onStateChangeCallback = options.onStateChange || null;
    elements.background = document.getElementById('adventure-background');
    elements.status = document.getElementById('adventure-status');

    load();
    render();
  };

  const getCurrentArea = () => {
    // 範囲外の場合はループ（エンドレスモード）
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
      theme: area.theme
    };
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
      // 背景
      background.style.background = progress.theme.background;
    }

    if (status) {
      // HTML構造の作成
      const total = progress.totalNodes;
      const current = progress.nodeIndex;

      // アバターの位置（％）を計算
      // 0で0%、(total-1)で100%になるように計算
      // ノード数は totalNodes（例: 10個なら index 0..9）
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

  // テスト用
  const reset = () => {
    state = { currentAreaIndex: 0, currentNodeIndex: 0 };
    save();
    render();
    notifyChange();
  };

  return {
    init,
    getCurrentArea,
    getProgress,
    advance,
    reset,
    // 外部から描画が必要な場合のために公開（通常はinitが呼ぶ）
    render
  };
})();
