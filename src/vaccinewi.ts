import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';


// Special options when we are running inside docker container
const launchOptions = process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true' ? { executablePath: 'google-chrome-stable' } : {};

const plugins = (): void => {
  if (!puppeteer.pluginNames.includes('stealth')) {
    console.log('[vaccinewi] Loading Puppeeter Plugin: stealth');
    puppeteer.use(StealthPlugin());
  }
  if (!puppeteer.pluginNames.includes('adblocker')) {
    console.log('[vaccinewi] Loading Puppeeter Plugin: adblocker');
    puppeteer.use(AdblockerPlugin());
  }
}

/**
 * Get a Wisconsin Vaccine Dashboard
 */
export default async (dose: 'first' | 'complete'): Promise<Buffer> => {
  // Load Plugins
  plugins();

  console.log('Fetching Wisconsin Vaccine Chart');
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
    const url: string = process.env.VACCINEWI_URL ? process.env.VACCINEWI_URL : 'https://bi.wisconsin.gov/t/DHS/views/VaccinesAdministeredtoWIResidents_16212677845310/VaccinatedWisconsin-County';
    await page.setViewport({ width: 1200, height: 1200 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="[Parameters].[Parameter 3]"]', { timeout: 20000 });

    if (dose === 'complete') {
      // Click and wait
      console.log('[vaccinewi] Clicking');
      const radios = await page.$$('input[name="[Parameters].[Parameter 3]"]');
      await radios[1].click();
      await page.waitForTimeout(5000);
    }

    // Get Screenshot
    const clip = await page.$('#tab-dashboard-region').then((element) => element.boundingBox());
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
