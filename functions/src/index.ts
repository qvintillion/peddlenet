import { onRequest } from 'firebase-functions/v2/https';
import next from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const app = next({
  dev: isDev,
  conf: {
    distDir: './.next',
  },
});

const handle = app.getRequestHandler();

export const nextjsFunc = onRequest(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    console.log('Next.js SSR request:', req.url);
    
    // Prepare Next.js
    await app.prepare();
    
    // Handle the request
    await handle(req, res);
  }
);
