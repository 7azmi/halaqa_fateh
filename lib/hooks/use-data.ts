'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { cacheData, getCachedData, getPendingActions, removePendingAction } from '@/lib/offline-store';
import type { Student, Teacher, DailyProgress } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';

function getSupabase() {
  return createClient();
}

// Online status hook
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Simplified sync status - no automatic looping
export function useSyncPendingActions() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [hasSynced, setHasSynced] = useState(false);

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing || hasSynced) return;
    const supabase = getSupabase();
    if (!supabase) return;

    setIsSyncing(true);
    try {
      const actions = await getPendingActions();
      setPendingCount(actions.length);

      for (const action of actions) {
        try {
          if (action.type === 'create') {
            await supabase.from(action.table).insert(action.data);
          } else if (action.type === 'update') {
            const { id, ...rest } = action.data;
            await supabase.from(action.table).update(rest).eq('id', id);
          } else if (action.type === 'delete') {
            await supabase.from(action.table).delete().eq('id', action.data.id);
          }
          await removePendingAction(action.id);
          setPendingCount(prev => Math.max(0, prev - 1));
        } catch {
          console.error('Failed to sync action:', action);
        }
      }
      setHasSynced(true);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, hasSynced]);

  // Only sync once on mount when online
  useEffect(() => {
    if (isOnline && !hasSynced) {
      sync();
    }
  }, [isOnline, hasSynced, sync]);

  return { isSyncing, pendingCount, sync };
}

// Teachers
async function fetchTeachers(): Promise<Teacher[]> {
  const supabase = getSupabase();
  if (!supabase) return getCachedData<Teacher>('teachers');

  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('is_active', true)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('name');

  if (error) {
    return getCachedData<Teacher>('teachers');
  }

  await cacheData('teachers', data);
  return data;
}

export function useTeachers() {
  return useSWR('teachers', fetchTeachers, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

// Students
async function fetchStudents(): Promise<Student[]> {
  const supabase = getSupabase();
  if (!supabase) return getCachedData<Student>('students');

  const { data, error } = await supabase
    .from('students')
    .select('*, teacher:teachers(*)')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return getCachedData<Student>('students');
  }

  await cacheData('students', data);
  return data;
}

export function useStudents() {
  return useSWR('students', fetchStudents, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}

export function useStudentsByTeacher(teacherId: string | null) {
  return useSWR(
    teacherId ? ['students', teacherId] : null,
    async () => {
      const supabase = getSupabase();
      if (!supabase) return [] as Student[];
      const { data, error } = await supabase
        .from('students')
        .select('*, teacher:teachers(*)')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Student[];
    },
    { revalidateOnFocus: false }
  );
}

// Daily Progress
export function useDailyProgress(hijriDate: string) {
  return useSWR(
    ['daily_progress', hijriDate],
    async () => {
      const supabase = getSupabase();
      if (!supabase) return [] as DailyProgress[];
      const { data, error } = await supabase
        .from('daily_progress')
        .select('*, student:students(*, teacher:teachers(*))')
        .eq('hijri_date', hijriDate);
      if (error) throw error;
      return data as DailyProgress[];
    },
    { revalidateOnFocus: false }
  );
}

export function useMonthlyProgress(hijriMonth: string) {
  return useSWR(
    ['monthly_progress', hijriMonth],
    async () => {
      const supabase = getSupabase();
      if (!supabase) return [] as DailyProgress[];
      const { data, error } = await supabase
        .from('daily_progress')
        .select('*, student:students(name, current_surah, teacher:teachers(name))')
        .eq('hijri_month', hijriMonth)
        .order('day_number');
      if (error) throw error;
      return data as DailyProgress[];
    },
    { revalidateOnFocus: false }
  );
}

