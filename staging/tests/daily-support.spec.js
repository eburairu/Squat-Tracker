const { test, expect } = require('@playwright/test');

test('継続サポートが表示され、今日のヒントが入っている', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#daily-support')).toBeVisible();
  await expect(page.locator('#daily-support h2')).toHaveText('継続サポート');
  await expect(page.locator('#daily-message')).toHaveText(/.+/);
  await expect(page.locator('#daily-goal')).toHaveText(/.+/);
  await expect(page.locator('#daily-streak')).toHaveText(/\d+日/);
});
