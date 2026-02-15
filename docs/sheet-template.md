# Google Sheet template — حلقة القرآن

Use one Google Workbook with **three sheets (tabs)**. Row 1 is always the header. Data starts at row 2.

---

## 1. Sheet: `Teachers`

| Column      | Header      | Type   | Notes                                      |
|------------|-------------|--------|--------------------------------------------|
| A          | id          | text   | UUID, e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| B          | name        | text   | Teacher name                               |
| C          | is_active   | number | 1 = active, 0 = inactive                    |
| D          | is_deleted  | number | 0 or empty = not deleted, 1 = soft deleted |
| E          | created_at  | text   | ISO date, e.g. `2025-01-15T10:00:00.000Z`  |

### Dummy data (copy into rows 2–4)

| id | name | is_active | is_deleted | created_at |
|----|------|-----------|------------|------------|
| t001-teacher-0001-4a2b-9c3d-111111111111 | خليل | 1 |  | 2025-01-01T08:00:00.000Z |
| t002-teacher-0002-4a2b-9c3d-222222222222 | محمد | 1 |  | 2025-01-01T08:00:00.000Z |
| t003-teacher-0003-4a2b-9c3d-333333333333 | ثابت | 1 |  | 2025-01-01T08:00:00.000Z |

---

## 2. Sheet: `Students`

| Column      | Header      | Type   | Notes                                      |
|------------|-------------|--------|--------------------------------------------|
| A          | id          | text   | UUID                                       |
| B          | name        | text   | Student name                               |
| C          | age         | number | Optional                                   |
| D          | current_surah | text | e.g. البقرة                                |
| E          | teacher_id  | text   | UUID from Teachers.id                      |
| F          | is_active   | number | 1 = active, 0 = inactive                  |
| G          | is_deleted  | number | 0 or empty = not deleted, 1 = soft deleted |
| H          | created_at  | text   | ISO date                                   |
| I          | updated_at  | text   | ISO date                                   |

### Dummy data (use teacher IDs from Teachers sheet above)

| id | name | age | current_surah | teacher_id | is_active | is_deleted | created_at | updated_at |
|----|------|-----|---------------|------------|-----------|------------|------------|------------|
| s001-student-0001-5b3c-0d4e-aaaaaaaaaaaa | أحمد | 10 | البقرة | t001-teacher-0001-4a2b-9c3d-111111111111 | 1 |  | 2025-01-01T09:00:00.000Z | 2025-01-01T09:00:00.000Z |
| s002-student-0002-5b3c-0d4e-bbbbbbbbbbbb | عمر | 9 | الفاتحة | t001-teacher-0001-4a2b-9c3d-111111111111 | 1 |  | 2025-01-01T09:00:00.000Z | 2025-01-01T09:00:00.000Z |
| s003-student-0003-5b3c-0d4e-cccccccccccc | يوسف | 11 | آل عمران | t002-teacher-0002-4a2b-9c3d-222222222222 | 1 |  | 2025-01-01T09:00:00.000Z | 2025-01-01T09:00:00.000Z |
| s004-student-0004-5b3c-0d4e-dddddddddddd | فاطمة | 8 | الفاتحة | t002-teacher-0002-4a2b-9c3d-222222222222 | 1 |  | 2025-01-01T09:00:00.000Z | 2025-01-01T09:00:00.000Z |
| s005-student-0005-5b3c-0d4e-eeeeeeeeeeee | مريم | 12 | النساء | t003-teacher-0003-4a2b-9c3d-333333333333 | 1 |  | 2025-01-01T09:00:00.000Z | 2025-01-01T09:00:00.000Z |
| s006-student-0006-5b3c-0d4e-ffffffffffff | علي | 10 | البقرة | t003-teacher-0003-4a2b-9c3d-333333333333 | 1 |  | 2025-01-01T09:00:00.000Z | 2025-01-01T09:00:00.000Z |

---

## 3. Sheet: `DailyProgress`

