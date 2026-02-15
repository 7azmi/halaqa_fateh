'use client';

import type { Teacher, Student, DailyProgress } from './types';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

function sheetFetch(
  spreadsheetId: string,
  accessToken: string,
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${SHEETS_API}/${spreadsheetId}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

// --- Teachers (tab: Teachers, cols A–E: id, name, is_active, is_deleted, created_at)
const TEACHERS_RANGE = 'Teachers!A2:E';
const TEACHERS_COLS = 5;

function rowToTeacher(row: unknown[]): Teacher {
  return {
    id: String(row[0] ?? ''),
    name: String(row[1] ?? ''),
    is_active: Number(row[2]) === 1,
    is_deleted: Number(row[3]) === 1,
    created_at: String(row[4] ?? ''),
  };
}

function teacherToRow(t: Teacher): unknown[] {
  return [t.id, t.name, t.is_active ? 1 : 0, t.is_deleted ? 1 : 0, t.created_at];
}

export async function getTeachers(spreadsheetId: string, accessToken: string): Promise<Teacher[]> {
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(TEACHERS_RANGE)}`);
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { values?: unknown[][] };
  const rows = json.values ?? [];
  return rows.map(rowToTeacher).filter((t) => t.id && !t.is_deleted);
}

/** Get one teacher by id (includes soft-deleted). Used for sync. */
export async function getTeacherById(spreadsheetId: string, accessToken: string, id: string): Promise<Teacher | null> {
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(TEACHERS_RANGE)}`);
  if (!res.ok) return null;
  const json = (await res.json()) as { values?: unknown[][] };
  const rows = json.values ?? [];
  const row = rows.find((r) => String(r[0]) === id);
  return row ? rowToTeacher(row) : null;
}

export async function appendTeacher(
  spreadsheetId: string,
  accessToken: string,
  teacher: Teacher
): Promise<void> {
  const res = await sheetFetch(
    spreadsheetId,
    accessToken,
    `values/Teachers!A:E:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      body: JSON.stringify({ values: [teacherToRow(teacher)] }),
    }
  );
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
}

export async function updateTeacher(
  spreadsheetId: string,
  accessToken: string,
  teacher: Teacher
): Promise<void> {
  const rowIndex = await findRowById(spreadsheetId, accessToken, 'Teachers', 'A', teacher.id);
  if (rowIndex === -1) throw new Error(`Teacher not found: ${teacher.id}`);
  const range = `Teachers!A${rowIndex}:E${rowIndex}`;
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ values: [teacherToRow(teacher)] }),
  });
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
}

// --- Students (tab: Students, cols A–I)
const STUDENTS_RANGE = 'Students!A2:I';
const STUDENTS_COLS = 9;

function rowToStudent(row: unknown[], teachers?: Map<string, Teacher>): Student {
  const teacherId = row[4] ? String(row[4]) : undefined;
  const teacher = teacherId && teachers ? teachers.get(teacherId) : undefined;
  return {
    id: String(row[0] ?? ''),
    name: String(row[1] ?? ''),
    age: row[2] !== '' && row[2] !== undefined ? Number(row[2]) : undefined,
    current_surah: row[3] ? String(row[3]) : undefined,
    teacher_id: teacherId,
    teacher,
    is_active: Number(row[5]) === 1,
    is_deleted: Number(row[6]) === 1,
    created_at: String(row[7] ?? ''),
    updated_at: String(row[8] ?? ''),
  };
}

function studentToRow(s: Student): unknown[] {
  return [
    s.id,
    s.name,
    s.age ?? '',
    s.current_surah ?? '',
    s.teacher_id ?? '',
    s.is_active ? 1 : 0,
    s.is_deleted ? 1 : 0,
    s.created_at,
    s.updated_at,
  ];
}

export async function getStudents(
  spreadsheetId: string,
  accessToken: string,
  teachers?: Teacher[]
): Promise<Student[]> {
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(STUDENTS_RANGE)}`);
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { values?: unknown[][] };
  const rows = json.values ?? [];
  const teacherMap = teachers ? new Map(teachers.map((t) => [t.id, t])) : undefined;
  return rows.map((r) => rowToStudent(r, teacherMap)).filter((s) => s.id && !s.is_deleted);
}

