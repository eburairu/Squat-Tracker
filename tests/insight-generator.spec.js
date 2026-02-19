import { test, expect } from '@playwright/test';

test.describe('InsightGenerator Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/index.html');
  });

  test('should generate welcome message for empty analysis', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { InsightGenerator } = await import('./js/modules/insight-generator.js');
      return InsightGenerator.generate({ totalSessions: 0 });
    });

    expect(result.type).toBe('welcome');
    expect(result.emoji).toBe('🔰');
  });

  test('should identify golden time day', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { InsightGenerator } = await import('./js/modules/insight-generator.js');
      const analysis = {
        totalSessions: 20,
        weekly: [200, 0, 0, 0, 0, 0, 0], // Only Sunday, total > 100
        hourly: { morning: 0, day: 0, night: 0, late: 0 },
        monthly: []
      };
      return InsightGenerator.generate(analysis);
    });

    expect(result.type).toBe('pattern');
    expect(result.message).toContain('日曜日');
  });

  test('should identify morning person', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { InsightGenerator } = await import('./js/modules/insight-generator.js');
      const analysis = {
        totalSessions: 20,
        weekly: [10, 10, 10, 10, 10, 10, 10], // Balanced
        hourly: { morning: 60, day: 10, night: 10, late: 0 }, // Mostly morning
        monthly: []
      };
      return InsightGenerator.generate(analysis);
    });

    expect(result.type).toBe('morning_person');
    expect(result.emoji).toBe('☀️');
  });

  test('should identify night owl', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { InsightGenerator } = await import('./js/modules/insight-generator.js');
      const analysis = {
        totalSessions: 20,
        weekly: [10, 10, 10, 10, 10, 10, 10],
        hourly: { morning: 0, day: 10, night: 60, late: 0 },
        monthly: []
      };
      return InsightGenerator.generate(analysis);
    });

    expect(result.type).toBe('night_owl');
    expect(result.emoji).toBe('🌙');
  });

});
