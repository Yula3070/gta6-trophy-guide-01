// A minimal static file server for the Vice Ledger app/ folder, for local
// reading only: `node serve.ts` (port from --port, else $PORT, else 8093).
// It answers GET requests with files from app/, refuses anything that would
// escape that folder, and sets the content types a browser expects.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function pickPort(): number {
  const flagAt = process.argv.indexOf('--port');
  const fromFlag = flagAt === -1 ? NaN : Number(process.argv[flagAt + 1]);
  const fromEnv = Number(process.env.PORT);
  for (const candidate of [fromFlag, fromEnv]) {
    if (Number.isInteger(candidate) && candidate > 0 && candidate < 65536) return candidate;
  }
  return 8093;
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function answerFile(response: import('node:http').ServerResponse, filePath: string): void {
  let size: number;
  try {
    const info = statSync(filePath);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
}

createServer((request, response) => {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const target = resolve(join(appRoot, normalize(pathname)));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }).end('forbidden');
    return;
  }
  answerFile(response, target);
}).listen(pickPort(), '127.0.0.1', () => {
  console.log(`Vice Ledger app/ is on http://localhost:${pickPort()}`);
});
