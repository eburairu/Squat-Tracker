export const FormAnalyzer = (() => {
  let targetDurations = { down: 0, hold: 0, up: 0 };
  let currentRepData = { down: 0, hold: 0, up: 0 };
  let repsData = [];
  let phaseStartTime = 0;
  let currentPhase = null;

  const init = (downSec, holdSec, upSec) => {
    targetDurations = {
      down: downSec * 1000,
      hold: holdSec * 1000,
      up: upSec * 1000
    };
    repsData = [];
    resetRepData();
  };

  const resetRepData = () => {
    currentRepData = { down: 0, hold: 0, up: 0 };
  };

  const recordPhaseStart = (phaseKey) => {
    currentPhase = phaseKey;
    phaseStartTime = Date.now();
  };

  const recordPhaseEnd = () => {
    if (!currentPhase || !phaseStartTime) return;

    // DOWN, HOLD, UPのフェーズのみ記録する
    if (['down', 'hold', 'up'].includes(currentPhase)) {
        const elapsed = Date.now() - phaseStartTime;
        currentRepData[currentPhase] = elapsed;
    }

    // UPフェーズが終わったら1レップ完了として記録
    if (currentPhase === 'up') {
        repsData.push({ ...currentRepData });
        resetRepData();
    }

    currentPhase = null;
    phaseStartTime = 0;
  };

  const calculateScore = () => {
    if (repsData.length === 0) return { score: 0, rank: 'C', message: 'データなし' };

    let totalScore = 0;
    const maxScorePerRep = 100;

    repsData.forEach(rep => {
      let repScore = 0;
      let totalTarget = targetDurations.down + targetDurations.hold + targetDurations.up;

      if(totalTarget === 0) return; // ゼロ除算防止

      // 各フェーズの誤差率を計算
      ['down', 'hold', 'up'].forEach(phase => {
          const target = targetDurations[phase];
          const actual = rep[phase];

          if (target > 0) {
              // 誤差をパーセンテージで計算 (1.0 = 100%誤差)
              const errorRatio = Math.abs(actual - target) / target;

              // 誤差が小さいほど高得点 (誤差0 = 100点、誤差100%以上 = 0点)
              // フェーズの重みづけはとりあえず均等にするため、フェーズごとの満点を設定
              const phaseWeight = target / totalTarget; // 時間の長さに応じた重み
              const phaseMaxScore = maxScorePerRep * phaseWeight;

              let phaseScore = phaseMaxScore * (1 - errorRatio);
              phaseScore = Math.max(0, phaseScore); // マイナスにならないように

              repScore += phaseScore;
          }
      });
      totalScore += repScore;
    });

    const averageScore = Math.round(totalScore / repsData.length);
    const rank = getRank(averageScore);
    const message = getFeedbackMessage(rank);

    return { score: averageScore, rank, message };
  };

  const getRank = (score) => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    return 'C';
  };

  const getFeedbackMessage = (rank) => {
    switch (rank) {
      case 'S': return '完璧なテンポです！素晴らしい！';
      case 'A': return '良いテンポです！その調子！';
      case 'B': return 'まずまずのテンポです。もう少しリズムを意識しましょう。';
      case 'C': default: return 'リズムが乱れがちです。ガイドに合わせることを意識しましょう。';
    }
  };

  return {
    init,
    recordPhaseStart,
    recordPhaseEnd,
    calculateScore,
    // テスト用に公開
    _getState: () => ({ targetDurations, repsData, currentRepData })
  };
})();
