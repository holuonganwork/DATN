import fs from 'node:fs';
import path from 'node:path';

export const TASK_STATUSES = new Set(['draft', 'ready', 'active', 'done', 'failed', 'blocked']);
export const RUN_STATUSES = new Set(['running', 'passed', 'failed', 'blocked', 'needs_review', 'cancelled']);
export const PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
export const QUALITY_PROFILES = new Set(['docs', 'code', 'harness']);

const REQUIRED_FIELDS = [
  'schema_version',
  'id',
  'title',
  'status',
  'priority',
  'objective',
  'context_files',
  'target',
  'dependencies',
  'preconditions',
  'acceptance_criteria',
  'execution_commands',
  'validation_commands',
  'deliverables',
  'out_of_scope',
  'risks',
  'retry_policy',
  'completion_report'
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isCommandArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' || (isPlainObject(item) && typeof item.command === 'string'));
}

export function validateTaskObject(task, { knownIds = new Set(), source = '<task>' } = {}) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(task)) {
    return { ok: false, errors: [`${source}: task phải là object`], warnings };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in task)) errors.push(`${source}: thiếu trường bắt buộc ${field}`);
  }

  if (task.schema_version !== 1) errors.push(`${source}: schema_version phải là 1`);
  if (typeof task.id !== 'string' || !/^T-\d{3}$/.test(task.id)) {
    errors.push(`${source}: id phải có dạng T-001`);
  }
  if (typeof task.title !== 'string' || !task.title.trim()) errors.push(`${source}: title không được rỗng`);
  if (!TASK_STATUSES.has(task.status)) errors.push(`${source}: status không hợp lệ`);
  if (!PRIORITIES.has(task.priority)) errors.push(`${source}: priority không hợp lệ`);
  if (typeof task.objective !== 'string' || !task.objective.trim()) errors.push(`${source}: objective không được rỗng`);

  for (const field of ['context_files', 'dependencies', 'preconditions', 'deliverables', 'out_of_scope', 'risks']) {
    if (!isStringArray(task[field])) errors.push(`${source}: ${field} phải là mảng chuỗi`);
  }
  for (const field of ['execution_commands', 'validation_commands']) {
    if (!isCommandArray(task[field])) errors.push(`${source}: ${field} phải là mảng command chuỗi hoặc object có command`);
  }

  if (!isPlainObject(task.target)) {
    errors.push(`${source}: target phải là object`);
  } else {
    if (typeof task.target.repository !== 'string' || !task.target.repository.trim()) errors.push(`${source}: target.repository không được rỗng`);
    if (!isStringArray(task.target.allowed_paths)) errors.push(`${source}: target.allowed_paths phải là mảng chuỗi`);
    if (task.target.harness_write_paths !== undefined && !isStringArray(task.target.harness_write_paths)) {
      errors.push(`${source}: target.harness_write_paths phải là mảng chuỗi`);
    }
    if (task.target.forbidden_paths !== undefined && !isStringArray(task.target.forbidden_paths)) {
      errors.push(`${source}: target.forbidden_paths phải là mảng chuỗi`);
    }
    for (const candidate of [ ...(task.target.allowed_paths ?? []), ...(task.target.harness_write_paths ?? []), ...(task.target.forbidden_paths ?? []) ]) {
      if (candidate.includes('..')) errors.push(`${source}: đường dẫn không được chứa ..: ${candidate}`);
    }
  }

  if (!Array.isArray(task.acceptance_criteria) || task.acceptance_criteria.length === 0) {
    errors.push(`${source}: acceptance_criteria phải có ít nhất một phần tử`);
  } else {
    const criteriaIds = new Set();
    for (const criterion of task.acceptance_criteria) {
      if (!isPlainObject(criterion)) {
        errors.push(`${source}: acceptance_criteria phải chứa object`);
        continue;
      }
      if (typeof criterion.id !== 'string' || !criterion.id.trim()) errors.push(`${source}: acceptance criterion thiếu id`);
      if (criteriaIds.has(criterion.id)) errors.push(`${source}: trùng acceptance criterion ${criterion.id}`);
      criteriaIds.add(criterion.id);
      if (typeof criterion.description !== 'string' || !criterion.description.trim()) errors.push(`${source}: criterion ${criterion.id} thiếu description`);
      if (typeof criterion.verification !== 'string' || !criterion.verification.trim()) errors.push(`${source}: criterion ${criterion.id} thiếu verification`);
    }
  }

  if (!isPlainObject(task.retry_policy) || !Number.isInteger(task.retry_policy.max_retries) || task.retry_policy.max_retries < 0 || task.retry_policy.max_retries > 10) {
    errors.push(`${source}: retry_policy.max_retries phải là số nguyên từ 0 đến 10`);
  }
  if (!isPlainObject(task.completion_report) || !isStringArray(task.completion_report.required)) {
    errors.push(`${source}: completion_report.required phải là mảng chuỗi`);
  }

  if (task.dependencies.some((id) => id === task.id)) errors.push(`${source}: task không được phụ thuộc chính nó`);
  for (const dependency of task.dependencies) {
    if (!/^T-\d{3}$/.test(dependency)) errors.push(`${source}: dependency không hợp lệ ${dependency}`);
    if (knownIds.size > 0 && !knownIds.has(dependency)) warnings.push(`${source}: dependency chưa có trong catalog ${dependency}`);
  }

  if (task.source_document !== undefined && typeof task.source_document !== 'string') warnings.push(`${source}: source_document nên là chuỗi`);
  if (task.checklist !== undefined && !isStringArray(task.checklist)) errors.push(`${source}: checklist phải là mảng chuỗi`);
  if (task.manual_validation_required !== undefined && typeof task.manual_validation_required !== 'boolean') errors.push(`${source}: manual_validation_required phải là boolean`);

  if (task.quality_profile !== undefined && !QUALITY_PROFILES.has(task.quality_profile)) {
    errors.push(`${source}: quality_profile phải là docs, code hoặc harness`);
  }
  if (task.quality_gates !== undefined) {
    if (!isPlainObject(task.quality_gates)) {
      errors.push(`${source}: quality_gates phải là object`);
    } else {
      for (const field of ['require_validation_commands', 'require_evidence', 'require_diff_check', 'require_quality_review_event']) {
        if (task.quality_gates[field] !== undefined && typeof task.quality_gates[field] !== 'boolean') {
          errors.push(`${source}: quality_gates.${field} phải là boolean`);
        }
      }
    }
  }
  if (['code', 'harness'].includes(task.quality_profile)
      && task.quality_gates?.require_validation_commands !== false
      && (!Array.isArray(task.validation_commands) || task.validation_commands.length === 0)) {
    errors.push(`${source}: task quality_profile=${task.quality_profile} phải có validation_commands`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function readTask(filePath) {
  const source = path.resolve(filePath);
  let raw;
  try {
    raw = fs.readFileSync(source, 'utf8');
  } catch (error) {
    throw new Error(`Không đọc được task ${source}: ${error.message}`);
  }
  let task;
  try {
    task = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Task không phải JSON hợp lệ ${source}: ${error.message}`);
  }
  const result = validateTaskObject(task, { source });
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return task;
}

export function validateTaskDirectory(directory, { knownIds = new Set() } = {}) {
  const errors = [];
  const warnings = [];
  const tasks = [];
  if (!fs.existsSync(directory)) return { ok: false, tasks, errors: [`Không tồn tại thư mục task ${directory}`], warnings };
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.json')).sort();
  const ids = new Set(knownIds);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    let task;
    try {
      task = readTask(fullPath);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    if (ids.has(task.id)) errors.push(`${fullPath}: trùng task id ${task.id}`);
    ids.add(task.id);
    tasks.push(task);
  }
  return { ok: errors.length === 0, tasks, errors, warnings };
}

