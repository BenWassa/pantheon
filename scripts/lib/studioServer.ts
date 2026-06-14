// The Studio dev backend: a Vite plugin that serves the review layer's private
// API. It runs ONLY in the dev server (configureServer), so the reader build
// stays backend-free and local-first. It exposes the live content (all statuses,
// not just published) and reads/writes the durable judgment ledger on disk.
//
//   GET    /studio/days          -> every day, every status, read fresh from disk
//   GET    /studio/judgments     -> the full judgment ledger
//   POST   /studio/judgments     -> validate + append one judgment
//   DELETE /studio/judgments/:id -> remove one judgment (undo)

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadDays } from './content.ts';
import { appendJudgment, readLedger, removeJudgment, validateJudgment } from './judgmentsFile.ts';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error('request body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export function studioServer(): Plugin {
  return {
    name: 'pantheon-studio-server',
    apply: 'serve', // dev only; never part of a production build
    configureServer(server) {
      server.middlewares.use('/studio/', async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0] ?? '';
        const method = req.method ?? 'GET';

        try {
          // The live corpus: all days, all statuses, straight from disk so the
          // Studio always reviews the latest content without a manifest rebuild.
          if (url === '/days' && method === 'GET') {
            return sendJson(
              res,
              200,
              loadDays().map((d) => d.day),
            );
          }

          if (url === '/judgments' && method === 'GET') {
            const { judgments } = readLedger();
            return sendJson(res, 200, judgments);
          }

          if (url === '/judgments' && method === 'POST') {
            const raw = await readBody(req);
            let parsed: unknown;
            try {
              parsed = JSON.parse(raw);
            } catch {
              return sendJson(res, 400, { error: 'body is not valid JSON' });
            }
            const result = validateJudgment(parsed);
            if (!result.ok) return sendJson(res, 422, { error: result.error });
            appendJudgment(result.judgment);
            return sendJson(res, 201, result.judgment);
          }

          if (url.startsWith('/judgments/') && method === 'DELETE') {
            const id = decodeURIComponent(url.slice('/judgments/'.length));
            const removed = removeJudgment(id);
            return sendJson(res, removed ? 200 : 404, { removed });
          }
        } catch (e) {
          return sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) });
        }

        next();
      });
    },
  };
}
