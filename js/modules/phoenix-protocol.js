import { STORAGE_KEYS } from '../constants.js';
import { isStorageAvailable, showToast, getLocalDateKey } from '../utils.js';
export const PhoenixProtocol = (() => {
  let state = {
    isActive: false,
    targetReps: 50,
    missedDate: null // YYYY-MM-DD
  };

  const TARGET_REPS = 50;

  const init = () => {
    if (!isStorageAvailable('localStorage')) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PHOENIX);
      if (stored) {
        state = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load PhoenixProtocol state', e);
    }

    // 期限切れチェック（日を跨いでいたらリセット）
    if (state.isActive) {
      const today = getLocalDateKey(new Date());
      // missedDate は「休んでしまった日」。クエストの有効期限は「休んだ日の翌日」なので、todayがそれより先なら失敗
      if (state.missedDate) {
        // new Date("YYYY-MM-DD") のUTCパース回避のためT00:00:00を追加
        const missed = new Date(state.missedDate + 'T00:00:00');
        const deadline = new Date(missed);
        deadline.setDate(deadline.getDate() + 1);
        if (today !== getLocalDateKey(deadline)) {
            // 期限切れ
            reset();
        }
      }
    }
  };

  const save = () => {
    if (!isStorageAvailable('localStorage')) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PHOENIX, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save PhoenixProtocol state', e);
    }
  };

  const reset = () => {
    state = {
      isActive: false,
      targetReps: TARGET_REPS,
      missedDate: null
    };
    save();
  };

  // 1日だけ記録が途切れているか判定する
  const checkEligibility = (historyEntries) => {
    if (!historyEntries || historyEntries.length === 0) return null;

    // 最新の履歴
    const lastEntry = historyEntries[0];
    const lastDate = new Date(lastEntry.date);
    const now = new Date();

    const todayKey = getLocalDateKey(now);
    const lastKey = getLocalDateKey(lastDate);

    if (todayKey === lastKey) return null; // 今日実施済みなら対象外

    // 昨日
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yesterday);

    if (lastKey === yesterdayKey) return null; // 昨日実施済みならまだlostになっていない(またはwarning/danger)

    // 一昨日
    const dayBeforeYesterday = new Date(now);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    const dayBeforeYesterdayKey = getLocalDateKey(dayBeforeYesterday);

    // 最後にやったのが「一昨日」であれば、「昨日」だけ休んだことになる
    if (lastKey === dayBeforeYesterdayKey) {
        return { missedDate: yesterdayKey, targetReps: TARGET_REPS };
    }

    return null;
  };

  const acceptQuest = (missedDateStr) => {
    state.isActive = true;
    state.targetReps = TARGET_REPS;
    state.missedDate = missedDateStr;
    save();

    showToast({
      emoji: '🔥',
      title: 'プロトコル起動',
      message: `ストリーク修復クエストを受注しました！\n目標: ${TARGET_REPS}回`
    });
  };

  const checkCompletion = (totalReps, saveHistoryCallback) => {
    if (!state.isActive || !state.missedDate) return null;

    if (totalReps >= state.targetReps) {
      // 達成！履歴を補填する
      const recoveryEntry = {
        date: state.missedDate + 'T23:59:59', // 休んだ日の最後として記録
        reps: state.targetReps,
        sets: 1,
        duration: 0,
        timeline: [],
        note: 'Phoenix Protocol: Streak Recovered',
        isRecovery: true // オプション
      };

      if (typeof saveHistoryCallback === 'function') {
        saveHistoryCallback(recoveryEntry);
      }

      showToast({
        emoji: '🦅',
        title: 'フェニックス・プロトコル完了',
        message: '過去の記録が修復され、ストリークが復活しました！'
      });

      reset();
      return recoveryEntry;
    } else {
        // 部分的な達成でも、今のセッションの回数を引いて継続させるか検討の余地あり。
        // シンプルに「1回のセッションで目標達成」とするなら引かない。
        // 今回はシンプルに、1回のセッションで達成できなくても、残りを減らしていく仕様にする
        state.targetReps -= totalReps;
        save();
        showToast({
          emoji: '🔥',
          title: 'プロトコル進行中',
          message: `ストリーク修復まであと ${state.targetReps}回`
        });
        return null;
    }
  };

  return {
    init,
    checkEligibility,
    acceptQuest,
    checkCompletion,
    get state() { return state; },
    reset // テスト用
  };
})();
