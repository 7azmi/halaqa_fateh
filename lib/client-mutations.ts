'use client';

import { cacheData, saveOfflineFirst, deleteOfflineFirst } from '@/lib/offline-store';
import type { Teacher, Student, DailyProgress } from './types';

export async function createTeacherClient(data: Omit<Teacher, 'id' | 'created_at'>): Promise<Teacher> {
  const teacher: Teacher = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const out = await saveOfflineFirst('teachers', teacher, 'create');
  return out as Teacher;
}

export async function updateTeacherClient(id: string, data: Partial<Teacher>): Promise<void> {
  const { getCachedData } = await import('@/lib/offline-store');
  const list = await getCachedData<Teacher>('teachers');
  const current = list.find((t) => t.id === id);
  if (!current) throw new Error('Teacher not found');
  await saveOfflineFirst('teachers', { ...current, ...data } as Teacher, 'update');
}

export async function softDeleteTeacherClient(id: string): Promise<void> {
  const { getCachedData, addPendingAction, cacheData } = await import('@/lib/offline-store');
  const list = await getCachedData<Teacher>('teachers');
  const current = list.find((t) => t.id === id);
  if (!current) throw new Error('Teacher not found');
  await addPendingAction({
    type: 'update',
    table: 'teachers',
    data: { ...current, is_deleted: true, is_active: false } as Record<string, unknown>,
  });
  await cacheData('teachers', list.filter((t) => t.id !== id));
}

export async function createStudentClient(
  data: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'teacher'>
): Promise<Student> {
  const now = new Date().toISOString();
  const student: Student = {
    ...data,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  const out = await saveOfflineFirst('students', student, 'create');
  return out as Student;
}

export async function updateStudentClient(id: string, data: Partial<Student>): Promise<void> {
  const { getCachedData } = await import('@/lib/offline-store');
  const list = await getCachedData<Student>('students');
  const current = list.find((s) => s.id === id);
  if (!current) throw new Error('Student not found');
  const updated = { ...current, ...data, updated_at: new Date().toISOString() };
  await saveOfflineFirst('students', updated, 'update');
}

export async function softDeleteStudentClient(id: string): Promise<void> {
  const { getCachedData, addPendingAction, cacheData } = await import('@/lib/offline-store');
  const list = await getCachedData<Student>('students');
  const current = list.find((s) => s.id === id);
  if (!current) throw new Error('Student not found');
  await addPendingAction({
    type: 'update',
    table: 'students',
    data: { ...current, is_deleted: true, is_active: false, updated_at: new Date().toISOString() } as Record<string, unknown>,
  });
  await cacheData('students', list.filter((s) => s.id !== id));
}

export async function reactivateStudentClient(id: string): Promise<void> {
  await updateStudentClient(id, { is_active: true, is_deleted: false });
}

export async function updateDailyProgressClient(entry: DailyProgress): Promise<void> {
  await saveOfflineFirst('daily_progress', entry, 'update');
}

export async function saveDailyProgressClient(
  entries: {
    id?: string;
    student_id: string;
    hijri_date: string;
    hijri_month: string;
    day_number: number;
    pages_memorized?: number;
    pages_reviewed?: number;
    attendance_only?: boolean;
    notes?: string;
    created_at?: string;
  }[]
): Promise<void> {
  const { getCachedData } = await import('@/lib/offline-store');
  const now = new Date().toISOString();
  for (const e of entries) {
    if (e.id) {
      const list = await getCachedData<DailyProgress>('daily_progress');
      const current = list.find((p) => p.id === e.id);
      if (current) {
        const updated: DailyProgress = {
          ...current,
          pages_memorized: e.pages_memorized ?? 0,
          pages_reviewed: e.pages_reviewed ?? 0,
          attendance_only: e.attendance_only ?? false,
          notes: e.notes,
        };
        await saveOfflineFirst('daily_progress', updated, 'update');
      }
    } else {
      const entry: DailyProgress = {
        id: crypto.randomUUID(),
        student_id: e.student_id,
        hijri_date: e.hijri_date,
        hijri_month: e.hijri_month,
        day_number: e.day_number,
        pages_memorized: e.pages_memorized ?? 0,
        pages_reviewed: e.pages_reviewed ?? 0,
        attendance_only: e.attendance_only ?? false,
        notes: e.notes,
        created_at: e.created_at ?? now,
      };
      await saveOfflineFirst('daily_progress', entry, 'create');
    }
  }
}