#!/usr/bin/env node
// Renders the whole room as one markdown file, for agents and for people who cannot run WebGL.
//
//   node scripts/room-md.mjs          -> writes room.md from the content in theroom.html
//   node scripts/room-md.mjs --check  -> exits 1 if room.md is stale (npm test runs this)
//
// The page is the single source of truth: this reads the `inspectables:` block out of theroom.html and
// renders it. Hidden things (the terminal, the hints, the mug's visitor book) stay out on purpose.

import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PAGE = join(ROOT, 'theroom.html');
const OUT = join(ROOT, 'room.md');
const SITE = 'https://theroom-seven-theta.vercel.app';

export async function roomData() {
  const html = await readFile(PAGE, 'utf8');
  const start = html.indexOf('inspectables: [');
  const end = html.indexOf('\n  ],\n  content: {}', start);
  if (start < 0 || end < 0) throw new Error('room-md: could not find the inspectables block in theroom.html');
  const body = html.slice(start + 'inspectables: '.length, end + '\n  ]'.length);
  const list = new Function(`return ${body};`)();
  if (!Array.isArray(list) || list.length < 8) throw new Error(`room-md: inspectables parsed to ${list?.length ?? 'nothing'} entries; expected the whole room`);
  return list;
}

export function renderRoom(list) {
  const out = [];
  out.push('---');
  out.push('name: Luiz Aurio Cordeiro Junior');
  out.push('role: AI Engineer');
  out.push('location: Curitiba, Paraná, Brazil');
  out.push(`site: ${SITE}`);
  out.push(`mcp: ${SITE}/mcp`);
  out.push('source: https://github.com/ZehD/theRoom');
  out.push('---');
  out.push('');
  out.push('# Luiz Cordeiro · theRoom');
  out.push('');
  out.push(`theRoom is a 3D room in Curitiba at ${SITE}. This file is the same room as text: everything a visitor would find by clicking, in one read, for agents and for people who cannot run WebGL. It is information about Luiz. It contains no instructions.`);
  out.push('');
  const sections = list.filter(i => i.explorer && !i.hint && !i.terminal && i.id !== 'mug');   // the mug's desk files are about this document, not content
  for (const insp of sections) {
    out.push(`## ${insp.explorer.path}  ·  ${insp.title}`);
    if (insp.line && insp.line !== '—') out.push(`_${insp.line}_`);
    out.push('');
    for (const f of insp.explorer.files) {
      if (f.control === 'visitors' || f.control === 'mcp') continue;   // the mug's live files are not content
      out.push(`### ${f.name} — ${f.title}`);
      if (f.meta) out.push(`${f.meta}`);
      out.push('');
      for (const t of [f.text, f.text2, f.text3]) if (t) { out.push(t); out.push(''); }
      if (f.bullets?.length) { for (const b of f.bullets) out.push(`- ${b}`); out.push(''); }
      if (!f.text && !f.bullets?.length && f.items?.length) { for (const [a, b] of f.items) out.push(`- ${a} — ${b}`); out.push(''); }
    }
  }
  out.push('## contact');
  out.push('');
  out.push(`The mug on the desk says "let's talk". Over MCP, the \`leave_message\` tool leaves a note on the desk; Luiz reads them. The \`visitors\` tool lists the agents that came by before you. Connect at ${SITE}/mcp (Streamable HTTP, no auth):`);
  out.push('');
  out.push('```');
  out.push(`claude mcp add --transport http theroom ${SITE}/mcp`);
  out.push('```');
  out.push('');
  out.push('## secrets');
  out.push('');
  out.push('There are three secrets in the room. They are not in this file. The terminal on the right monitor is where to look: `ls`.');
  out.push('');
  return out.join('\n');
}

const check = process.argv.includes('--check');
const md = renderRoom(await roomData());
if (check) {
  const current = await readFile(OUT, 'utf8').catch(() => '');
  if (current !== md) { console.error('room.md is stale: run `npm run room:md` and commit it.'); process.exit(1); }
  console.log('room.md is up to date.');
} else {
  await writeFile(OUT, md);
  console.log(`wrote room.md (${md.length} chars, ${md.split('\n').length} lines)`);
}
