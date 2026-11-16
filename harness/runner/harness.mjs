import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  readTask,
  validateTaskObject,
  validateTaskDirectory,
  RUN_STATUSES
} from '../validators/task.mjs';
import { getChangedFiles, validateScope } from '../validators/scope.mjs';
import { validateSecrets } from '../validators/secrets.mjs';
import { validateQuality } from '../validators/quality.mjs';
import { validateLogEvent, validateEventLog } from '../validators/log.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_HARNESS_ROOT = path.resolve(SCRIPT_DIR, '..');
const EVENT_SCHEMA_VERSION = 1;
const MAX_OUTPUT = 8 * 1024;

export function getHarnessRoot(explicitRoot) {
  return path.resolve(explicitRoot || process.env.HARNESS_ROOT || DEFAULT_HARNESS_ROOT);
}

export function getRepoRoot(harnessRoot) {
  const candidate = path.dirname(harnessRoot);
  if (fs.existsSync(path.join(candidate, '.git'))) return candidate;
  return process.cwd();
}

function pathsFor(root) {
  return {
    runtime: path.join(root, 'runtime'),
    runs: path.join(root, 'runtime', 'runs'),
    state: path.join(root, 'state'),
    activeTask: path.join(root, 'state', 'active-task.json'),
    projectState: path.join(root, 'state', 'project-state.json'),
    tasks: path.join(root, 'tasks'),
    readyTasks: path.join(root, 'tasks', 'ready'),
    schemas: path.join(root, 'schemas')
  };
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJsonAtomic(filePath, value) {
  ensureDirectory(path.dirname(filePath));
  const temporary = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function now() {
  return new Date().toISOString();
}

function relativeToRepo(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).replaceAll('\\', '/');
}

function truncate(value, limit = MAX_OUTPUT) {
  const text = String(value ?? '');
  return text.length > limit ? `${text.slice(0, limit)}\n...[truncated]` : text;
}

export function redact(value) {
  let text = String(value ?? '');
  text = text.replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gi, '[REDACTED_PRIVATE_KEY]');
  text = text.replace(/\b(gh[pousr]_|sk-|AKIA)[A-Za-z0-9_\-]{12,}/g, '[REDACTED_TOKEN]');
  text = text.replace(/\b(password|passwd|secret|private[_-]?key|api[_-]?key|token)\s*([:=])\s*(["']?)[^\s"']{8,}\3/gi, '$1$2[REDACTED]');
  return truncate(text);
}

function sanitizePayload(value) {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map(sanitizePayload);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizePayload(item)]));
  }
  return value;
}

function randomRunId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `${stamp}-${crypto.randomBytes(4).toString('hex')}`;
}

function runDirectory(harnessRoot, runId) {
  return path.join(pathsFor(harnessRoot).runs, runId);
}

function manifestPath(harnessRoot, runId) {
  return path.join(runDirectory(harnessRoot, runId), 'run.json');
}

function eventPath(harnessRoot, runId) {
  return path.join(runDirectory(harnessRoot, runId), 'events.jsonl');
}

function summaryPath(harnessRoot, runId) {
  return path.join(runDirectory(harnessRoot, runId), 'summary.json');
}

function readEvents(harnessRoot, runId) {
  const filePath = eventPath(harnessRoot, runId);
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function gitSnapshot(repoRoot) {
  const head = spawnSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8', windowsHide: true });
  const changed = getChangedFiles(repoRoot);
  return {
    head: head.status === 0 ? head.stdout.trim() : null,
    changed_files: changed
  };
}

function walkFiles(directory, relativePrefix, result, { skipRuntime = true } = {}) {
  if (!fs.existsSync(directory)) return;
  const rootStat = fs.statSync(directory);
  if (rootStat.isFile()) {
    result[relativePrefix] = `${rootStat.size}:${rootStat.mtimeMs}`;
    return;
  }
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const relative = path.posix.join(relativePrefix, entry.name);
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      if (skipRuntime && (relative === 'harness/runtime' || relative.startsWith('harness/runtime/'))) continue;
      walkFiles(fullPath, relative, result, { skipRuntime });
      continue;
    }
    try {
      const stat = fs.statSync(fullPath);
      result[relative] = `${stat.size}:${stat.mtimeMs}`;
    } catch {
      // Files disappearing during a snapshot are treated as absent.
    }
  }
}

