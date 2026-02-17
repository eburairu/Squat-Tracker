import { test, expect } from '@playwright/test';

test.describe('Title Synergy System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app initialization
    await page.waitForFunction(() => window.TitleManager && window.ClassManager);
  });

  test('should load synergy data', async ({ page }) => {
    const synergies = await page.evaluate(() => window.TitleManager.data.synergies);
    expect(synergies.length).toBeGreaterThan(0);
    expect(synergies[0]).toHaveProperty('id');
    expect(synergies[0]).toHaveProperty('condition');
    expect(synergies[0]).toHaveProperty('effect');
  });

  test('should activate synergy when matching title is equipped', async ({ page }) => {
    // Inject unlocked titles for testing
    await page.evaluate(() => {
      window.TitleManager.state.unlockedPrefixes.push('p_legendary');
      window.TitleManager.state.unlockedSuffixes.push('s_hero');
      window.TitleManager.equip('p_legendary', 's_hero');
    });

    // Check active synergy logic
    const activeSynergy = await page.evaluate(() => window.TitleManager.getActiveSynergy());
    expect(activeSynergy).not.toBeNull();
    expect(activeSynergy.id).toBe('syn_legendary_hero');
    expect(activeSynergy.name).toBe('伝説の英雄');

    // Check modifiers
    const mods = await page.evaluate(() => window.ClassManager.getModifiers());
    // Base attackMultiplier is 1.0. Synergy adds 0.2. Total should be around 1.2.
    // Note: Class level bonuses might apply, so we check if it's at least base + synergy.

    const synergyMods = await page.evaluate(() => window.TitleManager.getSynergyModifiers());
    expect(synergyMods.attackMultiplier).toBe(0.2);

    expect(mods.attackMultiplier).toBeGreaterThanOrEqual(1.2);
  });

  test('should display synergy info in modal', async ({ page }) => {
    // Inject titles
    await page.evaluate(() => {
      window.TitleManager.state.unlockedPrefixes.push('p_legendary');
      window.TitleManager.state.unlockedSuffixes.push('s_hero');
    });

    // Switch to Achievements tab to make the button visible
    await page.click('button[data-tab="achievements"]');

    // Open Modal
    await page.click('#open-title-settings');

    // Select Legendary Hero
    await page.selectOption('#prefix-select', 'p_legendary');
    await page.selectOption('#suffix-select', 's_hero');

    // Check UI
    const synergyContainer = page.locator('#synergy-preview-container');
    const synergyName = page.locator('#synergy-name');
    const synergyEffect = page.locator('#synergy-effect');

    await expect(synergyContainer).toBeVisible();
    await expect(synergyName).toHaveText('伝説の英雄');
    await expect(synergyEffect).toHaveText('攻撃力 +20%');

    // Select non-synergy combo (e.g. clear selection)
    await page.selectOption('#prefix-select', '');
    await expect(synergyContainer).not.toBeVisible();
  });
});
