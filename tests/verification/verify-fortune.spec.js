import { test, expect } from '@playwright/test';

test('Verify Fortune UI', async ({ page }) => {
  await page.goto('http://localhost:4173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // 1. Initial State
  const card = page.locator('#fortune-status-card');
  await expect(card).toBeVisible();
  await page.screenshot({ path: 'verification-fortune-initial.png' });

  // 2. Modal Open
  await card.click();
  const modal = page.locator('#fortune-modal');
  await expect(modal).toHaveClass(/active/);
  await page.waitForTimeout(500); // Wait for transition
  await page.screenshot({ path: 'verification-fortune-modal.png' });

  // 3. Result
  await page.click('#fortune-draw-button');
  await page.locator('#fortune-modal .fortune-result-name').waitFor({ state: 'visible', timeout: 5000 });
  await page.screenshot({ path: 'verification-fortune-result.png' });
});