function workspaceSnapshot(repoRoot, task) {
  const snapshot = {};
  const prefixes = [
    ...(task.target?.allowed_paths ?? []),
    ...(task.target?.harness_write_paths ?? [])
  ].map((value) => value.replaceAll('\\', '/').replace(/\/$/, ''));
  for (const prefix of new Set(prefixes)) {
    if (prefix === 'harness/runtime' || prefix.startsWith('harness/runtime/')) continue;
    walkFiles(path.join(repoRoot, prefix), prefix, snapshot);
  }
  return snapshot;
}

function changedFromSnapshots(before = {}, after = {}) {
  const files = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...files].filter((file) => before[file] !== after[file]).sort();
}

function newChangedFiles(before, after) {
  const baseline = new Set(before?.changed_files ?? []);
  return after.filter((file) => !baseline.has(file));
}

function updateActiveState(harnessRoot, run, status = 'active') {
  const paths = pathsFor(harnessRoot);
  const active = status === 'active'
    ? {
        schema_version: 1,
        run_id: run.run_id,
        task_id: run.task_id,
        task_file: run.task_file,
        status: 'active',
        phase: run.phase,
        updated_at: now()
      }
    : { task: null, status: 'idle', updated_at: now() };
  writeJsonAtomic(paths.activeTask, active);

  let projectState = { status: 'not_started', current_task: null, completed_tasks: [], updated_at: now() };
  if (fs.existsSync(paths.projectState)) {
    try { projectState = readJson(paths.projectState); } catch { /* recreate malformed local state */ }
  }
  if (status === 'active') {
    projectState.status = 'in_progress';
    projectState.current_task = run.task_id;
  } else if (run.status === 'passed') {
    projectState.current_task = null;
    projectState.status = projectState.completed_tasks?.length ? 'in_progress' : 'not_started';
  } else {
    projectState.current_task = null;
  }
  projectState.updated_at = now();
  writeJsonAtomic(paths.projectState, projectState);
}

function resolveTaskPath(harnessRoot, input) {
  const repoRoot = getRepoRoot(harnessRoot);
  const candidates = [];
  if (input) {
    candidates.push(path.resolve(input));
    candidates.push(path.resolve(repoRoot, input));
    candidates.push(path.resolve(harnessRoot, input));
  }
  if (input?.match(/^T-\d{3}$/)) {
    for (const directory of ['inbox', 'ready', 'active', 'blocked', 'done']) {
      candidates.push(path.join(harnessRoot, 'tasks', directory, `${input}.json`));
      const taskDirectory = path.join(harnessRoot, 'tasks', directory);
      if (fs.existsSync(taskDirectory)) {
        for (const file of fs.readdirSync(taskDirectory).filter((entry) => entry.startsWith(`${input}-`) && entry.endsWith('.json'))) {
          candidates.push(path.join(taskDirectory, file));
        }
      }
    }
  }
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`Không tìm thấy task: ${input}`);
}

function ensureDependencies(harnessRoot, task) {
  for (const dependency of task.dependencies ?? []) {
    const dependencyTask = readTask(resolveTaskPath(harnessRoot, dependency));
    if (dependencyTask.status !== 'done') {
      throw new Error(`Task ${task.id} chưa thể chạy: dependency ${dependency} đang ở trạng thái ${dependencyTask.status}`);
    }
  }
}

export function createRun(taskFile, { root, runId } = {}) {
  const harnessRoot = getHarnessRoot(root);
  const paths = pathsFor(harnessRoot);
  const repoRoot = getRepoRoot(harnessRoot);
  const resolvedTask = resolveTaskPath(harnessRoot, taskFile);
  const task = readTask(resolvedTask);
  ensureDependencies(harnessRoot, task);
  const id = runId || randomRunId();
  const directory = runDirectory(harnessRoot, id);
  if (fs.existsSync(directory)) throw new Error(`Run đã tồn tại: ${id}`);
  ensureDirectory(path.join(directory, 'commands'));
  ensureDirectory(paths.runs);
  const manifest = {
    schema_version: 1,
    run_id: id,
    task_id: task.id,
    task_file: relativeToRepo(repoRoot, resolvedTask),
    status: 'running',
    phase: 'start',
    created_at: now(),
    updated_at: now(),
    cwd: process.cwd(),
    hostname: os.hostname(),
    node_version: process.version,
    repo_root: repoRoot,
    event_log: relativeToRepo(repoRoot, eventPath(harnessRoot, id)),
    summary_file: relativeToRepo(repoRoot, summaryPath(harnessRoot, id)),
    last_sequence: 0,
    git_before: gitSnapshot(repoRoot),
    workspace_before: workspaceSnapshot(repoRoot, task),
    execution: null,
    validation: null
  };
  writeJsonAtomic(manifestPath(harnessRoot, id), manifest);
  appendEvent(harnessRoot, id, 'start', 'run_started', {
    task_file: manifest.task_file,
    cwd: manifest.cwd,
    git_head: manifest.git_before.head
  });
  updateActiveState(harnessRoot, manifest, 'active');
  return loadRun(harnessRoot, id);
}

