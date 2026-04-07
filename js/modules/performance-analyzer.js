/**
 * パフォーマンス・アナリティクス（自動評価＆フィードバック）モジュール
 * セッション終了時に達成度やペースを評価し、ランクとフィードバックを提供する。
 */

export const PerformanceAnalyzer = {
  /**
   * セッションデータを評価し、結果を返す
   * @param {Object} stats
   * @param {number} stats.targetTotalReps - 目標合計レップ数
   * @param {number} stats.completedReps - 完了したレップ数
   * @param {number} [stats.targetPace] - 1レップの目標秒数
   * @param {number} [stats.averagePace] - 1レップの平均実測秒数
   * @returns {Object} { score, rank, feedback }
   */
  evaluate(stats) {
    if (!stats || !stats.targetTotalReps) {
      return { score: 0, rank: 'C', feedback: '評価できませんでした。' };
    }

    const { targetTotalReps, completedReps, targetPace, averagePace } = stats;

    // 1. 達成度スコア (Max 100)
    let completionScore = (completedReps / targetTotalReps) * 100;
    if (completionScore > 100) completionScore = 100;

    // 2. ペーススコア計算 (実測値がある場合)
    let paceScore = 100;
    let paceFeedback = '';

    if (targetPace > 0 && averagePace > 0 && completedReps > 0) {
      const diff = averagePace - targetPace;
      const ratio = Math.abs(diff) / targetPace;

      // 誤差が10%以内なら満点、それ以上は減点
      if (ratio > 0.1) {
        paceScore -= (ratio - 0.1) * 100 * 2; // 減点係数2
        if (paceScore < 0) paceScore = 0;
      }

      if (diff < -0.5) {
        paceFeedback = 'ペースが少し早かったようです。次回はもう少しゆっくりと動くことを意識しましょう。';
      } else if (diff > 1.0) {
        paceFeedback = '少しペースが遅れがちでした。リズムに乗ることを意識しましょう。';
      } else {
        paceFeedback = '素晴らしいリズム感です！完璧なペースを維持できています。';
      }
    } else {
      // ペースデータがない場合は達成率のみで評価
      if (completionScore >= 100) {
        paceFeedback = '目標を完全達成しました！素晴らしい集中力です。';
      } else if (completionScore >= 80) {
        paceFeedback = 'あと少しで完全達成でした。この調子で頑張りましょう。';
      } else {
        paceFeedback = '無理せず、自分のペースで継続することが大切です。';
      }
    }

    // 3. 総合スコアの算出 (達成度を重視: 達成度 70%, ペース 30%)
    let finalScore = (completionScore * 0.7) + (paceScore * 0.3);
    finalScore = Math.round(finalScore);

    // 途中でリタイア（未達成）の場合は最大スコアに上限を設ける
    if (completionScore < 100 && finalScore >= 95) {
      finalScore = 94; // Sランクにはしない
    }

    // 4. ランク判定
    let rank = 'C';
    if (finalScore >= 95) {
      rank = 'S';
    } else if (finalScore >= 80) {
      rank = 'A';
    } else if (finalScore >= 60) {
      rank = 'B';
    }

    return {
      score: finalScore,
      rank: rank,
      feedback: paceFeedback
    };
  }
};
