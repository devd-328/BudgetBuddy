import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        page = await context.new_page()
        print("Navigating...")
        await page.goto("http://localhost:5173")
        await page.wait_for_timeout(3000)
        
        # Log in
        print("Logging in...")
        await page.fill('input[type="email"]', 'devd6@gemini.com')
        await page.fill('input[type="password"]', 'Devdas123!')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(3000)
        
        print("Settings...")
        await page.goto("http://localhost:5173/settings")
        await page.wait_for_timeout(2000)
        
        # Click replay tour
        print("Replay Tour...")
        await page.click('button:has-text("Replay App Tour")')
        await page.wait_for_timeout(2000)
        
        # Click "Yes, show me around!"
        await page.click('button:has-text("Yes, show me around!")')
        await page.wait_for_timeout(1000)
        
        print("Taking screenshot of dashboard step...")
        await page.screenshot(path="artifacts/dashboard-step.png")
        
        # Print bounding rect of balance card
        rect = await page.evaluate('''() => {
            const el = document.getElementById('dashboard-balance');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, height: r.height };
        }''')
        print("Balance Card Bounding Rect:", rect)
        
        # Print bounding rect of tooltip
        tooltip = await page.evaluate('''() => {
            const el = document.querySelector('.tour-tooltip-arrow-below') || document.querySelector('.tour-tooltip-arrow-above');
            if(!el) return null;
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, height: r.height };
        }''')
        print("Tooltip Bounding Rect:", tooltip)
        
        await browser.close()

asyncio.run(main())
