
import http from 'http';
import { pathToFileURL } from 'url';
import { handleRequest } from './api/v1/index';
import type { Request } from './api/v1/middleware';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return null;
  }

  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: unknown) => {
      if (chunk instanceof Uint8Array) {
        chunks.push(Buffer.from(chunk));
      } else if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      }
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', (err) => reject(err));
  });

  if (!raw) return null;
  return JSON.parse(raw) as unknown;
}

export function createApiServer(): http.Server {
  return http.createServer(async (req, res) => {
    console.log(`[Server] ${req.method} ${req.url}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Parse body
    let body: unknown = null;
    try {
      body = await readBody(req);
    } catch (e) {
      console.error('Error parsing body:', e);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    // Construct internal Request object
    const urlObj = new URL(req.url || '/', `http://${req.headers.host}`);
    const query: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const apiReq: Request = {
      headers: req.headers as Record<string, string>,
      method: req.method || 'GET',
      url: urlObj.pathname,
      query,
      body,
    };

    try {
      const apiRes = await handleRequest(apiReq);

      res.writeHead(apiRes.status, {
        'Content-Type': 'application/json',
        ...apiRes.headers,
      });
      res.end(JSON.stringify(apiRes.body));
    } catch (err) {
      console.error('Server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });
}

export async function startApiServer(port = PORT): Promise<http.Server> {
  const server = createApiServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', (err) => reject(err));
    server.listen(port, () => resolve());
  });
  return server;
}

export async function stopApiServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isMain) {
  void startApiServer().then(() => {
    console.log(`API Server running on http://localhost:${PORT}`);
  });
}
