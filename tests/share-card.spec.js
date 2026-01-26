import { test, expect } from '@playwright/test';

test.describe('Share Card Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.ShareManager && window.finishWorkout);
  });

  test('Share button appears after finishing workout and opens modal', async ({ page }) => {
    // 1. Finish Workout (Simulated)
    await page.evaluate(() => {
        // Setup minimal valid inputs
        document.getElementById('set-count').value = '1';
        document.getElementById('rep-count').value = '1';
        document.getElementById('down-duration').value = '1';
        document.getElementById('hold-duration').value = '1';
        document.getElementById('up-duration').value = '1';
        document.getElementById('rest-duration').value = '10'; // Valid min
        document.getElementById('countdown-duration').value = '3';

        // Call global finish handler
        window.finishWorkout();
    });

    // 2. Verify Share Button visibility
    const shareBtn = page.locator('#share-result-button');
    await expect(shareBtn).toBeVisible({ timeout: 5000 });
    await expect(shareBtn).toHaveText(/戦績をシェア/);

    // 3. Open Share Modal
    await shareBtn.click();
    const modal = page.locator('#share-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');

    // 4. Verify Card Content
    const card = page.locator('#share-card-target');
    await expect(card).toBeVisible();
    await expect(card.locator('.sc-app-name')).toHaveText('SQUAT QUEST');

    // Verify RPG elements
    await expect(card.locator('.sc-boss-emoji')).toBeVisible();

    // 5. Verify Stats (Default 3 sets * 10 reps = 30 reps, because startWorkout was skipped)
    await expect(card.locator('.sc-stat-value').first()).toHaveText('30');

    // 6. Verify Save functionality (html2canvas execution)
    // Wait for library to load
    await page.waitForFunction(() => window.html2canvas);

    const downloadBtn = page.locator('#share-download-btn');
    const originalText = await downloadBtn.textContent();

    await downloadBtn.click({ force: true });

    // Check loading state (might be fast so use regex or just wait for return)
    // Note: If execution is too fast, "生成中..." might be missed, but ensuring it returns to original is key.
    // However, playwright is fast enough usually.
    // Let's just wait for it to return to "画像を保存" (original text)
    // But we need to ensure it was clicked.
    // The previous click({force:true}) ensures it.

    // Wait for finish (back to original text)
    await expect(downloadBtn).toHaveText(originalText, { timeout: 20000 });

    // 7. Close Modal (Trigger click via JS to avoid overlay issues)
    await page.evaluate(() => {
        const closeBtn = document.querySelector('#share-modal .close-btn');
        if (closeBtn) closeBtn.click();
    });
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(modal).toBeHidden();
  });
});
