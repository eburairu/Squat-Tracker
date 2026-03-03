const { test, expect } = require('@playwright/test');

test.describe('Smart Mission Routine', () => {
  test.beforeEach(async ({ page }) => {
    // モックデータとして、Daily Mission と Bingo の状態をセット
    const mockDailyMissions = {
      lastUpdated: new Date().toISOString().split('T')[0],
      missions: [
        { type: 'total_reps', description: 'スクワットを50回行う', target: 50, current: 0, completed: false },
        { type: 'total_sets', description: '合計4セット行う', target: 4, current: 0, completed: false },
        { type: 'login', description: 'アプリを起動してログイン', target: 1, current: 1, completed: true }
      ]
    };

    const mockBingo = {
      weekId: '2023-W01',
      cells: [
        { id: 0, type: 'total_reps', description: 'スクワット', target: 100, current: 20, completed: false }, // 残り80回
        { id: 1, type: 'total_calories', description: 'カロリー消費', target: 20, current: 0, completed: false } // target 20 -> reps 40
      ],
      claimedLines: [],
      completed: false
    };

    // 初期化前に LocalStorage に設定
    await page.addInitScript((mockData) => {
      window.localStorage.setItem('squat-tracker-missions', JSON.stringify(mockData.daily));
      window.localStorage.setItem('squat-tracker-bingo', JSON.stringify(mockData.bingo));
    }, { daily: mockDailyMissions, bingo: mockBingo });

    // アプリ内部のBingoManagerが現在時刻からweekIdを計算し、保存された週と違う場合はリセットしてしまうため
    // page側の時刻もmockBingoのweekIdの週(2023-W01 = 2023/1/1週)に固定する
    await page.clock.install({ time: new Date('2023-01-05T12:00:00Z') });

    await page.goto('/');

    // アプリケーション（DOM）の準備完了を待つ
    await page.waitForFunction(() => window.SmartMissionRoutine !== undefined);
  });

  test('should calculate and apply optimal sets and reps', async ({ page }) => {
    // 期待値:
    // Daily の total_sets: 残り4セット -> targetSets = 4
    // Daily の total_reps: 残り50回
    // Bingo の total_reps: 残り80回
    // 必要な targetReps は Max(50, 80) = 80回
    // ...しかしBingo側で total_calories (target 20, current 0) も残っている
    // target 20 kcal は 0.5 rep/kcal で計算するため、repsForCalories = 40 reps
    // targetReps は Max(50, 80, 40) = 80回
    //
    // よって targetSets=4, targetReps=80
    // repsPerSet = Math.ceil(80 / 4) = 20回

    const setInput = page.locator('#set-count');
    const repInput = page.locator('#rep-count');

    // ボタンをクリック
    await page.click('#smart-mission-routine-button');

    // Toast が表示されるのを待つ (UI的なフィードバックの確認)
    const toast = page.locator('.achievement-toast').filter({ hasText: 'ミッション一括設定' });
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('4セット × 20回');

    // 入力欄の値が更新されていることを確認
    await expect(setInput).toHaveValue('4');
    await expect(repInput).toHaveValue('20');
  });
});
