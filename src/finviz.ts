import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';


// Special options when we are running inside docker container
const launchOptions = process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true' ? { executablePath: 'google-chrome-stable' } : {};

const plugins = (): void => {
  if (!puppeteer.pluginNames.includes('stealth')) {
    console.log('[finviz] Loading Puppeeter Plugin: stealth');
    puppeteer.use(StealthPlugin());
  }
  if (!puppeteer.pluginNames.includes('adblocker')) {
    console.log('[finviz] Loading Puppeeter Plugin: adblocker');
    puppeteer.use(AdblockerPlugin());
  }
}

/**
 * Get a FinViz chart
 */
export default async (map: string): Promise<Buffer> => {
  // Load Plugins
  plugins();

  console.log('Fetching Finviz Chart: %s', map);
  let browser: Browser;
  let page: Page;
  try {
    // Start Browser and Page
    browser = await puppeteer.launch({
      ...launchOptions,
      defaultViewport: null,
      args: ['--no-sandbox'],
    });
    page = await browser.newPage();

    // Load Page
    await page.setViewport({ width: 1200, height: 1200 });
    await page.goto(`https://finviz.com/map.ashx?t=${map}`);
    await page.waitForSelector('canvas.chart', { timeout: 20000 });

    // Get Screenshot
    const clip = await page.$('canvas.chart').then((element) => element.boundingBox());
    return await page.screenshot({
      clip,
      encoding: 'binary',
      type: 'png',
    });
  } finally {
    if (page && !page.isClosed()) {
      console.log('[finviz] Closing Page');
      page.close();
    }
    if (browser) {
      console.log('[finviz] Closing Browser');
      browser.close();
    }
  }
}
