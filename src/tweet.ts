import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';


// Special options when we are running inside docker container
const launchOptions = process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true' ? { executablePath: 'google-chrome-stable' } : {};

const plugins = (): void => {
  if (!puppeteer.pluginNames.includes('stealth')) {
    console.log('[tweet] Loading Puppeeter Plugin: stealth');
    puppeteer.use(StealthPlugin());
  }
  if (!puppeteer.pluginNames.includes('adblocker')) {
    console.log('[tweet] Loading Puppeeter Plugin: adblocker');
    puppeteer.use(AdblockerPlugin());
  }
}

const setValue = async (page: Page, selector: string, value: string): Promise<void> => {
  await page.evaluate((selectorName: any) => {
    document.querySelector(selectorName).value = '';
  }, selector);

  // The page only seems to update on key presses, and backspace alone doesn't work
  await page.focus(selector);
  await page.keyboard.press('a');
  await page.keyboard.press('Backspace');

  await page.type(selector, value);
};

/**
 * Get a fake tweet
 */
export default async (tweet: any): Promise<Buffer> => {
  // Load Plugins
  plugins();

  console.log('Creating Fake Tweet');
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
    await page.goto('https://lluiscamino.github.io/fake-tweet/');
    await page.waitForSelector('.tweet', { timeout: 10000 });

    // Enter Values
    await setValue(page, 'input#nickname', tweet.nickname);
    await setValue(page, 'input#name', tweet.name);
    await setValue(page, 'input#avatar', tweet.avatar);
    if (tweet.verified === 'false') {
      await page.$$eval('input#verified', (checks) => checks.forEach((c: any) => {
        if (c.checked) {
          c.click();
        }
      }));
    }
    await page.select('select#display', 'dim');
    await setValue(page, 'textarea#text', tweet.text);
    await setValue(page, 'textarea#image', '');

    const date = new Date();
    await setValue(
      page,
      'input#date',
      date.toLocaleString('en-US', { timeZone: 'America/Chicago' }),
    );

    if (tweet.retweets !== undefined) {
      await setValue(page, 'input#retweets', tweet.retweets.toString());
    }
    if (tweet.retweetsWithComments !== undefined) {
      await setValue(page, 'input#retweetsWithComments', tweet.retweetsWithComments.toString());
    }
    if (tweet.likes !== undefined) {
      await setValue(page, 'input#likes', tweet.likes.toString());
    }

    // Get Screenshot
    const clip = await page.$('.tweet').then((element) => element.boundingBox());
    return await page.screenshot({
      clip,
      encoding: 'binary',
      type: 'png',
    });
  } finally {
    if (page && !page.isClosed()) {
      console.log('[tweet] Closing Page');
      page.close();
    }
    if (browser) {
      console.log('[tweet] Closing Browser');
      browser.close();
    }
  }
}
