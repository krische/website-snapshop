import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import finviz from './finviz';
import tweet from './tweet';
import vaccinewi from './vaccinewi';

require('dotenv').config();

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

app.get('/', async (req, res): Promise<void> => {
  res.send('wecome to zombocom!');
  return Promise.resolve();
});

/**
 * FinViz Charts
 */
[
  { path: '/spy', map: 'sec' },
  { path: '/etf', map: 'etf' },
  { path: '/world', map: 'geo' },
].forEach((chart) => {
  app.get(chart.path, async (req, res): Promise<void> => {
    if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
      res.status(403);
      res.end('API_KEY required');
      return Promise.resolve();
    }
  
    try {
      const buffer = await finviz(chart.map);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': Buffer.byteLength(buffer),
      });
      res.end(buffer);
    } catch (error) {
      res.writeHead(500);
      res.end(error.message);
    } finally {

    }
  });
});

app.get('/tweet', async (req, res): Promise<void> => {
  if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
    res.status(403);
    res.end('API_KEY required');
    return Promise.resolve();
  }

  try {
    const buffer = await tweet(req.query as any);
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': Buffer.byteLength(buffer),
    });
    res.end(buffer);
  } catch (error) {
    res.writeHead(500);
    res.end(error.message);
  } finally {

  }
});

app.get('/vaccine-wi', async (req, res): Promise<void> => {
  if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
    res.status(403);
    res.end('API_KEY required');
    return Promise.resolve();
  }

  try {
    const buffer = await vaccinewi('first');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': Buffer.byteLength(buffer),
    });
    res.end(buffer);
  } catch (error) {
    res.writeHead(500);
    res.end(error.message);
  } finally {

  }
});

app.get('/vaccine-wi-complete', async (req, res): Promise<void> => {
  if (apiKey !== undefined && res.getHeader('API_KEY') !== apiKey) {
    res.status(403);
    res.end('API_KEY required');
    return Promise.resolve();
  }

  try {
    const buffer = await vaccinewi('complete');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': Buffer.byteLength(buffer),
    });
    res.end(buffer);
  } catch (error) {
    res.writeHead(500);
    res.end(error.message);
  } finally {

  }
});
