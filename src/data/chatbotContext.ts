import { products } from "./products";

export const getStoreContext = () => {
  const productInfo = products.map(p => `- ${p.name}: ₹${p.price} (${p.type}) - ${p.description.substring(0, 100)}...`).join('\n');
  
  const policies = `
Shipping:
- Delivery in 3-7 business days.
- Free shipping across India for helmets.
- Inspection required upon delivery.

Returns & Exchanges:
- 7-30 days return window.
- Must be unused, unworn, with all tags and protective film intact.
- Visor film removal voids return.
- Original packaging required.
- Free first exchange for size mismatches on premium helmets.
- 10-15% restocking fee for standard returns.

Non-Returnable:
- Ridden-in helmets.
- Final sale/Clearance items.
- Custom gear.
  `;

  const sizing = `
Helmet Sizing Guide:
- Use a soft measuring tape around your head, about 1 inch (2.5cm) above eyebrows and just above ears.
- AGV Size Chart:
  - XS: 53–54 cm
  - S: 55–56 cm
  - M: 57–58 cm
  - L: 59–60 cm
  - XL: 61–62 cm
  - XXL: 63–64 cm
- Pro Tip: If between sizes, choose smaller for snug fit (liners expand 10-15%).
- Snug Test: Helmet shouldn't rotate; cheeks should be slightly compressed.
- wear it for 15-20 min at home to identify pressure points.
  `;

  const guidelines = `
Step-by-Step Purchase Guide:
1. Browse: Go to the "Shop" page to see our full collection.
2. Selection: Click on any product to see details, then select your size and color.
3. Cart: Click "Add to Cart" or "Buy Now" for instant checkout.
4. Checkout: In the Checkout page, enter your mobile number to receive a 6-digit OTP.
5. Delivery: After OTP verification, enter your full name, address, and pin code.
6. Order: Click "Place Order". You will receive an Order ID.
7. Support: You can message us on WhatsApp with your Order ID for real-time updates.

Contacting Customer Support:
- WhatsApp: +91 8292908076 (Replies within 2 hours)
- Email: Support@motogp.com (Replies within 24hr to 48hr)
- Phone: +91 8292908076
- Availability: 10 AM - 7 PM (Mon-Sat)

Finding the Best Product for You:
- Tell me your bike type (e.g., Sports, Naked, Cruiser).
- Your primary use (Daily commute, Track days, Weekend touring).
- Your budget range.
- I can recommend helmets from AGV, Shoei, or Shark based on these!
  `;

  return `
Store Name: AVG GOD
Specialty: Premium Riding Gear (AGV, Shoei, Shark, Motorcycles, Accessories)

Helpful Guides:
${guidelines}

Products:
${productInfo}

Policies:
${policies}

Sizing:
${sizing}
  `;
};
