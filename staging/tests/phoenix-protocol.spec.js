const { test, expect } = require('@playwright/test');

test.describe('Phoenix Protocol', () => {
  test.beforeEach(async ({ page }) => {
    // モックデータとして、履歴を「今日＝2023-10-03」「昨日＝なし」「一昨日＝2023-10-01（実施済み）」にする
    const mockHistory = [
      {
        date: '2023-10-01T12:00:00.000Z',
        reps: 50,
        sets: 1,
        duration: 300,
        timeline: []
      }
    ];

    await page.addInitScript((history) => {
      window.localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
    }, mockHistory);

    // 時間を2023-10-03に固定
    await page.clock.install({ time: new Date('2023-10-03T12:00:00Z') });

    await page.goto('/');

    // DOMの準備を待つ
    await page.waitForSelector('#streak-guardian', { state: 'attached' });

    // アプリケーションが完全にロードされるのを待つ
    await page.waitForFunction(() => window.PhoenixProtocol !== undefined && window.StreakGuardian !== undefined);

    // 強制的にupdateを走らせる
    await page.evaluate(() => {
        window.StreakGuardian.update(JSON.parse(window.localStorage.getItem('squat-tracker-history-v1')));
    });

    await expect(page.locator('#streak-guardian')).not.toHaveCSS('display', 'none', { timeout: 10000 });
  });

  test('should display phoenix protocol accept button when eligible', async ({ page }) => {
    const streakGuardian = page.locator('#streak-guardian');
    await expect(streakGuardian).toBeVisible({ timeout: 10000 });

    // クラスが status-phoenix になっていること
    await expect(streakGuardian).toHaveClass(/status-phoenix/);

    // 受注ボタンが表示されていること
    const acceptBtn = streakGuardian.locator('#phoenix-accept-btn');
    await expect(acceptBtn).toBeVisible();

    // 文言確認
    await expect(streakGuardian).toContainText('記録修復クエスト発生');
  });

  test('should accept quest and update ui to in-progress', async ({ page }) => {
    const streakGuardian = page.locator('#streak-guardian');
    const acceptBtn = streakGuardian.locator('#phoenix-accept-btn');

    await acceptBtn.click();

    // Toastが表示されること
    const toast = page.locator('.achievement-toast').filter({ hasText: 'プロトコル起動' });
    await expect(toast).toBeVisible();

    // UIが進行中表示に切り替わること
    await expect(streakGuardian).toContainText('修復クエスト進行中');
    await expect(streakGuardian).toContainText('残り 50回');
  });
});
