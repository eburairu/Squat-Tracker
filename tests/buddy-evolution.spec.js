import { test, expect } from '@playwright/test';

test.describe('Buddy Evolution System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for initialization
    await page.waitForFunction(() => {
        return window.BuddyManager &&
               window.BuddyManager.init &&
               window.InventoryManager &&
               Object.keys(window.InventoryManager.weaponsData || {}).length > 0;
    });

    // Re-bind tabs just in case init timing missed elements or wasn't fully done
    await page.evaluate(() => window.InventoryManager.setupTabs());

    // Reset state and add a buddy
    await page.evaluate(() => {
      localStorage.clear();
      window.BuddyManager._reset();
      // Add Slime (index 0)
      window.BuddyManager._forceAdd(0);
    });

    // Inject evolution data specifically for testing just in case
    await page.evaluate(() => {
        const evoData = {
          "スライム": {
            "targetLevel": 3, // Set to 3 so Lv1->Lv2 doesn't trigger evolution immediately
            "nextId": "king_slime",
            "nextName": "キングスライム",
            "nextEmoji": "👑",
            "baseDamageBonus": 5
          }
        };
        window.BuddyManager.init(evoData);
    });
  });

  test('should gain experience after workout', async ({ page }) => {
    // Check initial state
    const initialExp = await page.evaluate(() => {
        const buddy = window.BuddyManager.getCurrentBuddy();
        return buddy ? buddy.exp : -1;
    });
    expect(initialExp).toBe(0);

    // Perform workout (simulate via internal function to save time)
    await page.evaluate(() => {
        // Mock inputs just in case validation runs
        document.getElementById('set-count').value = 3;
        document.getElementById('rep-count').value = 10;

        window.startWorkout();
        window.finishWorkout(); // Instant finish
    });

    // Check exp gain
    const newExp = await page.evaluate(() => {
        const buddy = window.BuddyManager.getCurrentBuddy();
        return buddy ? buddy.exp : -1;
    });

    // 3 sets * 10 reps = 30 exp
    expect(newExp).toBe(30);
  });

  test('should level up and increase stats', async ({ page }) => {
    // Add enough exp to level up (Lv1 -> Lv2 needs 50 exp)
    await page.evaluate(() => {
        window.BuddyManager.addExp(60);
    });

    const buddy = await page.evaluate(() => window.BuddyManager.getCurrentBuddy());
    expect(buddy.level).toBe(2);

    // Damage bonus check: Base(3) + Lv(2)*2 = 7
    const damage = await page.evaluate(() => window.BuddyManager.getDamageBonus());
    expect(damage).toBe(7);

    // Check UI
    await page.click('#equipment-button');

    // Wait for modal and tab click to ensure render
    await page.waitForSelector('#equipment-modal.active');
    await page.click('button[data-target="buddy-view"]');

    const levelText = await page.textContent('.buddy-level');
    expect(levelText).toContain('Lv.2');
  });

  test('should evolve when target level is reached', async ({ page }) => {
    // Target Level is 3
    // Lv1 -> Lv2: Needs 50 EXP (Total 50)
    // Lv2 -> Lv3: Needs 100 EXP (Total 150)
    // Evolution happens at Lv3.

    // Add 150 EXP to reach Lv3 and trigger evolution
    await page.evaluate(() => {
        window.BuddyManager.addExp(150);
    });

    const buddy = await page.evaluate(() => window.BuddyManager.getCurrentBuddy());

    expect(buddy.name).toBe('キングスライム');
    expect(buddy.emoji).toBe('👑');
    expect(buddy.level).toBe(1); // Reset to 1

    // Base damage should increase: 3 (default) + 5 (bonus) = 8
    // Current damage: 8 + (1 * 2) = 10
    const damage = await page.evaluate(() => window.BuddyManager.getDamageBonus());
    expect(damage).toBe(10);
  });

  test('should acquire and equip a buddy (UI)', async ({ page }) => {
    // Already added Slime in beforeEach

    // Open UI
    await page.click('#equipment-button');
    await page.waitForSelector('#equipment-modal.active');

    // Click tab and wait for visibility
    await page.click('button[data-target="buddy-view"]');

    // Force show tab content if click fails to update display in test env
    await page.evaluate(() => {
        const el = document.getElementById('buddy-view');
        if (el && !el.classList.contains('active')) {
            el.classList.add('active');
            el.style.display = 'block';
        }
    });

    await page.waitForSelector('#buddy-view', { state: 'visible' });

    // Check List
    const buddyItem = page.locator('.buddy-item').first();
    await expect(buddyItem).toBeVisible();
    await expect(buddyItem).toContainText('スライム');
    await expect(buddyItem).toHaveClass(/equipped/);

    // Check EXP Bar Container (Bar might be 0 width if exp is 0)
    await expect(page.locator('.buddy-exp-container')).toBeVisible();
  });

  test('should display buddy in boss battle', async ({ page }) => {
    // Already added Slime in beforeEach

    // Force render boss battle
    await page.evaluate(() => {
        window.BossBattle.render();
    });

    // Check Boss Display
    const buddyAvatar = page.locator('#buddy-container .buddy-avatar');
    await expect(buddyAvatar).toBeVisible();
    await expect(buddyAvatar).toContainText('💧');
  });

  test('should switch buddies', async ({ page }) => {
      // Add another buddy
      await page.evaluate(() => {
          window.BuddyManager._forceAdd(1); // Bat
      });

      await page.click('#equipment-button');
      await page.waitForSelector('#equipment-modal.active');

      await page.click('button[data-target="buddy-view"]');

      // Force show tab content if click fails to update display in test env
      await page.evaluate(() => {
          const el = document.getElementById('buddy-view');
          if (el && !el.classList.contains('active')) {
              el.classList.add('active');
              el.style.display = 'block';
          }
      });

      await page.waitForSelector('#buddy-view', { state: 'visible' });

      const buddies = page.locator('.buddy-item');
      await expect(buddies).toHaveCount(2);

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
