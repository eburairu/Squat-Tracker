import { test, expect } from '@playwright/test';

test.describe('ChartRenderer Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:4173/index.html');
  });

  test('should render bar chart correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { ChartRenderer } = await import('./js/modules/chart-renderer.js');

      const container = document.createElement('div');
      container.id = 'bar-chart-container';
      document.body.appendChild(container);

      const data = [
        { label: 'Sun', value: 10 },
        { label: 'Mon', value: 20 },
        { label: 'Tue', value: 30 }
      ];

      ChartRenderer.renderBarChart(container, data, { color: 'red' });

      const svg = container.querySelector('svg');
      const rects = container.querySelectorAll('rect');
      const labels = container.querySelectorAll('.chart-x-label');

      return {
        hasSvg: !!svg,
        rectCount: rects.length,
        labelCount: labels.length,
        firstLabelText: labels[0].textContent
      };
    });

    expect(result.hasSvg).toBe(true);
    expect(result.rectCount).toBe(3);
    expect(result.labelCount).toBe(3);
    expect(result.firstLabelText).toBe('Sun');
  });

  test('should render line chart correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { ChartRenderer } = await import('./js/modules/chart-renderer.js');

      const container = document.createElement('div');
      container.id = 'line-chart-container';
      document.body.appendChild(container);

      const data = [
        { label: 'Jan', value: 100 },
        { label: 'Feb', value: 200 },
        { label: 'Mar', value: 150 }
      ];

      ChartRenderer.renderLineChart(container, data, { color: 'blue' });

      const svg = container.querySelector('svg');
      const path = container.querySelector('path');
      const circles = container.querySelectorAll('circle');

      return {
        hasSvg: !!svg,
        hasPath: !!path,
        circleCount: circles.length
      };
    });

    expect(result.hasSvg).toBe(true);
    expect(result.hasPath).toBe(true);
    expect(result.circleCount).toBe(3);
  });

});
