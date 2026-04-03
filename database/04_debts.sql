-- 4. Debts Table
-- Tracks amounts the user has borrowed or lent out

CREATE TABLE debts (
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

-- Enable Row Level Security (RLS)
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own debts
CREATE POLICY "Users can manage own debts" 
ON debts FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
