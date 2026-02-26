const { test, expect } = require('@playwright/test');

test.describe('Endless Tower Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Go to app
    await page.goto('/');

    // Wait for modules to be ready
    await page.waitForFunction(() => typeof window.TowerManager !== 'undefined');

    // Reset state before each test
    await page.evaluate(() => {
      if (window.TowerManager.state.isActive) {
        window.TowerManager.endTower(false);
      }
      window.TowerManager.state.playerHp = 100;
      window.TowerManager.state.currentFloor = 1;
      localStorage.removeItem('squat-tracker-tower-highscore');
    });
    await page.waitForTimeout(500);
  });

  test('should display tower entry card and start tower mode', async ({ page }) => {
    const entryCard = page.locator('#tower-entry-card');
    await expect(entryCard).toBeVisible();

    const startBtn = page.locator('#tower-start-button');
    await startBtn.click();

    const battleCard = page.locator('#tower-battle-card');
    await expect(battleCard).toBeVisible();

    const bossCard = page.locator('#boss-card');
    await expect(bossCard).not.toBeVisible();

    const floorDisplay = page.locator('#tower-floor-display');
    await expect(floorDisplay).toHaveText('Floor 1');
  });

  test('should handle damage to enemy correctly', async ({ page }) => {
    // Start Tower
    await page.click('#tower-start-button');

    // Get initial HP
    const initialHpText = await page.locator('#tower-enemy-hp-text').textContent();
    const initialHp = parseInt(initialHpText.split('/')[0].trim());

    // Perform Attack (via exposed helper)
    await page.evaluate(() => {
      window.performAttack();
    });

    // Check HP reduced
    const newHpText = await page.locator('#tower-enemy-hp-text').textContent();
    const newHp = parseInt(newHpText.split('/')[0].trim());

    expect(newHp).toBeLessThan(initialHp);
  });

  test('should process floor completion, damage player, and heal', async ({ page }) => {
    await page.click('#tower-start-button');

    // Setup state: Enemy HP 50%
    await page.evaluate(() => {
      window.TowerManager.state.enemy.currentHp = 50;
      window.TowerManager.state.enemy.maxHp = 100;
      window.TowerManager.state.playerHp = 100;
      window.TowerManager.state.maxPlayerHp = 100;

      // Trigger set finish manually
      window.TowerManager.onSetFinished();
    });

    // Verify logic:
    // Damage = floor(0.5 * 20) = 10 damage.
    // HP = 100 - 10 = 90.
    // Heal = +10.
    // Final HP = 100.
    // Floor should be 2.

    const playerHpText = await page.locator('#tower-player-hp-text').textContent();
    const floorText = await page.locator('#tower-floor-display').textContent();

    expect(playerHpText).toBe('100/100'); // Actually healed back to full
    expect(floorText).toBe('Floor 2');
  });

  test('should handle game over when player HP reaches 0', async ({ page }) => {
    await page.click('#tower-start-button');

    // Setup state: Player HP 1, Enemy Full HP
    await page.evaluate(() => {
      window.TowerManager.state.playerHp = 1;
      window.TowerManager.state.enemy.currentHp = 100;
      window.TowerManager.state.enemy.maxHp = 100;

      // Trigger set finish manually
      window.TowerManager.onSetFinished();
    });

    // Damage = 20. HP = -19. Game Over.

    // Should return to entry card
    const entryCard = page.locator('#tower-entry-card');
    await expect(entryCard).toBeVisible();

    const battleCard = page.locator('#tower-battle-card');
    await expect(battleCard).not.toBeVisible();

    // Check toast message (optional, might be flaky)
    // await expect(page.locator('.toast')).toContainText('GAME OVER');
  });
});
