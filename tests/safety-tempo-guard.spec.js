const { test, expect } = require('@playwright/test');

test.describe('SafetyTempoGuard', () => {
  test('Fast Downで警告が表示され、適用ボタンで2-1-1にリセットされる', async ({ page }) => {
    await page.goto('/');

    // 最初は非表示
    await expect(page.locator('#tempo-guard-alert')).not.toBeVisible();

    // Downを1秒に設定 (Fast Down条件)
    const downInput = page.locator('#down-duration');
    await downInput.fill('1');
    await downInput.evaluate(e => e.dispatchEvent(new Event('input')));

    // 警告が表示されることを確認
    await expect(page.locator('#tempo-guard-alert')).toBeVisible();
    await expect(page.locator('#tempo-guard-message')).toContainText('しゃがむスピードが速すぎます');

    // 「安全なテンポを適用」ボタンをクリック
    await page.locator('#apply-safe-tempo-btn').click();

    // 警告が非表示になること
    await expect(page.locator('#tempo-guard-alert')).not.toBeVisible();

    // 2-1-1 に設定が戻っていること
    await expect(page.locator('#down-duration')).toHaveValue('2');
    await expect(page.locator('#hold-duration')).toHaveValue('1');
    await expect(page.locator('#up-duration')).toHaveValue('1');
  });

  test('Fast Tempoで警告が表示される', async ({ page }) => {
    await page.goto('/');

    const downInput = page.locator('#down-duration');
    const holdInput = page.locator('#hold-duration');
    const upInput = page.locator('#up-duration');

    // 2-0-1 = 3秒 (Fast Tempo条件)
    await downInput.fill('2');
    await holdInput.fill('0'); // 本来はmin="1"だがテストとして
    await upInput.fill('1');
    await downInput.evaluate(e => e.dispatchEvent(new Event('input')));

    // 警告が表示されることを確認
    await expect(page.locator('#tempo-guard-alert')).toBeVisible();
    await expect(page.locator('#tempo-guard-message')).toContainText('動作テンポが速すぎます');
  });
});
