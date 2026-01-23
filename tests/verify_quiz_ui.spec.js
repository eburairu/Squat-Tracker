const { test, expect } = require('@playwright/test');

test.describe('Quiz UI Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Disable voice and sensor to avoid interference
    await page.evaluate(() => {
      localStorage.clear();
      if (window.VoiceCoach) window.VoiceCoach.setEnabled(false);
    });
    // Set short durations for quicker testing
    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#rest-duration', '10');
    await page.fill('#countdown-duration', '3'); // Min value is 3
  });

  test('Layout should be 1x4 and persistent in IDLE state', async ({ page }) => {
    // Check 1x4 layout logic (grid-template-columns)
    const container = page.locator('#quiz-options-container');
    // Computed value will be pixels, e.g. "100px 100px 100px 100px"
    const gridTemplate = await container.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    const columns = gridTemplate.split(' ');
    expect(columns.length).toBe(4);

    // Check IDLE state visibility
    await expect(container).toBeVisible();
    const buttons = container.locator('.quiz-option');
    await expect(buttons).toHaveCount(4);

    // In IDLE, buttons should be disabled and show "--"
    for (let i = 0; i < 4; i++) {
      const btn = buttons.nth(i);
      await expect(btn).toBeDisabled();
      await expect(btn).toHaveText('--');
    }
  });

  test('Correct answer feedback loop', async ({ page }) => {
    await page.click('#start-button');

    // Wait for DOWN phase (quiz generated)
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ', { timeout: 5000 });

    const buttons = page.locator('.quiz-option');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBe(4);

    // Use exposed currentQuiz to find correct answer reliably
    const correctAnswer = await page.evaluate(() => window.currentQuiz.correctAnswer);

    // Find correct button
    let correctBtnIndex = -1;
    for (let i = 0; i < 4; i++) {
        const btnText = await buttons.nth(i).innerText();
        const val = parseInt(btnText);
        if (val === correctAnswer) {
            correctBtnIndex = i;
            break;
        }
    }

    expect(correctBtnIndex).toBeGreaterThan(-1);

    // Click correct button
    await buttons.nth(correctBtnIndex).click();

    // Verify green class
    await expect(buttons.nth(correctBtnIndex)).toHaveClass(/correct/);
    await expect(buttons.nth(correctBtnIndex)).not.toHaveClass(/incorrect/);
  });

  test('Incorrect answer feedback (Green/Red) and Persistence', async ({ page }) => {
    await page.click('#start-button');
    await expect(page.locator('#phase-display')).toHaveText('しゃがむ', { timeout: 5000 });

    const buttons = page.locator('.quiz-option');

    // Use exposed currentQuiz
    const correctAnswer = await page.evaluate(() => window.currentQuiz.correctAnswer);

    // Find incorrect button
    let incorrectBtnIndex = -1;
    let correctBtnIndex = -1;
    for (let i = 0; i < 4; i++) {
        const val = parseInt(await buttons.nth(i).innerText());
        if (val !== correctAnswer) incorrectBtnIndex = i;
        else correctBtnIndex = i;
    }

    expect(incorrectBtnIndex).toBeGreaterThan(-1);
    expect(correctBtnIndex).toBeGreaterThan(-1);

    await buttons.nth(incorrectBtnIndex).click();

    // Verify Red on clicked
    await expect(buttons.nth(incorrectBtnIndex)).toHaveClass(/incorrect/);

    // Verify Green on correct (New Requirement)
    await expect(buttons.nth(correctBtnIndex)).toHaveClass(/correct/);

    // Wait for UP phase (Answer Reveal)
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 5000 });

    // Verify state persistence in UP phase
    await expect(buttons.nth(incorrectBtnIndex)).toHaveClass(/incorrect/);
    await expect(buttons.nth(correctBtnIndex)).toHaveClass(/correct/);
    await expect(buttons.nth(incorrectBtnIndex)).toBeDisabled();
  });
});
