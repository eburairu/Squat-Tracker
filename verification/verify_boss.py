from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Wait for Boss Card
        page.wait_for_selector("#boss-card")

        # Scroll to view
        page.locator("#boss-card").scroll_into_view_if_needed()

        # Take initial screenshot
        page.screenshot(path="verification/boss_initial.png")
        print("Initial screenshot taken.")

        # Apply damage
        page.evaluate("window.BossBattle.damage(5)")

        # Wait for animation (css transition is 0.3s)
        page.wait_for_timeout(500)

        # Take damaged screenshot
        page.screenshot(path="verification/boss_damaged.png")
        print("Damaged screenshot taken.")

        browser.close()

if __name__ == "__main__":
    run()
