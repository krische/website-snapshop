import express from 'express';
import cors from 'cors';
import * as captureWebsite from 'capture-website';
import morgan from 'morgan';
import { Page } from 'puppeteer';

require('dotenv').config();

// Special options when we are running inside docker container
const launchOptions = process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true' ? { executablePath: 'google-chrome-stable' } : {};
const apiKey = process.env.API_KEY;

const app = express();
app.use(cors());
app.use(morgan('combined'));
let port = process.env.PORT;
if (port === undefined || port.trim() === '') {
  port = 8080 as any;
}

app.listen(port, () => {
  console.info(`App Listening on port ${port}`);
});

app.get('/', (req, res): void => {
  res.send('wecome to zombocom!');
});

app.get('/spy', (req, res): void => {
  if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
    res.status(403);
    res.end('API_KEY required');
    return;
  }

  console.log('Fetching SPY visualization');
  captureWebsite.buffer('https://finviz.com/map.ashx', {
    width: 1200,
    height: 2000,
    timeout: 90000,
    element: 'canvas.chart',
    launchOptions: {
      ...launchOptions,
      args: ['--no-sandbox'],
    },
  }).then((buffer) => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': Buffer.byteLength(buffer),
    });
    res.end(buffer);
  });
});

app.get('/etf', (req, res): void => {
  if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
    res.status(403);
    res.end('API_KEY required');
    return;
  }

  console.log('Fetching ETF visualization');
  captureWebsite.buffer('https://finviz.com/map.ashx?t=etf', {
    width: 1200,
    height: 2000,
    timeout: 90000,
    element: 'canvas.chart',
    launchOptions: {
      ...launchOptions,
      args: ['--no-sandbox'],
    },
  }).then((buffer) => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': Buffer.byteLength(buffer),
    });
    res.end(buffer);
  });
});

const setValue = async (page: Page, selector: string, value: string): Promise<void> => {
  await page.evaluate((selectorName) => {
    document.querySelector(selectorName).value = '';
  }, selector);
  await page.type(selector, value);
};

app.get('/tweet', (req, res): void => {
  if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
    res.status(403);
    res.end('API_KEY required');
    return;
  }

  const tweet = req.query as any;
  console.log('Fetching Tweet screenshot');
  captureWebsite.buffer('https://lluiscamino.github.io/fake-tweet/', {
    height: 1200,
    element: '.tweet',
    styles: ['.App { background-color: #000 !important; }'], // remove weird white top and bottom border
    beforeScreenshot: async (page) => {
      await setValue(page, 'input#nickname', tweet.nickname);
      await setValue(page, 'input#name', tweet.name);
      await setValue(page, 'input#avatar', tweet.avatar);
      await page.select('select#display', 'lightsout');

      const date = new Date();
      await setValue(page, 'input#date',
        date.toLocaleString('en-US', { timeZone: 'America/Chicago' }));

      await setValue(page, 'textarea#text', tweet.text);

      if (tweet.retweets !== undefined) {
        await setValue(page, 'input#retweets', tweet.retweets.toString());
      }
      if (tweet.retweetsWithComments !== undefined) {
        await setValue(page, 'input#retweetsWithComments', tweet.retweetsWithComments.toString());
      }
      if (tweet.likes !== undefined) {
        await setValue(page, 'input#likes', tweet.likes.toString());
      }
      if (tweet.verified === 'false') {
        await page.$$eval('input#verified', (checks) => checks.forEach((c: any) => {
          if (c.checked) {
            c.click();
          }
        }));
      }
    },
    launchOptions: {
      ...launchOptions,
      args: ['--no-sandbox'],
    },
  }).then((buffer) => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': Buffer.byteLength(buffer),
    });
    res.end(buffer);
  });
});
