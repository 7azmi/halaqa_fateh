'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { cacheData, getCachedData, getPendingActions, removePendingAction } from '@/lib/offline-store';
import type { Student, Teacher, DailyProgress, FinancialReport, ActivityType, Budget, ExpenseItem, ReportPhoto, BudgetTransaction } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';

const supabase = createClient();

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
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('is_active', true)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('name');

  if (error) {
    // Try to get cached data
    return getCachedData<Teacher>('teachers');
  }

  // Cache the data
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

// Activity Types
async function fetchActivityTypes(): Promise<ActivityType[]> {
  const { data, error } = await supabase
    .from('activity_types')
    .select('*')
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('name');

  if (error) {
    return getCachedData<ActivityType>('activity_types');
  }

  await cacheData('activity_types', data);
  return data;
}

export function useActivityTypes() {
  return useSWR('activity_types', fetchActivityTypes, {
    revalidateOnFocus: false,
  });
}

// Financial Reports
export function useFinancialReports(hijriMonth?: number, hijriYear?: number) {
  return useSWR(
    ['financial_reports', hijriMonth, hijriYear],
    async () => {
      let query = supabase
        .from('financial_reports')
        .select('*, activity_type:activity_types(*)')
        .order('created_at', { ascending: false });

      if (hijriMonth && hijriYear) {
        query = query.eq('hijri_month', hijriMonth).eq('hijri_year', hijriYear);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialReport[];
    },
    { revalidateOnFocus: false }
  );
}

export function useFinancialReportDetails(reportId: string | null) {
  return useSWR(
    reportId ? ['financial_report', reportId] : null,
    async () => {
      const [reportRes, expensesRes, photosRes] = await Promise.all([
        supabase
          .from('financial_reports')
          .select('*, activity_type:activity_types(*)')
          .eq('id', reportId)
          .single(),
        supabase
          .from('expense_items')
          .select('*')
          .eq('report_id', reportId),
        supabase
          .from('report_photos')
          .select('*')
          .eq('report_id', reportId),
      ]);

      if (reportRes.error) throw reportRes.error;

      return {
        report: reportRes.data as FinancialReport,
        expenses: (expensesRes.data || []) as ExpenseItem[],
        photos: (photosRes.data || []) as ReportPhoto[],
      };
    },
    { revalidateOnFocus: false }
  );
}

// Budget - single global budget
export function useBudget() {
  return useSWR(
    'budget',
    async () => {
      const { data, error } = await supabase
        .from('budget')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Budget | null;
    },
    { revalidateOnFocus: false }
  );
}

// Budget Transactions - history of all budget changes
export function useBudgetTransactions(limit: number = 20) {
  return useSWR(
    ['budget_transactions', limit],
    async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as BudgetTransaction[];
    },
    { revalidateOnFocus: false }
  );
}
