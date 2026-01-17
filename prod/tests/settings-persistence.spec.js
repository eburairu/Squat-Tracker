const { test, expect } = require('@playwright/test');

test.describe('Workout Settings Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should persist workout settings across reloads', async ({ page }) => {
    const newSettings = {
      '#set-count': '5',
      '#rep-count': '15',
      '#down-duration': '3',
      '#hold-duration': '2',
      '#up-duration': '2',
      '#rest-duration': '45',
      '#countdown-duration': '10',
    };

    // Change settings
    for (const [selector, value] of Object.entries(newSettings)) {
      const input = page.locator(selector);
      await input.fill(value);
      // Explicitly dispatch change event to ensure listeners fire if they listen to 'change'
      // .fill triggers input event, but depending on implementation, change might be needed
      await input.dispatchEvent('change');
    }

    // Verify values changed
    for (const [selector, value] of Object.entries(newSettings)) {
      await expect(page.locator(selector)).toHaveValue(value);
    }

    // Reload page
    await page.reload();

    // Verify values persisted
    for (const [selector, value] of Object.entries(newSettings)) {
      await expect(page.locator(selector)).toHaveValue(value);
    }
  });

  test('should use default values if no settings saved', async ({ page }) => {
    // Default values from index.html
    const defaults = {
      '#set-count': '3',
      '#rep-count': '10',
      '#down-duration': '2',
      '#hold-duration': '1',
      '#up-duration': '1',
      '#rest-duration': '30',
      '#countdown-duration': '5',
    };

    for (const [selector, value] of Object.entries(defaults)) {
      await expect(page.locator(selector)).toHaveValue(value);
    }
  });
});
