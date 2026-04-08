import { test, expect } from '@playwright/test';

test.describe('Daily Director Feature', () => {
  test.beforeEach(async ({ page }) => {
    // 必要に応じて Bingo や Missions のモックデータを注入する
    await page.goto('/');
    // ストレージが空だったりモック化されている場合、Playwright が初期化処理を
    // 見逃す可能性があるため、page.evaluate で evaluateAndShow を強制実行する
    await page.waitForSelector('.app', { state: 'visible' });
    await page.evaluate(() => {
        if (window.DailyDirector) {
            window.DailyDirector.evaluateAndShow();
        }
    });
    // コンテナが表示されるのを待つ
    await page.waitForSelector('#daily-director-container', { state: 'visible', timeout: 5000 });
  });

  test('should render daily director container', async ({ page }) => {
    const container = page.locator('#daily-director-container');
    await expect(container).toBeVisible();

    const title = container.locator('#director-title');
    await expect(title).toHaveText('本日の最適メニュー');

    const sets = container.locator('#director-sets');
    const reps = container.locator('#director-reps');
    await expect(sets).not.toBeEmpty();
    await expect(reps).not.toBeEmpty();
  });

  test('should apply suggested routine and start workout when button is clicked', async ({ page }) => {
    const container = page.locator('#daily-director-container');
    await expect(container).toBeVisible();

    const recSets = await container.locator('#director-sets').textContent();
    const recReps = await container.locator('#director-reps').textContent();

    const startBtn = container.locator('#director-start-btn');
    await startBtn.click();

    await expect(container).not.toBeVisible();

    const setCountInput = page.locator('#set-count');
    const repCountInput = page.locator('#rep-count');
    await expect(setCountInput).toHaveValue(recSets.trim());
    await expect(repCountInput).toHaveValue(recReps.trim());

    // ワークアウトが実際に開始されるまで待つ
    // applyAndStart 内部に 500ms の遅延があり、それに加えてDOM更新時間を考慮する
    await page.waitForTimeout(1500);

    // プログレスバーが初期化されたか、またはセッション進捗テキストが更新されたかを確認する
    const statsSessionTarget = page.locator('#stats-session-target');
    const targetValue = await statsSessionTarget.textContent();
    expect(parseInt(targetValue)).toBeGreaterThan(0);
  });
});
