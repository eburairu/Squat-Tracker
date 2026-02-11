import { test, expect } from '@playwright/test';

test('verify encounter ui', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.EncounterManager);

  // Start workout to enable pause/resume
  await page.click('#start-button');
  await page.waitForTimeout(1000);

  const encounter = {
    id: 'screenshot_encounter',
    title: 'Screenshot Event',
    description: 'This is a visual verification of the encounter modal.',
    emoji: '📸',
    choices: [
      {
        id: 'choice1',
        text: 'Take Screenshot',
        result: { type: 'none', message: 'Cheese!' }
      },
      {
        id: 'choice2',
        text: 'Ignore',
        result: { type: 'none' }
      }
    ]
  };

  // Trigger encounter
  await page.evaluate((e) => window.EncounterManager.triggerEncounter(e), encounter);

  // Wait for modal animation
  await page.waitForTimeout(500);

  // Screenshot Modal
  await page.screenshot({ path: 'verification/encounter_modal.png', fullPage: false });

  // Click choice
  await page.click('.encounter-choice-btn >> nth=0');

  // Wait for modal close and toast
  await page.waitForTimeout(500);

  // Screenshot Toast
  await page.screenshot({ path: 'verification/encounter_toast.png', fullPage: false });
});
