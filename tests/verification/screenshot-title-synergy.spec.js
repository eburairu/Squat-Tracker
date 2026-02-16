import { test, expect } from '@playwright/test';

test('capture title synergy ui', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.TitleManager);

  // Inject titles
  await page.evaluate(() => {
    window.TitleManager.state.unlockedPrefixes.push('p_legendary');
    window.TitleManager.state.unlockedSuffixes.push('s_hero');
  });

  // Switch to Achievements
  await page.click('button[data-tab="achievements"]');

  // Open Modal
  await page.click('#open-title-settings');

  // Select Synergy
  await page.selectOption('#prefix-select', 'p_legendary');
  await page.selectOption('#suffix-select', 's_hero');

  // Wait for animation
  await page.waitForTimeout(1000);

  // Screenshot modal content
  const modalContent = page.locator('#title-modal .modal-content');
  await modalContent.screenshot({ path: 'verification/title-synergy.png' });
});
