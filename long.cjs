const fs = require('fs');
const code = fs.readFileSync('bundle.js', 'utf8');

const regex = /["']([^"']{50,200})["']/g;
const matches = [...code.matchAll(regex)].map(m => m[1]);
const unique = [...new Set(matches.filter(s => s.includes(' ') && !s.includes('<path') && !s.includes('function') && !s.includes('return')))];
fs.writeFileSync('longstrings.txt', unique.slice(0, 100).join('\n'));
