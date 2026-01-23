import { isStorageAvailable, getLocalDateKey, showToast } from '../utils.js';
import { InventoryManager } from './inventory-manager.js';

const STORAGE_KEY = 'squat-tracker-streak-shield';

export const StreakManager = {
  history: [], // シールドを使用した日付文字列 'YYYY-MM-DD' のリスト

  init() {
    this.load();
  },

  load() {
    if (!isStorageAvailable) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.history = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load streak shield history', e);
      this.history = [];
    }
  },

  save() {
    if (!isStorageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (e) {
      console.error('Failed to save streak shield history', e);
    }
  },

  getHistory() {
    return [...this.history];
  },

  addHistory(dateStr) {
    if (!this.history.includes(dateStr)) {
      this.history.push(dateStr);
      this.history.sort();
      this.save();
    }
  },

  /**
   * 昨日分のシールドを自動使用すべきかチェックします。
   * @param {string} lastWorkoutDateIso - 最終トレーニング日のISO日付文字列
   * @returns {boolean} シールドが使用された場合はtrue
   */
  checkAutoUse(lastWorkoutDateIso) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayKey = getLocalDateKey(yesterday);
    const lastWorkoutKey = lastWorkoutDateIso ? getLocalDateKey(new Date(lastWorkoutDateIso)) : null;

    // 条件1: 昨日のトレーニングが完了している場合は不要
    if (lastWorkoutKey === yesterdayKey) {
      return false;
    }

    // 仕様: アプリ起動時、昨日トレーニングしていない場合にシールドを消費する。
    // lastWorkoutKey が昨日より前の場合、昨日は未実施とみなす。
    // 本日トレーニング済みの場合 (lastWorkoutKey == today) も、昨日の分をチェックするには
    // 詳細な履歴が必要だが、簡易的に「最終実施日が昨日より後ならOK（連続しているとみなす）」とするか、
    // あるいは「最終実施日が今日なら、昨日のチェックはスキップ」とする。
    // ここでは「最終実施日が昨日以降ならシールド不要」と判断する。

    if (lastWorkoutKey && lastWorkoutKey >= yesterdayKey) {
        return false;
    }

    // 条件: すでに昨日分のシールドが使用されているかチェック
    if (this.history.includes(yesterdayKey)) {
      return false;
    }

    // インベントリチェック
    const shieldCount = InventoryManager.getConsumableCount('streak_shield');
    if (shieldCount <= 0) {
      return false;
    }

    // シールド適用
    InventoryManager.useConsumable('streak_shield', 1);
    this.addHistory(yesterdayKey);

    showToast({
        emoji: '🛡️',
        title: 'ストリーク・シールド発動',
        message: '昨日の分をカバーしました！',
        sound: true
    });

    return true;
  }
};
