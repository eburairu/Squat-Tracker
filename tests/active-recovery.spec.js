import { test, expect } from '@playwright/test';

test.describe('Active Recovery Mode', () => {
  test.beforeEach(async ({ page }) => {
    // モックデータの注入
    await page.addInitScript(() => {
      // 履歴データ
      localStorage.setItem('squat-tracker-history-v1', JSON.stringify([
        { id: '1', date: new Date().toISOString(), totalSets: 3, repsPerSet: 10, totalReps: 30, durations: { down: 2, hold: 1, up: 1, rest: 30, countdown: 5 }, timeline: [] }
      ]));

      // ユーザー設定（通常のトレーニング設定）
      localStorage.setItem('squat-tracker-settings', JSON.stringify({
        setCount: 3,
        repCount: 15,
        downDuration: 2,
        holdDuration: 1,
        upDuration: 1,
        restDuration: 30,
        countdownDuration: 5
      }));

      // クラス・EXP
      localStorage.setItem('squat-tracker-class-mastery', JSON.stringify({
        novice: { exp: 100, level: 1, unlockedNodes: [] }
      }));
    });

    await page.goto('/');
    // アニメーション完了まで待機
    await page.waitForTimeout(500);
  });

  test('should override settings when toggled ON and restore when toggled OFF', async ({ page }) => {
    // 初期状態の確認（モックデータの設定が反映されているか）
    await expect(page.locator('#set-count')).toHaveValue('3');
    await expect(page.locator('#rep-count')).toHaveValue('15');

    const toggle = page.locator('#active-recovery-toggle');

    // ON にする (Slider部分をクリックして切り替える)
    await page.evaluate(() => document.getElementById('active-recovery-toggle').click());

    // 設定が上書きされたか（1セット、5回など）
    await expect(page.locator('#set-count')).toHaveValue('1');
    // input type="number" returns a string of the number, our script sets it to 5 (number), which becomes '5'
    await expect(page.locator('#rep-count')).toHaveValue('5');
    await expect(page.locator('#down-duration')).toHaveValue('3');

    // フォームが無効化されているか
    await expect(page.locator('#set-count')).toBeDisabled();

    // OFF に戻す
    await page.evaluate(() => document.getElementById('active-recovery-toggle').click());

    // 設定が元の値に復元されたか
    await expect(page.locator('#set-count')).toHaveValue('3');
    await expect(page.locator('#rep-count')).toHaveValue('15');
    await expect(page.locator('#set-count')).toBeEnabled();
  });

  test('should bypass EXP and mission progress when finishing workout in Active Recovery mode', async ({ page }) => {
    // Active Recovery ON
    await page.evaluate(() => document.getElementById('active-recovery-toggle').click());

    // クラスの初期EXPを確認 (モックは100)
    const initialExp = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('squat-tracker-class-mastery'));
      return data.novice.exp;
    });
    expect(initialExp).toBe(100);

    // ワークアウト強制完了
    await page.evaluate(() => {
      // 内部状態を強制的にセット完了状態にして finishWorkout を呼ぶ
      window.startWorkout(); // init states
      window.finishWorkout();
    });

    // トーストメッセージの確認 (toast is dynamic, might need to wait for it or look for its text in general)
    const toast = page.locator('.badge-toast');
    await expect(toast.filter({ hasText: 'ストリークを維持しました' })).toBeVisible();

    // EXPが増えていないことを確認
    const finalExp = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('squat-tracker-class-mastery'));
      return data.novice.exp;
    });
    expect(finalExp).toBe(100); // 増加していない

    // 履歴には追加されている（ストリーク維持）
    const history = await page.evaluate(() => JSON.parse(localStorage.getItem('squat-tracker-history-v1')));
    expect(history.length).toBe(2); // モックの1件 + 今回の1件
    expect(history[0].totalSets).toBe(1);
    expect(history[0].repsPerSet).toBe(5);
  });
});
