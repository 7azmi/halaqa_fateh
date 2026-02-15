'use client';

import { createClient } from '@/lib/supabase/client';
import type { Student, Teacher, DailyProgress } from './types';

function getSupabase() {
  const supabase = createClient();
  if (!supabase) throw new Error('Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or use Google Sheets in Settings.');
  return supabase;
}

export async function createTeacherSupabase(data: Omit<Teacher, 'id' | 'created_at'>): Promise<Teacher> {
  const supabase = getSupabase();
  const { data: teacher, error } = await supabase.from('teachers').insert(data).select().single();
  if (error) throw new Error(error.message);
  return teacher as Teacher;
}

export async function updateTeacherSupabase(id: string, data: Partial<Teacher>): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('teachers').update(data).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteTeacherSupabase(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('teachers').update({ is_deleted: true, is_active: false }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function createStudentSupabase(
  data: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'teacher'>
): Promise<Student> {
  const supabase = getSupabase();
  const { data: student, error } = await supabase
    .from('students')
    .insert(data)
    .select('*, teacher:teachers(*)')
    .single();
  if (error) throw new Error(error.message);
  return student as Student;
}

export async function updateStudentSupabase(id: string, data: Partial<Student>): Promise<void> {
  const supabase = getSupabase();
  const { teacher, ...updateData } = data;
  const { error } = await supabase
    .from('students')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deactivateStudentSupabase(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('students')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function reactivateStudentSupabase(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('students')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getInactiveStudentsSupabase(): Promise<Student[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('students')
    .select('*, teacher:teachers(*)')
    .eq('is_active', false)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Student[];
}

export async function saveDailyProgressSupabase(entries: {
  student_id: string;
  hijri_date: string;
  hijri_month: string;
  day_number: number;
  pages_memorized?: number;
  pages_reviewed?: number;
  notes?: string;
}[]): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('daily_progress').upsert(entries, {
    onConflict: 'student_id,hijri_date',
    ignoreDuplicates: false,
  });
  if (error) throw new Error(error.message);
}

export async function markAttendanceOnlySupabase(entry: {
  student_id: string;
  hijri_date: string;
  hijri_month: string;
  day_number: number;
}): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('daily_progress')
    .upsert(
      {
        ...entry,
        pages_memorized: 0,
        pages_reviewed: 0,
        attendance_only: true,
      },
      { onConflict: 'student_id,hijri_date', ignoreDuplicates: false }
    );
  if (error) throw new Error(error.message);
}
