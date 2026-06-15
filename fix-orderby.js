import fs from 'fs';

const replaceText = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/orderBy\("createdAt"/g, 'orderBy("created_at"');
  fs.writeFileSync(filePath, content, 'utf8');
};

replaceText('src/pages/OrderHistory.tsx');
// In Admin.tsx, there are products and orders that both use createdAt.
// Let's be careful. Let's just fix it for orders.
let adminContent = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
adminContent = adminContent.replace(/query\(collection\(db, "orders"\), orderBy\("createdAt"/g, 'query(collection(db, "orders"), orderBy("created_at"');
fs.writeFileSync('src/pages/Admin.tsx', adminContent, 'utf8');