/** Get one student by id (includes soft-deleted). Used for sync. */
export async function getStudentById(
  spreadsheetId: string,
  accessToken: string,
  id: string,
  teachers?: Teacher[]
): Promise<Student | null> {
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(STUDENTS_RANGE)}`);
  if (!res.ok) return null;
  const json = (await res.json()) as { values?: unknown[][] };
  const rows = json.values ?? [];
  const row = rows.find((r) => String(r[0]) === id);
  return row ? rowToStudent(row, teachers ? new Map(teachers.map((t) => [t.id, t])) : undefined) : null;
}

export async function appendStudent(
  spreadsheetId: string,
  accessToken: string,
  student: Student
): Promise<void> {
  const res = await sheetFetch(
    spreadsheetId,
    accessToken,
    `values/Students!A:I:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      body: JSON.stringify({ values: [studentToRow(student)] }),
    }
  );
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
}

export async function updateStudent(
  spreadsheetId: string,
  accessToken: string,
  student: Student
): Promise<void> {
  const rowIndex = await findRowById(spreadsheetId, accessToken, 'Students', 'A', student.id);
  if (rowIndex === -1) throw new Error(`Student not found: ${student.id}`);
  const range = `Students!A${rowIndex}:I${rowIndex}`;
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ values: [studentToRow(student)] }),
  });
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
}

// --- DailyProgress (tab: DailyProgress, cols A–J)
const PROGRESS_RANGE = 'DailyProgress!A2:J';

function rowToProgress(row: unknown[]): DailyProgress {
  return {
    id: String(row[0] ?? ''),
    student_id: String(row[1] ?? ''),
    hijri_date: String(row[2] ?? ''),
    hijri_month: String(row[3] ?? ''),
    day_number: Number(row[4]) || 0,
    pages_memorized: Number(row[5]) || 0,
    pages_reviewed: Number(row[6]) || 0,
    attendance_only: Number(row[7]) === 1,
    notes: row[8] ? String(row[8]) : undefined,
    created_at: String(row[9] ?? ''),
  };
}

function progressToRow(p: DailyProgress): unknown[] {
  return [
    p.id,
    p.student_id,
    p.hijri_date,
    p.hijri_month,
    p.day_number,
    p.pages_memorized,
    p.pages_reviewed,
    p.attendance_only ? 1 : 0,
    p.notes ?? '',
    p.created_at,
  ];
}

export async function getDailyProgress(
  spreadsheetId: string,
  accessToken: string,
  hijriDate?: string
): Promise<DailyProgress[]> {
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(PROGRESS_RANGE)}`);
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { values?: unknown[][] };
  const rows = json.values ?? [];
  let list = rows.map(rowToProgress);
  if (hijriDate) list = list.filter((p) => p.hijri_date === hijriDate);
  return list;
}

export async function getDailyProgressByMonth(
  spreadsheetId: string,
  accessToken: string,
  hijriMonth: string
): Promise<DailyProgress[]> {
  const list = await getDailyProgress(spreadsheetId, accessToken);
  return list.filter((p) => p.hijri_month === hijriMonth).sort((a, b) => a.day_number - b.day_number);
}

export async function appendDailyProgress(
  spreadsheetId: string,
  accessToken: string,
  entry: DailyProgress
): Promise<void> {
  const res = await sheetFetch(
    spreadsheetId,
    accessToken,
    `values/DailyProgress!A:J:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      body: JSON.stringify({ values: [progressToRow(entry)] }),
    }
  );
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
}

export async function updateDailyProgress(
  spreadsheetId: string,
  accessToken: string,
  entry: DailyProgress
): Promise<void> {
  const rowIndex = await findRowById(spreadsheetId, accessToken, 'DailyProgress', 'A', entry.id);
  if (rowIndex === -1) throw new Error(`DailyProgress not found: ${entry.id}`);
  const range = `DailyProgress!A${rowIndex}:J${rowIndex}`;
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ values: [progressToRow(entry)] }),
  });
  if (!res.ok) throw new Error(`Sheets API: ${res.status} ${await res.text()}`);
}

/** Find 1-based row index of the row where columnLetter equals value. Data starts at row 2. */
async function findRowById(
  spreadsheetId: string,
  accessToken: string,
  sheetName: string,
  columnLetter: string,
  value: string
): Promise<number> {
  const range = `${sheetName}!${columnLetter}2:${columnLetter}`;
  const res = await sheetFetch(spreadsheetId, accessToken, `values/${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error(`Sheets API: ${res.status}`);
  const json = (await res.json()) as { values?: unknown[][] };
  const rows = json.values ?? [];
  const index = rows.findIndex((row) => String(row[0]) === value);
  return index === -1 ? -1 : index + 2;
}
