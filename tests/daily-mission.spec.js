const { test, expect } = require('@playwright/test');

test.describe('Daily Mission System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure fresh state
    await page.addInitScript(() => {
      localStorage.removeItem('squat-tracker-missions');
    });
    await page.goto('/');
  });

  test('should display the daily mission card', async ({ page }) => {
    const missionCard = page.locator('#mission-card');
    await expect(missionCard).toBeVisible();
    await expect(missionCard.locator('h2')).toContainText('今日のミッション');
  });

  test('should initialize DailyMissionSystem and save to localStorage', async ({ page }) => {
    // Check if DailyMissionSystem is exposed globally
    const isExposed = await page.evaluate(() => typeof window.DailyMissionSystem !== 'undefined');
    expect(isExposed).toBe(true);

    // Wait for initialization (localStorage might be set async or immediately)
    // Since init is called on load, we check localStorage
    await page.waitForFunction(() => {
      const data = localStorage.getItem('squat-tracker-missions');
      return data && JSON.parse(data).missions;
    });

    const missions = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('squat-tracker-missions'));
      return data.missions;
    });

    // Expect 3 missions to be generated
    expect(missions.length).toBe(3);
  });

  test('should generate valid missions from the pool', async ({ page }) => {
    // Force generation
    await page.evaluate(() => {
      localStorage.removeItem('squat-tracker-missions');
      DailyMissionSystem.init();
    });

    const missions = await page.evaluate(() => DailyMissionSystem.state.missions);
    expect(missions.length).toBe(3);

    // Check structure of generated missions
    missions.forEach(mission => {
      expect(mission).toHaveProperty('id');
      expect(mission).toHaveProperty('type');
      expect(mission).toHaveProperty('description');
      expect(mission).toHaveProperty('target');
      expect(mission).toHaveProperty('current');
      expect(typeof mission.current).toBe('number');
      // Login mission might be auto-completed on init, so current can be > 0
      // expect(mission).toHaveProperty('completed', false); // Can be true
      expect(mission).toHaveProperty('claimed', false);
    });

    // Ensure types are valid (at least one known type should appear if logic is random)
    // Note: Since it's random, we check if type is string.
    // Ideally we check against a known list if we exposed it, but checking property existence is good for now.
    expect(typeof missions[0].type).toBe('string');
  });

  test('should update progress and complete missions', async ({ page }) => {
    // Inject specific missions
    await page.evaluate(() => {
      DailyMissionSystem.state.missions = [
        { id: 'm1', type: 'login', description: 'Login', target: 1, current: 0, completed: false, claimed: false },
        { id: 'm2', type: 'total_reps', description: 'Reps', target: 10, current: 0, completed: false, claimed: false }
      ];
      DailyMissionSystem.save();
    });

    // Check login mission (should be auto-checked on init, but here we can call it manually to be safe or rely on init if we reload)
    // To test "auto-login check", we would need to reload the page or call init again.
    // For this unit test, let's explicitely call check for login to verifying the logic itself works.
    await page.evaluate(() => DailyMissionSystem.check({ type: 'login' }));

    let mission1 = await page.evaluate(() => DailyMissionSystem.state.missions[0]);
    expect(mission1.current).toBe(1);
    expect(mission1.completed).toBe(true);

    // Check reps mission (partial progress)
    await page.evaluate(() => DailyMissionSystem.check({ type: 'finish', totalReps: 5 }));

    let mission2 = await page.evaluate(() => DailyMissionSystem.state.missions[1]);
    expect(mission2.current).toBe(5);
    expect(mission2.completed).toBe(false);

    // Complete reps mission
    await page.evaluate(() => DailyMissionSystem.check({ type: 'finish', totalReps: 5 })); // +5 reps

    mission2 = await page.evaluate(() => DailyMissionSystem.state.missions[1]);
    expect(mission2.current).toBe(10);
    expect(mission2.completed).toBe(true);
  });

  test('should claim reward and add weapon to inventory', async ({ page }) => {
    // Inject completed mission
    await page.evaluate(() => {
      DailyMissionSystem.state.missions = [
        { id: 'm1', type: 'login', description: 'Login', target: 1, current: 1, completed: true, claimed: false }
      ];
      // Reset inventory
      InventoryManager.state.items = { unarmed: { level: 1 } };
      InventoryManager.state.equippedId = 'unarmed';
      DailyMissionSystem.save();
    });

    // Claim reward
    await page.evaluate(() => {
        // Debugging logs
        console.log('DailyMissionSystem keys:', Object.keys(DailyMissionSystem));
        console.log('claimReward type:', typeof DailyMissionSystem.claimReward);
        DailyMissionSystem.claimReward('m1')
    });

    // Check mission state
    const mission = await page.evaluate(() => DailyMissionSystem.state.missions[0]);
    expect(mission.claimed).toBe(true);

    // Check inventory (should have more than just unarmed)
    const inventoryCount = await page.evaluate(() => Object.keys(InventoryManager.state.items).length);
    expect(inventoryCount).toBeGreaterThan(1);
  });

  test('should progress missions on workout finish', async ({ page }) => {
    // Inject mission
    await page.evaluate(() => {
      DailyMissionSystem.state.missions = [
        { id: 'm1', type: 'finish_workout', description: 'Finish Workout', target: 1, current: 0, completed: false, claimed: false }
      ];
      DailyMissionSystem.save();
    });

    // Simulate workout finish
    // We can call finishWorkout directly or simulate the UI flow. Calling directly is faster and tests the integration.
    await page.evaluate(() => {
      // Mock inputs for settings
      document.getElementById('set-count').value = '1';
      document.getElementById('rep-count').value = '1';
      document.getElementById('down-duration').value = '1';
      document.getElementById('hold-duration').value = '1';
      document.getElementById('up-duration').value = '1';
      document.getElementById('rest-duration').value = '10';
      document.getElementById('countdown-duration').value = '3';

      // Call finishWorkout (global function)
      // Note: In a real scenario, finishWorkout is called by the timer.
      // We need to ensure startWorkout -> ... -> finishWorkout flow or just call it.
      // Since finishWorkout is not exposed to window in the provided app.js snippet (it's inside module scope but not explicitly attached),
      // we might need to rely on the fact that it's called by 'nextRepOrSet'.
      // Wait, app.js defines: if (typeof window !== 'undefined') window.finishWorkout = finishWorkout; ?? No it doesn't.

      if (typeof window.finishWorkout === 'function') {
        window.finishWorkout();
      } else {
        throw new Error('finishWorkout is not exposed');
      }
    });

    const mission = await page.evaluate(() => DailyMissionSystem.state.missions[0]);
    expect(mission.current).toBe(1);
    expect(mission.completed).toBe(true);
  });
});
