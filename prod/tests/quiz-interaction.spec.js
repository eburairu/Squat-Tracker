import { test, expect } from '@playwright/test';

test.describe('Quiz Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for boss to be initialized to prevent race conditions on attack
    await page.waitForSelector('#boss-name:not(:text("Loading..."))');

    // Set short durations and dispatch input event for validation
    for (const [selector, value] of [
      ['#set-count', '1'],
      ['#rep-count', '2'], // Use 2 reps to test rep increment
      ['#down-duration', '1'],
      ['#hold-duration', '1'],
      ['#up-duration', '1'],
      ['#rest-duration', '10'],
      ['#countdown-duration', '3']
    ]) {
      await page.locator(selector).fill(value);
      await page.locator(selector).dispatchEvent('input'); // Trigger validation
    }
  });

  test('Cooperative mode: correct answer should grant attack bonus', async ({ page }) => {
    // Start button should be enabled now
    await page.click('#start-button');
    await page.waitForSelector('#quiz-options-container');

    // Wait until quiz is generated
    await page.waitForFunction(() => {
        const problem = document.getElementById('quiz-problem');
        return problem && problem.textContent.includes('問題:') && !problem.textContent.includes('--');
    });

    // 2. Get the correct answer and click the corresponding button
    const correctAnswer = await page.evaluate(() => window.currentQuiz.correctAnswer);
    await page.click(`.quiz-option:text-is("${correctAnswer}")`);

    // 3. Verify bonus was applied (delayed until Phase.UP)
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 10000 });
    const bonus = await page.evaluate(() => window.sessionAttackBonus);
    expect(bonus).toBe(1);

    // 4. Spy on BossBattle.damage
    await page.evaluate(() => {
      window.damageCalls = [];
      const originalDamage = window.BossBattle.damage;
      window.BossBattle.damage = (...args) => {
        window.damageCalls.push(args);
        originalDamage.apply(window.BossBattle, args);
      };
    });

    // 5. Let the workout proceed to the attack phase (UP phase completion)
    // Down (1s) + Hold (1s) + Up (1s) = 3s. Wait for 5s.
    // This might trigger a second attack, so we should check the first call.
    await page.waitForTimeout(5000);

    // 6. Check if BossBattle.damage was called with the bonus
    const damageCalls = await page.evaluate(() => window.damageCalls);
    const baseAp = await page.evaluate(() => window.userBaseAp);
    const weaponBonus = await page.evaluate(() => window.InventoryManager.getAttackBonus());

    // The first argument to damage() is the amount
    const expectedDamageWithoutCrit = baseAp + weaponBonus + 1;
    // Check the first call (should be the one with bonus)
    expect(damageCalls.length).toBeGreaterThan(0);
    expect(damageCalls[0][0]).toBeGreaterThanOrEqual(expectedDamageWithoutCrit);
  });

});
