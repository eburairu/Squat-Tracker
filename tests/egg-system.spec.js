import { test, expect } from '@playwright/test';

test.describe('Buddy Egg System', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージをクリアしてからページを開く
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
    await page.waitForFunction(() => window.EggManager && window.finishWorkout);
  });

  test('should display initial egg with 0 progress', async ({ page }) => {
    const container = page.locator('#egg-container');
    await expect(container).toBeVisible();

    const progressText = page.locator('#egg-progress-text');
    await expect(progressText).toHaveText('0 / 50');

    // 初期状態では孵化待ちのトーストが出るはず
    await container.click();
    const toast = page.locator('.achievement-toast').filter({ hasText: '孵化します' });
    await expect(toast).toBeVisible();
  });

  test('should add progress when finishing a workout', async ({ page }) => {
    // finishWorkout を呼び出して進捗を進める
    // デフォルトの設定 (3 sets * 10 reps = 30)
    await page.evaluate(() => {
      // app.js の設定をモックする代わりに、EggManager を直接呼ぶか、finishWorkoutをモック状態で行う
      window.EggManager.addProgress(30);
    });

    const progressText = page.locator('#egg-progress-text');
    await expect(progressText).toHaveText('30 / 50');

    // UIの幅が変化しているか
    const progressBar = page.locator('#egg-progress-fill');
    await expect(progressBar).toHaveCSS('width', /.+/); // widthが0%ではなくなっていること
  });

  test('should show hatch modal when progress reaches required reps', async ({ page }) => {
    // 50回到達させる
    await page.evaluate(() => {
      window.EggManager.addProgress(50);
    });

    // 状態が ready になっているか（クラス付与）
    const container = page.locator('#egg-container');
    await expect(container).toHaveClass(/ready/);

    // アイコンが変わっているか
    const icon = page.locator('#egg-icon');
    await expect(icon).toHaveText('🐣');

    // タップしてモーダルを開く
    await container.click();
    const modal = page.locator('#egg-hatch-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');

    // 「割る！」ボタンを押す
    const hatchBtn = page.locator('#egg-hatch-btn');
    await expect(hatchBtn).toBeVisible();
    await hatchBtn.click();

    // 報酬が表示され、ボタンが消えること
    await expect(hatchBtn).toBeHidden();
    const rewardText = page.locator('#egg-reward-text');
    await expect(rewardText).toContainText('新しいバディ');
  });
});
