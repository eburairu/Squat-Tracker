const { test, expect } = require('@playwright/test');

test('Verify Class Mastery UI', async ({ page }) => {
  await page.goto('/');

  // Inject EXP to show progress bar
  await page.evaluate(() => {
    localStorage.clear();
    // Warrior: Lv2 (Threshold 100), Current 150. Progress 50. Next Threshold 300. Range 200. 50/200 = 25%
    window.ClassManager.addExperience('warrior', 150);
    // Mage: Lv3 (Threshold 300), Current 400. Progress 100. Next Threshold 600. Range 300. 100/300 = 33%
    window.ClassManager.addExperience('mage', 400);
  });
  await page.reload();
  await page.waitForFunction(() => window.ClassManager);

  // Open modal
  await page.click('#open-class-settings');
  await page.waitForSelector('#class-modal.active');

  // Wait for animation
  await page.waitForTimeout(500);

  // Screenshot
  await page.screenshot({ path: 'verification-mastery.png' });
});
