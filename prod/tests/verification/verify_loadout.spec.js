const { test, expect } = require('@playwright/test');

test('Verify Loadout Modal', async ({ page }) => {
  // Navigate to local server
  await page.goto('http://localhost:8000/');

  // Wait for initialization
  await page.waitForLoadState('networkidle');

  // Click on Loadout Menu Button
  const loadoutBtn = page.locator('#open-loadout-menu');
  await expect(loadoutBtn).toBeVisible();
  await loadoutBtn.click();

  // Wait for Modal
  const modal = page.locator('#loadout-modal');
  await expect(modal).toHaveClass(/active/);
  await expect(modal).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'verification/loadout-modal.png' });
});
