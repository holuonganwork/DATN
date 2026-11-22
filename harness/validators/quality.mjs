import fs from 'node:fs';
import path from 'node:path';

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.sol']);

export function scanCodeQualityText(text, source = '<text>') {
  const findings = [];
  const lines = String(text ?? '').split(/\r?\n/);
  const checks = [
    { type: 'debug_statement', pattern: /\bdebugger\b|\bconsole\.log\s*\(/ },
    { type: 'ts_ignore', pattern: /@ts-(?:ignore|nocheck)\b/ },
    { type: 'unsafe_any', pattern: /\bas\s+any\b/ },
    { type: 'empty_catch', pattern: /catch\s*(?:\([^)]*\))?\s*\{\s*\}/ }
  ];
  lines.forEach((line, index) => {
    for (const check of checks) {
      if (check.pattern.test(line)) findings.push({ source, line: index + 1, type: check.type });
    }
  });
  return findings;
}

function scanChangedCode(files, repoRoot) {
  const findings = [];
  for (const file of files) {
    const normalized = String(file).replaceAll('\\', '/');
    if (!normalized.startsWith('project/') || !CODE_EXTENSIONS.has(path.extname(normalized).toLowerCase())) continue;
    try {
      const fullPath = path.resolve(repoRoot, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue;
      findings.push(...scanCodeQualityText(fs.readFileSync(fullPath, 'utf8'), normalized));
    } catch {
      // Deleted files are handled by the scope validator.
    }
  }
  return findings;
}

export function validateQuality({ task, events = [], commandResults = [], changedFiles = [], repoRoot } = {}) {
  const errors = [];
  const warnings = [];
  const eventTypes = new Set(events.map((event) => event.event_type));
  for (const required of ['run_started', 'phase_started', 'phase_completed']) {
    if (!eventTypes.has(required)) warnings.push(`Chưa có event ${required}`);
  }
  for (const result of commandResults) {
    if (result.exit_code !== 0) errors.push(`Command thất bại: ${result.command}`);
  }
  if (!task?.acceptance_criteria?.length) errors.push('Task không có acceptance criteria');
  if (!task?.completion_report?.required?.length) errors.push('Task không có completion report contract');

  const profile = task?.quality_profile;
  const gates = task?.quality_gates ?? {};
  if (['code', 'harness'].includes(profile) && gates.require_validation_commands !== false && !task?.validation_commands?.length) {
    errors.push(`Task quality_profile=${profile} phải có validation_commands`);
  }
  if (gates.require_diff_check) {
    const diffChecks = events
      .filter((event) => event.event_type === 'command_finished' && event.payload?.kind === 'validation')
      .map((event) => event.payload)
      .filter((result) => String(result.command ?? '').toLowerCase().includes('git diff --check'));
    if (!diffChecks.some((result) => result.exit_code === 0)) errors.push('Chưa có validation git diff --check đạt');
  }
  if (gates.require_quality_review_event && !eventTypes.has('quality_reviewed')) {
    errors.push('Thiếu event quality_reviewed trước khi finalize');
  }
  const findings = profile === 'code' && repoRoot ? scanChangedCode(changedFiles, repoRoot) : [];
  if (findings.length) errors.push(`Static clean-code scan phát hiện ${findings.length} finding`);
  return { ok: errors.length === 0, errors, warnings, findings };
}

