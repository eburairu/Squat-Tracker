const { test, expect } = require('@playwright/test');

test.describe('Buddy Egg System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for the DOM to be ready
    await page.goto('/');

    // Clear storage and initialize empty states
    await page.evaluate(() => {
      localStorage.clear();
      window.EggManager._reset();
      window.BuddyManager._reset();
    });

    // Reload to apply empty state
    await page.reload();
  });

  test('should display the egg tracker on initial load', async ({ page }) => {
    // 卵のトラッカーが存在するか確認
    const tracker = page.locator('#egg-tracker');
    await expect(tracker).toBeVisible();

    // 初期状態のテキストが 0 / 100 であることを確認
    const progressText = page.locator('#egg-progress-text');
    await expect(progressText).toHaveText('0 / 100');

    // プログレスバーの幅が 0% であることを確認
    const progressBar = page.locator('#egg-progress-bar');
    await expect(progressBar).toHaveCSS('width', '0px'); // 0% usually evaluates to 0px
  });

  test('should update progress bar when reps are added', async ({ page }) => {
    // 10回のスクワットを追加
    await page.evaluate(() => window.EggManager.addReps(10));

    // UIが更新されるのを待つ
    const progressText = page.locator('#egg-progress-text');
    await expect(progressText).toHaveText('10 / 100');

    // プログレスバーが更新されているか確認 (10%)
    // width はコンテナのサイズに依存してpxで返るため、style属性で検証する
    const progressBar = page.locator('#egg-progress-bar');
    const style = await progressBar.getAttribute('style');
    expect(style).toContain('width: 10%');
  });

  test('should hatch and add a buddy when reps reach requirement', async ({ page }) => {
    // 100回追加して孵化させる
    await page.evaluate(() => window.EggManager.addReps(100));

    // トースト通知が表示されるか確認
    const toast = page.locator('.achievement-toast').filter({ hasText: '卵が孵った！' });
    await expect(toast).toBeVisible();

    // 次の卵の進捗が 0 / 100 にリセットされているか確認
    const progressText = page.locator('#egg-progress-text');
    await expect(progressText).toHaveText('0 / 100');

    // BuddyManagerに新しいバディが追加されているか確認
    const buddyCount = await page.evaluate(() => window.BuddyManager.getBuddyList().length);
    expect(buddyCount).toBe(1);

    // hatchedCountが増えているか確認
    const hatchedCount = await page.evaluate(() => window.EggManager._getState().hatchedCount);
    expect(hatchedCount).toBe(1);
  });

  test('should carry over excess reps to the next egg', async ({ page }) => {
    // 150回追加（1回孵化して50回余るはず）
    await page.evaluate(() => window.EggManager.addReps(150));

    // トーストが表示されるか確認
    const toast = page.locator('.achievement-toast').filter({ hasText: '卵が孵った！' });
    await expect(toast).toBeVisible();

    // 次の卵の進捗が 50 / 100 になっているか確認
    const progressText = page.locator('#egg-progress-text');
    await expect(progressText).toHaveText('50 / 100');

    // BuddyManagerに新しいバディが追加されているか確認
    const buddyCount = await page.evaluate(() => window.BuddyManager.getBuddyList().length);
    expect(buddyCount).toBe(1);
  });

  test('should hatch multiple times if enough reps are added at once', async ({ page }) => {
    // 250回追加（2回孵化して50回余るはず）
    await page.evaluate(() => window.EggManager.addReps(250));

    // 進捗が 50 / 100 になっているか確認
    const progressText = page.locator('#egg-progress-text');
    await expect(progressText).toHaveText('50 / 100');

    // BuddyManagerに2体のバディが追加されているか確認
    const buddyCount = await page.evaluate(() => window.BuddyManager.getBuddyList().length);
    expect(buddyCount).toBe(2);

    // hatchedCountが2になっているか確認
    const hatchedCount = await page.evaluate(() => window.EggManager._getState().hatchedCount);
    expect(hatchedCount).toBe(2);
  });
});
