const { test, expect } = require('@playwright/test');

test('テーマ切替トグルで外観が切り替わり、スクリーンショットを取得できる', async ({ page }, testInfo) => {
  await page.goto('/');

  const toggle = page.locator('#theme-toggle');

  // The toggle should be attached to the DOM for accessibility,
  // even if visually hidden using the clip pattern.
  await expect(toggle).toBeAttached();

  await page.locator('.theme-toggle .switch').click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');

  const screenshotPath = testInfo.outputPath('theme-toggle.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
});
