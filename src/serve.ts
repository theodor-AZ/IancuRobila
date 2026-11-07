/**
 * Tiny static server for the local test pages (and later Colleague 4's demo campaigns).
 *   npm run serve            -> serves ./test-pages on http://localhost:4173
 *   npm run serve -- <dir> [port]
 * Unknown paths return a real 404, so broken CTAs can be detected.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf',
};

export function startServer(dir: string, port: number): Promise<Server> {
  const root = path.resolve(dir);
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let file = path.join(root, urlPath);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      let s = await stat(file);
      if (s.isDirectory()) {
        if (!urlPath.endsWith('/')) { res.writeHead(301, { Location: urlPath + '/' }).end(); return; }
        file = path.join(file, 'index.html');
        s = await stat(file);
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Content-Length': s.size });
      if (req.method === 'HEAD') { res.end(); return; }
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html' }).end('<h1>404 Not Found</h1>');
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const dir = process.argv[2] ?? 'test-pages';
  const port = Number(process.argv[3] ?? 4173);
  startServer(dir, port).then(() => console.log(`Serving ${path.resolve(dir)} on http://localhost:${port}`));
}
