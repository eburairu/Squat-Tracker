import { getLocalDateKey, formatDate } from '../utils.js';

let heatmapTooltip = null;
const initializedContainers = new WeakSet();

export const initHeatmap = (heatmapContainer) => {
  if (!heatmapContainer || initializedContainers.has(heatmapContainer)) return;

  if (!heatmapTooltip) {
    heatmapTooltip = document.createElement('div');
    heatmapTooltip.className = 'heatmap-tooltip';
    document.body.appendChild(heatmapTooltip);
  }

  const showTooltip = (cell) => {
    if (!cell) return;
    const key = cell.dataset.date;
    const count = cell.dataset.count;
    if (!key) return;

    const rect = cell.getBoundingClientRect();
    const dateStr = formatDate(new Date(key.replace(/-/g, '/')).toISOString());
    heatmapTooltip.textContent = `${dateStr}: ${count}回`;
    heatmapTooltip.classList.add('visible');

    const tooltipWidth = heatmapTooltip.offsetWidth;
    heatmapTooltip.style.top = `${rect.top - 34 + window.scrollY}px`;
    heatmapTooltip.style.left = `${rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX}px`;
  };

  const hideTooltip = () => {
    if (heatmapTooltip) {
      heatmapTooltip.classList.remove('visible');
    }
  };

  heatmapContainer.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('heatmap-cell')) {
      showTooltip(e.target);
    }
  });

  heatmapContainer.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('heatmap-cell')) {
      hideTooltip();
    }
  });

  heatmapContainer.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('heatmap-cell')) {
      showTooltip(e.target);
      setTimeout(hideTooltip, 2500);
    }
  }, { passive: true });

  initializedContainers.add(heatmapContainer);
};

export const renderHeatmap = (historyEntries, heatmapContainer) => {
  if (!heatmapContainer) return;

  // Ensure initialized if not already (for safety, though initHeatmap should be called explicitly)
  initHeatmap(heatmapContainer);

  heatmapContainer.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'heatmap-grid';

  const dataMap = new Map();
  historyEntries.forEach((entry) => {
    const key = getLocalDateKey(new Date(entry.date));
    if (key) {
      dataMap.set(key, (dataMap.get(key) || 0) + entry.totalReps);
    }
  });

  const today = new Date();
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (26 * 7) - dayOfWeek);

  const cursor = new Date(startDate);
  const daysToRender = [];

  while (cursor <= today || cursor.getDay() !== 0) {
    if (cursor > today && cursor.getDay() === 0) break;
    daysToRender.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  daysToRender.forEach((date) => {
    const key = getLocalDateKey(date);
    const count = dataMap.get(key) || 0;

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';

    let level = 0;
    if (count > 0) level = 1;
    if (count >= 30) level = 2;
    if (count >= 60) level = 3;
    if (count >= 100) level = 4;

    cell.dataset.level = level;
    cell.dataset.date = key || '';
    cell.dataset.count = count;

    grid.appendChild(cell);
  });

  heatmapContainer.appendChild(grid);

  requestAnimationFrame(() => {
    heatmapContainer.scrollLeft = heatmapContainer.scrollWidth;
  });
};
