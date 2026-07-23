#!/usr/bin/env node
import process from 'node:process';

const raw = process.env.FORGE_BUILD_UI_STEPS || '';
const steps = raw ? raw.split('|').filter(Boolean).map((entry) => {
  const [state, ...label] = entry.split(':');
  return { state, label: label.join(':') };
}) : [];

const moduleId = process.env.FORGE_BUILD_UI_MODULE || 'resolving';
const lifecycle = process.env.FORGE_BUILD_UI_STATE || 'declared';
const action = process.env.FORGE_BUILD_UI_ACTION || 'none';
const tty = Boolean(process.stdout.isTTY) && process.env.FORGE_BUILD_UI_PLAIN !== '1';
const color = tty && !('NO_COLOR' in process.env);
const width = Math.max(72, Math.min(Number(process.stdout.columns || 100), 132));
const inner = width - 4;
const leftWidth = Math.floor((inner - 3) * 0.54);
const rightWidth = inner - 3 - leftWidth;
const complete = steps.filter((step) => step.state === 'done').length;
const running = steps.some((step) => step.state === 'running');
const total = Math.max(steps.length, 1);
const percent = Math.floor((complete / total) * 100);
const barWidth = Math.max(20, inner - 18);
const filled = Math.round((percent / 100) * barWidth);

const ansi = {
  reset: color ? '\x1b[0m' : '',
  bold: color ? '\x1b[1m' : '',
  dim: color ? '\x1b[2m' : '',
  forge: color ? '\x1b[38;5;45m' : '',
  green: color ? '\x1b[38;5;82m' : '',
  yellow: color ? '\x1b[38;5;220m' : '',
  red: color ? '\x1b[38;5;196m' : '',
  muted: color ? '\x1b[38;5;245m' : '',
  white: color ? '\x1b[38;5;255m' : '',
};

const paint = (value, tone) => `${ansi[tone] || ''}${value}${ansi.reset}`;
const stripAnsi = (value) => value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
const crop = (value, length) => {
  const clean = stripAnsi(String(value));
  return clean.length > length ? `${clean.slice(0, Math.max(0, length - 1))}…` : clean;
};
const pad = (value, length) => {
  const string = String(value);
  const clean = crop(string, length);
  const visible = stripAnsi(clean).length;
  return clean + ' '.repeat(Math.max(0, length - visible));
};
const symbol = (state) => ({
  done: paint('✓', 'green'),
  running: paint('◆', 'forge'),
  pending: paint('·', 'muted'),
  blocked: paint('!', 'red'),
}[state] || paint('·', 'muted'));

const banner = [
  '███████╗ ██████╗ ██████╗  ██████╗ ███████╗     ██████╗██╗     ██╗',
  '██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝    ██╔════╝██║     ██║',
  '█████╗  ██║   ██║██████╔╝██║  ███╗█████╗      ██║     ██║     ██║',
  '██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝      ██║     ██║     ██║',
  '██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗    ╚██████╗███████╗██║',
  '╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝     ╚═════╝╚══════╝╚═╝',
];

const left = [
  `${paint('MÓDULO', 'muted')}  ${paint(moduleId, 'white')}`,
  `${paint('ESTADO', 'muted')}  ${paint(lifecycle, running ? 'forge' : 'yellow')}`,
  '',
  ...steps.map((step) => `${symbol(step.state)} ${step.label}`),
];
const right = [
  paint('FORGE BUILD SYSTEM', 'bold'),
  '',
  `${paint('Progreso', 'muted')}   ${paint(`${percent}%`, 'forge')}`,
  `${paint(`${complete}/${steps.length || 0}`, 'white')} pasos`,
  '',
  `${paint('Acción', 'muted')}     ${paint(action, action === 'none' ? 'muted' : 'yellow')}`,
  `${paint('Ejecución', 'muted')}  ${paint(running ? 'EN CURSO' : complete === steps.length && steps.length ? 'DETENIDA' : 'PREPARANDO', running ? 'green' : 'yellow')}`,
  '',
  `${paint('Ctrl+C', 'muted')}     detener con seguridad`,
];
const rows = Math.max(left.length, right.length, 10);
const top = `┌${'─'.repeat(leftWidth + 2)}┬${'─'.repeat(rightWidth + 2)}┐`;
const sep = `├${'─'.repeat(leftWidth + 2)}┼${'─'.repeat(rightWidth + 2)}┤`;
const bottom = `└${'─'.repeat(leftWidth + 2)}┴${'─'.repeat(rightWidth + 2)}┘`;
const lines = [];
if (width >= 92) {
  lines.push(...banner.map((line) => paint(line, 'forge')), '');
} else {
  lines.push(paint('FORGE CLI', 'forge'), '');
}
lines.push(top);
for (let index = 0; index < rows; index += 1) {
  lines.push(`│ ${pad(left[index] || '', leftWidth)} │ ${pad(right[index] || '', rightWidth)} │`);
  if (index === 1) lines.push(sep);
}
lines.push(bottom);
const progress = `${paint('█'.repeat(filled), 'forge')}${paint('░'.repeat(barWidth - filled), 'muted')}`;
lines.push(`  ${progress}  ${paint(String(percent).padStart(3), percent === 100 ? 'green' : 'forge')}%`);

if (tty) process.stdout.write('\x1b[2J\x1b[H');
process.stdout.write(`${lines.join('\n')}\n`);
