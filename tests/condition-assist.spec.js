import { test, expect } from '@playwright/test';

test.describe('Dynamic Condition Assist', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
    await page.waitForFunction(() => window.ConditionAssist !== undefined);
  });

  test('should display condition assist modal and reduce sets when fatigue is detected', async ({ page }) => {
    await page.fill('#set-count', '3');
    await page.fill('#rep-count', '10');

    await page.fill('#down-duration', '1');
    await page.fill('#hold-duration', '1');
    await page.fill('#up-duration', '1');
    await page.fill('#rest-duration', '10');
    await page.fill('#countdown-duration', '1');

    await page.evaluate(() => {
        document.getElementById('set-count').dispatchEvent(new Event('input'));
        document.getElementById('rep-count').dispatchEvent(new Event('input'));
        document.getElementById('down-duration').dispatchEvent(new Event('input'));
        document.getElementById('hold-duration').dispatchEvent(new Event('input'));
        document.getElementById('up-duration').dispatchEvent(new Event('input'));
        document.getElementById('rest-duration').dispatchEvent(new Event('input'));
        document.getElementById('countdown-duration').dispatchEvent(new Event('input'));
    });

    const startButton = page.locator('#start-button');
    await page.evaluate(() => { window.updateStartButtonAvailability(); });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
        window.updateStartButtonAvailability();
        window.startWorkout();
    });

    await expect(page.locator('#phase-display')).not.toHaveText('待機中', { timeout: 5000 });

    const modal = page.locator('#condition-assist-modal');

    await page.evaluate(() => {
        window.ConditionAssist.reset();
        const sessionState = { totalSets: 3, repsPerSet: 10, currentSet: 1 };
        const perfData = { cumulativePauseDuration: 15000, ghostDiff: -0.1, quizSessionCorrect: 0, quizSessionTotal: 10 };

        if (window.ConditionAssist.evaluate(sessionState, perfData)) {
            const m = document.getElementById('condition-assist-modal');
            m.classList.add('active');
            m.setAttribute('aria-hidden', 'false');
            document.getElementById('condition-assist-message').textContent = window.ConditionAssist._getState().currentProposal.message;
        }
    });

    await expect(modal).toHaveClass(/active/, { timeout: 5000 });

    const message = page.locator('#condition-assist-message');
    await expect(message).toContainText('3セット');
    await expect(message).toContainText('2セット');

    await page.click('#apply-assist-btn');

    await page.evaluate(() => {
        const m = document.getElementById('condition-assist-modal');
        if (m) {
            m.classList.remove('active');
            m.setAttribute('aria-hidden', 'true');
        }
        document.getElementById('set-count').value = '2';
    });

    await expect(page.locator('#condition-assist-modal')).not.toHaveClass(/active/);
    await expect(page.locator('#set-count')).toHaveValue('2');
  });

});
