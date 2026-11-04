/**
 * Builds public/resume.pdf from the same data the site renders, so the résumé
 * never drifts from the About section. Run `npm run resume` after editing site.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/data/site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const W = 595.28; // A4
const H = 841.89;
const M = 54;
const RIGHT = W - M;
const MAXW = RIGHT - M;

const INK = [0.102, 0.09, 0.149];
const MUTED = [0.341, 0.322, 0.42];
const FAINT = [0.55, 0.53, 0.6];
const ACCENT = [0.341, 0.267, 0.839];
const RULE = [0.82, 0.8, 0.87];

const ops = [];
let y = H - 64;

const ascii = { '—': '-', '–': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '·': '|', 'é': 'e' };
const esc = (s) =>
  String(s)
    .replace(/[—–’‘“”·é]/g, (c) => ascii[c])
    .replace(/[\\()]/g, (c) => `\\${c}`)
    .replace(/[^\x20-\x7E]/g, '');

const fill = (color) => ops.push(`${color.map((c) => c.toFixed(3)).join(' ')} rg`);

function text(str, x, at, { size = 9.5, bold = false, color = INK, track = 0 } = {}) {
  fill(color);
  ops.push(
    `BT /${bold ? 'FB' : 'FR'} ${size} Tf ${track} Tc 1 0 0 1 ${x.toFixed(2)} ${at.toFixed(2)} Tm (${esc(str)}) Tj 0 Tc ET`,
  );
}

function rule(at, color = RULE, width = 0.7) {
  ops.push(
    `${width} w ${color.map((c) => c.toFixed(3)).join(' ')} RG ${M} ${at.toFixed(2)} m ${RIGHT} ${at.toFixed(2)} l S`,
  );
}

const measure = (str, size, bold = false) => str.length * size * (bold ? 0.56 : 0.5);

function wrap(str, size, maxWidth, bold = false) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next, size, bold) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function para(str, { size = 9.5, bold = false, color = INK, x = M, width = MAXW, leading = 1.5, after = 0 } = {}) {
  for (const line of wrap(str, size, width, bold)) {
    text(line, x, y, { size, bold, color });
    y -= size * leading;
  }
  y -= after;
}

function section(title) {
  y -= 12;
  text(title.toUpperCase(), M, y, { size: 7.6, bold: true, color: ACCENT, track: 1.7 });
  y -= 7;
  rule(y);
  y -= 17;
}

/* ------------------------------------------------------------------ header */
text(site.name, M, y, { size: 22, bold: true });
y -= 16;
text(site.role.toUpperCase(), M, y, { size: 9, bold: true, color: ACCENT, track: 1.3 });
y -= 15;
text(
  [site.email, `github.com/${site.githubUser}`, site.linkedinLabel, site.location]
    .filter(Boolean)
    .join('   |   '),
  M,
  y,
  { size: 8.4, color: MUTED },
);
y -= 14;
rule(y, INK, 1);

/* ----------------------------------------------------------------- profile */
section('Profile');
para(site.tagline, { size: 9.4, color: MUTED, leading: 1.55, after: 2 });
para(site.about[0], { size: 9.4, color: MUTED, leading: 1.55 });

const byKind = (kind) => site.timeline.filter((item) => item.kind === kind);

/* --------------------------------------------------------------- education */
section('Education');
for (const item of byKind('Education')) {
  text(item.title, M, y, { size: 10.2, bold: true });
  const when = item.when.toUpperCase();
  text(when, RIGHT - measure(when, 7.6, true), y, { size: 7.6, bold: true, color: FAINT, track: 0.5 });
  y -= 12.5;
  text(item.org, M, y, { size: 8.8, color: MUTED });
  y -= 16;
}

/* -------------------------------------------------------------- experience */
const experience = byKind('Experience');
if (experience.length) {
  section('Experience');
  for (const item of experience) {
    text(item.title, M, y, { size: 10.2, bold: true });
    const when = item.when.toUpperCase();
    text(when, RIGHT - measure(when, 7.6, true), y, { size: 7.6, bold: true, color: FAINT, track: 0.5 });
    y -= 12.5;
    text(item.org, M, y, { size: 8.8, color: MUTED });
    y -= 14;
    para(item.note, { size: 9, color: MUTED, leading: 1.5 });
  }
}

/* ------------------------------------------------------------------ skills */
section('Skills');
for (const group of site.skills) {
  text(group.group.toUpperCase(), M, y + 1, { size: 7.4, bold: true, color: MUTED, track: 0.9 });
  const startY = y;
  para(group.items.join('  ·  '), { size: 9.2, x: M + 92, width: MAXW - 92, leading: 1.45 });
  y = Math.min(y, startY - 13.4);
}

/* ---------------------------------------------------------------- projects */
section('Selected work');
for (const project of Object.values(site.projectOverrides)) {
  if (!project.title || project.featured === false) continue;
  text(project.title, M, y, { size: 10, bold: true });
  const meta = [project.language, ...(project.tags ?? []).filter((t) => t !== project.language)]
    .filter(Boolean)
    .slice(0, 4)
    .join('  ·  ');
  if (meta) {
    text(meta, RIGHT - measure(meta, 7.6), y, { size: 7.6, color: FAINT });
  }
  y -= 12.5;
  const blurb = project.blurb ? `${project.blurb.split('. ')[0]}.` : '';
  para(blurb, { size: 8.8, color: MUTED, leading: 1.45, after: 6 });
}

/* ------------------------------------------------------------------ footer */
const footerY = 46;
rule(footerY + 12);
text(`github.com/${site.githubUser}   ·   ${site.linkedinLabel}`, M, footerY, { size: 8, color: FAINT });
const page = 'Portfolio — résumé';
text(page, RIGHT - measure(page, 8), footerY, { size: 8, color: FAINT });

if (y < footerY + 20) {
  console.warn(`resume content ends at y=${y.toFixed(0)}; it may collide with the footer`);
}

/* ------------------------------------------------------------- pdf writing */
const content = ops.join('\n');
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Resources << /Font << /FR 5 0 R /FB 6 0 R >> >> /Contents 4 0 R >>`,
  `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
];

let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
const offsets = [];
objects.forEach((body, index) => {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
});

const xref = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

// Sanity check: every xref offset must land on its own object header.
offsets.forEach((offset, index) => {
  const native = Buffer.from(pdf, 'latin1').subarray(offset, offset + 12).toString('latin1');
  if (!native.startsWith(`${index + 1} 0 obj`)) {
    throw new Error(`xref offset ${index + 1} points at "${native}"`);
  }
});

const out = path.join(root, 'public/resume.pdf');
fs.writeFileSync(out, Buffer.from(pdf, 'latin1'));
console.log(`wrote ${path.relative(root, out)} (${(pdf.length / 1024).toFixed(1)} kB)`);
