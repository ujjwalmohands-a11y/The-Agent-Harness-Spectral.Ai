const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  
  // Wait for the button to be rendered
  await page.waitForSelector('.btn-primary');

  // Evaluate and see what is actually at the exact center of the button
  const elementDetails = await page.evaluate(() => {
    const btn = document.querySelector('.btn-primary');
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const elAtPoint = document.elementFromPoint(x, y);
    return {
      btnHTML: btn.outerHTML,
      elAtPointHTML: elAtPoint ? elAtPoint.outerHTML : 'null',
      elAtPointClasses: elAtPoint ? elAtPoint.className : 'null',
      rect: rect
    };
  });

  console.log(JSON.stringify(elementDetails, null, 2));

  await browser.close();
})();
