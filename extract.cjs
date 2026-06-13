const fs = require('fs');
const code = fs.readFileSync('bundle.js', 'utf8');

// try to extract some readable text out of bundle.js
const words = [...code.matchAll(/([A-Z][a-z0-9_]{3,}\s?)+/g)].map(m => m[0]);
const interesting = words.filter(w => w.length > 15 && !w.includes('React') && !w.includes('Node'));
fs.writeFileSync('words.txt', [...new Set(interesting)].slice(0, 100).join('\n'));
