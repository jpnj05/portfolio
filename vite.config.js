import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vercel runs `api/*.js` as Node functions. `vite dev` has no such runtime,
 * so this plugin mounts the very same handler as dev middleware. That keeps
 * one implementation for local dev and production.
 */
function apiRoutes() {
  return {
    name: 'local-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0];
        if (!path.startsWith('/api/')) return next();

        try {
          const mod = await server.ssrLoadModule(`${path}.js`);
          const handler = mod.default || mod.handler;
          if (typeof handler !== 'function') return next();

          // Give the handler the small surface it uses from Vercel's req/res.
          req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (body) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(body));
          };
          res.send = (body) => res.end(body);

          await handler(req, res);
        } catch (error) {
          server.config.logger.error(`[api] ${path} failed: ${error.message}`);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Local API failed', detail: error.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiRoutes()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome100',
  },
});
