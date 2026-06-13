import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function test() {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
        order_id: "ORD-12345",
        user_id: 'guest',
        user_email: null,
        items: [{
            product: { id: "p1", name: "Helmet", price: 100, type: "Full-face" },
            size: "M",
            color: "Black",
            quantity: 1
        }],
        total_amount: 100,
        status: 'Processing',
        shipping_info: {
          name: "Test User",
          phone: "1234567890",
          address: "12345678910",
          city: "Test City",
          pincode: "123456",
          whatsappUpdates: true
        },
        payment_method: "UPI",
        created_at: serverTimestamp()
    });
    console.log("Success!", docRef.id);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
test();
