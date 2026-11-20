// Vice Ledger preview server: serves the app/ folder at http://localhost:8093.
// Standard library only, for local preview and screenshot capture. The guide
// itself needs no server — any static host with app/ at its root works, and
// it runs with the network off because every file it loads is its own.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(repoDir, 'app');
const port = Number(process.env.PORT ?? 8093);

const mimeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer((req, res) => {
  const requestPath = new URL(req.url ?? '/', 'http://localhost').pathname;
  let rel = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, '');
  if (rel === '/' || rel === '.') rel = 'index.html';
  const file = join(appRoot, rel);
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': mimeByExt[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Vice Ledger preview at http://localhost:${port}`));
