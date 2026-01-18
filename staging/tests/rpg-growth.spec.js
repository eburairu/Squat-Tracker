const { test, expect } = require('@playwright/test');

test.describe('RPG Growth System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Level Calculation Formula', async ({ page }) => {
    // We expect a function or object logic to handle level calculation
    // Assuming RpgSystem is exposed
    await page.evaluate(() => {
      // Stub if not yet implemented to fail gracefully or check existence
      if (!window.RpgSystem) throw new Error('RpgSystem not found');
    });

    const checkLevel = async (reps, expectedLevel) => {
      const level = await page.evaluate((r) => window.RpgSystem.calculateLevel(r), reps);
      expect(level).toBe(expectedLevel);
    };

    await checkLevel(0, 1);
    await checkLevel(4, 2);   // sqrt(4)*0.5 = 1.0 -> floor(1+1) = 2
    await checkLevel(16, 3);  // sqrt(16)*0.5 = 2.0 -> floor(1+2) = 3
    await checkLevel(36, 4);  // sqrt(36)*0.5 = 3.0 -> floor(1+3) = 4
    await checkLevel(100, 6); // sqrt(100)*0.5 = 5.0 -> floor(1+5) = 6
  });

  test('Attack Power Calculation', async ({ page }) => {
    const checkAp = async (level, expectedAp) => {
      const ap = await page.evaluate((l) => window.RpgSystem.calculateAttackPower(l), level);
      expect(ap).toBe(expectedAp);
    };

    await checkAp(1, 1);
    await checkAp(3, 2);  // 1 + floor(2*0.5) = 2
    await checkAp(5, 3);  // 1 + floor(4*0.5) = 3
    await checkAp(11, 6); // 1 + floor(10*0.5) = 6
  });

  test('Critical Hit Logic', async ({ page }) => {
    // Mock Math.random to force critical and non-critical
    // 10% chance: < 0.1 is critical

    // Test Critical
    const criticalDamage = await page.evaluate(() => {
      // Mock random to return 0.05
      const originalRandom = Math.random;
      Math.random = () => 0.05;

      const result = window.RpgSystem.calculateDamage(10); // Base AP 10

      Math.random = originalRandom;
      return result;
    });

    expect(criticalDamage.isCritical).toBe(true);
    expect(criticalDamage.amount).toBe(20); // 10 * 2

    // Test Normal
    const normalDamage = await page.evaluate(() => {
      // Mock random to return 0.15
      const originalRandom = Math.random;
      Math.random = () => 0.15;

      const result = window.RpgSystem.calculateDamage(10); // Base AP 10

      Math.random = originalRandom;
      return result;
    });

    expect(normalDamage.isCritical).toBe(false);
    expect(normalDamage.amount).toBe(10);
  });
});
