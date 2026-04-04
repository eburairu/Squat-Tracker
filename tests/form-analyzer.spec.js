import { test, expect } from '@playwright/test';

test.describe('FormAnalyzer System', () => {
  test.beforeEach(async ({ page }) => {
    // 状態を初期化してローカルサーバーにアクセス
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // 設定値をセット
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '1');
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#rest-duration', '10');
    await page.fill('#countdown-duration', '3');

    // 値の変更をトリガー
    await page.evaluate(() => {
        document.getElementById('set-count').dispatchEvent(new Event('input'));
        document.getElementById('set-count').dispatchEvent(new Event('change'));
    });
  });

  test('FormAnalyzer should initialize and expose globally', async ({ page }) => {
    const isExposed = await page.evaluate(() => {
        return typeof window.FormAnalyzer !== 'undefined';
    });
    expect(isExposed).toBeTruthy();
  });

  test('FormAnalyzer should record perfect tempo and return Rank S', async ({ page }) => {
    await page.evaluate(() => {
        window.FormAnalyzer.init(1, 1, 1);

        window.FormAnalyzer.recordPhaseStart('down');
        // Simulate perfect 1s elapsed
        const originalDateNow = Date.now;
        Date.now = () => originalDateNow() + 1000;
        window.FormAnalyzer.recordPhaseEnd();

        window.FormAnalyzer.recordPhaseStart('hold');
        Date.now = () => originalDateNow() + 2000;
        window.FormAnalyzer.recordPhaseEnd();

        window.FormAnalyzer.recordPhaseStart('up');
        Date.now = () => originalDateNow() + 3000;
        window.FormAnalyzer.recordPhaseEnd();

        // Restore Date.now
        Date.now = originalDateNow;
    });

    const result = await page.evaluate(() => {
        return window.FormAnalyzer.calculateScore();
    });

    expect(result.score).toBe(100);
    expect(result.rank).toBe('S');
  });

  test('FormAnalyzer should show result UI after finishWorkout', async ({ page }) => {
    // Workoutを手動でシミュレートして完了させる
    await page.evaluate(() => {
      window.startWorkout();
    });

    // カウントダウン待ち (3秒) + ダウン(1) + ホールド(1) + アップ(1) = 計6秒程度待つ
    // スピードアップのためにタイマーをいじるよりは素直に待つか、関数を直接呼ぶ
    await page.evaluate(() => {
        window.FormAnalyzer.init(1, 1, 1);

        // モックデータを流し込む
        window.FormAnalyzer.recordPhaseStart('down');
        const d = Date.now; Date.now = () => d() + 1000; window.FormAnalyzer.recordPhaseEnd();
        window.FormAnalyzer.recordPhaseStart('hold');
        Date.now = () => d() + 2000; window.FormAnalyzer.recordPhaseEnd();
        window.FormAnalyzer.recordPhaseStart('up');
        Date.now = () => d() + 3000; window.FormAnalyzer.recordPhaseEnd();
        Date.now = d;

        window.finishWorkout();
    });

    // リザルトが表示されることを確認
    const resultElement = page.locator('#form-analyzer-result');
    await expect(resultElement).not.toHaveCSS('display', 'none');

    const rankElement = page.locator('#form-analyzer-rank');
    await expect(rankElement).toContainText('Rank S');
  });
});
