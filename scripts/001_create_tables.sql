-- Quran Center Management System Database Schema

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  current_surah TEXT,
  teacher_id UUID REFERENCES teachers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily progress entries
CREATE TABLE IF NOT EXISTS daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  hijri_date TEXT NOT NULL, -- Format: YYYY-MM-DD in Hijri
  hijri_month TEXT NOT NULL, -- e.g., "جماد الثاني 1447"
  day_number INTEGER NOT NULL, -- 1-30
  pages_memorized DECIMAL(4,2) DEFAULT 0,
  pages_reviewed DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, hijri_date)
);

-- Activity types for financial reports
CREATE TABLE IF NOT EXISTS activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial reports (activities)
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  hijri_date TEXT NOT NULL,
  participant_count INTEGER NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  budget_before DECIMAL(10,2) NOT NULL,
  budget_after DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense items for each financial report
CREATE TABLE IF NOT EXISTS expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES financial_reports(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos attached to financial reports
CREATE TABLE IF NOT EXISTS report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES financial_reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget tracking
CREATE TABLE IF NOT EXISTS budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default activity types
INSERT INTO activity_types (name) VALUES 
  ('رياضة وصبوح'),
  ('رحلة'),
  ('مسابقة'),
  ('احتفال'),
  ('أخرى')
ON CONFLICT (name) DO NOTHING;

-- Insert initial budget record
INSERT INTO budget (current_balance) VALUES (15500)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_progress_student ON daily_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_date ON daily_progress(hijri_date);
CREATE INDEX IF NOT EXISTS idx_progress_month ON daily_progress(hijri_month);
CREATE INDEX IF NOT EXISTS idx_reports_date ON financial_reports(hijri_date);
CREATE INDEX IF NOT EXISTS idx_expense_report ON expense_items(report_id);

-- Disable RLS for internal tool (teacher-only access)
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget DISABLE ROW LEVEL SECURITY;
