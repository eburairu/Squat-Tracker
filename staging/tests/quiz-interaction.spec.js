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
      ['#rest-duration', '1'],
      ['#countdown-duration', '1']
    ]) {
      await page.locator(selector).fill(value);
      await page.locator(selector).dispatchEvent('input'); // Trigger validation
    }
  });

  test('Cooperative mode: correct answer should grant attack bonus', async ({ page }) => {
    // Start button should be enabled now
    await page.click('#start-button');
    await page.waitForSelector('#quiz-options-container');

    // 2. Get the correct answer and click the corresponding button
    const correctAnswer = await page.evaluate(() => window.currentQuiz.correctAnswer);
    await page.click(`.quiz-option:text-is("${correctAnswer}")`);

    // 3. Verify bonus was applied
    const bonus = await page.evaluate(() => window.sessionAttackBonus);
    expect(bonus).toBe(1);

    // 4. Spy on BossBattle.damage
    await page.evaluate(() => {
      window.lastDamageArgs = null;
      const originalDamage = window.BossBattle.damage;
      window.BossBattle.damage = (...args) => {
        window.lastDamageArgs = args;
        originalDamage.apply(window.BossBattle, args);
      };
    });

    // 5. Let the workout proceed to the attack phase (UP phase completion)
    // Down (2s) + Hold (1s) + Up (1s) = 4s. Wait for 5s to be safe.
    await page.waitForTimeout(5000);

    // 6. Check if BossBattle.damage was called with the bonus
    const lastDamageArgs = await page.evaluate(() => window.lastDamageArgs);
    const baseAp = await page.evaluate(() => window.userBaseAp);
    const weaponBonus = await page.evaluate(() => window.InventoryManager.getAttackBonus());

    // The first argument to damage() is the amount
    const expectedDamageWithoutCrit = baseAp + weaponBonus + 1;
    expect(lastDamageArgs[0]).toBeGreaterThanOrEqual(expectedDamageWithoutCrit);
  });

  test('Disruptive mode: incorrect answer should not increment rep count', async ({ page }) => {
    // 1. Switch to disruptive mode
    await page.click('#quiz-mode-toggle');
    await expect(page.locator('#quiz-mode-label')).toHaveText('お邪魔');

    // 2. Start workout
    await page.click('#start-button');
    await page.waitForSelector('#quiz-options-container');

    // 3. Get the correct answer and click an INCORRECT button
    const correctAnswer = await page.evaluate(() => window.currentQuiz.correctAnswer);
    const options = await page.evaluate(() => window.currentQuiz.options);
    const incorrectAnswer = options.find(opt => opt !== correctAnswer);
    await page.click(`.quiz-option:text-is("${incorrectAnswer}")`);

    // 4. Verify rep display is "1 / 10" initially
    await expect(page.locator('#rep-display')).toHaveText('1 / 10');

    // 5. Let the workout proceed through one rep cycle
    await page.waitForTimeout(5000);

    // 6. Verify rep display is STILL "1 / 10" because of the penalty
    await expect(page.locator('#rep-display')).toHaveText('1 / 10');
  });
});