export function loadRun(harnessRoot, runId) {
  const root = getHarnessRoot(harnessRoot);
  const filePath = manifestPath(root, runId);
  if (!fs.existsSync(filePath)) throw new Error(`Không tìm thấy run: ${runId}`);
  return readJson(filePath);
}

export function appendEvent(harnessRoot, runId, phase, eventType, payload = {}) {
  const root = getHarnessRoot(harnessRoot);
  const manifest = loadRun(root, runId);
  const events = readEvents(root, runId);
  const sequence = events.length ? events[events.length - 1].sequence + 1 : 1;
  const event = {
    schema_version: EVENT_SCHEMA_VERSION,
    event_id: `${runId}:${sequence}`,
    run_id: runId,
    sequence,
    timestamp: now(),
    phase,
    event_type: eventType,
    task_id: manifest.task_id,
    payload: sanitizePayload(payload)
  };
  const eventCheck = validateLogEvent(event);
  if (!eventCheck.ok) throw new Error(`Event không hợp lệ: ${eventCheck.errors.join('; ')}`);
  fs.appendFileSync(eventPath(root, runId), `${JSON.stringify(event)}\n`, 'utf8');
  manifest.last_sequence = sequence;
  manifest.phase = phase;
  manifest.updated_at = event.timestamp;
  writeJsonAtomic(manifestPath(root, runId), manifest);
  return event;
}

function commandSpec(value, index) {
  if (typeof value === 'string') return { name: `command-${index + 1}`, command: value, timeout_ms: 10 * 60 * 1000, continue_on_error: false };
  if (value && typeof value === 'object' && typeof value.command === 'string') {
    return {
      name: value.name || `command-${index + 1}`,
      command: value.command,
      cwd: value.cwd,
      env: value.env || {},
      timeout_ms: value.timeout_ms || 10 * 60 * 1000,
      continue_on_error: value.continue_on_error === true
    };
  }
  throw new Error(`Command thứ ${index + 1} không hợp lệ`);
}

function executeCommand(harnessRoot, runId, spec, index, attempt, kind) {
  const root = getHarnessRoot(harnessRoot);
  const run = loadRun(root, runId);
  const repoRoot = run.repo_root;
  const cwd = spec.cwd ? path.resolve(repoRoot, spec.cwd) : repoRoot;
  const started = now();
  appendEvent(root, runId, kind === 'execution' ? 'execute' : 'validate', 'command_started', {
    kind,
    index,
    attempt,
    name: spec.name,
    command: spec.command,
    cwd: relativeToRepo(repoRoot, cwd)
  });
  const result = spawnSync(spec.command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    timeout: spec.timeout_ms,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
    env: { ...process.env, ...spec.env, HARNESS_RUN_ID: runId, HARNESS_TASK_ID: run.task_id }
  });
  const commandDir = path.join(runDirectory(root, runId), 'commands');
  const stem = `${String(index + 1).padStart(3, '0')}-${kind}-${attempt}`;
  const stdoutFile = path.join(commandDir, `${stem}.stdout.log`);
  const stderrFile = path.join(commandDir, `${stem}.stderr.log`);
  fs.writeFileSync(stdoutFile, redact(result.stdout || ''), 'utf8');
  fs.writeFileSync(stderrFile, redact(result.stderr || result.error?.message || ''), 'utf8');
  const exitCode = result.status ?? (result.error ? 1 : 0);
  const finished = {
    kind,
    index,
    attempt,
    name: spec.name,
    command: spec.command,
    started_at: started,
    finished_at: now(),
    exit_code: exitCode,
    signal: result.signal || null,
    timed_out: Boolean(result.error?.code === 'ETIMEDOUT'),
    stdout: redact(result.stdout || ''),
    stderr: redact(result.stderr || result.error?.message || ''),
    stdout_file: relativeToRepo(repoRoot, stdoutFile),
    stderr_file: relativeToRepo(repoRoot, stderrFile)
  };
  appendEvent(root, runId, kind === 'execution' ? 'execute' : 'validate', 'command_finished', finished);
  return finished;
}

