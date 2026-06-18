// BLOODRUN ARCADE — deploy.js
// Packages the artifact for placement inside bloodrun.exe's public tree.
//
// Output: out/
// Intended placement: public/holmn/mount/bloodrun-arcade/
//
// Usage:
//   node deploy.js
//   node deploy.js --dest /path/to/bloodrun.exe/public/holmn/mount/bloodrun-arcade
//
// The output directory is self-contained and relocatable:
//   index.html       — page entry (load via app://app/holmn/mount/bloodrun-arcade/index.html)
//   arcade.page.css  — all styles; font urls are relative to this file
//   arcade.bundle.js — compiled React app
//   fonts/           — IBM Plex Mono + Serif
//   audio/           — game + menu + gameover tracks
//   assets/          — sprites/, blood-sigil.png, tarot-attendant.png
//
// bloodrun.exe integration checklist:
//   1. Add to isShellPage in main.js (see index.html header comment)
//   2. Run: npm run audit  (arcade JS is not under public/assets/js, won't be scanned)
//   3. No changes needed to preload.js, vm, or any progression route
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const args = process.argv.slice(2);
const destArg = args.find(a => a.startsWith('--dest='))?.slice(7)
             || args[args.indexOf('--dest') + 1];
const OUT = destArg
  ? path.resolve(destArg)
  : path.join(ROOT, 'out');

// ── Utilities ─────────────────────────────────────────────────────────────
function cp(src, dest) {
  const abs = path.join(ROOT, src);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.statSync(abs).isDirectory()) {
    fs.cpSync(abs, dest, { recursive: true });
  } else {
    fs.copyFileSync(abs, dest);
  }
}

function out(rel) { return path.join(OUT, rel); }

// ── Main ──────────────────────────────────────────────────────────────────
console.log('\n▲ BLOODRUN ARCADE — packaging artifact CSG-DSC-04A\n');

// Clean output
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
  console.log(`  cleared: ${OUT}`);
}
fs.mkdirSync(OUT, { recursive: true });

// Build the bundle
console.log('  building bundle…');
execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });

// Copy deployment files
const files = [
  ['index.html',              out('index.html')],
  ['arcade.page.css',         out('arcade.page.css')],
  ['dist/arcade.bundle.js',   out('arcade.bundle.js')],
  ['fonts',                   out('fonts')],
  ['audio',                   out('audio')],
  ['assets',                  out('assets')],
];

for (const [src, dest] of files) {
  cp(src, dest);
  console.log(`  copied: ${src}`);
}

// Manifest
const manifest = {
  artifactId:    'CSG-DSC-04A',
  surfaceName:   'BLOODRUN ARCADE',
  status:        'Unindexed / Recovered Executable Remnant',
  authority:     'Catalyst Systems Group',
  routeClass:    'optional-recovered-branch',
  progression:   'NONE',
  stateKeys:     [
    'wr_holmn_arcade_installed_v1',
    'wr_holmn_arcade_completed_v1',
    'wr_holmn_arcade_notice_found_v1',
  ],
  placement:     'public/holmn/mount/bloodrun-arcade/',
  builtAt:       new Date().toISOString(),
};

fs.writeFileSync(
  out('MANIFEST.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);
console.log('  wrote: MANIFEST.json');

// Report
const totalBytes = (dir) => {
  let total = 0;
  for (const f of fs.readdirSync(dir, { recursive: true })) {
    try { total += fs.statSync(path.join(dir, f)).size; } catch {}
  }
  return total;
};
const kb = Math.round(totalBytes(OUT) / 1024);
console.log(`\n▲ artifact sealed — ${kb} KB total`);
console.log(`  output: ${OUT}`);
console.log(`  place at: public/holmn/mount/bloodrun-arcade/\n`);
