const { test, expect } = require('@playwright/test');

test.describe('Theme and Sound System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('can change visual theme style', async ({ page }) => {
    // Open settings modal
    await page.click('#open-settings');
    await expect(page.locator('#settings-modal')).toHaveClass(/active/);

    // Select Forest theme by clicking label
    await page.click('label.theme-option:has(input[value="forest"])');

    // Verify body attribute
    await expect(page.locator('body')).toHaveAttribute('data-style', 'forest');

    // Select Volcano theme
    await page.click('label.theme-option:has(input[value="volcano"])');
    await expect(page.locator('body')).toHaveAttribute('data-style', 'volcano');

    // Select Default theme
    await page.click('label.theme-option:has(input[value="default"])');
    await expect(page.locator('body')).not.toHaveAttribute('data-style');
  });

  test('theme selection persists after reload', async ({ page }) => {
    // Open settings and select Forest
    await page.click('#open-settings');
    await page.click('label.theme-option:has(input[value="forest"])');
    await expect(page.locator('body')).toHaveAttribute('data-style', 'forest');

    // Reload
    await page.reload();

    // Verify persistence
    await expect(page.locator('body')).toHaveAttribute('data-style', 'forest');

    // Verify radio button state
    await page.click('#open-settings');
    const forestRadio = page.locator('input[name="theme-style"][value="forest"]');
    await expect(forestRadio).toBeChecked();
  });

  test('can change sound skin', async ({ page }) => {
    // Open settings
    await page.click('#open-settings');

    // Select 'square' sound
    await page.selectOption('#sound-type-select', 'square');

    // Verify localStorage persistence
    const stored = await page.evaluate(() => localStorage.getItem('squat-tracker-sound-type'));
    expect(stored).toBe('square');

    // Verify SoundManager state via window (if exposed? SoundManager is not exposed directly)
    // But we can check utils internal state if exposed? No.
    // We rely on localStorage persistence for this test.
  });

  test('dark mode toggle works with styles', async ({ page }) => {
    // Ensure light mode initially
    const body = page.locator('body');
    await expect(body).toHaveAttribute('data-theme', 'light');

    // Toggle dark mode via header
    // Click the slider
    await page.click('.theme-toggle .slider');
    await expect(body).toHaveAttribute('data-theme', 'dark');

    // Set Forest style
    await page.click('#open-settings');
    await page.click('label.theme-option:has(input[value="forest"])');

    // Should have both
    await expect(body).toHaveAttribute('data-theme', 'dark');
    await expect(body).toHaveAttribute('data-style', 'forest');
  });
});
