-- 3. Categories Table
-- Stores custom budget categories for users

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  budget_limit DECIMAL(12, 2)
);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own categories
CREATE POLICY "Users can manage own categories" 
ON categories FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
