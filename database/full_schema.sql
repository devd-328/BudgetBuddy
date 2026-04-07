-- BudgetBuddy Consolidated Schema
-- Run this in the Supabase SQL Editor (https://app.supabase.com)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'Rs',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  budget_limit DECIMAL(12, 2)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
CREATE POLICY "Users can manage own categories" ON categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Debts Table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lent', 'owed')),
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'settled')) DEFAULT 'pending',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own debts" ON debts;
CREATE POLICY "Users can manage own debts" ON debts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  limit_amount DECIMAL(12, 2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "unique_user_category_month_year" ON budgets;
-- Note: Constraints cannot be dropped if they don't exist without catching errors, so we'll just try to add it.
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_category_month_year') THEN
    ALTER TABLE budgets ADD CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year);
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
