import { test, expect } from '@playwright/test';

test.describe('Class Active Skills Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/index.html');
    await page.waitForFunction(() => window.SkillManager && window.ClassManager);

    // Setup: Reduce countdown to min to speed up tests
    await page.fill('#countdown-duration', '3');
    await page.dispatchEvent('#countdown-duration', 'change');
    await page.waitForTimeout(500);
  });

  const startWorkout = async (page) => {
    const startBtn = page.locator('#start-button');
    await expect(startBtn).toBeEnabled();
    await startBtn.click();
    await expect(page.locator('#phase-display')).not.toContainText('待機中');
  };

  test('UI should display skill button after workout starts', async ({ page }) => {
    await page.evaluate(() => window.ClassManager.changeClass('novice'));
    await startWorkout(page);

    const button = page.locator('#skill-trigger-button');
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();
    await expect(button.locator('.skill-name')).toContainText('深呼吸');
  });

  test('Warrior Skill (Power Surge) should increase attack multiplier', async ({ page }) => {
    await page.evaluate(() => window.ClassManager.changeClass('warrior'));
    await startWorkout(page);

    const button = page.locator('#skill-trigger-button');
    await expect(button).toBeVisible();
    await expect(button.locator('.skill-name')).toContainText('パワーサージ');

    // Activate Skill
    await button.click();

    await expect(button).toBeDisabled();
    await expect(button).toHaveClass(/active/);
    await expect(button.locator('.skill-name')).toContainText('発動中');

    const multiplier = await page.evaluate(() => window.SkillManager.getAttackMultiplier());
    expect(multiplier).toBe(1.5);
  });

  test('Mage Skill (Foresight) should auto-win quiz', async ({ page }) => {
    await page.evaluate(() => window.ClassManager.changeClass('mage'));
    await startWorkout(page);

    const button = page.locator('#skill-trigger-button');
    await expect(button).toBeVisible();
    await expect(button.locator('.skill-name')).toContainText('予知');

    await button.click();

    const shouldAutoWin = await page.evaluate(() => window.SkillManager.shouldAutoWinQuiz());
    expect(shouldAutoWin).toBe(true);

    await page.evaluate(() => {
      // Phase DOWN: Generate Quiz (Use Japanese const value)
      window.updateQuizAndTimerDisplay('しゃがむ');

      // Phase UP: Resolve Quiz (Use Japanese const value)
      window.updateQuizAndTimerDisplay('立つ');
    });

    const correctCount = await page.evaluate(() => window.quizSessionCorrect);
    expect(correctCount).toBeGreaterThan(0);

    const effectRemaining = await page.evaluate(() => window.SkillManager.shouldAutoWinQuiz());
    expect(effectRemaining).toBe(false);
  });

  test('Reset workout should reset skill usage', async ({ page }) => {
    await page.evaluate(() => window.ClassManager.changeClass('warrior'));
    await startWorkout(page);

    await page.locator('#skill-trigger-button').click();
    await expect(page.locator('#skill-trigger-button')).toBeDisabled();

    await page.click('#reset-button');

    const button = page.locator('#skill-trigger-button');
    await expect(button).toBeHidden();

    await startWorkout(page);
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();
    await expect(button).not.toHaveClass(/used/);

    const multiplier = await page.evaluate(() => window.SkillManager.getAttackMultiplier());
    expect(multiplier).toBe(1.0);
  });
});
