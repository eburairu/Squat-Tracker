import { test, expect } from '@playwright/test';

test.describe('Settings and Data Reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for the app to be fully interactive
    // We check for the settings button to be present in the DOM
    await page.waitForSelector('#open-settings', { state: 'attached' });
  });

  test('Settings modal opens and closes correctly', async ({ page }) => {
    const settingsButton = page.locator('#open-settings');
    await expect(settingsButton).toBeVisible();

    await settingsButton.click();

    const modal = page.locator('#settings-modal');
    await expect(modal).toHaveClass(/active/);
    await expect(modal).toHaveAttribute('aria-hidden', 'false');

    const resetButton = page.locator('#reset-all-data');
    await expect(resetButton).toBeVisible();

    const closeButton = modal.locator('.close-modal');
    await closeButton.click();

    await expect(modal).not.toHaveClass(/active/);
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
  });

  test('Reset Data button triggers confirmation', async ({ page }) => {
    await page.locator('#open-settings').click();

    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    const resetButton = page.locator('#reset-all-data');
    await resetButton.click();

    expect(dialogMessage).toContain('本当に全てのデータを削除しますか？');
  });
});
