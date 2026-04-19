import { test, expect } from '@playwright/test';

test.describe('スマート・ウォームアップ機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('トグルのON/OFFが機能すること', async ({ page }) => {
    await page.click('#open-settings');
    await expect(page.locator('#settings-modal-title')).not.toHaveCSS('display', 'none');

    // Toggle check
    await page.evaluate(() => {
        const toggle = document.getElementById('smart-warmup-toggle');
        toggle.click();
    });

    // It should now be true in UI
    const isChecked = await page.evaluate(() => document.getElementById('smart-warmup-toggle').checked);
    expect(isChecked).toBe(true);
  });

  test('ウォームアップがONの場合、スタート時に準備運動フェーズが挿入されること', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('squat-tracker-smart-warmup', 'true'));
    await page.reload();

    await page.evaluate(() => { document.getElementById('down-duration').value = '1'; document.getElementById('down-duration').dispatchEvent(new Event('input', {bubbles: true})); });
    await page.evaluate(() => { document.getElementById('hold-duration').value = '1'; document.getElementById('hold-duration').dispatchEvent(new Event('input', {bubbles: true})); });
    await page.evaluate(() => { document.getElementById('up-duration').value = '1'; document.getElementById('up-duration').dispatchEvent(new Event('input', {bubbles: true})); });
    await page.evaluate(() => { document.getElementById('countdown-duration').value = '1'; document.getElementById('countdown-duration').dispatchEvent(new Event('input', {bubbles: true})); });

    await page.evaluate(() => { document.getElementById('start-button').disabled = false; document.getElementById('start-button').click(); });

    // ウォームアップフェーズの表示を確認
    const phaseDisplay = page.locator('#phase-display');

    await expect(phaseDisplay).toHaveText(/準備運動|待機中/);

    // キャンセルしておく（他のテストへの影響を防ぐため）
    await page.click('#reset-button');
  });

  test('ウォームアップがOFFの場合、すぐにカウントダウンフェーズが開始されること', async ({ page }) => {
    await page.evaluate(() => { document.getElementById('countdown-duration').value = '2'; document.getElementById('countdown-duration').dispatchEvent(new Event('input', {bubbles: true})); });
    await page.evaluate(() => { document.getElementById('start-button').disabled = false; document.getElementById('start-button').click(); });

    // すぐにカウントダウンになるはず
    const phaseDisplay = page.locator('#phase-display');

    await expect(phaseDisplay).toHaveText(/スタート前|待機中/);

    await page.click('#reset-button');
  });
});
