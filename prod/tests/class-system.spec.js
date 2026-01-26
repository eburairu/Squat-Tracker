const { test, expect } = require('@playwright/test');

test.describe('Class System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/index.html');
  });

  test('should allow changing class and persisting it', async ({ page }) => {
    // Check initial state (Novice: 🌱)
    const icon = page.locator('#current-class-icon');
    await expect(icon).toHaveText('🌱');

    // Open Modal
    await page.click('#open-class-settings');
    const modal = page.locator('#class-modal');
    await expect(modal).toBeVisible();

    // Check list rendering
    const warriorCard = page.locator('.class-card[data-id="warrior"]');
    await expect(warriorCard).toBeVisible();
    await expect(warriorCard).toContainText('戦士');
    await expect(warriorCard).toContainText('攻撃力 x1.2');

    // Select Warrior
    await warriorCard.click();

    // Verify Toast and UI Update
    // Toast might be quick, but HUD icon should update
    await expect(icon).toHaveText('⚔️');

    // Check local storage
    const storedClass = await page.evaluate(() => localStorage.getItem('squat-tracker-class'));
    expect(storedClass).toBe('warrior');

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('#current-class-icon')).toHaveText('⚔️');
  });

  test('should apply mage class bonus logic (mocked)', async ({ page }) => {
    // Wait for app initialization
    await page.waitForFunction(() => window.ClassManager && window.ClassManager.classes.length > 0);

    // Select Mage
    await page.evaluate(() => {
        window.ClassManager.changeClass('mage');
    });

    // Verify Mage selected
    await expect(page.locator('#current-class-icon')).toHaveText('杖');

    // Verify modifiers via internal state
    const modifiers = await page.evaluate(() => window.ClassManager.getModifiers());
    expect(modifiers.quizMultiplier).toBe(2.0);
  });
});
