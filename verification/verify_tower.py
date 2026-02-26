from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 1600}) # Taller viewport

    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page Error: {err}"))
    page.on("requestfailed", lambda req: print(f"Request failed: {req.url} {req.failure}"))

    # 1. Access App
    page.goto("http://localhost:4173/")
    page.wait_for_selector("#tower-entry-card")
    page.locator("#tower-entry-card").scroll_into_view_if_needed()

    # Screenshot Entry
    page.screenshot(path="verification/tower_entry.png")
    print("Screenshot saved: tower_entry.png")

    # 2. Start Tower
    page.click("#tower-start-button")
    page.wait_for_selector("#tower-battle-card")

    # Screenshot Battle
    page.screenshot(path="verification/tower_battle.png")
    print("Screenshot saved: tower_battle.png")

    # 3. Simulate Damage (using window.performAttack helper we exposed)
    page.evaluate("window.performAttack()")
    page.wait_for_timeout(500) # Wait for animation

    # Screenshot Battle Damaged
    page.screenshot(path="verification/tower_battle_damaged.png")
    print("Screenshot saved: tower_battle_damaged.png")

    # 4. End Tower (Retreat)
    page.on("dialog", lambda dialog: dialog.accept())
    page.click("#tower-retreat-button")

    # Wait for toast
    page.wait_for_selector(".achievement-toast")

    # Screenshot Result
    page.screenshot(path="verification/tower_result.png")
    print("Screenshot saved: tower_result.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