function successfulCommandIndexes(events, kind) {
  return new Set(events.filter((event) => event.event_type === 'command_finished' && event.payload.kind === kind && event.payload.exit_code === 0).map((event) => event.payload.index));
}

function getTaskForRun(root, run) {
  const recordedPath = path.resolve(run.repo_root, run.task_file);
  if (fs.existsSync(recordedPath)) return readTask(recordedPath);
  // Task files may move between inbox/ready/active/done. Resolve by stable task id for resume/review.
  return readTask(resolveTaskPath(root, run.task_id));
}

export function executeRun(harnessRoot, runId, { resume = false } = {}) {
  const root = getHarnessRoot(harnessRoot);
  let run = loadRun(root, runId);
  const task = getTaskForRun(root, run);
  run.status = 'running';
  run.phase = 'execute';
  writeJsonAtomic(manifestPath(root, runId), run);
  appendEvent(root, runId, 'execute', 'phase_started', { resumed: resume });
  const commands = task.execution_commands.map(commandSpec);
  if (commands.length === 0) {
    appendEvent(root, runId, 'execute', 'execution_manual_required', { reason: 'task không khai báo execution_commands' });
    appendEvent(root, runId, 'execute', 'phase_completed', { ok: true, manual_required: true });
    run = loadRun(root, runId);
    run.execution = { ok: true, manual_required: true, commands: [] };
    writeJsonAtomic(manifestPath(root, runId), run);
    updateActiveState(root, run, 'active');
    return run;
  }

  const completed = successfulCommandIndexes(readEvents(root, runId), 'execution');
  const results = [];
  let failed = false;
  for (let index = 0; index < commands.length; index += 1) {
    const spec = commands[index];
    if (resume && completed.has(index)) {
      appendEvent(root, runId, 'execute', 'command_skipped', { kind: 'execution', index, name: spec.name, reason: 'đã thành công ở lần chạy trước' });
      continue;
    }
    let passed = false;
    let lastResult;
    const maxRetries = task.retry_policy.max_retries;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      lastResult = executeCommand(root, runId, spec, index, attempt, 'execution');
      results.push(lastResult);
      if (lastResult.exit_code === 0) {
        passed = true;
        break;
      }
      if (attempt < maxRetries) appendEvent(root, runId, 'execute', 'command_retrying', { index, attempt, next_attempt: attempt + 1, max_retries: maxRetries });
    }
    if (!passed && !spec.continue_on_error) {
      failed = true;
      appendEvent(root, runId, 'execute', 'phase_failed', { reason: 'command thất bại', index, exit_code: lastResult?.exit_code });
      break;
    }
  }
  if (!failed) appendEvent(root, runId, 'execute', 'phase_completed', { ok: true, manual_required: false, command_count: commands.length });
  run = loadRun(root, runId);
  run.execution = { ok: !failed, manual_required: false, commands: results };
  run.status = failed ? 'failed' : 'running';
  writeJsonAtomic(manifestPath(root, runId), run);
  updateActiveState(root, run, 'active');
  return run;
}

