import { test, expect } from '@playwright/test';

test.describe('Analytics Logic Verification', () => {

  test('should correctly analyze weekly activity', async ({ page }) => {
    // Navigate to the app to ensure scripts can load
    await page.goto('http://127.0.0.1:4173/index.html');

    const result = await page.evaluate(async () => {
      const { AnalyticsManager } = await import('./js/modules/analytics-manager.js');

      const mockHistory = [
        { date: new Date(2023, 9, 1).toISOString(), totalReps: 10 }, // Sun (Oct 1)
        { date: new Date(2023, 9, 2).toISOString(), totalReps: 20 }, // Mon
        { date: new Date(2023, 9, 3).toISOString(), totalReps: 30 }, // Tue
        { date: new Date(2023, 9, 4).toISOString(), totalReps: 40 }, // Wed
        { date: new Date(2023, 9, 5).toISOString(), totalReps: 50 }, // Thu
        { date: new Date(2023, 9, 6).toISOString(), totalReps: 60 }, // Fri
        { date: new Date(2023, 9, 7).toISOString(), totalReps: 70 }, // Sat
      ];

      return AnalyticsManager.analyzeWeekly(mockHistory);
    });

    expect(result).toEqual([10, 20, 30, 40, 50, 60, 70]);
  });

  test('should correctly analyze hourly performance', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/index.html');

    const result = await page.evaluate(async () => {
      const { AnalyticsManager } = await import('./js/modules/analytics-manager.js');

      const mockHistory = [
        { date: new Date(2023, 9, 1, 6, 0).toISOString(), totalReps: 10 }, // Morning (06:00)
        { date: new Date(2023, 9, 1, 12, 0).toISOString(), totalReps: 20 }, // Day (12:00)
        { date: new Date(2023, 9, 1, 18, 0).toISOString(), totalReps: 30 }, // Night (18:00)
        { date: new Date(2023, 9, 1, 23, 30).toISOString(), totalReps: 40 }, // Late (23:30)
        { date: new Date(2023, 9, 2, 3, 0).toISOString(), totalReps: 50 }, // Late (03:00)
      ];

      return AnalyticsManager.analyzeHourly(mockHistory);
    });

    expect(result).toEqual({
      morning: 10,
      day: 20,
      night: 30,
      late: 90
    });
  });

  test('should handle empty history gracefully', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/index.html');

    const result = await page.evaluate(async () => {
      const { AnalyticsManager } = await import('./js/modules/analytics-manager.js');
      return AnalyticsManager.analyze([]);
    });

    expect(result.weekly).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(result.hourly).toEqual({ morning: 0, day: 0, night: 0, late: 0 });
    // Monthly can be empty array
    expect(result.monthly).toHaveLength(6);
    expect(result.monthly[0].value).toBe(0);
  });

});
