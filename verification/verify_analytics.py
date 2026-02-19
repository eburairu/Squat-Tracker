from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app
        page.goto("http://127.0.0.1:4173/index.html")

        # Inject dummy history
        page.evaluate("""
            const history = [];
            const today = new Date();
            for (let i = 0; i < 7; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                history.push({
                    id: `test-${i}`,
                    date: d.toISOString(),
                    totalSets: 3,
                    repsPerSet: 10,
                    totalReps: 30,
                    durations: { down: 2, hold: 1, up: 1, rest: 30, countdown: 5 },
                    timeline: []
                });
            }
            localStorage.setItem('squat-tracker-history-v1', JSON.stringify(history));
            location.reload();
        """)

        page.wait_for_load_state('load')

        # Click Analytics Button
        page.click('#open-analytics')

        # Wait for modal animation
        page.wait_for_timeout(1000)

        # Take screenshot
        os.makedirs("verification", exist_ok=True)
        page.screenshot(path="verification/analytics_modal.png")

        browser.close()

if __name__ == "__main__":
    run()
