-- Budget transactions for history tracking
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- 'deposit', 'expense', 'adjustment'
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- optional link to financial_report
  hijri_month TEXT, -- e.g., "جماد الثاني 1447"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_deleted column to teachers for soft delete
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add is_deleted column to activity_types for soft delete  
ALTER TABLE activity_types ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add attendance_only column to daily_progress
ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS attendance_only BOOLEAN DEFAULT false;

-- Create index for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_date ON budget_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_month ON budget_transactions(hijri_month);

-- Disable RLS
ALTER TABLE budget_transactions DISABLE ROW LEVEL SECURITY;
