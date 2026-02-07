const { test, expect } = require('@playwright/test');

test.describe('Tension System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for initialization
    await page.waitForFunction(() => window.TensionManager);
  });

  test('initial state should be 0%', async ({ page }) => {
    const tensionValue = await page.textContent('#tension-value');
    expect(tensionValue).toBe('0%');

    const barWidth = await page.$eval('#tension-bar', el => el.style.width);
    expect(barWidth).toBe('0%');
  });

  test('should increase tension when added', async ({ page }) => {
    // Simulate adding tension via exposed manager
    await page.evaluate(() => {
      window.TensionManager.add(10);
    });

    const tensionValue = await page.textContent('#tension-value');
    expect(tensionValue).toBe('10%');

    const barWidth = await page.$eval('#tension-bar', el => el.style.width);
    expect(barWidth).toBe('10%');
  });

  test('should activate boost mode at 100%', async ({ page }) => {
    // Add enough tension to trigger boost
    await page.evaluate(() => {
      window.TensionManager.add(100);
    });

    const tensionValue = await page.textContent('#tension-value');
    expect(tensionValue).toBe('BOOST!');

    // Check for body class
    const isBoostMode = await page.$eval('body', el => el.classList.contains('boost-mode'));
    expect(isBoostMode).toBe(true);
  });

  test('should increase damage multiplier during boost', async ({ page }) => {
     await page.evaluate(() => {
      window.TensionManager.add(100);
    });

    const multiplier = await page.evaluate(() => window.TensionManager.getMultiplier());
    expect(multiplier).toBe(1.5);
  });

  test('should reset after deactivation', async ({ page }) => {
    await page.evaluate(() => {
      window.TensionManager.add(100);
    });

    // Manually deactivate to verify reset logic
    await page.evaluate(() => {
      window.TensionManager.deactivate();
    });

    const isBoostMode = await page.$eval('body', el => el.classList.contains('boost-mode'));
    expect(isBoostMode).toBe(false);

    const tensionValue = await page.textContent('#tension-value');
    expect(tensionValue).toBe('0%');

    // Take verification screenshot
    await page.screenshot({ path: 'verification/tension_reset.png' });
  });
});