export function validateRun(harnessRoot, runId) {
  const root = getHarnessRoot(harnessRoot);
  let run = loadRun(root, runId);
  const task = getTaskForRun(root, run);
  const repoRoot = run.repo_root;
  appendEvent(root, runId, 'validate', 'phase_started', {});
  const commandResults = [];
  const commands = task.validation_commands.map(commandSpec);
  const completed = successfulCommandIndexes(readEvents(root, runId), 'validation');
  let commandFailure = false;
  for (let index = 0; index < commands.length; index += 1) {
    const spec = commands[index];
    if (completed.has(index)) {
      appendEvent(root, runId, 'validate', 'command_skipped', { kind: 'validation', index, name: spec.name, reason: 'đã thành công ở lần chạy trước' });
      continue;
    }
    let passed = false;
    let lastResult;
    for (let attempt = 0; attempt <= task.retry_policy.max_retries; attempt += 1) {
      lastResult = executeCommand(root, runId, spec, index, attempt, 'validation');
      commandResults.push(lastResult);
      if (lastResult.exit_code === 0) {
        passed = true;
        break;
      }
      if (attempt < task.retry_policy.max_retries) appendEvent(root, runId, 'validate', 'command_retrying', { index, attempt, next_attempt: attempt + 1 });
    }
    if (!passed && !spec.continue_on_error) commandFailure = true;
  }

  const taskCheck = validateTaskObject(task, { source: run.task_file });
  const changedFiles = newChangedFiles(run.git_before, getChangedFiles(repoRoot));
  const scopeCheck = validateScope(task, changedFiles);
  const secretCheck = validateSecrets(changedFiles, repoRoot);
  const allEvents = readEvents(root, runId);
  const qualityCheck = validateQuality({ task, events: allEvents, commandResults, changedFiles, repoRoot });
  const logCheck = validateEventLog(allEvents, { runId });
  const checks = [
    { name: 'task_schema', ...taskCheck },
    { name: 'scope', ...scopeCheck },
    { name: 'secrets', ...secretCheck },
    { name: 'quality', ...qualityCheck },
    { name: 'commands', ok: !commandFailure, errors: commandFailure ? ['validation command thất bại'] : [], warnings: [] },
    { name: 'event_log', ...logCheck }
  ];
  for (const check of checks) appendEvent(root, runId, 'validate', 'validator_result', { name: check.name, ok: check.ok, errors: check.errors ?? [], warnings: check.warnings ?? [], findings: check.findings ?? [] });
  const ok = checks.every((check) => check.ok);
  const manualRequired = task.manual_validation_required === true || commands.length === 0;
  appendEvent(root, runId, 'validate', 'phase_completed', { ok, manual_required: manualRequired, changed_files: changedFiles, checks: checks.map((check) => ({ name: check.name, ok: check.ok })) });
  run = loadRun(root, runId);
  run.validation = { ok, manual_required: manualRequired, changed_files: changedFiles, checks };
  run.status = ok ? 'running' : 'failed';
  writeJsonAtomic(manifestPath(root, runId), run);
  updateActiveState(root, run, 'active');
  return run;
}

