import fs from 'fs';
let content = fs.readFileSync('src/context/CartContext.tsx', 'utf8');
content = content.replace(/user\.uid/g, 'user.id');
fs.writeFileSync('src/context/CartContext.tsx', content, 'utf8');
