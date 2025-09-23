from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000/lingua-flow/")

        # Wait for the loading text to disappear
        page.wait_for_selector('text=Laddar ord...', state='hidden', timeout=20000)

        # Now, wait for the start session button
        page.wait_for_selector('text=Starta Lektion', timeout=10000)

        # Click the start session button
        page.click('text=Starta Lektion')

        # Wait for the flashcard to appear
        page.wait_for_selector('.perspective-1000', timeout=5000)

        # Take a screenshot of the front of the card
        page.screenshot(path="jules-scratch/verification/01_front_of_card.png")

        # Click the card to flip it
        page.click('.perspective-1000')

        # Wait for the flip animation to complete
        page.wait_for_timeout(1000)

        # Take a screenshot of the back of the card
        page.screenshot(path="jules-scratch/verification/02_back_of_card.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
