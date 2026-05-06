const fs = require('fs');
const path = 'd:/DIAN R/APPKU/LPS-Siswa-main/src/App.tsx';
const s = fs.readFileSync(path, 'utf8');
const counts = { curly: 0, paren: 0, square: 0 };
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '{') counts.curly++;
  else if (ch === '}') counts.curly--;
  else if (ch === '(') counts.paren++;
  else if (ch === ')') counts.paren--;
  else if (ch === '[') counts.square++;
  else if (ch === ']') counts.square--;
}
console.log('counts:', counts);
const idx = s.indexOf('const menuIcons');
console.log('menuIcons index:', idx);
console.log(s.slice(Math.max(0, idx-200), idx+200));
// Count simple tag pairs in the part before menuIcons
const before = s.slice(0, idx);
const openDiv = (before.match(/<div(\s|>)/g) || []).length;
const closeDiv = (before.match(/<\/div>/g) || []).length;
const openSvg = (before.match(/<svg(\s|>)/g) || []).length;
const closeSvg = (before.match(/<\/svg>/g) || []).length;
console.log('openDiv, closeDiv:', openDiv, closeDiv);
console.log('openSvg, closeSvg:', openSvg, closeSvg);

// Find unclosed <div> positions by simple stack
const tagRegex = /<\/?div(?:\s[^>]*?)?>/g;
let m;
const stack = [];
while ((m = tagRegex.exec(before)) !== null) {
  const tag = m[0];
  const pos = m.index;
  const line = before.slice(0, pos).split('\n').length;
  console.log('tag:', tag.replace(/\n/g, ' '), 'at line', line);
  if (tag.startsWith('</')) {
    if (stack.length > 0) stack.pop();
    else console.log('Extra closing </div> at', pos);
  } else if (tag.endsWith('/>')) {
    // self-closing, ignore
  } else {
    stack.push({ tag: '<div>', pos });
  }
}
if (stack.length) {
  console.log('Unclosed <div> count:', stack.length);
  stack.slice(0, 10).forEach((t, i) => {
    const upto = before.slice(0, t.pos);
    const line = upto.split('\n').length;
    console.log(i + 1, 'pos', t.pos, 'line', line);
    const start = Math.max(0, t.pos - 400);
    const snippet = before.slice(start, t.pos + 400);
    console.log('--- snippet start ---');
    console.log(snippet);
    console.log('--- snippet end ---');
  });
}
