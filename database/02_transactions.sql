-- 2. Transactions Table
-- Stores all income and expense entries

CREATE TABLE transactions (
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

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own transactions
CREATE POLICY "Users can manage own transactions" 
ON transactions FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
