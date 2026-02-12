import { test, expect } from '@playwright/test';

test.describe('Encounter System', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    await page.goto('/');
    // Wait for app initialization
    await page.waitForFunction(() => window.EncounterManager);
  });

  test('displays encounter modal and pauses workout when triggered', async ({ page }) => {
    // Start workout first to enable pause functionality
    await page.click('#start-button');
    await page.waitForTimeout(1000); // Wait for countdown or start

    const encounter = {
      id: 'test_encounter',
      title: 'Test Encounter',
      description: 'This is a test encounter.',
      emoji: '🧪',
      choices: [
        {
          id: 'choice1',
          text: 'Choose Me',
          result: { type: 'none', message: 'You chose wisely.' }
        }
      ]
    };

    // Trigger encounter
    await page.evaluate((e) => window.EncounterManager.triggerEncounter(e), encounter);

    // Verify modal visibility
    const modal = page.locator('#encounter-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#encounter-title')).toHaveText('Test Encounter');
    await expect(page.locator('#encounter-desc')).toHaveText('This is a test encounter.');

    // Verify workout is paused
    const pauseButton = page.locator('#pause-button');
    await expect(pauseButton).toHaveText('再開');
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('resolves encounter, applies result, and resumes workout', async ({ page }) => {
    // Start workout
    await page.click('#start-button');
    await page.waitForTimeout(1000);

    const encounter = {
      id: 'test_encounter_2',
      title: 'Resolving Encounter',
      description: 'Click the button.',
      choices: [
        {
          id: 'choice1',
          text: 'Click Me',
          result: { type: 'none', message: 'Done.' }
        }
      ]
    };

    // Trigger encounter
    await page.evaluate((e) => window.EncounterManager.triggerEncounter(e), encounter);

    // Click choice
    const button = page.locator('.encounter-choice-btn', { hasText: 'Click Me' });
    await button.click();

    // Verify modal closed
    const modal = page.locator('#encounter-modal');
    // Modal uses opacity transition, so check for class removal or opacity
    await expect(modal).not.toHaveClass(/active/);
    await expect(modal).toHaveCSS('opacity', '0');

    // Verify workout resumed
    const pauseButton = page.locator('#pause-button');
    await expect(pauseButton).toHaveText('一時停止');
    await expect(pauseButton).toHaveAttribute('aria-pressed', 'false');
  });
});
