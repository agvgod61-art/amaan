import fs from 'fs';

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/order\.totalAmount/g, 'order.total_amount');
  content = content.replace(/order\.shippingInfo/g, 'order.shipping_info');
  content = content.replace(/order\.paymentMethod/g, 'order.payment_method');
  content = content.replace(/order\.createdAt/g, 'order.created_at');
  fs.writeFileSync(filePath, content, 'utf8');
};

fixFile('src/pages/OrderHistory.tsx');
fixFile('src/pages/Admin.tsx');
fixFile('src/pages/TrackOrder.tsx');
