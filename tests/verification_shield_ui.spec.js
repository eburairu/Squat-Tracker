const { test, expect } = require('@playwright/test');

test('Verify Shield UI', async ({ page }) => {
  await page.goto('/');
  // Clear and Reload to get fresh state (and shield gift)
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');

  // Wait for shield card
  const shieldCard = page.locator('#stat-shield');
  await expect(shieldCard).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#shield-count')).toHaveText('1');

  // Screenshot
  await page.screenshot({ path: 'verification/shield_ui.png', fullPage: true });
});