| Column         | Header         | Type   | Notes                                      |
|----------------|----------------|--------|--------------------------------------------|
| A              | id             | text   | UUID                                       |
| B              | student_id     | text   | UUID from Students.id                     |
| C              | hijri_date     | text   | YYYY-MM-DD (Hijri)                         |
| D              | hijri_month    | text   | e.g. جماد الثاني 1447                     |
| E              | day_number     | number | 1–30                                       |
| F              | pages_memorized| number |                                            |
| G              | pages_reviewed | number |                                            |
| H              | attendance_only| number | 0 or empty = false, 1 = true (attended, no pages) |
| I              | notes          | text   | Optional                                   |
| J              | created_at     | text   | ISO date                                   |

### Dummy data (use student IDs from Students sheet)

| id | student_id | hijri_date | hijri_month | day_number | pages_memorized | pages_reviewed | attendance_only | notes | created_at |
|----|------------|------------|-------------|------------|-----------------|----------------|-----------------|-------|------------|
| p001-progress-0001-6c4d-1e5f-aaaaaaaaaaaa | s001-student-0001-5b3c-0d4e-aaaaaaaaaaaa | 1447-06-01 | جماد الثاني 1447 | 1 | 1 | 2 | 0 |  | 2025-01-15T14:00:00.000Z |
| p002-progress-0002-6c4d-1e5f-bbbbbbbbbbbb | s002-student-0002-5b3c-0d4e-bbbbbbbbbbbb | 1447-06-01 | جماد الثاني 1447 | 1 | 0.5 | 1 | 0 |  | 2025-01-15T14:00:00.000Z |
| p003-progress-0003-6c4d-1e5f-cccccccccccc | s003-student-0003-5b3c-0d4e-cccccccccccc | 1447-06-01 | جماد الثاني 1447 | 1 | 0 | 0 | 1 | حاضر فقط | 2025-01-15T14:00:00.000Z |
| p004-progress-0004-6c4d-1e5f-dddddddddddd | s001-student-0001-5b3c-0d4e-aaaaaaaaaaaa | 1447-06-02 | جماد الثاني 1447 | 2 | 1.5 | 3 | 0 |  | 2025-01-16T14:00:00.000Z |
| p005-progress-0005-6c4d-1e5f-eeeeeeeeeeee | s004-student-0004-5b3c-0d4e-dddddddddddd | 1447-06-02 | جماد الثاني 1447 | 2 | 0.5 | 0.5 | 0 |  | 2025-01-16T14:00:00.000Z |
| p006-progress-0006-6c4d-1e5f-ffffffffffff | s005-student-0005-5b3c-0d4e-eeeeeeeeeeee | 1447-06-03 | جماد الثاني 1447 | 3 | 2 | 4 | 0 |  | 2025-01-17T14:00:00.000Z |
| p007-progress-0007-6c4d-1e5f-111111111111 | s006-student-0006-5b3c-0d4e-ffffffffffff | 1447-06-03 | جماد الثاني 1447 | 3 | 1 | 2 | 0 |  | 2025-01-17T14:00:00.000Z |
| p008-progress-0008-6c4d-1e5f-222222222222 | s002-student-0002-5b3c-0d4e-bbbbbbbbbbbb | 1447-06-03 | جماد الثاني 1447 | 3 | 0 | 0 | 1 |  | 2025-01-17T14:00:00.000Z |

---

## How to create the Sheet

1. Create a new Google Sheet.
2. Rename the first tab to **Teachers**, second to **Students**, third to **DailyProgress** (or add two new tabs and name all three exactly as above).
3. In each sheet, put the **header row** in row 1 with the column names exactly as in the tables (id, name, …).
4. Paste or type the dummy data into rows 2 onward. Keep **tab names and column order** exactly as specified so the app can read/write without config.

## Spreadsheet ID

From the Sheet URL  
`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`  
copy the `SPREADSHEET_ID` and paste it in the app (Settings or first-run screen) so the app knows which workbook to use.
