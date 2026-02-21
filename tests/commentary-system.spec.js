import { test, expect } from '@playwright/test';

test.describe('Commentary System Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept JSON requests
    await page.route('**/*.json', async route => {
      const url = route.request().url();
      if (url.includes('commentary-lines.json')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            start: ["Start line 1"],
            combo_small: ["Combo small line 1"],
            combo_large: ["Combo large line 1"]
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]'
        });
      }
    });

    await page.goto('/');

    // Wait for CommentaryManager to be available
    await page.waitForFunction(() => window.CommentaryManager && window.VoiceCoach);

    // Mock VoiceCoach and Init Manager Manually to ensure state
    await page.evaluate(async () => {
      window.speechSynthesis.cancel();
      window.__spokenTexts = [];
      window.VoiceCoach.speak = (text) => {
        window.__spokenTexts.push(text);
      };

      // Force init with mocked data
      await window.CommentaryManager.init();
      // Reset
      window.CommentaryManager.setEnabled(false);
      window.CommentaryManager.lastSpokenTime = {};
    });
  });

  test('should speak on start event when enabled', async ({ page }) => {
    // Enable system directly
    await page.evaluate(() => window.CommentaryManager.setEnabled(true));

    // Trigger start event
    await page.evaluate(() => {
      window.CommentaryManager.notify('start');
    });

    // Verify speech
    const spokenTexts = await page.evaluate(() => window.__spokenTexts);
    expect(spokenTexts.length).toBeGreaterThan(0);
    expect(spokenTexts[0]).toBe("Start line 1");
  });

  test('should not speak when disabled', async ({ page }) => {
    await page.evaluate(() => window.CommentaryManager.setEnabled(false));

    await page.evaluate(() => {
      window.CommentaryManager.notify('start');
    });

    const spokenTexts = await page.evaluate(() => window.__spokenTexts);
    expect(spokenTexts.length).toBe(0);
  });

  test('should respect cooldowns', async ({ page }) => {
    await page.evaluate(() => window.CommentaryManager.setEnabled(true));

    await page.evaluate(() => {
      window.CommentaryManager.notify('start');
      window.CommentaryManager.notify('start');
    });

    const spokenTexts = await page.evaluate(() => window.__spokenTexts);
    expect(spokenTexts.length).toBe(1);
  });

  test('should handle combo events correctly', async ({ page }) => {
    await page.evaluate(() => window.CommentaryManager.setEnabled(true));

    await page.evaluate(() => {
      window.CommentaryManager.notify('combo', { count: 10 });
    });

    const spokenTexts = await page.evaluate(() => window.__spokenTexts);
    expect(spokenTexts.length).toBe(1);
    expect(spokenTexts[0]).toBe("Combo small line 1");
  });

  test('should ignore low combo counts', async ({ page }) => {
    await page.evaluate(() => window.CommentaryManager.setEnabled(true));

    await page.evaluate(() => {
      window.CommentaryManager.notify('combo', { count: 5 });
    });

    const spokenTexts = await page.evaluate(() => window.__spokenTexts);
    expect(spokenTexts.length).toBe(0);
  });

});
