const { test, expect } = require('@playwright/test');

test.describe('Smart Coach Suggestion System', () => {

  const STORAGE_KEY_HISTORY = 'squat-tracker-history-v1';
  const STORAGE_KEY_COACH_SUGGEST = 'squat-tracker-coach-suggest';

  test.beforeEach(async ({ page }) => {
    // オリジンを設定し、ストレージをクリアする
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should not show banner if there is no history', async ({ page }) => {
    await page.goto('/');
    // 履歴がない場合はバナーが表示されないことを確認する
    const banner = page.locator('.smart-coach-banner');
    await expect(banner).toHaveCount(0);
  });

  test('should suggest Recovery if user has done 50+ reps consistently', async ({ page }) => {
    // モック履歴の注入: 50回以上のセッションが3回連続している状態
    const mockHistory = [
      { id: '1', date: new Date().toISOString(), totalSets: 5, repsPerSet: 10, totalReps: 50 },
      { id: '2', date: new Date(Date.now() - 86400000).toISOString(), totalSets: 5, repsPerSet: 11, totalReps: 55 },
      { id: '3', date: new Date(Date.now() - 172800000).toISOString(), totalSets: 6, repsPerSet: 10, totalReps: 60 }
    ];
    await page.evaluate((data) => {
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(data));
    }, mockHistory);

    await page.goto('/');

    const banner = page.locator('.smart-coach-banner.active');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('リカバリーモードをONにする');

    // 適用ボタンをクリック
    await banner.locator('.smart-coach-apply').click();

    // アクティブリカバリーが有効になり、トーストが表示され、バナーが消えることを確認
    await expect(banner).toHaveCount(0);
    const toast = page.locator('.achievement-toast').last();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('コーチの提案を適用');

    // アクティブリカバリーのトグルがONになっていることを確認
    const recoveryToggle = page.locator('#active-recovery-toggle');
    await expect(recoveryToggle).toBeChecked();
  });

  test('should suggest Overload if user has done exact same reps consistently', async ({ page }) => {
    // モック履歴の注入: 3セット10回(計30回)が3回連続している状態
    const mockHistory = [
      { id: '1', date: new Date().toISOString(), totalSets: 3, repsPerSet: 10, totalReps: 30 },
      { id: '2', date: new Date(Date.now() - 86400000).toISOString(), totalSets: 3, repsPerSet: 10, totalReps: 30 },
      { id: '3', date: new Date(Date.now() - 172800000).toISOString(), totalSets: 3, repsPerSet: 10, totalReps: 30 }
    ];
    await page.evaluate((data) => {
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify(data));
    }, mockHistory);

    await page.goto('/');

    const banner = page.locator('.smart-coach-banner.active');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('提案を適用する');
    await expect(banner).toContainText('3セット × 12回'); // ロジックにより回数が+2されているか確認

    // Overloadを適用
    await banner.locator('.smart-coach-apply').click();

    // フォームの値が更新されていることを確認
    const setCountInput = page.locator('#set-count');
    const repCountInput = page.locator('#rep-count');

    await expect(setCountInput).toHaveValue('3');
    await expect(repCountInput).toHaveValue('12');

    // リロード時に今日中は再表示されないことを確認
    await page.goto('/');
    const bannerAfterReload = page.locator('.smart-coach-banner');
    await expect(bannerAfterReload).toHaveCount(0);
  });
});