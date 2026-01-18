const { test, expect } = require('@playwright/test');

test.describe('Boss Battle Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clean state
    await page.evaluate(() => {
      localStorage.removeItem('squat-tracker-boss-v1');
      localStorage.removeItem('squat-tracker-history-v1');
    });
    await page.reload();
  });

  test('should display boss card with initial monster', async ({ page }) => {
    // Check for Boss Card visibility
    await expect(page.locator('.boss-card')).toBeVisible();
    await expect(page.locator('#boss-avatar')).not.toBeEmpty();
    await expect(page.locator('#boss-name')).not.toBeEmpty();
    await expect(page.locator('#boss-hp-bar')).toBeVisible();
  });

  test('should take damage when damage method is called', async ({ page }) => {
    // Get initial HP text
    const hpTextElement = page.locator('#boss-hp-text');
    await expect(hpTextElement).toBeVisible();
    const initialHpText = await hpTextElement.textContent();
    const initialHp = parseInt(initialHpText.split('/')[0].trim());

    // Call damage manually (Simulating rep completion)
    await page.evaluate(() => {
      if (window.BossBattle) {
        window.BossBattle.damage(1);
      }
    });

    // Verify HP decreased by 1
    // Wait for UI update (happens immediately but good to wait for text change)
    await expect(async () => {
      const newHpText = await hpTextElement.textContent();
      const newHp = parseInt(newHpText.split('/')[0].trim());
      expect(newHp).toBe(initialHp - 1);
    }).toPass();
  });

  test('should persist monster state after reload', async ({ page }) => {
    // Manually set a state
    const state = {
      currentMonster: {
        name: 'Test Monster',
        emoji: '🧪',
        maxHp: 50,
        currentHp: 25
      },
      totalKills: 10
    };

    await page.addInitScript(state => {
      localStorage.setItem('squat-tracker-boss-v1', JSON.stringify(state));
    }, state);

    await page.reload();

    await expect(page.locator('#boss-name')).toHaveText('Test Monster');
    await expect(page.locator('#boss-avatar')).toHaveText('🧪');
    await expect(page.locator('#boss-hp-text')).toContainText('25 / 50');
    await expect(page.locator('#boss-kill-count')).toHaveText('10');
  });
});
