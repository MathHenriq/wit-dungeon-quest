#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const NEW_FILE = 'C:/Users/Matheus/Downloads/equipmentAbilityRegistry_LOTES_2_a_8.ts';
const REGISTRY = path.resolve(__dirname, '..', 'src', 'lib', 'battle', 'equipmentAbilityRegistry.ts');
const DO_NOT_TOUCH = new Set([
  'water-breathing_combo',
  'titan-serum_combo',
  'cruel-sun_combo',
  'murasame_unique',
]);

// Parse a TS source for top-level entries of the form:
//   <indent>'key': {
//      ...balanced braces...
//   <indent>},
// Returns array of { key, start, end, text } where text includes the entry
// (from the opening `'key':` line through the closing `},` line).
//
// We parse by scanning line-by-line. When we see a line matching
//   /^(\s*)'([a-z0-9-]+(?:_combo|_unique))':\s*\{\s*$/
// inside the registry (or anywhere in the new file), we then track brace
// depth starting at +1 until we hit depth 0; that line must be the closing
// brace at the same indentation followed by `,`.

function parseEntries(text, indentMustBe /* string|null */) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^(\s*)'([a-z0-9-]+(?:_combo|_unique))':\s*\{\s*$/);
    if (m && (indentMustBe === null || m[1] === indentMustBe)) {
      const indent = m[1];
      const key = m[2];
      const startIdx = i;
      // Count braces from this line; we start at depth 1 because of the `{`.
      // But we count the entire line so the math works generically.
      let depth = 0;
      let endIdx = -1;
      for (let j = i; j < lines.length; j++) {
        const l = lines[j];
        // Strip strings and comments to avoid counting braces inside them.
        // Simple state machine.
        let k = 0;
        while (k < l.length) {
          const c = l[k];
          if (c === '/' && l[k + 1] === '/') break; // line comment
          if (c === '/' && l[k + 1] === '*') {
            const close = l.indexOf('*/', k + 2);
            if (close === -1) { k = l.length; break; }
            k = close + 2; continue;
          }
          if (c === "'" || c === '"' || c === '`') {
            const q = c;
            k++;
            while (k < l.length) {
              if (l[k] === '\\') { k += 2; continue; }
              if (l[k] === q) { k++; break; }
              k++;
            }
            continue;
          }
          if (c === '{') depth++;
          else if (c === '}') {
            depth--;
            if (depth === 0) {
              // The rest of the line should be `,` (with optional trailing
              // whitespace/comment). Accept either `},` or just `}` then a
              // separate line — but in our files entries always end `},`.
              endIdx = j;
              break;
            }
          }
          k++;
        }
        if (endIdx !== -1) break;
      }
      if (endIdx === -1) {
        throw new Error(`Unterminated entry for key '${key}' starting at line ${startIdx + 1}`);
      }
      const block = lines.slice(startIdx, endIdx + 1).join('\n');
      entries.push({ key, indent, startIdx, endIdx, text: block });
      i = endIdx + 1;
    } else {
      i++;
    }
  }
  return entries;
}

const newSrc = fs.readFileSync(NEW_FILE, 'utf8');
const regSrc = fs.readFileSync(REGISTRY, 'utf8');

// New file entries are indented with 2 spaces (per the snippets).
const newEntries = parseEntries(newSrc, '  ');
console.log(`Parsed ${newEntries.length} entries from new file`);

// Registry entries — also 2 spaces.
const regEntries = parseEntries(regSrc, '  ');
console.log(`Parsed ${regEntries.length} entries from registry`);

const regByKey = new Map(regEntries.map(e => [e.key, e]));

const regLines = regSrc.split(/\r?\n/);
// Build a modification plan: array of {startIdx, endIdx, newText} for replacements,
// plus a list of new entries to append.

const replacements = [];
const additions = [];
const skipped = [];

for (const ne of newEntries) {
  if (DO_NOT_TOUCH.has(ne.key)) {
    skipped.push(ne.key);
    continue;
  }
  const existing = regByKey.get(ne.key);
  if (existing) {
    replacements.push({ startIdx: existing.startIdx, endIdx: existing.endIdx, text: ne.text, key: ne.key });
  } else {
    additions.push(ne);
  }
}

// Apply replacements from bottom to top to keep indices valid.
replacements.sort((a, b) => b.startIdx - a.startIdx);
let outLines = regLines.slice();
for (const r of replacements) {
  const newBlockLines = r.text.split('\n');
  outLines.splice(r.startIdx, r.endIdx - r.startIdx + 1, ...newBlockLines);
}

// Find the closing `};` of the registry object. It is the line `};` that
// immediately follows the last entry, and is preceded by the `const registry`
// opening. We look for the line `};` after the last entry — easiest: find
// the line `};` after the line containing `const registry`.
let closingIdx = -1;
let openIdx = outLines.findIndex(l => l.includes('const registry: Record'));
if (openIdx === -1) throw new Error('Could not find registry opening');
for (let j = openIdx + 1; j < outLines.length; j++) {
  if (/^\};\s*$/.test(outLines[j])) { closingIdx = j; break; }
}
if (closingIdx === -1) throw new Error('Could not find registry closing };');

// Build appended block: blank line + comment + each new entry separated by blank line.
if (additions.length > 0) {
  const appendLines = [
    '',
    '  // ═══════════════════════════════════════════════════════════════',
    '  // NEW ENTRIES — added by merge_handlers.cjs',
    '  // ═══════════════════════════════════════════════════════════════',
    '',
  ];
  for (const a of additions) {
    appendLines.push(...a.text.split('\n'));
    appendLines.push('');
  }
  // Insert before closingIdx
  outLines.splice(closingIdx, 0, ...appendLines);
}

fs.writeFileSync(REGISTRY, outLines.join('\n'), 'utf8');

console.log(`Replacements: ${replacements.length}`);
console.log(`Additions: ${additions.length}`);
if (additions.length) {
  console.log('Added keys:');
  for (const a of additions) console.log('  + ' + a.key);
}
console.log(`Skipped (DO NOT TOUCH): ${skipped.length} -> ${skipped.join(', ') || '(none)'}`);
