const { test, expect } = require('@playwright/test');

test.describe('Loadout System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Clear existing data to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
      // Mock necessary managers if they rely on async data loading
      // For now, we assume the app initializes normally
    });

    // Reload to apply cleared storage
    await page.reload();
  });

  test('should allow saving and applying loadouts', async ({ page }) => {
    // Wait for app initialization (assuming LoadoutManager is exposed)
    // Since LoadoutManager is not implemented yet, this test is expected to fail or we need to wait for it.
    // For TDD, we write the test assuming it exists.

    // 1. Setup initial state (Class: Warrior, Weapon: Sword)
    await page.evaluate(() => {
      // Mock data or use existing managers to set state
      // Assuming ClassManager and InventoryManager are available globally
      if (window.ClassManager && window.InventoryManager) {
        // Ensure weaponsData exists for validation
        if (!window.InventoryManager.weaponsData['iron_sword']) {
            window.InventoryManager.weaponsData['iron_sword'] = { id: 'iron_sword', name: 'Iron Sword', rarity: 1 };
        }
        if (!window.InventoryManager.weaponsData['wood_staff']) {
            window.InventoryManager.weaponsData['wood_staff'] = { id: 'wood_staff', name: 'Wood Staff', rarity: 1 };
        }

        // Force set state for testing
        // Note: Real implementation might need to wait for data loading
        window.ClassManager.currentClassId = 'warrior';

        // Ensure item is owned
        window.InventoryManager.state.items['iron_sword'] = { level: 1, acquiredAt: Date.now() };
        window.InventoryManager.state.equippedId = 'iron_sword';

        window.TitleManager.state.currentPrefix = 'p1';
        window.TitleManager.state.currentSuffix = 's1';
      }
    });

    // 2. Save Loadout
    const loadoutName = 'My Battle Set';
    await page.evaluate((name) => {
      if (!window.LoadoutManager) throw new Error('LoadoutManager not found');
      window.LoadoutManager.saveCurrentLoadout(name);
    }, loadoutName);

    // Verify it's saved in manager
    const loadouts = await page.evaluate(() => window.LoadoutManager.getLoadouts());
    expect(loadouts).toHaveLength(1);
    expect(loadouts[0].name).toBe(loadoutName);
    expect(loadouts[0].classId).toBe('warrior');

    // 3. Change state (Class: Mage)
    await page.evaluate(() => {
      window.ClassManager.currentClassId = 'mage';
      window.InventoryManager.state.equippedId = 'wood_staff';
    });

    // 4. Apply Loadout
    await page.evaluate((id) => {
      window.LoadoutManager.applyLoadout(id);
    }, loadouts[0].id);

    // 5. Verify state restored
    const currentState = await page.evaluate(() => ({
      classId: window.ClassManager.currentClassId,
      weaponId: window.InventoryManager.state.equippedId
    }));

    expect(currentState.classId).toBe('warrior');
    expect(currentState.weaponId).toBe('iron_sword');
  });

  test('should persist loadouts across reloads', async ({ page }) => {
    // 1. Save a loadout
    await page.evaluate(() => {
        if (!window.LoadoutManager) throw new Error('LoadoutManager not found');
        // Mock state
        window.ClassManager.currentClassId = 'warrior';
        window.LoadoutManager.saveCurrentLoadout('Persist Test');
    });

    // 2. Reload page
    await page.reload();

    // 3. Check if loadout exists
    const loadouts = await page.evaluate(() => {
        if (!window.LoadoutManager) return [];
        return window.LoadoutManager.getLoadouts();
    });

    expect(loadouts.length).toBeGreaterThan(0);
    expect(loadouts[0].name).toBe('Persist Test');
  });

  test('should delete a loadout', async ({ page }) => {
      // 1. Save a loadout
      await page.evaluate(() => {
        if (!window.LoadoutManager) throw new Error('LoadoutManager not found');
        window.LoadoutManager.saveCurrentLoadout('Delete Test');
      });

      const loadoutsBefore = await page.evaluate(() => window.LoadoutManager.getLoadouts());
      const idToDelete = loadoutsBefore[0].id;

      // 2. Delete it
      await page.evaluate((id) => {
        window.LoadoutManager.deleteLoadout(id);
      }, idToDelete);

      // 3. Verify it's gone
      const loadoutsAfter = await page.evaluate(() => window.LoadoutManager.getLoadouts());
      expect(loadoutsAfter).toHaveLength(0);
  });
});
