import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')
        await page.goto(f'file://{file_path}')

        # 1. Verify Login Screen
        await expect(page.locator("#login-screen")).to_be_visible()
        await expect(page.locator("#app")).to_be_hidden()
        print("Login screen verified.")

        # 2. Simulate successful login to show the main app
        await page.evaluate("""() => {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            const mockUser = { uid: 'test-uid-123', displayName: 'Test User' };
            app.init(mockUser, window.firebase_db);
        }""")
        await expect(page.locator("#app")).to_be_visible()
        print("Simulated login and initialized app.")

        # 3. Verify "Begin Quest" opens a new tab (dungeon.html)
        await page.get_by_role("button", name="Begin Quest").click()
        await expect(page.locator("#modal-title")).to_have_text("Begin Quest?")

        async with context.expect_page() as new_page_info:
            await page.get_by_role("button", name="Yes").click()

        dungeon_page = await new_page_info.value
        await dungeon_page.wait_for_load_state()

        print(f"New tab opened with URL: {dungeon_page.url}")
        assert "dungeon.html" in dungeon_page.url

        print("Dungeon tab opened successfully.")

        # 4. Interact with the Dungeon Page
        await expect(dungeon_page.get_by_role("heading", name="Task 1 / 5")).to_be_visible()
        await expect(dungeon_page.locator("#next-task-btn")).to_be_disabled()

        # Check all the checkboxes for the first task
        set_checkboxes = await dungeon_page.locator('.set-checkbox').all()
        for checkbox in set_checkboxes:
            await checkbox.check()

        print("All sets for Task 1 checked.")

        # 5. Verify "Next Task" is enabled and take screenshot
        await expect(dungeon_page.locator("#next-task-btn")).to_be_enabled()
        print("Next Task button is enabled.")

        await dungeon_page.screenshot(path="jules-scratch/verification/dungeon_verification.png")
        print("Screenshot of dungeon page taken.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
