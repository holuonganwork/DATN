import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const runDirectory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(runDirectory, '../../../..');
const webDirectory = path.join(repository, 'project/apps/web');
const baseline = JSON.parse(fs.readFileSync(path.join(runDirectory, 'rename-baseline.json'), 'utf8'));
const expectedChanges = new Set(['package.json', 'README.md', 'scripts/validate-demo.mjs']);
let unchangedFiles = 0;

for (const entry of baseline) {
  const relativePath = entry.path === 'scripts/validate-demo.mjs' ? 'scripts/validate-web.mjs' : entry.path;
  const file = path.join(webDirectory, relativePath);
  assert.ok(fs.existsSync(file), `Missing relocated file: ${relativePath}`);
  if (!expectedChanges.has(entry.path)) {
    const hash = createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
    assert.equal(hash, entry.hash, `Unexpected change to ${relativePath}`);
    unchangedFiles += 1;
  }
}

const allFiles = fs.readdirSync(webDirectory, { recursive: true, withFileTypes: true });
assert.equal(allFiles.filter((entry) => entry.isFile()).length, baseline.length);
assert.equal(fs.existsSync(path.join(repository, 'project/apps/demo')), false);
assert.equal(fs.existsSync(path.join(webDirectory, 'scripts/validate-demo.mjs')), false);
assert.equal(JSON.parse(fs.readFileSync(path.join(webDirectory, 'package.json'), 'utf8')).name, 'certificate-web');
assert.ok(fs.readFileSync(path.join(repository, 'project/README.md'), 'utf8').includes('(apps/web/README.md)'));

const taskPath = path.join(repository, 'harness/tasks/ready/T-015-demo-vertical-slice.json');
const previousTask = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
for (const command of [...previousTask.execution_commands, ...previousTask.validation_commands]) {
  if (!command.cwd) continue;
  assert.equal(command.cwd, 'project/apps/web');
  assert.ok(fs.existsSync(path.join(repository, command.cwd)));
  if (command.command.startsWith('node scripts/')) {
    assert.ok(fs.existsSync(path.join(repository, command.cwd, command.command.slice(5))));
  }
}
for (const relativePath of ['project/README.md', 'harness/context/current-state.md', 'harness/tasks/ready/T-015-demo-vertical-slice.json']) {
  assert.equal(fs.readFileSync(path.join(repository, relativePath), 'utf8').includes('apps/demo'), false, relativePath);
}
process.stdout.write(`PASS: ${baseline.length} files retained; ${unchangedFiles} unchanged SHA-256 hashes; package, README and T-015 paths verified.\n`);
