-- Connect to your database and run this SQL to insert test entry records

INSERT INTO entry_records (
  student_name,
  hist_no,
  course,
  admission_date,
  duration,
  receipt_no,
  amount,
  month,
  is_auto_generated,
  created_at,
  updated_at
) VALUES 
('Ahmed Khan', 'REG-001', 'Computer Science Diploma', '2026-01-15', '6 Months', 'RCP-001', 15000, 'June 2026', true, NOW(), NOW()),
('Fatima Ali', 'REG-002', 'Web Development Course', '2026-02-01', '4 Months', 'RCP-002', 12000, 'June 2026', true, NOW(), NOW()),
('Muhammad Hassan', 'REG-003', 'Data Entry Course', '2026-01-20', '3 Months', 'RCP-003', 8000, 'June 2026', true, NOW(), NOW()),
('Ayesha Malik', 'REG-004', 'Graphic Design Course', '2026-02-10', '5 Months', 'RCP-004', 18000, 'June 2026', false, NOW(), NOW()),
('Ali Ahmed', 'REG-005', 'Office Management', '2026-01-25', '4 Months', 'RCP-005', 10000, 'June 2026', true, NOW(), NOW()),
('Zara Sheikh', 'REG-006', 'Digital Marketing', '2026-02-15', '6 Months', 'RCP-006', 20000, 'June 2026', false, NOW(), NOW()),
('Hamza Khan', 'REG-007', 'Programming Fundamentals', '2026-01-30', '8 Months', 'RCP-007', 25000, 'June 2026', true, NOW(), NOW())
ON CONFLICT DO NOTHING;