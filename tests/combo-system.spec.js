const { test, expect } = require('@playwright/test');

test.describe('Combo System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app initialization
    await page.waitForFunction(() => window.ComboSystem);
  });

  test('initial state is hidden', async ({ page }) => {
    const comboContainer = page.locator('#combo-container');
    await expect(comboContainer).not.toBeVisible(); // opacity: 0 effectively hidden but check visibility
    // Since it's opacity: 0, .not.toBeVisible() might pass if display:none is set,
    // but styles.css sets opacity: 0. Wait, initial HTML has style="display: none;"
    // So it should be not visible.

    const value = await page.evaluate(() => window.ComboSystem.value);
    expect(value).toBe(0);
  });

  test('combo increments and updates UI', async ({ page }) => {
    const comboContainer = page.locator('#combo-container');
    const comboCount = page.locator('#combo-count');

    // 1st increment
    await page.evaluate(() => window.ComboSystem.increment());
    let value = await page.evaluate(() => window.ComboSystem.value);
    expect(value).toBe(1);
    // Still hidden (< 2)
    await expect(comboContainer).not.toHaveClass(/active/);

    // 2nd increment
    await page.evaluate(() => window.ComboSystem.increment());
    value = await page.evaluate(() => window.ComboSystem.value);
    expect(value).toBe(2);
    // Visible
    await expect(comboContainer).toHaveClass(/active/);
    await expect(comboCount).toHaveText('2');
  });

  test('combo resets on miss', async ({ page }) => {
    const comboContainer = page.locator('#combo-container');
    const comboLabel = page.locator('#combo-label');

    // Set to 5
    await page.evaluate(() => {
        window.ComboSystem.value = 5;
        window.ComboSystem.updateUI(false);
    });

    await expect(comboContainer).toHaveClass(/active/);

    // Reset
    await page.evaluate(() => window.ComboSystem.reset());

    // Check Miss Effect
    await expect(comboContainer).toHaveClass(/combo-reset/);
    await expect(comboLabel).toHaveText('MISS...');

    // Check value reset immediately
    const value = await page.evaluate(() => window.ComboSystem.value);
    expect(value).toBe(0);
  });

  test('tension bonus calculation', async ({ page }) => {
    // 0 combo
    let bonus = await page.evaluate(() => window.ComboSystem.getTensionBonus());
    expect(bonus).toBe(0);

    // 10 combo
    await page.evaluate(() => { window.ComboSystem.value = 10; });
    bonus = await page.evaluate(() => window.ComboSystem.getTensionBonus());
    expect(bonus).toBe(5);

    // 29 combo
    await page.evaluate(() => { window.ComboSystem.value = 29; });
    bonus = await page.evaluate(() => window.ComboSystem.getTensionBonus());
    expect(bonus).toBe(10);
  });
});
