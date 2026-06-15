import fs from 'fs';
import path from 'path';

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) {
        results = results.concat(walkDir(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace from "firebase/firestore" to "../lib/firebase"
  // But wait, the path to lib/firebase might be different depending on file depth.
  // We can use an absolute-ish import like "@/lib/firebase" if vite is configured, but let's just count depth.
  const depth = file.split('/').length - 2; // e.g. src/pages/Admin.tsx -> depth 1 -> ../lib/firebase
  // e.g. src/App.tsx -> depth 0 -> ./lib/firebase
  
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  const libPath = prefix + 'lib/firebase';
  
  if (content.includes('from "firebase/firestore"')) {
    content = content.replace(/from "firebase\/firestore"/g, 'from "' + libPath + '"');
    changed = true;
  }
  if (content.includes("from 'firebase/firestore'")) {
    content = content.replace(/from 'firebase\/firestore'/g, "from '" + libPath + "'");
    changed = true;
  }
  
  if (content.includes('from "firebase/storage"')) {
    content = content.replace(/from "firebase\/storage"/g, 'from "' + libPath + '"');
    changed = true;
  }
  if (content.includes("from 'firebase/storage'")) {
    content = content.replace(/from 'firebase\/storage'/g, "from '" + libPath + "'");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed imports in', file);
  }
});
