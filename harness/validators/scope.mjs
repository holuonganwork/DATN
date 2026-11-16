import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function normalize(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function globToRegExp(pattern) {
  const normalized = normalize(pattern);
  let source = '';
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    if (char === '*' && normalized[index + 1] === '*') {
      source += '.*';
      index += 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else {
      source += char.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}(?:/.*)?$`, 'i');
}

export function matchesPath(file, patterns = []) {
  const candidate = normalize(file);
  return patterns.some((pattern) => globToRegExp(pattern).test(candidate));
}

export function getChangedFiles(repoRoot) {
  const result = spawnSync('git', ['-C', repoRoot, 'status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
    const raw = line.slice(3).trim();
    const renamed = raw.includes(' -> ') ? raw.split(' -> ').pop() : raw;
    return normalize(renamed);
  });
}

export function validateScope(task, files = []) {
  const errors = [];
  const allowed = task.target?.allowed_paths ?? [];
  const harnessAllowed = task.target?.harness_write_paths ?? [
    'harness/state/',
    'harness/runtime/',
    'harness/evidence/'
  ];
  const forbidden = task.target?.forbidden_paths ?? [];

  for (const original of files) {
    const file = normalize(original);
    if (!file) continue;
    if (matchesPath(file, forbidden)) {
      errors.push(`Đường dẫn bị cấm: ${file}`);
      continue;
    }
    if (matchesPath(file, harnessAllowed) || matchesPath(file, allowed)) continue;
    errors.push(`Đường dẫn nằm ngoài scope: ${file}`);
  }
  return { ok: errors.length === 0, errors, files: files.map(normalize) };
}

export function scanFilesForScope(files, repoRoot) {
  return files.filter((file) => {
    const full = path.resolve(repoRoot, file);
    try { return fs.statSync(full).isFile(); } catch { return false; }
  });
}

