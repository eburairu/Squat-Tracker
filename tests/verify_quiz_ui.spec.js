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

    // Get quiz data
    const quizData = await page.evaluate(() => window.RpgSystem ? window.currentQuiz : null);
    // Note: currentQuiz is a module-level variable in app.js, not directly on window unless exposed.
    // In app.js: window.currentQuiz is NOT exposed. It's a local variable.
    // But updateQuizAndTimerDisplay uses it.
    // We can infer the correct answer by checking the logic or we can expose it for test,
    // OR we can just try clicking buttons until we hit the correct one?
    // Actually, app.js exposes `generateQuiz` but not the current instance.
    // However, the text content of the problem is visible. We can parse it?
    // "A + B = ?" -> calculate result.

    const problemText = await page.locator('#quiz-problem').innerText();
    // format: "問題: 3 + 4 = ?"
    const match = problemText.match(/問題:\s*(\d+)\s*([+\-×÷])\s*(\d+)\s*=\s*\?/);
    let correctAnswer;
    if (match) {
        const a = parseInt(match[1]);
        const op = match[2];
        const b = parseInt(match[3]);
        if (op === '+') correctAnswer = a + b;
        else if (op === '-') correctAnswer = a - b;
        else if (op === '×') correctAnswer = a * b;
        else if (op === '÷') correctAnswer = a / b;
    } else {
        // Handle "missing operand" cases if they exist in quiz.js
        // For simplicity, let's just cheat by modifying app.js to expose currentQuiz OR
        // we can iterate buttons and check text.
        // Wait, app.js does not expose currentQuiz.
        // Let's rely on button click feedback.
    }

    // Let's just find the button with the correct answer text.
    // We need to re-parse because the problem might be "? + 3 = 5" type.
    // But for this test, we can just click the button that matches the logic if we could parse it.
    // Easier approach: expose currentQuiz in app.js temporarily? No, I shouldn't modify code just for test if I can avoid it.

    // Alternative: We know the answer buttons have text. We can try to compute the answer.
    // Let's assume the parser works for the standard "A op B = ?" case which is common.
    // If not, we might fail, but let's try.

    // Actually, I can just click the button that becomes "correct" class? No, class is added AFTER click.

    // Let's use `page.evaluate` to inspect the closure state if possible? No.
    // I will try to parse the text.
    // quiz.js logic:
    // Normal: A + B = ? (Answer is result)
    // Missing Left: ? + B = R (Answer is A)
    // Missing Right: A + ? = R (Answer is B)

    // Let's look at the problem text again.
    // "3 + 5 = ?" -> Answer 8.
    // "? + 5 = 8" -> Answer 3.
    // "3 + ? = 8" -> Answer 5.

    // I'll implement a simple solver in the test.
    const buttons = page.locator('.quiz-option');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBe(4);

    // Find correct button
    let correctBtnIndex = -1;
    for (let i = 0; i < 4; i++) {
        const btnText = await buttons.nth(i).innerText();
        const val = parseInt(btnText);

        // Solve based on problem text
        const pText = problemText.replace('問題: ', '');
        // Check patterns
        let ans;
        if (pText.includes('?')) {
             const parts = pText.split(' '); // "?", "+", "3", "=", "5"
             // Basic parser
             let a = parts[0];
             let op = parts[1];
             let b = parts[2];
             let res = parts[4];

             const parseVal = (s) => s === '?' ? null : parseInt(s);
             const valA = parseVal(a);
             const valB = parseVal(b);
             const valRes = parseVal(res);

             if (valA === null) { // ? + B = R => A = R - B (inverse op)
                 if (op === '+') ans = valRes - valB;
                 else if (op === '-') ans = valRes + valB; // ? - B = R => A = R + B
                 else if (op === '×') ans = valRes / valB;
                 else if (op === '÷') ans = valRes * valB; // ? / B = R => A = R * B
             } else if (valB === null) { // A + ? = R
                 if (op === '+') ans = valRes - valA;
                 else if (op === '-') ans = valA - valRes; // A - ? = R => ? = A - R
                 else if (op === '×') ans = valRes / valA;
                 else if (op === '÷') ans = valA / valRes; // A / ? = R => ? = A / R
             } else { // A + B = ?
                 if (op === '+') ans = valA + valB;
                 else if (op === '-') ans = valA - valB;
                 else if (op === '×') ans = valA * valB;
                 else if (op === '÷') ans = valA / valB;
             }
        }

        if (val === ans) {
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

    const problemText = await page.locator('#quiz-problem').innerText();
    const buttons = page.locator('.quiz-option');

    // Determine correct answer (same logic as above, simplified)
    const pText = problemText.replace('問題: ', '');
    const parts = pText.split(' ');
    let ans;
    // ... (Use a helper function in real code, duplicating here for brevity)
    // For now, let's cheat: I will click the FIRST button. If it's correct, I'll restart.
    // If it's incorrect, I verify the logic.

    // Actually, I can just evaluate the problem text in node context to solve it robustly.
    // Or I can click a button that is NOT the correct answer.
    // Let's implement the solver inside the test properly.

    const solveQuiz = (text) => {
         const parts = text.replace('問題: ', '').split(' ');
         const parseVal = (s) => s === '?' ? null : parseInt(s);
         const valA = parseVal(parts[0]);
         const op = parts[1];
         const valB = parseVal(parts[2]);
         const valRes = parseVal(parts[4]);

         if (valA === null) {
             if (op === '+') return valRes - valB;
             if (op === '-') return valRes + valB;
             if (op === '×') return valRes / valB;
             if (op === '÷') return valRes * valB;
         } else if (valB === null) {
             if (op === '+') return valRes - valA;
             if (op === '-') return valA - valRes;
             if (op === '×') return valRes / valA;
             if (op === '÷') return valA / valRes;
         } else {
             if (op === '+') return valA + valB;
             if (op === '-') return valA - valB;
             if (op === '×') return valA * valB;
             if (op === '÷') return valA / valB;
         }
    };

    const correctAnswer = solveQuiz(problemText);

    // Find incorrect button
    let incorrectBtnIndex = -1;
    let correctBtnIndex = -1;
    for (let i = 0; i < 4; i++) {
        const val = parseInt(await buttons.nth(i).innerText());
        if (val !== correctAnswer) incorrectBtnIndex = i;
        else correctBtnIndex = i;
    }

    await buttons.nth(incorrectBtnIndex).click();

    // Verify Red on clicked
    await expect(buttons.nth(incorrectBtnIndex)).toHaveClass(/incorrect/);

    // Verify Green on correct (New Requirement)
    await expect(buttons.nth(correctBtnIndex)).toHaveClass(/correct/);

    // Wait for UP phase (Answer Reveal)
    // DOWN(1s) -> HOLD(1s) -> UP
    // We are already in DOWN. Wait for transition.
    await expect(page.locator('#phase-display')).toHaveText('立つ', { timeout: 5000 });

    // Verify state persistence in UP phase
    // Buttons should still have classes
    await expect(buttons.nth(incorrectBtnIndex)).toHaveClass(/incorrect/);
    await expect(buttons.nth(correctBtnIndex)).toHaveClass(/correct/);
    await expect(buttons.nth(incorrectBtnIndex)).toBeDisabled();
  });
});