export function finalizeRun(harnessRoot, runId, { requestedStatus, markDone = false } = {}) {
  const root = getHarnessRoot(harnessRoot);
  let run = loadRun(root, runId);
  appendEvent(root, runId, 'finalize', 'phase_started', { requested_status: requestedStatus || null });
  const executionOk = run.execution?.ok === true;
  const validationOk = run.validation?.ok === true;
  const manualRequired = Boolean(run.execution?.manual_required || run.validation?.manual_required);
  let status = requestedStatus || (executionOk && validationOk ? (manualRequired ? 'needs_review' : 'passed') : 'failed');
  if (!RUN_STATUSES.has(status) || status === 'running') status = 'failed';
  if (status === 'passed' && (!executionOk || !validationOk || manualRequired)) status = 'failed';
  const task = getTaskForRun(root, run);
  const evidencePaths = {
    report: path.join(run.repo_root, 'harness', 'evidence', 'task-reports', `${run.task_id}-${run.run_id}.md`),
    validation: path.join(run.repo_root, 'harness', 'evidence', 'validation', `${run.task_id}-${run.run_id}.json`)
  };
  const requiresEvidence = task.quality_gates?.require_evidence !== false;
  const missingEvidence = Object.entries(evidencePaths)
    .filter(([, filePath]) => requiresEvidence && !fs.existsSync(filePath))
    .map(([name]) => name);
  if (markDone && status === 'passed' && (manualRequired || missingEvidence.length > 0)) {
    appendEvent(root, runId, 'finalize', 'mark_done_blocked', {
      reason: manualRequired ? 'manual_validation_required' : 'missing_evidence',
      missing_evidence: missingEvidence
    });
    status = 'failed';
    markDone = false;
  }
  const allFilesChanged = [...new Set([
    ...newChangedFiles(run.git_before, getChangedFiles(run.repo_root)),
    ...changedFromSnapshots(run.workspace_before, workspaceSnapshot(run.repo_root, task))
  ])].sort();
  const internalFilesChanged = allFilesChanged.filter((file) => file.startsWith('harness/state/') || file.startsWith('harness/runtime/'));
  const filesChanged = allFilesChanged.filter((file) => !internalFilesChanged.includes(file));
  const completedAt = now();
  appendEvent(root, runId, 'finalize', 'run_finalized', { status, manual_required: manualRequired, files_changed: filesChanged, internal_files_changed: internalFilesChanged });
  run = loadRun(root, runId);
  run.phase = 'finalize';
  run.status = status;
  run.completed_at = completedAt;
  run.files_changed = filesChanged;
  run.internal_files_changed = internalFilesChanged;
  run.summary = {
    run_id: run.run_id,
    task_id: run.task_id,
    status,
    started_at: run.created_at,
    completed_at: completedAt,
    phase: run.phase,
    files_changed: filesChanged,
    internal_files_changed: internalFilesChanged,
    execution: run.execution,
    validation: run.validation,
    remaining_risks: [
      ...(manualRequired ? ['Cần Agent/người dùng xác nhận acceptance criteria thủ công.'] : []),
      ...(missingEvidence.length ? [`Thiếu evidence: ${missingEvidence.join(', ')}`] : [])
    ],
    evidence: {
      required: requiresEvidence,
      report: relativeToRepo(run.repo_root, evidencePaths.report),
      validation: relativeToRepo(run.repo_root, evidencePaths.validation),
      missing: missingEvidence
    }
  };
  writeJsonAtomic(manifestPath(root, runId), run);
  writeJsonAtomic(summaryPath(root, runId), run.summary);
  if (markDone && status === 'passed') {
    const recordedTaskPath = path.resolve(run.repo_root, run.task_file);
    const taskPath = fs.existsSync(recordedTaskPath) ? recordedTaskPath : resolveTaskPath(root, run.task_id);
    const task = readTask(taskPath);
    task.status = 'done';
    task.completed_at = completedAt;
    writeJsonAtomic(taskPath, task);
    run.task_marked_done = true;
    run.task_file = relativeToRepo(run.repo_root, taskPath);
    writeJsonAtomic(manifestPath(root, runId), run);
  }
  updateActiveState(root, run, 'idle');
  return run;
}

export function runLifecycle(taskFile, options = {}) {
  const root = getHarnessRoot(options.root);
  const run = createRun(taskFile, options);
  try {
    executeRun(root, run.run_id, { resume: false });
    const afterExecution = loadRun(root, run.run_id);
    if (afterExecution.execution?.ok === false) return finalizeRun(root, run.run_id, { requestedStatus: 'failed' });
    validateRun(root, run.run_id);
    const afterValidation = loadRun(root, run.run_id);
    return finalizeRun(root, run.run_id, { requestedStatus: options.status, markDone: options.markDone && afterValidation.validation?.ok !== false });
  } catch (error) {
    appendEvent(root, run.run_id, 'finalize', 'run_error', { message: error.message, stack: error.stack });
    const failed = loadRun(root, run.run_id);
    failed.execution = failed.execution || { ok: false, error: error.message };
    failed.validation = failed.validation || { ok: false, error: error.message };
    writeJsonAtomic(manifestPath(root, run.run_id), failed);
    return finalizeRun(root, run.run_id, { requestedStatus: 'failed' });
  }
}

export function resumeRun(harnessRoot, runId, options = {}) {
  const root = getHarnessRoot(harnessRoot);
  let run = loadRun(root, runId);
  if (['passed', 'blocked', 'needs_review', 'cancelled'].includes(run.status)) return run;
  const previousPhase = run.phase;
  const previousStatus = run.status;
  run.status = 'running';
  writeJsonAtomic(manifestPath(root, runId), run);
  appendEvent(root, runId, 'resume', 'run_resumed', { previous_phase: previousPhase, previous_status: previousStatus });
  executeRun(root, runId, { resume: true });
  run = loadRun(root, runId);
  if (run.execution?.ok === false) return finalizeRun(root, runId, { requestedStatus: 'failed' });
  validateRun(root, runId);
  return finalizeRun(root, runId, { requestedStatus: options.status, markDone: options.markDone });
}

