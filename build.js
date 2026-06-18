// BLOODRUN.exe — esbuild bundler
const esbuild = require('esbuild');
const args    = process.argv.slice(2);
const watching = args.includes('--watch');

const config = {
  entryPoints: ['src/index.jsx'],
  bundle: true,
  outfile: 'dist/arcade.bundle.js',
  platform: 'browser',
  jsx: 'automatic',
  sourcemap: true,
  // Production React build: no dev warnings, smaller bundle, no eval usage.
  define: { 'process.env.NODE_ENV': '"production"' },
};

if (watching) {
  esbuild.context(config).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  }).catch(() => process.exit(1));
} else {
  esbuild.build(config).then(() => {
    console.log('Build complete → dist/arcade.bundle.js');
  }).catch(() => process.exit(1));
}
