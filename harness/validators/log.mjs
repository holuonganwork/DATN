const PHASES = new Set(['start', 'execute', 'validate', 'finalize', 'resume']);

export function validateLogEvent(event) {
  const errors = [];
  if (!event || typeof event !== 'object') return { ok: false, errors: ['event phải là object'] };
  if (event.schema_version !== 1) errors.push('schema_version phải là 1');
  for (const field of ['event_id', 'run_id', 'timestamp', 'phase', 'event_type', 'task_id']) {
    if (typeof event[field] !== 'string' || !event[field]) errors.push(`thiếu ${field}`);
  }
  if (!Number.isInteger(event.sequence) || event.sequence < 1) errors.push('sequence phải là số nguyên dương');
  if (!PHASES.has(event.phase)) errors.push(`phase không hợp lệ: ${event.phase}`);
  if (!/^T-\d{3}$/.test(event.task_id || '')) errors.push('task_id không hợp lệ');
  if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) errors.push('payload phải là object');
  return { ok: errors.length === 0, errors };
}

export function validateEventLog(events, { runId } = {}) {
  const errors = [];
  let expected = 1;
  for (const event of events) {
    const result = validateLogEvent(event);
    errors.push(...result.errors.map((error) => `event ${event?.sequence ?? '?'}: ${error}`));
    if (event?.sequence !== expected) errors.push(`sequence không liên tục: cần ${expected}, nhận ${event?.sequence}`);
    if (runId && event?.run_id !== runId) errors.push(`event ${event?.sequence ?? '?'} sai run_id`);
    expected += 1;
  }
  return { ok: errors.length === 0, errors, count: events.length };
}
