const { test, expect } = require('@playwright/test');

test.describe('Class Mastery System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear storage before each test to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload to ensure clean state applies to app logic (if it loaded data on init)
    await page.reload();
    // Wait for initialization
    await page.waitForFunction(() => window.ClassManager && window.ClassManager.classes.length > 0);
  });

  test('Initial state is Level 1 with 0 EXP', async ({ page }) => {
    // Check initial level via ClassManager
    const level = await page.evaluate(() => window.ClassManager.getLevel('warrior'));
    expect(level).toBe(1);

    // Check UI
    await page.click('#open-class-settings');
    await page.waitForSelector('#class-modal.active');

    // Check warrior card text
    const warriorCard = page.locator('.class-card[data-id="warrior"]');
    await expect(warriorCard).toContainText('Lv.1');
    await expect(warriorCard).toContainText('EXP: 0');
  });

  test('Experience gain and Level Up', async ({ page }) => {
    // Inject EXP
    const result = await page.evaluate(() => {
      // Add 150 EXP (Threshold for Lv2 is 100)
      return window.ClassManager.addExperience('warrior', 150);
    });

    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);

    // Verify storage before reload
    const storedBefore = await page.evaluate(() => localStorage.getItem('squat-tracker-class-mastery'));
    expect(storedBefore).not.toBeNull();
    expect(storedBefore).toContain('"warrior":150');

    // Verify localStorage persistence
    await page.reload();
    await page.waitForFunction(() => window.ClassManager);

    const level = await page.evaluate(() => window.ClassManager.getLevel('warrior'));
    expect(level).toBe(2);

    // Verify UI
    await page.click('#open-class-settings');
    await page.waitForSelector('#class-modal.active');

    const warriorCard = page.locator('.class-card[data-id="warrior"]');
    await expect(warriorCard).toContainText('Lv.2');

    // Lv2 Range: 100 -> 300. Progress = 150 - 100 = 50. Range = 200.
    // Percent = 50/200 = 25%.

    // Check progress bar width
    const progressBar = warriorCard.locator('.mastery-bar');
    const style = await progressBar.getAttribute('style');
    expect(style).toContain('width: 25%');
  });

  test('Modifiers are applied based on Level', async ({ page }) => {
    // Set Warrior to Lv 5 (1000 EXP)
    await page.evaluate(() => {
        window.ClassManager.addExperience('warrior', 1000);
        window.ClassManager.changeClass('warrior');
    });

    // Lv 5 Bonus: (5-1) = 4 levels.
    // Warrior Base Attack: 1.2
    // Attack Bonus: 4 * 0.05 = 0.2
    // Total Attack: 1.4

    const modifiers = await page.evaluate(() => window.ClassManager.getModifiers());
    expect(modifiers.attackMultiplier).toBeCloseTo(1.4, 2);
  });
});
