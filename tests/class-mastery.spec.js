import { test, expect } from '@playwright/test';

test.describe('Class Mastery Logic', () => {
  let classesData;

  test.beforeEach(async ({ page }) => {
    // Inject mock data and ClassManager
    await page.goto('about:blank'); // Or load app page if needed, but about:blank is faster for pure logic test

    // Load module source
    await page.addScriptTag({ path: './js/utils.js' }); // Dependency
    // Since utils.js exports, we might need to handle modules.
    // Easier approach: Use page.evaluate to define minimal mock environment and copy-paste relevant logic?
    // OR: Just navigate to index.html and use window.ClassManager (exposed in app.js if possible)

    // Let's rely on the app loading.
    await page.goto('/');

    // Wait for ClassManager
    await page.waitForFunction(() => window.ClassManager && window.ClassManager.classes.length > 0);
  });

  test('should migrate old data format correctly', async ({ page }) => {
    await page.evaluate(() => {
      // Mock storage with old format
      localStorage.setItem('squat-tracker-class-mastery', JSON.stringify({
        "warrior": 100
      }));
      // Re-init or reload data
      window.ClassManager.loadMasteryData();
    });

    const data = await page.evaluate(() => window.ClassManager.masteryData);
    expect(data.warrior).toEqual({ exp: 100, unlockedNodes: [] });
  });

  test('should calculate SP correctly', async ({ page }) => {
    await page.evaluate(() => {
      // Set warrior to Lv2 (100 EXP) -> 1 SP
      window.ClassManager.masteryData['warrior'] = { exp: 100, unlockedNodes: [] };
      window.ClassManager.saveMasteryData();
    });

    const sp = await page.evaluate(() => window.ClassManager.getSP('warrior'));
    expect(sp.total).toBe(1);
    expect(sp.available).toBe(1);

    await page.evaluate(() => {
        // Set warrior to Lv3 (300 EXP) -> 2 SP
        window.ClassManager.masteryData['warrior'] = { exp: 300, unlockedNodes: [] };
    });
    const sp2 = await page.evaluate(() => window.ClassManager.getSP('warrior'));
    expect(sp2.total).toBe(2);
  });

  test('should unlock node if requirements met', async ({ page }) => {
    // Set Lv2 Warrior (1 SP)
    await page.evaluate(() => {
      window.ClassManager.masteryData['warrior'] = { exp: 100, unlockedNodes: [] };
    });

    // Try unlock Tier 1 node (cost 1)
    // Need to know node ID. Assuming warrior_atk_1 from previous step.
    const result = await page.evaluate(() => {
      return window.ClassManager.unlockNode('warrior', 'warrior_atk_1');
    });

    expect(result.success).toBe(true);

    const unlocked = await page.evaluate(() => window.ClassManager.getUnlockedNodes('warrior'));
    expect(unlocked).toContain('warrior_atk_1');

    const sp = await page.evaluate(() => window.ClassManager.getSP('warrior'));
    expect(sp.available).toBe(0);
  });

  test('should fail unlock if not enough SP', async ({ page }) => {
    // Lv1 Warrior (0 SP)
    await page.evaluate(() => {
      window.ClassManager.masteryData['warrior'] = { exp: 0, unlockedNodes: [] };
    });

    const result = await page.evaluate(() => {
      return window.ClassManager.unlockNode('warrior', 'warrior_atk_1');
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('not_enough_sp');
  });

  test('should fail unlock if prerequisites not met', async ({ page }) => {
    // Lv10 Warrior (9 SP)
    await page.evaluate(() => {
      window.ClassManager.masteryData['warrior'] = { exp: 4500, unlockedNodes: [] };
    });

    // Try unlock Tier 2 node directly
    const result = await page.evaluate(() => {
      return window.ClassManager.unlockNode('warrior', 'warrior_atk_2');
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('prerequisites_not_met');
  });

  test('should apply node effects to modifiers', async ({ page }) => {
     // Lv2 Warrior + warrior_atk_1 (Attack +10%)
     await page.evaluate(() => {
        window.ClassManager.masteryData['warrior'] = { exp: 100, unlockedNodes: ['warrior_atk_1'] };
     });

     const mods = await page.evaluate(() => window.ClassManager.getModifiers('warrior'));

     // Base Warrior Attack: 1.2
     // Level Bonus (Lv2): +0.05
     // Skill Tree: +0.1
     // Total: 1.35

     expect(mods.attackMultiplier).toBeCloseTo(1.35, 2);
  });

  test('should apply expMultiplier even if not in base modifiers', async ({ page }) => {
    // Novice has no expMultiplier in base.
    // novice_exp_1 adds 0.05 expMultiplier.
    await page.evaluate(() => {
        window.ClassManager.masteryData['novice'] = { exp: 100, unlockedNodes: ['novice_exp_1'] };
    });

    const mods = await page.evaluate(() => window.ClassManager.getModifiers('novice'));
    // Base 1.0 + 0.05 = 1.05
    expect(mods.expMultiplier).toBeCloseTo(1.05, 2);
  });
});