export function listRuns(harnessRoot) {
  const root = getHarnessRoot(harnessRoot);
  const directory = pathsFor(root).runs;
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((entry) => fs.existsSync(manifestPath(root, entry))).map((runId) => loadRun(root, runId)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function print(value, json = false) {
  if (json) console.log(JSON.stringify(value, null, 2));
  else if (typeof value === 'string') console.log(value);
  else console.log(JSON.stringify(value, null, 2));
}

function compactRun(run) {
  return {
    run_id: run.run_id,
    task_id: run.task_id,
    status: run.status,
    phase: run.phase,
    created_at: run.created_at,
    updated_at: run.updated_at,
    completed_at: run.completed_at || null,
    last_sequence: run.last_sequence,
    files_changed: run.files_changed || [],
    internal_files_changed: run.internal_files_changed || [],
    execution_ok: run.execution?.ok ?? null,
    validation_ok: run.validation?.ok ?? null,
    event_log: run.event_log,
    summary_file: run.summary_file
  };
}

function parseArgs(args) {
  const positional = [];
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    const [key, inline] = value.slice(2).split('=', 2);
    if (inline !== undefined) options[key.replaceAll('-', '_')] = inline;
    else if (['json', 'mark_done', 'all', 'full'].includes(key.replaceAll('-', '_'))) options[key.replaceAll('-', '_')] = true;
    else options[key.replaceAll('-', '_')] = args[++index];
  }
  return { positional, options };
}

export function doctor(harnessRoot) {
  const root = getHarnessRoot(harnessRoot);
  const paths = pathsFor(root);
  ensureDirectory(paths.runtime);
  ensureDirectory(paths.runs);
  const checks = [];
  for (const directory of [paths.runtime, paths.runs, paths.state, paths.tasks, paths.schemas]) {
    checks.push({ name: `directory:${relativeToRepo(getRepoRoot(root), directory)}`, ok: fs.existsSync(directory) });
  }
  checks.push({ name: 'node_version', ok: Number(process.versions.node.split('.')[0]) >= 20, value: process.version });
  const taskDirs = ['inbox', 'ready', 'active', 'blocked', 'done'];
  const knownIds = new Set();
  for (const directory of taskDirs) {
    const result = validateTaskDirectory(path.join(paths.tasks, directory), { knownIds });
    for (const task of result.tasks) knownIds.add(task.id);
    checks.push({ name: `tasks:${directory}`, ok: result.ok, errors: result.errors, warnings: result.warnings, count: result.tasks.length });
  }
  checks.push({ name: 'task_count', ok: knownIds.size >= 12, count: knownIds.size, expected_minimum: 12 });
  const ok = checks.every((check) => check.ok);
  return { ok, checked_at: now(), root, checks };
}

function usage() {
  return [
    'Usage:',
    '  node harness/runner/harness.mjs run <task-file|T-001> [--mark-done] [--json]',
    '  node harness/runner/harness.mjs start <task-file|T-001>',
    '  node harness/runner/harness.mjs execute <run-id>',
    '  node harness/runner/harness.mjs validate <run-id>',
    '  node harness/runner/harness.mjs finalize <run-id> [--status passed|failed|blocked|needs_review] [--mark-done]',
    '  node harness/runner/harness.mjs resume <run-id>',
    '  node harness/runner/harness.mjs status [run-id] [--all] [--full] [--json]',
    '  node harness/runner/harness.mjs event <run-id> <phase> <event-type> [--data JSON]',
    '  node harness/runner/harness.mjs list-tasks [--json]',
    '  node harness/runner/harness.mjs validate-task <task-file> [--json]',
    '  node harness/runner/harness.mjs validate-scope <task-file> [file ...] [--json]',
    '  node harness/runner/harness.mjs validate-secrets [file ...] [--json]',
    '  node harness/runner/harness.mjs validate-quality <run-id> [--json]',
    '  node harness/runner/harness.mjs validate-log <run-id> [--json]',
    '  node harness/runner/harness.mjs doctor [--json]'
  ].join('\n');
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const { positional, options } = parseArgs(rest);
  const root = getHarnessRoot(options.root);
  switch (command) {
    case 'run': {
      const result = runLifecycle(positional[0], { root, status: options.status, markDone: Boolean(options.mark_done), runId: options.run_id });
      print(result.summary || result, Boolean(options.json));
      return result.status === 'failed' ? 1 : 0;
    }
    case 'start': {
      const result = createRun(positional[0], { root, runId: options.run_id });
      print(result, Boolean(options.json));
      return 0;
    }
    case 'execute': {
      const result = executeRun(root, positional[0], { resume: Boolean(options.resume) });
      print(result, Boolean(options.json));
      return result.execution?.ok === false ? 1 : 0;
    }
    case 'validate': {
      const result = validateRun(root, positional[0]);
      print(result.validation || result, Boolean(options.json));
      return result.validation?.ok === false ? 1 : 0;
    }
    case 'finalize': {
      const result = finalizeRun(root, positional[0], { requestedStatus: options.status, markDone: Boolean(options.mark_done) });
      print(result.summary || result, Boolean(options.json));
      return result.status === 'failed' ? 1 : 0;
    }
    case 'resume': {
      const result = resumeRun(root, positional[0], { status: options.status, markDone: Boolean(options.mark_done) });
      print(result.summary || result, Boolean(options.json));
      return result.status === 'failed' ? 1 : 0;
    }
    case 'status': {
      const raw = positional[0] ? loadRun(root, positional[0]) : (options.all ? listRuns(root) : listRuns(root)[0] || { status: 'idle', runs: [] });
      const value = options.full ? raw : (Array.isArray(raw) ? raw.map(compactRun) : (raw.run_id ? compactRun(raw) : raw));
      print(value, Boolean(options.json));
      return 0;
    }
    case 'event': {
      const data = options.data ? JSON.parse(options.data) : {};
      const event = appendEvent(root, positional[0], positional[1], positional[2], data);
      print(event, Boolean(options.json));
      return 0;
    }
    case 'list-tasks': {
      const paths = pathsFor(root);
      const tasks = [];
      for (const directory of ['inbox', 'ready', 'active', 'blocked', 'done']) {
        const result = validateTaskDirectory(path.join(paths.tasks, directory));
        tasks.push(...result.tasks.map((task) => ({ ...task, directory })));
      }
      print(tasks, Boolean(options.json));
      return 0;
    }
    case 'validate-task': {
      try {
        const taskPath = resolveTaskPath(root, positional[0]);
        const task = readTask(taskPath);
        print({ ok: true, task_id: task.id, file: taskPath }, Boolean(options.json));
        return 0;
      } catch (error) {
        print({ ok: false, errors: [error.message] }, Boolean(options.json));
        return 1;
      }
    }
    case 'validate-scope': {
      const taskPath = resolveTaskPath(root, positional[0]);
      const task = readTask(taskPath);
      const files = positional.slice(1).length ? positional.slice(1) : getChangedFiles(getRepoRoot(root));
      const result = validateScope(task, files);
      print(result, Boolean(options.json));
      return result.ok ? 0 : 1;
    }
    case 'validate-secrets': {
      const files = positional.length ? positional : getChangedFiles(getRepoRoot(root));
      const result = validateSecrets(files, getRepoRoot(root));
      print(result, Boolean(options.json));
      return result.ok ? 0 : 1;
    }
    case 'validate-quality': {
      const run = loadRun(root, positional[0]);
      const task = getTaskForRun(root, run);
      const events = readEvents(root, run.run_id);
      const commandResults = events.filter((event) => event.event_type === 'command_finished').map((event) => event.payload);
      const result = validateQuality({ task, events, commandResults });
      print(result, Boolean(options.json));
      return result.ok ? 0 : 1;
    }
    case 'validate-log': {
      const run = loadRun(root, positional[0]);
      const result = validateEventLog(readEvents(root, run.run_id), { runId: run.run_id });
      print(result, Boolean(options.json));
      return result.ok ? 0 : 1;
    }
    case 'doctor': {
      const result = doctor(root);
      print(result, Boolean(options.json));
      return result.ok ? 0 : 1;
    }
    default:
      console.error(usage());
      return 2;
  }
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === path.resolve(fileURLToPath(import.meta.url))) {
  main().then((exitCode) => { process.exitCode = exitCode; }).catch((error) => {
    console.error(redact(error.stack || error.message));
    process.exitCode = 1;
  });
}

