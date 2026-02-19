/**
 * InsightGenerator
 * 分析データに基づいて、ユーザーへのアドバイスやメッセージを生成する
 */
export const InsightGenerator = {
  /**
   * 分析結果からインサイトを生成する
   * @param {Object} analysis - AnalyticsManager.analyze() の結果
   * @returns {Object} { type, message, emoji }
   */
  generate(analysis) {
    if (!analysis || !analysis.totalSessions) {
      return {
        type: 'welcome',
        emoji: '🔰',
        message: 'トレーニングデータがまだありません。まずは1回、スクワットをやってみましょう！'
      };
    }

    const { weekly, hourly, monthly, totalSessions } = analysis;
    const today = new Date();
    const currentDay = today.getDay(); // 0-6

    // 1. 直近の活動チェック (簡易的にweeklyデータから推測は難しいが、AnalyticsManagerにlastWorkoutDateがあればベスト。
    // 今回は簡易的に、総回数が少ない場合を初心者とする)
    if (totalSessions < 5) {
      return {
        type: 'beginner',
        emoji: '🌱',
        message: '開始したばかりですね！まずは3日坊主を卒業しましょう。'
      };
    }

    // 2. 曜日別分析
    const maxDayIndex = weekly.indexOf(Math.max(...weekly));
    const minDayIndex = weekly.indexOf(Math.min(...weekly));
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    // 特定の曜日に偏っているか？
    const totalWeeklyReps = weekly.reduce((a, b) => a + b, 0);
    const maxDayRate = weekly[maxDayIndex] / (totalWeeklyReps || 1);

    if (maxDayRate > 0.4 && totalWeeklyReps > 100) {
      return {
        type: 'pattern',
        emoji: '📅',
        message: `${dayNames[maxDayIndex]}曜日はあなたの「ゴールデンタイム」です！この調子で続けましょう。`
      };
    }

    // 3. 時間帯分析
    const { morning, day, night, late } = hourly;
    const totalHourly = morning + day + night + late;

    if (morning > totalHourly * 0.5) {
      return {
        type: 'morning_person',
        emoji: '☀️',
        message: '素晴らしい朝活習慣です！朝のスクワットは代謝アップに効果的です。'
      };
    }

    if (night > totalHourly * 0.5) {
      return {
        type: 'night_owl',
        emoji: '🌙',
        message: '夜のトレーニングが定着していますね。良質な睡眠のため、寝る1時間前には終えましょう。'
      };
    }

    if (late > totalHourly * 0.2) {
      return {
        type: 'warning',
        emoji: '🦉',
        message: '深夜の運動が多いようです。無理せず、睡眠時間もしっかり確保してくださいね。'
      };
    }

    // 4. 苦手な曜日への提案 (今日が苦手な曜日なら)
    if (weekly[currentDay] === 0 && totalWeeklyReps > 50) {
      return {
        type: 'suggestion',
        emoji: '🔥',
        message: `今日はこれまで実績が少ない${dayNames[currentDay]}曜日です。今日やれば、新しい習慣への第一歩になります！`
      };
    }

    // Default
    return {
      type: 'general',
      emoji: '💪',
      message: '継続は力なり。あなたのペースで着実に積み重ねていきましょう。'
    };
  }
};
