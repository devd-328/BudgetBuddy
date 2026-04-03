-- 5. Budgets Table
-- Stores monthly budget limits mapped to specific categories

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  limit_amount DECIMAL(12, 2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL
);

-- Make category, month, and year unique per user so they don't have duplicate budgets
ALTER TABLE budgets ADD CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year);

-- Enable Row Level Security (RLS)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own budgets
CREATE POLICY "Users can manage own budgets" 
ON budgets FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
