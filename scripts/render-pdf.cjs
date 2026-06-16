const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const file = 'file://' + path.resolve(__dirname, 'deck.html');
  await page.goto(file, { waitUntil: 'networkidle0' });
  // give webfonts a beat to settle
  try { await page.evaluateHandle('document.fonts.ready'); } catch (e) {}

  await page.pdf({
    path: path.resolve(__dirname, 'Umbrelly-Presentation.pdf'),
    width: '1280px',
    height: '720px',
    printBackground: true,
    pageRanges: '1-11',
  });

  await browser.close();
  console.log('PDF written');
})();
