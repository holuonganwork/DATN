import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendEvent,
  createRun,
  finalizeRun,
  getHarnessRoot,
  listRuns,
  loadRun,
  resumeRun,
  runLifecycle
} from '../runner/harness.mjs';
import { validateTaskObject } from '../validators/task.mjs';
import { validateScope } from '../validators/scope.mjs';
import { scanSecretText } from '../validators/secrets.mjs';
import { scanCodeQualityText, validateQuality } from '../validators/quality.mjs';
import { validateEventLog } from '../validators/log.mjs';

const testsDir = path.dirname(fileURLToPath(import.meta.url));

function temporaryHarness() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'credential-harness-'));
  const root = path.join(repo, 'harness');
  fs.mkdirSync(path.join(repo, '.git'));
  fs.mkdirSync(path.join(root, 'tasks', 'ready'), { recursive: true });
  fs.mkdirSync(path.join(root, 'state'), { recursive: true });
  fs.mkdirSync(path.join(root, 'runtime'), { recursive: true });
  return { repo, root };
}

function taskFixture(root, id, overrides = {}) {
  const task = {
    schema_version: 1,
    id,
    title: 'Fixture task',
    status: 'ready',
    priority: 'medium',
    objective: 'Kiểm tra runner',
    context_files: ['harness/context/project-brief.md'],
    target: {
      repository: 'project',
      allowed_paths: ['project/'],
      harness_write_paths: ['harness/runtime/', 'harness/state/', 'harness/evidence/'],
      forbidden_paths: ['project/.env', 'project/.env.*', '**/*secret*']
    },
    dependencies: [],
    preconditions: [],
    implementation_notes: [],
    checklist: ['Chạy fixture'],
    acceptance_criteria: [{ id: 'AC-1', description: 'Runner chạy được', verification: 'node --test' }],
    execution_commands: ['node -e "process.exit(0)"'],
    validation_commands: ['node -e "process.exit(0)"'],
    deliverables: ['fixture'],
    out_of_scope: [],
    risks: [],
    retry_policy: { max_retries: 0, retry_failed_commands: true },
    completion_report: { required: ['files_changed', 'commands_run', 'validation_results', 'remaining_risks'] },
    manual_validation_required: false,
    ...overrides
  };
  const filePath = path.join(root, 'tasks', 'ready', `${id}-fixture.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(task, null, 2)}\n`, 'utf8');
  return filePath;
}

function removeTemporaryHarness(repo) {
  fs.rmSync(repo, { recursive: true, force: true });
}

test('task validator accepts the machine-readable task contract', () => {
  const result = validateTaskObject({
    schema_version: 1,
    id: 'T-099',
    title: 'Valid',
    status: 'ready',
    priority: 'medium',
    objective: 'Valid',
    context_files: [],
    target: { repository: 'project', allowed_paths: ['project/'] },
    dependencies: [],
    preconditions: [],
    acceptance_criteria: [{ id: 'AC-1', description: 'Valid', verification: 'Valid' }],
    execution_commands: [],
    validation_commands: [],
    deliverables: [],
    out_of_scope: [],
    risks: [],
    retry_policy: { max_retries: 0 },
    completion_report: { required: [] }
  });
  assert.equal(result.ok, true);
});

