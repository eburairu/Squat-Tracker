/**
 * AnalyticsManager
 * 履歴データを分析し、曜日別・時間帯別・月別の統計情報を生成するモジュール
 */
export const AnalyticsManager = {
  /**
   * 全ての分析を実行する
   * @param {Array} historyEntries - 履歴データの配列
   * @returns {Object} 分析結果オブジェクト
   */
  analyze(historyEntries) {
    if (!historyEntries || !Array.isArray(historyEntries)) {
      return this.getEmptyResult();
    }

    return {
      weekly: this.analyzeWeekly(historyEntries),
      hourly: this.analyzeHourly(historyEntries),
      monthly: this.analyzeMonthly(historyEntries),
      totalSessions: historyEntries.length
    };
  },

  /**
   * 空の分析結果を返す
   */
  getEmptyResult() {
    return {
      weekly: Array(7).fill(0),
      hourly: { morning: 0, day: 0, night: 0, late: 0 },
      monthly: [],
      totalSessions: 0
    };
  },

  /**
   * 曜日別のアクティビティを集計する (日〜土)
   * @param {Array} entries
   * @returns {Array} 曜日ごとの合計回数 [日, 月, ..., 土]
   */
  analyzeWeekly(entries) {
    const weekly = Array(7).fill(0); // 0: 日曜, 6: 土曜

    entries.forEach(entry => {
      const date = new Date(entry.date);
      const day = date.getDay(); // 0-6
      weekly[day] += (entry.totalReps || 0);
    });

    return weekly;
  },

  /**
   * 時間帯別のアクティビティを集計する
   * 朝: 05:00 - 10:59
   * 昼: 11:00 - 16:59
   * 夜: 17:00 - 22:59
   * 深夜: 23:00 - 04:59
   * @param {Array} entries
   * @returns {Object} { morning, day, night, late }
   */
  analyzeHourly(entries) {
    const hourly = { morning: 0, day: 0, night: 0, late: 0 };

    entries.forEach(entry => {
      const date = new Date(entry.date);
      const hour = date.getHours();
      const reps = entry.totalReps || 0;

      if (hour >= 5 && hour < 11) {
        hourly.morning += reps;
      } else if (hour >= 11 && hour < 17) {
        hourly.day += reps;
      } else if (hour >= 17 && hour < 23) {
        hourly.night += reps;
      } else {
        // 23:00 - 04:59
        hourly.late += reps;
      }
    });

    return hourly;
  },

  /**
   * 直近6ヶ月の月別推移を集計する
   * @param {Array} entries
   * @returns {Array} [{ label: '10月', value: 100 }, ...]
   */
  analyzeMonthly(entries) {
    // 直近6ヶ月の月リストを作成
    const months = [];
    const today = new Date();

    // 5ヶ月前〜今月まで
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key: key,
        label: `${d.getMonth() + 1}月`,
        value: 0
      });
    }

    // 集計
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const targetMonth = months.find(m => m.key === key);
      if (targetMonth) {
        targetMonth.value += (entry.totalReps || 0);
      }
    });

    // キーを削除してラベルと値だけ返す
    return months.map(m => ({ label: m.label, value: m.value }));
  }
};
