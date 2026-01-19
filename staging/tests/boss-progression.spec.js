
const { test, expect } = require('@playwright/test');

test.describe('Boss Battle Progression', () => {
  test.beforeEach(async ({ page }) => {
    // Reset storage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should start with Slime', async ({ page }) => {
    const bossName = page.locator('#boss-name');
    await expect(bossName).toHaveText('スライム');
  });

  test('should take damage on rep completion', async ({ page }) => {
    // Initial HP
    const hpText = await page.locator('#boss-hp-text').textContent();
    const [initialHp] = hpText.split(' / ').map(Number);

    // Mock RpgSystem.calculateDamage to prevent critical hits causing flaky tests
    await page.evaluate(() => {
      window.RpgSystem.calculateDamage = (baseAttackPower) => ({
        amount: baseAttackPower,
        isCritical: false
      });
    });

    // Fast forward phases to complete 1 rep
    // Phase 1: Countdown (5s) -> Down (2s) -> Hold (1s) -> Up (1s) -> Damage applied

    // We can simulate time or just wait. Let's use clock manipulation if possible,
    // but the app uses Date.now(). Playwright's page.clock helps.

    // Start workout logic
    // We need to wait for countdown to finish.
    // Let's just mock the timer or wait it out since default is short (5s countdown).

    // Actually, we can use the "skip" logic if implemented, but we don't have it.
    // Let's override durations to be super short.
    // NOTE: countdown-duration has min=3 in HTML
    await page.fill('#countdown-duration', '3');
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');

    await page.locator('#start-button').click();

    // Wait for "Start Phase Cycle" (Voice Coach says "Start" or text changes)
    await expect(page.locator('#phase-hint')).toContainText('スタートまで');

    // Wait enough time for 1 rep to complete (3s countdown + 1s down + 1s hold + 1s up + buffer)
    await page.waitForTimeout(7000);

    // Check HP again
    const hpTextAfter = await page.locator('#boss-hp-text').textContent();
    const [currentHp] = hpTextAfter.split(' / ').map(Number);

    expect(currentHp).toBeLessThan(initialHp);
    expect(currentHp).toBe(initialHp - 1); // 1 rep = 1 damage
  });

  test('should regenerate HP over time', async ({ page }) => {
    // Manually set state to simulate damaged boss
    await page.evaluate(() => {
      const state = {
        monsterIndex: 0,
        loopCount: 1,
        lastInteraction: Date.now() - (12 * 60 * 60 * 1000), // 12 hours ago
        totalKills: 0,
        currentMonster: {
          name: 'スライム',
          emoji: '💧',
          maxHp: 20,
          currentHp: 10 // Damaged
        }
      };
      localStorage.setItem('squat-tracker-boss-v1', JSON.stringify(state));
    });

    await page.reload();

    // Should have regenerated:
    // 12 hours = 50% of daily rate (10%) = 5% recovery.
    // 5% of 20 = 1 HP.
    // Current HP should be 11.
    // Even with slight time drift, it won't exceed 1.0001 HP -> 11.0001 -> ceil 12.
    // Let's verify internal state to be precise.

    const currentHp = await page.evaluate(() => {
      return window.BossBattle.state.currentMonster.currentHp;
    });

    // 10 + 1 = 11. Allow small margin for execution time
    expect(currentHp).toBeGreaterThanOrEqual(11);
    expect(currentHp).toBeLessThan(11.1);
  });
});
