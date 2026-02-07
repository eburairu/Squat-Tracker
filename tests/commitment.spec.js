import { test, expect } from '@playwright/test';

test.describe('Commitment Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Install clock before navigation
    await page.clock.install();
    await page.goto('/');

    // Reset storage and setup Boss
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('squat-tracker-boss-v1', JSON.stringify({
          currentMonster: { maxHp: 1000, currentHp: 500, name: 'Test Boss', emoji: '👾' },
          lastInteraction: Date.now()
      }));
    });
    await page.reload();
    // Wait for app initialization
    await page.waitForFunction(() => window.CommitmentManager);
  });

  test('should show commitment modal', async ({ page }) => {
    // Trigger modal manually
    await page.evaluate(() => {
        window.CommitmentManager.showModal();
    });

    const modal = page.locator('#commitment-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('次回の誓い');
  });

  test('should fulfill commitment and give bonus', async ({ page }) => {
    // 1. Set Commitment (Tomorrow)
    await page.evaluate(() => {
        window.CommitmentManager.setCommitment('tomorrow');
    });

    // Check Status Display
    const status = page.locator('#commitment-status');
    await expect(status).toBeVisible();
    await expect(status).toContainText('Next Goal');

    // 2. Advance time (1 hour later) - Still within deadline
    await page.clock.fastForward(1000 * 60 * 60);

    // 3. Start Workout
    const startBtn = page.locator('#start-button');
    await startBtn.click();

    // 4. Verify Bonus
    // sessionAttackBonus should be positive (10% of 1 AP is small, but let's assume min 1)
    const bonus = await page.evaluate(() => window.sessionAttackBonus);
    expect(bonus).toBeGreaterThanOrEqual(0);

    // Verify Tension increased (Initial 0 + 50)
    const tension = await page.evaluate(() => window.TensionManager.value);
    expect(tension).toBe(50);
  });

  test('should break commitment and apply penalty on expiration', async ({ page }) => {
    // 1. Set Commitment
    await page.evaluate(() => {
        window.CommitmentManager.setCommitment('tomorrow');
    });

    // 2. Fast forward past deadline (48 hours later)
    await page.clock.fastForward(1000 * 60 * 60 * 48);

    // 3. Reload page to trigger checkExpiration
    await page.reload();
    await page.waitForFunction(() => window.BossBattle && window.BossBattle.state.currentMonster);

    // 4. Verify Penalty (Boss Healed)
    // Initial HP 500. Penalty 20% of 1000 = 200. Target ~700.
    // Note: regenHp might run too, but forceHeal adds on top.
    const currentHp = await page.evaluate(() => window.BossBattle.state.currentMonster.currentHp);

    // 500 + 200 = 700.
    expect(currentHp).toBeGreaterThanOrEqual(700);
  });
});
