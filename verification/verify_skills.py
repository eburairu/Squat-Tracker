from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/index.html")

        # Wait for initialization
        page.wait_for_function("window.SkillManager && window.ClassManager")

        # Change to Warrior
        page.evaluate("window.ClassManager.changeClass('warrior')")

        # Reduce countdown
        page.fill("#countdown-duration", "3")
        page.dispatch_event("#countdown-duration", "change")

        # Start Workout
        page.click("#start-button")

        # Wait for skill button
        button = page.locator("#skill-trigger-button")
        expect(button).to_be_visible()
        expect(button).not_to_be_disabled()

        # Screenshot 1: Skill Button Visible
        page.screenshot(path="verification/skill_visible.png")
        print("Screenshot saved: verification/skill_visible.png")

        # Activate Skill
        button.click()

        # Screenshot 2: Skill Activated
        expect(button).to_be_disabled()
        # Wait for class 'active' (Playwright Python API uses 'to_have_class' but regex matching might differ)
        # Just wait a bit for animation frame
        page.wait_for_timeout(500)
        page.screenshot(path="verification/skill_active.png")
        print("Screenshot saved: verification/skill_active.png")

        browser.close()

if __name__ == "__main__":
    run()
