import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../../../project/apps/web/node_modules/vite/dist/node/index.js';

const runDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(runDirectory, '../../../../project/apps/web');
process.chdir(webRoot);
try {
  await build({
    root: webRoot,
    configFile: false,
    logLevel: 'silent',
    build: {
      outDir: path.join(runDirectory, 'css-probe'),
      emptyOutDir: false,
      rolldownOptions: { input: path.join(webRoot, 'src/styles.css') },
    },
  });
  const assets = fs.readdirSync(path.join(runDirectory, 'css-probe/assets'));
  if (!assets.some((file) => file.endsWith('.css'))) throw new Error('CSS output was not emitted');
  process.stdout.write('PASS: Vite compiled src/styles.css; PostCSS configuration loaded successfully.\n');
} catch (error) {
  fs.writeFileSync(path.join(runDirectory, 'repro-before.log'), `${error.stack ?? error}\n`);
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
}
