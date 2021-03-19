import express from 'express';
import cors from 'cors';
import * as captureWebsite from 'capture-website';
import morgan from 'morgan';

require('dotenv').config();

// Special options when we are running inside docker container
const launchOptions = process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true' ? { executablePath: 'google-chrome-stable' } : {};
const apiKey = process.env.API_KEY;

const app = express();
app.set('trust proxy', true);
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
    timeout: 30,
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
    timeout: 30,
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

app.get('/world', (req, res): void => {
  if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
    res.status(403);
    res.end('API_KEY required');
    return;
  }

  console.log('Fetching ETF visualization');
  captureWebsite.buffer('https://finviz.com/map.ashx?t=geo', {
    width: 1200,
    height: 2000,
    timeout: 30,
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

const setValue = async (page: any, selector: string, value: string): Promise<void> => {
  await page.evaluate((selectorName: any) => {
    document.querySelector(selectorName).value = '';
  }, selector);

  // The page only seems to update on key presses, and backspace alone doesn't work
  await page.focus(selector);
  await page.keyboard.press('a');
  await page.keyboard.press('Backspace');

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
    beforeScreenshot: async (page) => {
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

app.get('/vaccine-wi', (req, res): void => {
  if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
    res.status(403);
    res.end('API_KEY required');
    return;
  }

  console.log('Fetching Wisconsin Vaccine visualization');
  captureWebsite.buffer('https://bi.wisconsin.gov/t/DHS/views/VaccinesAdministeredtoWIResidents/VaccinatedWisconsin-County', {
    width: 1200,
    height: 2000,
    timeout: 30,
    element: '#tab-dashboard-region',
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
