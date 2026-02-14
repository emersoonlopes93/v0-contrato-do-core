
import http from 'http';
import { pathToFileURL } from 'url';
import { handleRequest } from './api/v1/index';
import type { Request } from './api/v1/middleware';
import { initRealtimeServer } from '@/src/realtime/socketio.server';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

function checkSecurityHardening() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      console.error('FATAL ERROR: Security Hardening Failed');
      console.error('JWT_SECRET is missing or too short (must be >= 32 characters).');
      console.error('The server cannot start in an insecure state.');
      process.exit(1);
    }
    console.warn('JWT_SECRET ausente ou muito curto. Gerando chaves inseguras em modo desenvolvimento.');
  }
}

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
  const server = http.createServer(async (req, res) => {
    console.log(`[Server] ${req.method} ${req.url}`);

    // CORS headers (DEV)
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Tenant-ID, X-Tenant-Slug, X-Tenant-Subdomain, X-Auth-Context'
    );

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Parse body
    let body: unknown = null;
    try {
      body = await readBody(req);
      if (req.method === 'POST') {
        // console.log('[Server] Parsed body:', JSON.stringify(body, null, 2));
        // console.log('[Server] Headers:', JSON.stringify(req.headers, null, 2));
      }
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

    const normalizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        normalizedHeaders[key] = value;
      } else if (Array.isArray(value)) {
        const first = value[0];
        if (typeof first === 'string') {
          normalizedHeaders[key] = first;
        }
      }
    }

    const apiReq: Request = {
      headers: normalizedHeaders,
      method: req.method || 'GET',
      url: urlObj.pathname,
      query,
      body,
    };

    try {
      const apiRes = await handleRequest(apiReq);

      const responseHeaders: Record<string, string | string[]> = {
        'Content-Type': 'application/json',
        ...apiRes.headers,
      };
      res.writeHead(apiRes.status, responseHeaders);
      res.end(JSON.stringify(apiRes.body));
    } catch (err) {
      console.error('Server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  });

  initRealtimeServer(server);
  return server;
}

export async function startApiServer(port = PORT): Promise<http.Server> {
  // Hardening Check
  checkSecurityHardening();

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
