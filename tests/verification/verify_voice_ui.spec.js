import { test, expect } from '@playwright/test';

test('verify voice command ui', async ({ page }) => {
  // Go to page
  await page.goto('/');

  // Scroll to control card to ensure it's rendered (though fullPage screenshot captures all)
  const controlCard = page.locator('.control-card');
  await controlCard.scrollIntoViewIfNeeded();

  // Find toggle and turn ON
  const toggle = page.locator('label:has(#voice-command-toggle)');
  await toggle.click();

  // Wait for UI update
  await page.waitForTimeout(1000);

  // Verify indicator exists
  const indicator = page.locator('#voice-status-indicator');
  await expect(indicator).toBeVisible();

  // Take screenshot
  // We want to see the header (indicator) and the settings card.
  // Full page might be too long, but let's try.
  await page.screenshot({ path: 'verification/voice_ui_verification.png', fullPage: true });
});
