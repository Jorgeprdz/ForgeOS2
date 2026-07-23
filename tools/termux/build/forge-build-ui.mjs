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
const tty = process.stdout.isTTY && process.env.FORGE_BUILD_UI_PLAIN !== '1';
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
const bar = `${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}`;

const stripAnsi = (value) => value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
const crop = (value, length) => {
  const clean = stripAnsi(String(value));
  return clean.length > length ? `${clean.slice(0, Math.max(0, length - 1))}…` : clean;
};
const pad = (value, length) => {
  const clean = crop(value, length);
  return clean + ' '.repeat(Math.max(0, length - clean.length));
};
const symbol = (state) => ({ done: '✓', running: '◆', pending: '·', blocked: '!' }[state] || '·');

const left = [
  `MÓDULO  ${moduleId}`,
  `ESTADO  ${lifecycle}`,
  '',
  ...steps.map((step) => `${symbol(step.state)} ${step.label}`),
];
const right = [
  'FORGE BUILD SYSTEM',
  '',
  `Progreso   ${percent}%`,
  `${complete}/${steps.length || 0} pasos`,
  '',
  `Acción     ${action}`,
  `Ejecución  ${running ? 'EN CURSO' : complete === steps.length && steps.length ? 'DETENIDA' : 'PREPARANDO'}`,
  '',
  'Ctrl+C     detener con seguridad',
];
const rows = Math.max(left.length, right.length, 10);
const top = `┌${'─'.repeat(leftWidth + 2)}┬${'─'.repeat(rightWidth + 2)}┐`;
const sep = `├${'─'.repeat(leftWidth + 2)}┼${'─'.repeat(rightWidth + 2)}┤`;
const bottom = `└${'─'.repeat(leftWidth + 2)}┴${'─'.repeat(rightWidth + 2)}┘`;
const lines = [top];
for (let index = 0; index < rows; index += 1) {
  lines.push(`│ ${pad(left[index] || '', leftWidth)} │ ${pad(right[index] || '', rightWidth)} │`);
  if (index === 1) lines.push(sep);
}
lines.push(bottom);
lines.push(`  ${bar}  ${String(percent).padStart(3)}%`);

if (tty) process.stdout.write('\x1b[2J\x1b[H');
process.stdout.write(`${lines.join('\n')}\n`);
