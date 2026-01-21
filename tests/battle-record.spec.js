import { test, expect } from '@playwright/test';

test.describe('Battle Record Card Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have the share card modal structure in DOM', async ({ page }) => {
    // Expect the modal to exist in the DOM (hidden initially)
    const modal = page.locator('#share-card-modal');
    await expect(modal).toHaveCount(1);

    // Check internal elements
    await expect(modal.locator('#share-card-image')).toHaveCount(1);
    await expect(modal.locator('#share-card-download')).toHaveCount(1);
    await expect(modal.locator('[data-close-share]')).toHaveCount(2);
  });

  test('should show generate button in achievements tab', async ({ page }) => {
    const btn = page.locator('#create-share-card-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText(/戦績カードを作成/);
  });

  test('should open modal when button is clicked', async ({ page }) => {
    // Navigate to achievements tab to make sure button is interactable if needed
    // (CSS handles tab visibility, but button is injected. Playwright might need visibility)
    await page.click('[data-tab="achievements"]');

    await page.click('#create-share-card-btn');
    const modal = page.locator('#share-card-modal');
    await expect(modal).toHaveClass(/active/);
    await expect(modal).toBeVisible();
  });
});
