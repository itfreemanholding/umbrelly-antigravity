import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5173');
    const key = await page.evaluate(() => localStorage.getItem('revops_gemini_key'));
    console.log("5173 key:", key);
    await page.goto('http://localhost:5174');
    const key2 = await page.evaluate(() => localStorage.getItem('revops_gemini_key'));
    console.log("5174 key:", key2);
    await browser.close();
})();
