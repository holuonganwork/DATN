import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const harnessRoot = path.resolve(toolsDir, '..');
const repoRoot = path.dirname(harnessRoot);
const sourceDir = path.join(harnessRoot, 'tasks', 'inbox');
const outputDir = path.join(harnessRoot, 'tasks', 'ready');

function sectionMap(lines) {
  const sections = new Map();
  let current = '';
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].trim();
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current).push(line);
  }
  return sections;
}

function nonEmpty(lines) {
  return lines.map((line) => line.trim()).filter(Boolean);
}

function bullets(lines) {
  return lines.map((line) => line.match(/^\s*-\s+(?:\[ \]\s*)?(.*)$/)?.[1]?.trim()).filter(Boolean);
}

function numbered(lines) {
  return lines.map((line) => line.match(/^\s*\d+[.)]\s+(.*)$/)?.[1]?.trim()).filter(Boolean);
}

function field(lines, label) {
  return lines.find((line) => line.startsWith(`**${label}:**`))?.replace(`**${label}:**`, '').trim() || '';
}

function parseTask(fileName) {
  const sourcePath = path.join(sourceDir, fileName);
  const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);
  const heading = lines.find((line) => line.startsWith('# '))?.replace(/^#\s+/, '').trim() || fileName;
  const number = fileName.match(/^(\d{2})-/)?.[1];
  if (!number) return null;
  const taskId = `T-${Number(number).toString().padStart(3, '0')}`;
  const sections = sectionMap(lines);
  const objective = field(lines, 'Mục tiêu') || heading;
  const checklist = bullets(sections.get('Checklist') || []);
  const outputs = bullets(sections.get('Đầu ra') || []);
  const criteria = nonEmpty(sections.get('Tiêu chí hoàn thành') || []).filter((line) => !line.startsWith('#'));
  const riskSection = [...sections.entries()].find(([name]) => name.startsWith('Rủi ro'))?.[1] || [];
  const risks = bullets(riskSection);
  const completionDescription = criteria.join(' ').trim() || 'Hoàn thành toàn bộ checklist và bàn giao các đầu ra của task.';
  const previous = Number(number) - 1;
  const dependencies = previous > 0 ? [`T-${previous.toString().padStart(3, '0')}`] : [];
  return {
    schema_version: 1,
    id: taskId,
    title: heading.replace(/^Giai đoạn\s+\d+\s*[—-]\s*/, ''),
    status: 'ready',
    priority: Number(number) <= 5 ? 'high' : 'medium',
    objective,
    context_files: [
      'harness/context/project-brief.md',
      'harness/context/scope.md',
      'harness/context/current-state.md',
      'harness/context/architecture.md',
      'harness/context/conventions.md'
    ],
    target: {
      repository: 'project',
      allowed_paths: ['project/'],
      harness_write_paths: ['harness/state/', 'harness/evidence/', 'harness/runtime/'],
      forbidden_paths: ['project/.env', 'project/.env.*', '**/private-key*', '**/*secret*']
    },
    dependencies,
    preconditions: [
      previous > 0 ? `Task ${dependencies[0]} đã hoàn thành hoặc có bằng chứng đủ để tiếp tục.` : 'Đã chốt mục tiêu và phạm vi MVP.'
    ],
    implementation_notes: nonEmpty(sections.get('Mô tả') || []),
    checklist,
    acceptance_criteria: [
      {
        id: 'AC-1',
        description: completionDescription,
        verification: 'Đối chiếu checklist, output, test và evidence trong harness/evidence/.'
      }
    ],
    execution_commands: [],
    validation_commands: [],
    deliverables: outputs,
    out_of_scope: [],
    risks,
    retry_policy: { max_retries: 2, retry_failed_commands: true },
    completion_report: { required: ['files_changed', 'commands_run', 'validation_results', 'remaining_risks'] },
    source_document: path.relative(repoRoot, sourcePath).replaceAll('\\', '/'),
    manual_validation_required: true,
    duration: field(lines, 'Thời lượng')
  };
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const files = fs.readdirSync(sourceDir).filter((file) => /^\d{2}-.*\.md$/i.test(file)).sort();
  for (const file of files) {
    const task = parseTask(file);
    if (!task) continue;
    const target = path.join(outputDir, `${task.id}-${file.replace(/^\d{2}-/, '').replace(/\.md$/i, '')}.json`);
    fs.writeFileSync(target, `${JSON.stringify(task, null, 2)}\n`, 'utf8');
    console.log(`${task.id} -> ${path.relative(repoRoot, target)}`);
  }
}

main();

