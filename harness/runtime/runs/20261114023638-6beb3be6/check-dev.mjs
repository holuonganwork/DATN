import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer } from '../../../../project/apps/web/node_modules/vite/dist/node/index.js';

const runDirectory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(runDirectory, '../../../..');
const webRoot = path.join(repository, 'project/apps/web');
process.chdir(webRoot);
let server;
try {
  server = await createServer({
    root: webRoot,
    cacheDir: path.join(runDirectory, 'vite-dev-cache'),
    server: { host: '127.0.0.1', port: 0, open: false },
  });
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  for (const route of ['/', '/src/main.tsx', '/src/styles.css']) {
    const response = await fetch(`${origin}${route}`);
    assert.equal(response.status, 200, `Dev request failed: ${route}`);
    const content = await response.text();
    assert.equal(content.includes('Failed to load PostCSS config'), false);
    if (route.endsWith('.css')) assert.ok(content.includes('.app-shell'));
    process.stdout.write(`PASS: dev HTTP 200 ${route}\n`);
  }
  const preservedFiles = JSON.parse(fs.readFileSync(path.join(runDirectory, 'preserved-files.json'), 'utf8'));
  for (const file of preservedFiles) {
    const hash = createHash('sha256').update(fs.readFileSync(path.join(repository, file.path))).digest('hex').toUpperCase();
    assert.equal(hash, file.sha256, `Unexpected change: ${file.path}`);
  }
  process.stdout.write('PASS: app package, lockfile, Vite config and styles preserved.\n');
} catch (error) {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
} finally {
  await server?.close();
}
