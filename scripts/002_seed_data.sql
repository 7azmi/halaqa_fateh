-- Seed sample teachers (matching the spreadsheet)
INSERT INTO teachers (name, is_active) 
SELECT * FROM (VALUES 
  ('خليل', true),
  ('محمد', true),
  ('ثابت', true)
) AS t(name, is_active)
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teachers.name = t.name);
