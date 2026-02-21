import { test, expect } from '@playwright/test';

test.describe('Buddy System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app initialization
    await page.waitForFunction(() => window.BuddyManager && window.BossBattle);
  });

  test('should acquire and equip a buddy', async ({ page }) => {
    // 1. Force add a buddy (Slime: index 0)
    await page.evaluate(() => {
      window.BuddyManager._reset();
      window.BuddyManager._forceAdd(0); // Slime
    });

    // 2. Open Inventory Modal
    await page.click('#equipment-button');
    const modal = page.locator('#equipment-modal');
    await expect(modal).toHaveClass(/active/);

    // 3. Switch to Buddy Tab
    await page.click('[data-target="buddy-view"]');
    await expect(page.locator('#buddy-view')).toBeVisible();

    // 4. Check Buddy List
    const buddyItem = page.locator('.buddy-item').first();
    await expect(buddyItem).toBeVisible();
    await expect(buddyItem).toContainText('スライム');
    await expect(buddyItem).toHaveClass(/equipped/); // First one auto-equipped

    // 5. Check Bonus Display
    const bonusText = await page.locator('#buddy-total-bonus').textContent();
    expect(bonusText).toBe('+5'); // Base 3 + Level 1 * 2 = 5
  });

  test('should display buddy in boss battle', async ({ page }) => {
    // 1. Force add a buddy
    await page.evaluate(() => {
      window.BuddyManager._reset();
      window.BuddyManager._forceAdd(0);
      window.BossBattle.render(); // Update UI
    });

    // 2. Check Boss Display
    const buddyAvatar = page.locator('#buddy-container .buddy-avatar');
    await expect(buddyAvatar).toBeVisible();
    await expect(buddyAvatar).toContainText('💧');
  });

  test('should apply damage bonus', async ({ page }) => {
     // 1. Force add a buddy
    await page.evaluate(() => {
      window.BuddyManager._reset();
      window.BuddyManager._forceAdd(0);
    });

    // 2. Verify bonus calculation
    const bonus = await page.evaluate(() => window.BuddyManager.getDamageBonus());
    expect(bonus).toBe(5);

    // 3. Perform attack (mock) and check no errors
    await page.evaluate(() => {
        // Just ensuring no crash when damage is called
        if (window.BossBattle.state.currentMonster) {
            window.BossBattle.damage(10);
        }
    });
  });

  test('should switch buddies', async ({ page }) => {
      // Add two buddies
      await page.evaluate(() => {
          window.BuddyManager._reset();
          window.BuddyManager._forceAdd(0); // Slime (Auto equipped)
          window.BuddyManager._forceAdd(1); // Bat
      });

      await page.click('#equipment-button');
      await page.click('[data-target="buddy-view"]');

      const buddies = page.locator('.buddy-item');
      await expect(buddies).toHaveCount(2);

      // Initial state: Slime is equipped and should be first
      await expect(buddies.nth(0)).toContainText('スライム');
      await expect(buddies.nth(0)).toHaveClass(/equipped/);
      await expect(buddies.nth(1)).toContainText('コウモリ');

      // Click Bat to equip
      await buddies.nth(1).click();

      // Bat should now be equipped and moved to top
      await expect(buddies.nth(0)).toContainText('コウモリ');
      await expect(buddies.nth(0)).toHaveClass(/equipped/);

      // Verify via Manager
      const currentId = await page.evaluate(() => window.BuddyManager.getCurrentBuddy().id);
      expect(currentId).toBe('コウモリ');
  });
});
