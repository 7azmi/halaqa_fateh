'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import type { Student, Teacher, DailyProgress } from './types';

async function getSupabase() {
  const supabase = await createClient();
  if (!supabase) throw new Error('Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or use the app with Google Sheets (coming soon).');
  return supabase;
}

// Teacher actions
export async function createTeacher(data: Omit<Teacher, 'id' | 'created_at'>) {
  const supabase = await getSupabase();
  const { data: teacher, error } = await supabase
    .from('teachers')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateTag('teachers', 'max');
  return teacher;
}

export async function updateTeacher(id: string, data: Partial<Teacher>) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('teachers')
    .update(data)
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('teachers', 'max');
}

// Student actions
export async function createStudent(data: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'teacher'>) {
  const supabase = await getSupabase();
  const { data: student, error } = await supabase
    .from('students')
    .insert(data)
    .select('*, teacher:teachers(*)')
    .single();

  if (error) throw new Error(error.message);
  revalidateTag('students', 'max');
  return student;
}

export async function updateStudent(id: string, data: Partial<Student>) {
  const supabase = await getSupabase();
  const { teacher, ...updateData } = data;
  const { error } = await supabase
    .from('students')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('students', 'max');
}

export async function deactivateStudent(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('students')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('students', 'max');
}

export async function reactivateStudent(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('students')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('students', 'max');
}

// Daily Progress actions
export async function saveDailyProgress(entries: {
  student_id: string;
  hijri_date: string;
  hijri_month: string;
  day_number: number;
  pages_memorized?: number;
  pages_reviewed?: number;
  notes?: string;
}[]) {
  const supabase = await getSupabase();
  
  // Upsert based on student_id and hijri_date
  const { error } = await supabase
    .from('daily_progress')
    .upsert(entries, {
      onConflict: 'student_id,hijri_date',
      ignoreDuplicates: false
    });

  if (error) throw new Error(error.message);
  revalidateTag('daily_progress', 'max');
}

export async function updateDailyProgressEntry(
  studentId: string, 
  hijriDate: string, 
  data: Partial<DailyProgress>
) {
  const supabase = await getSupabase();
  const { student, ...updateData } = data;
  
  const { error } = await supabase
    .from('daily_progress')
    .update(updateData)
    .eq('student_id', studentId)
    .eq('hijri_date', hijriDate);

  if (error) throw new Error(error.message);
  revalidateTag('daily_progress', 'max');
}

// Mark attendance only (no memorization entry)
export async function markAttendanceOnly(entry: {
  student_id: string;
  hijri_date: string;
  hijri_month: string;
  day_number: number;
}) {
  const supabase = await getSupabase();
  
  const { error } = await supabase
    .from('daily_progress')
    .upsert({
      ...entry,
      pages_memorized: 0,
      pages_reviewed: 0,
      attendance_only: true
    }, {
      onConflict: 'student_id,hijri_date',
      ignoreDuplicates: false
    });

  if (error) throw new Error(error.message);
  revalidateTag('daily_progress', 'max');
}

// Teacher delete
export async function deleteTeacher(id: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('teachers')
    .update({ is_deleted: true, is_active: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('teachers', 'max');
}

// Get inactive students for reactivation
export async function getInactiveStudents() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('students')
    .select('*, teacher:teachers(*)')
    .eq('is_active', false)
    .order('name');

  if (error) throw new Error(error.message);
  return data;
}
