// Minimal static server for Playwright — serves the project root on port 4848.
// Required because browsers block audio/font loading on file:// URLs.
"use strict";

const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 4848;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.mp3':  'audio/mpeg',
  '.m4a':  'audio/mp4',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.map':  'application/json',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/BLOODRUN.exe.html';

  const filePath = path.resolve(ROOT, '.' + urlPath);
  // Security: stay within project root
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end(); return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    // Permissive CSP for test environment (mirrors CSP_SHELL from bloodrun.exe)
    'Content-Security-Policy': [
      "default-src 'self'",
      "style-src   'self' 'unsafe-inline'",
      "style-src-attr 'unsafe-inline'",
      "script-src  'self' 'unsafe-eval'",
      "font-src    'self' data:",
      "img-src     'self' data: blob:",
      "media-src   'self' data: blob:",
      "connect-src 'self'",
    ].join('; '),
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`[test-server] http://localhost:${PORT}`);
});
