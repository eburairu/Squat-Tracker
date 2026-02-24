from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://127.0.0.1:4173")

        # Clear storage
        page.evaluate("localStorage.clear()")
        page.reload()

        # Click Weekly Tab (now Bingo)
        page.click("#mission-tab-weekly")

        # Wait for bingo grid
        page.wait_for_selector(".bingo-grid")

        # Screenshot
        output_dir = "verification"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        page.screenshot(path=f"{output_dir}/verify_bingo.png")
        browser.close()

if __name__ == "__main__":
    run()
