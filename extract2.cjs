const fs = require('fs');
const code = fs.readFileSync('bundle.js', 'utf8');

const regex = /["']([\w \-!?,.]{15,40})["']/g;
const matches = [...code.matchAll(regex)].map(m => m[1]);
const interesting = [...new Set(matches.filter(m => !m.includes('React') && !m.includes('Webkit') && !m.includes('Error')))].slice(200, 300);
fs.writeFileSync('strings.txt', interesting.join('\n'));
