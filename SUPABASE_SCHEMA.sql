-- Supabase SQL Schema for AVG GOD Application
-- Copy and run this in your Supabase SQL Editor.

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers Table (Extends Supabase Auth Auth.users)
CREATE TABLE public.customers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  customer_id TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.customers FOR UPDATE USING (auth.uid() = id);

-- 2. Admins Table
CREATE TABLE public.admins (
  email TEXT PRIMARY KEY,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by TEXT
);

-- Enable RLS for admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Only admins can modify" ON public.admins FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);

-- 3. Products
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Full-face',
  model TEXT,
  price NUMERIC NOT NULL,
  description TEXT,
  weight TEXT,
  image TEXT,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft',
  colors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Only admins can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);
CREATE POLICY "Only admins can update products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);
CREATE POLICY "Only admins can delete products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);

-- 4. Categories
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);

-- 5. Orders
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id TEXT, -- Could be UUID from auth.users or 'guest'
  user_email TEXT,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Processing',
  shipping_info JSONB,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can process their own orders" ON public.orders FOR INSERT WITH CHECK (
  auth.uid()::text = user_id OR user_id = 'guest'
);
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (
  auth.uid()::text = user_id OR 
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);
CREATE POLICY "Only admins can update/delete orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);
CREATE POLICY "Only admins can update/delete orders" ON public.orders FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);

-- 6. Reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- auth.users UUID or 'guest'
  user_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  image TEXT,
  is_admin_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);

-- 7. Blocked Users
CREATE TABLE public.blocked_users (
  uid TEXT PRIMARY KEY,
  email TEXT,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for blocked users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to blocked_users" ON public.blocked_users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);

-- 8. Security Incidents
CREATE TABLE public.security_incidents (
  id TEXT PRIMARY KEY,
  email TEXT,
  violation TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security incidents
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to security_incidents" ON public.security_incidents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);

-- 9. Settings (general)
CREATE TABLE public.settings (
  id TEXT PRIMARY KEY, -- 'general'
  site_name TEXT,
  logo_image TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image TEXT,
  accent_color TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  footer_text TEXT,
  site_access TEXT DEFAULT 'public',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Only admins can modify settings" ON public.settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);

-- 10. Site Config (gallery)
CREATE TABLE public.site_config (
  id TEXT PRIMARY KEY, -- 'homepage_gallery'
  wide_image TEXT,
  square_image_1 TEXT,
  square_image_2 TEXT,
  technical_image TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for site config
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read site config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Only admins can modify site config" ON public.site_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt() ->> 'email')
);
