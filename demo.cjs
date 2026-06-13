const fs = require('fs');
const code = fs.readFileSync('bundle.js', 'utf8');

const regex = /demo[a-z0-9]*/gi;
const matches = [...code.matchAll(regex)].map(m => m[0]);
console.log([...new Set(matches)]);
