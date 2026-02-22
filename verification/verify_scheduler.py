from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:4173")

    # 1. Open Scheduler Modal
    page.click('#open-scheduler-button')
    page.wait_for_selector('#scheduler-modal.active')

    # Screenshot 1: Modal
    page.screenshot(path="verification/scheduler_modal.png")
    print("Screenshot taken: verification/scheduler_modal.png")

    # 2. Configure Schedule
    # Click Improve Plan
    # Since input is hidden, click the label or execute script
    page.evaluate("document.querySelector('input[name=\"scheduler-plan\"][value=\"improve\"]').click()")

    # Click All Days
    # Using evaluate for reliability as seen in tests
    page.evaluate("""
        document.querySelectorAll('input[name=\"scheduler-day\"]').forEach(el => {
            if (!el.checked) el.click();
        });
    """)

    # Save
    page.click('#save-schedule-button')
    page.wait_for_selector('#scheduler-modal', state='hidden')

    # 3. Verify Home Card
    page.wait_for_selector('#daily-schedule-card')

    # Screenshot 2: Home with Card
    page.screenshot(path="verification/scheduler_home.png")
    print("Screenshot taken: verification/scheduler_home.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