test('quality profile requires validation commands for code and harness tasks', () => {
  const result = validateTaskObject({
    schema_version: 1,
    id: 'T-094',
    title: 'Quality profile',
    status: 'ready',
    priority: 'medium',
    objective: 'Valid',
    context_files: [],
    target: { repository: 'project', allowed_paths: ['project/'] },
    dependencies: [],
    preconditions: [],
    acceptance_criteria: [{ id: 'AC-1', description: 'Valid', verification: 'Valid' }],
    execution_commands: [],
    validation_commands: [],
    deliverables: [],
    out_of_scope: [],
    risks: [],
    retry_policy: { max_retries: 0 },
    completion_report: { required: [] },
    quality_profile: 'code'
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /validation_commands/);
});

test('clean-code scan reports blocking patterns with line numbers', () => {
  const findings = scanCodeQualityText([
    'console.log(value);',
    '// @ts-ignore',
    'const unsafe = value as any;',
    'try { run(); } catch (error) {}'
  ].join('\n'), 'fixture.ts');
  assert.deepEqual(findings.map((finding) => finding.type), [
    'debug_statement',
    'ts_ignore',
    'unsafe_any',
    'empty_catch'
  ]);
  assert.deepEqual(findings.map((finding) => finding.line), [1, 2, 3, 4]);
});

test('quality validator blocks a code task without validation commands', () => {
  const result = validateQuality({
    task: {
      quality_profile: 'code',
      quality_gates: { require_validation_commands: true },
      validation_commands: [],
      acceptance_criteria: [{ id: 'AC-1' }],
      completion_report: { required: ['files_changed'] }
    }
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /validation_commands/);
});

test('scope and secret validators reject unsafe changes', () => {
  const task = {
    target: {
      allowed_paths: ['project/'],
      harness_write_paths: ['harness/runtime/'],
      forbidden_paths: ['project/.env', '**/*secret*']
    }
  };
  assert.equal(validateScope(task, ['project/apps/api.ts']).ok, true);
  assert.equal(validateScope(task, ['harness/runner/harness.mjs']).ok, false);
  assert.equal(validateScope(task, ['project/.env']).ok, false);
  assert.equal(scanSecretText('private_key="super-secret-value"').length, 1);
});

test('lifecycle writes ordered append-only events and summary', () => {
  const fixture = temporaryHarness();
  try {
    const taskFile = taskFixture(fixture.root, 'T-099');
    const run = runLifecycle(taskFile, { root: fixture.root, runId: 'lifecycle-test' });
    assert.equal(run.status, 'passed');
    const eventsFile = path.join(fixture.root, 'runtime', 'runs', run.run_id, 'events.jsonl');
    const initial = fs.readFileSync(eventsFile, 'utf8');
    const events = initial.trim().split(/\r?\n/).map((line) => JSON.parse(line));
    assert.deepEqual(events.map((event) => event.sequence), events.map((_, index) => index + 1));
    assert.equal(validateEventLog(events, { runId: run.run_id }).ok, true);
    assert.deepEqual(new Set(events.map((event) => event.phase)), new Set(['start', 'execute', 'validate', 'finalize']));
    appendEvent(fixture.root, run.run_id, 'finalize', 'test_event', { message: 'append-only' });
    const after = fs.readFileSync(eventsFile, 'utf8');
    assert.equal(after.startsWith(initial), true);
    assert.equal(after.trim().split(/\r?\n/).length, events.length + 1);
    assert.equal(listRuns(fixture.root).length, 1);
  } finally {
    removeTemporaryHarness(fixture.repo);
  }
});

test('resume continues a failed command from the persisted run log', () => {
  const fixture = temporaryHarness();
  try {
    const marker = path.join(fixture.repo, 'resume-marker');
    const taskFile = taskFixture(fixture.root, 'T-098', {
      execution_commands: [{
        name: 'fail-once',
        command: 'node -e "const fs=require(\'fs\');const p=process.env.HARNESS_FIXTURE_MARKER;if(!fs.existsSync(p)){fs.writeFileSync(p,\'x\');process.exit(1)}"',
        env: { HARNESS_FIXTURE_MARKER: marker }
      }]
    });
    const first = runLifecycle(taskFile, { root: fixture.root, runId: 'resume-test' });
    assert.equal(first.status, 'failed');
    const resumed = resumeRun(fixture.root, 'resume-test');
    assert.equal(resumed.status, 'passed');
    const events = fs.readFileSync(path.join(fixture.root, 'runtime', 'runs', 'resume-test', 'events.jsonl'), 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
    assert.equal(events.some((event) => event.event_type === 'run_resumed'), true);
    assert.equal(events.at(-1).event_type, 'run_finalized');
    assert.equal(loadRun(fixture.root, 'resume-test').status, 'passed');
  } finally {
    removeTemporaryHarness(fixture.repo);
  }
});

test('createRun records start before execute is invoked', () => {
  const fixture = temporaryHarness();
  try {
    const taskFile = taskFixture(fixture.root, 'T-097');
    const run = createRun(taskFile, { root: fixture.root, runId: 'start-test' });
    assert.equal(run.status, 'running');
    const events = fs.readFileSync(path.join(fixture.root, 'runtime', 'runs', 'start-test', 'events.jsonl'), 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
    assert.equal(events[0].event_type, 'run_started');
    assert.equal(events[0].phase, 'start');
    finalizeRun(fixture.root, 'start-test', { requestedStatus: 'needs_review' });
  } finally {
    removeTemporaryHarness(fixture.repo);
  }
});

test('finalize refuses passed when execution or validation is missing', () => {
  const fixture = temporaryHarness();
  try {
    const taskFile = taskFixture(fixture.root, 'T-093');
    const run = createRun(taskFile, { root: fixture.root, runId: 'missing-validation-test' });
    const finalized = finalizeRun(fixture.root, run.run_id, { requestedStatus: 'passed' });
    assert.equal(finalized.status, 'failed');
    assert.equal(loadRun(fixture.root, run.run_id).task_marked_done, undefined);
  } finally {
    removeTemporaryHarness(fixture.repo);
  }
});

test('mark-done refuses a passed run when evidence files are missing', () => {
  const fixture = temporaryHarness();
  try {
    const taskFile = taskFixture(fixture.root, 'T-092');
    const run = runLifecycle(taskFile, { root: fixture.root, runId: 'missing-evidence-test' });
    assert.equal(run.status, 'passed');
    const finalized = finalizeRun(fixture.root, run.run_id, { requestedStatus: 'passed', markDone: true });
    assert.equal(finalized.status, 'failed');
    assert.equal(finalized.task_marked_done, undefined);
    assert.equal(fs.existsSync(taskFile), true);
    assert.equal(JSON.parse(fs.readFileSync(taskFile, 'utf8')).status, 'ready');
  } finally {
    removeTemporaryHarness(fixture.repo);
  }
});

test('finalize reports ignored harness files from the workspace snapshot', () => {
  const fixture = temporaryHarness();
  try {
    const taskFile = taskFixture(fixture.root, 'T-096', {
      target: {
        repository: 'harness',
        allowed_paths: ['harness/'],
        harness_write_paths: ['harness/runtime/'],
        forbidden_paths: ['project/']
      },
      execution_commands: [],
      validation_commands: [],
      manual_validation_required: true
    });
    const run = createRun(taskFile, { root: fixture.root, runId: 'snapshot-test' });
    const changed = path.join(fixture.root, 'runner-change.txt');
    fs.writeFileSync(changed, 'harness change', 'utf8');
    const finalized = finalizeRun(fixture.root, run.run_id, { requestedStatus: 'needs_review' });
    assert.equal(finalized.files_changed.includes('harness/runner-change.txt'), true);
  } finally {
    removeTemporaryHarness(fixture.repo);
  }
});

test('runner blocks a task whose dependency is not done', () => {
  const fixture = temporaryHarness();
  try {
    taskFixture(fixture.root, 'T-095');
    const dependent = taskFixture(fixture.root, 'T-094', { dependencies: ['T-095'] });
    assert.throws(() => createRun(dependent, { root: fixture.root, runId: 'dependency-test' }), /dependency T-095 đang ở trạng thái ready/);
  } finally {
    removeTemporaryHarness(fixture.repo);
  }
});

