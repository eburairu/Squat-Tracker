import { getLocalDateKey, showToast } from '../utils.js';
import { PhoenixProtocol } from './phoenix-protocol.js';

export const StreakGuardian = (() => {
  let container = null;
  let currentDeadline = null;
  let currentStatus = null;

  // Constants
  const ONE_HOUR = 60 * 60 * 1000;
  const THRESHOLDS = {
    WARNING: 6 * ONE_HOUR,
    DANGER: 3 * ONE_HOUR,
  };

  const init = () => {
    container = document.getElementById('streak-guardian');
    if (!container) {
      console.warn('StreakGuardian: Container #streak-guardian not found in DOM.');
      return;
    }

    // Add interaction
    container.style.cursor = 'pointer';
    container.setAttribute('role', 'button');
    container.setAttribute('tabindex', '0');
    container.setAttribute('aria-label', 'ストリーク状態。クリックして詳細を確認');

    container.addEventListener('click', handleClick);
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    });
  };

  const handleClick = () => {
    if (!currentStatus || currentStatus === 'lost') return;

    if (currentStatus === 'completed') {
      showToast({ emoji: '✅', title: '完了済み', message: '本日のトレーニングは完了しています！' });
      return;
    }

    if (currentDeadline) {
      const m = currentDeadline.getMonth() + 1;
      const d = currentDeadline.getDate();
      const h = String(currentDeadline.getHours()).padStart(2, '0');
      const min = String(currentDeadline.getMinutes()).padStart(2, '0');

      const timeStr = `${m}/${d} ${h}:${min}`;

      showToast({ emoji: '🛡️', title: '有効期限', message: `${timeStr} までに次のトレーニングを行ってください。` });
    }
  };

  const getDeadline = (lastDateStr) => {
    const lastDate = new Date(lastDateStr);
    // 期限は翌日の23:59:59.999
    const deadline = new Date(lastDate);
    deadline.setDate(deadline.getDate() + 1);
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  };

  const formatDuration = (ms) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
  };

  const update = (historyEntries) => {
    if (!container) return;

    // 履歴がない場合 -> 初回ユーザー
    if (!Array.isArray(historyEntries) || historyEntries.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex'; // 表示

    const lastEntry = historyEntries[0];
    const lastDate = new Date(lastEntry.date);
    const now = new Date();

    // 今日すでに完了しているか確認
    const todayKey = getLocalDateKey(now);
    const lastKey = getLocalDateKey(lastDate);

    if (todayKey === lastKey) {
      currentStatus = 'completed';
      currentDeadline = null;
      render('completed');
      return;
    }

    // 期限計算
    const deadline = getDeadline(lastEntry.date);
    currentDeadline = deadline;
    const remaining = deadline - now;

    // ステータス判定
    if (remaining <= 0) {
      currentStatus = 'lost';

      // PhoenixProtocolの判定
      const eligibility = PhoenixProtocol.checkEligibility(historyEntries);
      if (eligibility || PhoenixProtocol.state.isActive) {
        render('phoenix', 0, eligibility);
      } else {
        render('lost');
      }
    } else if (remaining < THRESHOLDS.DANGER) {
      currentStatus = 'danger';
      render('danger', remaining);
    } else if (remaining < THRESHOLDS.WARNING) {
      currentStatus = 'warning';
      render('warning', remaining);
    } else {
      currentStatus = 'safe';
      render('safe', remaining);
    }
  };

  const render = (status, remaining = 0, phoenixEligibility = null) => {
    // クラスリセット
    container.classList.remove('status-completed', 'status-safe', 'status-warning', 'status-danger', 'status-lost', 'status-phoenix');
    container.classList.add(`status-${status}`);

    // イベントリスナーのクリーンアップ（Phoenix用）
    const existingBtn = container.querySelector('#phoenix-accept-btn');
    if (existingBtn) {
      existingBtn.replaceWith(existingBtn.cloneNode(true));
    }

    let html = '';
    if (status === 'completed') {
      html = `
        <div class="guardian-icon">✅</div>
        <div class="guardian-text">本日のトレーニング完了！</div>
      `;
    } else if (status === 'lost') {
      html = `
        <div class="guardian-icon">💤</div>
        <div class="guardian-text">記録が途切れました...</div>
      `;
    } else if (status === 'phoenix') {
      if (PhoenixProtocol.state.isActive) {
        html = `
          <div class="guardian-icon">🦅</div>
          <div class="guardian-content">
            <div class="guardian-label">修復クエスト進行中</div>
            <div class="guardian-timer">残り ${PhoenixProtocol.state.targetReps}回</div>
          </div>
        `;
      } else if (phoenixEligibility) {
        html = `
          <div class="guardian-icon">🔥</div>
          <div class="guardian-content" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div class="guardian-label" style="font-size: 0.8em; margin-right: 8px;">記録修復クエスト発生！</div>
            <button id="phoenix-accept-btn" class="btn primary small" style="padding: 4px 8px; font-size: 0.8em;">受注</button>
          </div>
        `;
      }
    } else {
      const timeStr = formatDuration(remaining);
      let icon = '🛡️';
      let msg = '連続記録継続中';

      if (status === 'warning') {
        icon = '⚠️';
        msg = '記録継続の期限まで';
      } else if (status === 'danger') {
        icon = '🔥';
        msg = '期限まであとわずか！';
      }

      html = `
        <div class="guardian-icon">${icon}</div>
        <div class="guardian-content">
          <div class="guardian-label">${msg}</div>
          <div class="guardian-timer">あと ${timeStr}</div>
        </div>
      `;
    }
    container.innerHTML = html;

    if (status === 'phoenix' && phoenixEligibility && !PhoenixProtocol.state.isActive) {
      const acceptBtn = container.querySelector('#phoenix-accept-btn');
      if (acceptBtn) {
        acceptBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // StreakGuardian自体のクリックイベントを防ぐ
          PhoenixProtocol.acceptQuest(phoenixEligibility.missedDate);
          render('phoenix', 0, phoenixEligibility); // 再レンダリングして「進行中」表示にする
        });
      }
    }
  };

  return {
    init,
    update
  };
})();
