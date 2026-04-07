const { test, expect } = require('@playwright/test');

test.describe('Performance Analyzer Logic', () => {
  test('evaluates perfectly (S rank) for complete reps and exact pace', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      return window.PerformanceAnalyzer.evaluate({
        targetTotalReps: 10,
        completedReps: 10,
        targetPace: 4, // d:2, h:1, u:1
        averagePace: 4
      });
    });

    expect(result.score).toBe(100);
    expect(result.rank).toBe('S');
    expect(result.feedback).toContain('素晴らしいリズム感です');
  });

  test('evaluates pace slightly fast (A or B rank)', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      return window.PerformanceAnalyzer.evaluate({
        targetTotalReps: 10,
        completedReps: 10,
        targetPace: 4,
        averagePace: 2 // too fast
      });
    });

    // Score: Completion (100*0.7) = 70. Pace error: diff -2, ratio 0.5. ratio > 0.1 so (0.5-0.1)*200 = 80 penalty. Pace Score = 20. Total = 70 + (20*0.3) = 76 => B
    expect(result.score).toBeLessThan(80); // B rank
    expect(result.rank).toBe('B');
    expect(result.feedback).toContain('ペースが少し早かったようです');
  });

  test('evaluates incomplete reps with max cap', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      return window.PerformanceAnalyzer.evaluate({
        targetTotalReps: 10,
        completedReps: 5,
        targetPace: 4,
        averagePace: 4
      });
    });

    // Completion: 50%. Pace: 100. Total = 35 + 30 = 65 => B
    expect(result.score).toBe(65);
    expect(result.rank).toBe('B');
  });
});

test.describe('Performance Analyzer UI', () => {
  test('displays performance result after finishing workout', async ({ page }) => {
    await page.goto('/');

    // Set short durations for fast test
    await page.fill('#set-count', '1');
    await page.fill('#rep-count', '1');
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#rest-duration', '1');
    await page.fill('#countdown-duration', '1');

    // Make start button clickable by evaluating inputs correctly to bypass validation delays
    await page.evaluate(() => {
      document.getElementById('set-count').dispatchEvent(new Event('input'));
      document.getElementById('rep-count').dispatchEvent(new Event('input'));
      window.updateStartButtonAvailability();
    });

    await page.click('#start-button');

    // Fast-forward or wait. Let's just hook the logic.
    await page.evaluate(() => {
      window.workoutStarted = true; // Ensure app thinks it started
      window.finishWorkout();
    });

    const perfContainer = page.locator('#performance-result-container');
    await expect(perfContainer).toBeVisible();

    const rank = perfContainer.locator('.performance-rank');
    await expect(rank).toBeVisible();
    const rankText = await rank.textContent();
    expect(['S', 'A', 'B', 'C']).toContain(rankText);

    await expect(perfContainer.locator('.performance-score')).toBeVisible();
    await expect(perfContainer.locator('.performance-feedback')).toBeVisible();
  });
});
