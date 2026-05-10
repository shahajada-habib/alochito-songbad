import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const isProduction = process.env['NODE_ENV'] === 'production';
const apiOrigin = process.env['API_ORIGIN'] || (isProduction ? '' : 'http://localhost:8080');
const apiProxyLimit = process.env['API_PROXY_BODY_LIMIT'] || '10mb';

if (!apiOrigin) {
  throw new Error('API_ORIGIN must be configured when NODE_ENV=production');
}

app.disable('x-powered-by');
app.use('/api', express.raw({ type: '*/*', limit: apiProxyLimit }));

/**
 * Keep browser and SSR API calls stable when the public site is served by the
 * Angular Node server. Deployments can point this at the Spring Boot origin.
 */
app.use('/api', async (req, res, next) => {
  try {
    const target = new URL(req.originalUrl, apiOrigin);
    if (!['http:', 'https:'].includes(target.protocol)) {
      throw new Error('API_ORIGIN must use http or https');
    }
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (!value || key.toLowerCase() === 'host') {
        continue;
      }

      headers.set(key, Array.isArray(value) ? value.join(',') : value);
    }

    const response = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const body = Buffer.from(await response.arrayBuffer());
      res.send(body);
    } else {
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
