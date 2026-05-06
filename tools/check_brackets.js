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
// Find last 200 chars around the menuIcons location
const idx = s.indexOf('const menuIcons');
console.log('menuIcons index:', idx);
console.log(s.slice(Math.max(0, idx-200), idx+200));
