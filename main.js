// BLOODRUN.exe — arcade standalone Electron entry
// ─────────────────────────────────────────────────────────────────────────────
// CSP NOTE (bloodrun.exe integration):
//   Add "arcade/index.html" to isShellPage in bloodrun.exe/main.js so the
//   page gets CSP_SHELL (allows style-src-attr 'unsafe-inline' for Win95 chrome):
//
//     const isShellPage = rel === "vm/index.html"
//                      || rel === "recovery-node.html"
//                      || rel === "arcade/index.html"; // ← add this
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const { app, BrowserWindow, protocol, net } = require('electron');
const path   = require('path');
const fs     = require('fs');
const { pathToFileURL } = require('url');

// Register BEFORE app.whenReady()
protocol.registerSchemesAsPrivileged([{
  scheme:     'app',
  privileges: {
    standard:           true,
    secure:             true,
    supportFetchAPI:    true,
    corsEnabled:        true,
    allowServiceWorkers: false,
    stream:             true,
  },
}]);

if (process.env.BR_DISABLE_GPU === '1') {
  app.disableHardwareAcceleration();
}

const ROOT = __dirname; // project root — all assets live here

function mimeFor(p) {
  const ext = path.extname(p).toLowerCase();
  return ext === '.html' ? 'text/html; charset=utf-8'
    : ext === '.js'   ? 'text/javascript; charset=utf-8'
    : ext === '.css'  ? 'text/css; charset=utf-8'
    : ext === '.json' ? 'application/json; charset=utf-8'
    : ext === '.png'  ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : ext === '.svg'  ? 'image/svg+xml'
    : ext === '.mp3'  ? 'audio/mpeg'
    : ext === '.m4a'  ? 'audio/mp4'
    : ext === '.aac'  ? 'audio/aac'
    : ext === '.ttf'  ? 'font/ttf'
    : ext === '.woff2'? 'font/woff2'
    : 'application/octet-stream';
}

app.whenReady().then(() => {
  // Serve all project files through app:// so webSecurity can stay ON.
  // app://arcade/<path> → ROOT/<path>
  protocol.handle('app', async (request) => {
    try {
      const url     = new URL(request.url);
      let   relPath = decodeURIComponent(url.pathname);
      if (relPath.startsWith('/')) relPath = relPath.slice(1);
      if (!relPath)                relPath = 'BLOODRUN.exe.html';

      const abs  = path.resolve(ROOT, relPath);
      const root = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
      if (!(abs + path.sep).startsWith(root)) {
        return new Response('Forbidden', { status: 403 });
      }
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
        return new Response('Not found', { status: 404 });
      }

      const upstream = await net.fetch(pathToFileURL(abs).href);
      const headers  = new Headers(upstream.headers);
      if (!headers.get('Content-Type')) headers.set('Content-Type', mimeFor(abs));

      // Permissive CSP for standalone dev — inline styles are required for Win95 chrome.
      // bloodrun.exe uses header-level CSP via its own protocol handler; we mirror that
      // pattern here but with 'unsafe-inline' to allow the desktop/installer screens.
      headers.set('Content-Security-Policy', [
        "default-src 'self' app:",
        "style-src   'self' app: 'unsafe-inline' https://fonts.googleapis.com",
        "style-src-attr 'unsafe-inline'",
        "style-src-elem 'self' app: 'unsafe-inline' https://fonts.googleapis.com",
        "font-src    'self' app: data: https://fonts.gstatic.com",
        "img-src     'self' app: data: blob:",
        "media-src   'self' app: data: blob:",
        "script-src  'self' app:",
        "connect-src 'self' app:",
      ].join('; '));

      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (e) {
      return new Response('Internal error', { status: 500 });
    }
  });

  const win = new BrowserWindow({
    width:  1280,
    height: 720,
    backgroundColor: '#000000',
    show:   false,
    icon:   path.join(__dirname, 'build', 'icon.icns'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      // webSecurity is ON — assets served through app:// protocol, no file:// needed
    },
  });

  // macOS ignores BrowserWindow.icon when unpackaged — set the dock icon directly.
  if (process.platform === 'darwin' && app.dock) {
    try { app.dock.setIcon(path.join(__dirname, 'build', 'icon-256.png')); } catch {}
  }

  win.once('ready-to-show', () => win.show());
  // Load via app:// so all relative paths resolve through the handler above
  win.loadURL('app://arcade/BLOODRUN.exe.html');
});

app.on('window-all-closed', () => app.quit());
