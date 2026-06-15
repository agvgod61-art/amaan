-- Copy and paste this script into the Supabase SQL Editor and click "Run"

-- 1. Create Admins table
CREATE TABLE IF NOT EXISTS admins (
  id text PRIMARY KEY, -- Email address
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Products table
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  description text,
  category text,
  image text,
  inStock boolean DEFAULT true,
  createdAt timestamp with time zone DEFAULT now()
);

-- 3. Create Categories table
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  image text,
  "order" integer,
  createdAt timestamp with time zone DEFAULT now()
);

-- 4. Create Gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id text PRIMARY KEY,
  title text,
  category text,
  image text NOT NULL,
  url text,
  type text,
  createdAt timestamp with time zone DEFAULT now()
);

-- 5. Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  productId text REFERENCES products(id) ON DELETE CASCADE,
  userId text,
  userName text,
  rating integer,
  comment text,
  createdAt timestamp with time zone DEFAULT now()
);

-- 6. Create Orders table
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id text UNIQUE NOT NULL,
  user_id text,
  user_email text,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  status text DEFAULT 'Processing',
  shipping_info jsonb NOT NULL,
  payment_method text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Create Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
  id text PRIMARY KEY, -- Composite ID: productId_size_color
  user_id text NOT NULL,
  product jsonb NOT NULL,
  size text NOT NULL,
  color text,
  quantity integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 8. Create Security Incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
  id text PRIMARY KEY, -- User ID
  uid text,
  email text,
  reason text,
  timestamp timestamp with time zone DEFAULT now()
);

-- 9. Create Blocked Users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id text PRIMARY KEY, -- User ID
  uid text,
  email text,
  reason text,
  blockedAt timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (temporarily allowing all access for easiest migration)
-- In a production environment, you should restrict these policies.

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON cart_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON security_incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write" ON blocked_users FOR ALL USING (true) WITH CHECK (true);
