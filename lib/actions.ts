'use server';

import { createClient } from '@/lib/supabase/server';
import { put } from '@vercel/blob';
import { revalidateTag } from 'next/cache';
import type { Student, Teacher, DailyProgress, FinancialReport, ExpenseItem, ActivityType } from './types';

// Teacher actions
export async function createTeacher(data: Omit<Teacher, 'id' | 'created_at'>) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { error } = await supabase
    .from('teachers')
    .update(data)
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('teachers', 'max');
}

// Student actions
export async function createStudent(data: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'teacher'>) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { teacher, ...updateData } = data;
  const { error } = await supabase
    .from('students')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('students', 'max');
}

export async function deactivateStudent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('students')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('students', 'max');
}

export async function reactivateStudent(id: string) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  
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

// Activity Type actions
export async function createActivityType(name: string) {
  const supabase = await createClient();
  const { data: activityType, error } = await supabase
    .from('activity_types')
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateTag('activity_types', 'max');
  return activityType;
}

export async function deleteActivityType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('activity_types')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('activity_types', 'max');
}

// Teacher delete
export async function deleteTeacher(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('teachers')
    .update({ is_deleted: true, is_active: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('teachers', 'max');
}

// Financial Report actions
export async function createFinancialReport(
  reportData: {
    activity_type: string;
    hijri_date: string;
    participant_count: number;
    total_cost: number;
    budget_before: number;
    budget_after: number;
    notes?: string;
  },
  expenses: { description: string; amount: number }[],
  photoUrls: string[]
) {
  const supabase = await createClient();
  
  // Create the report
  const { data: report, error: reportError } = await supabase
    .from('financial_reports')
    .insert(reportData)
    .select()
    .single();

  if (reportError) throw new Error(reportError.message);

  // Add expense items
  if (expenses.length > 0) {
    const expenseItems = expenses.map(e => ({
      description: e.description,
      amount: e.amount,
      report_id: report.id
    }));
    
    const { error: expenseError } = await supabase
      .from('expense_items')
      .insert(expenseItems);

    if (expenseError) throw new Error(expenseError.message);
  }

  // Add photos
  for (const photoUrl of photoUrls) {
    const { error: photoError } = await supabase
      .from('report_photos')
      .insert({
        report_id: report.id,
        photo_url: photoUrl
      });

    if (photoError) throw new Error(photoError.message);
  }

  // Update budget and create transaction record
  const { data: budgetData } = await supabase
    .from('budget')
    .select()
    .single();

  if (budgetData) {
    await supabase
      .from('budget')
      .update({ 
        current_balance: reportData.budget_after,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetData.id);
    
    // Create budget transaction record
    await supabase
      .from('budget_transactions')
      .insert({
        type: 'expense',
        amount: reportData.total_cost,
        balance_before: reportData.budget_before,
        balance_after: reportData.budget_after,
        description: `${reportData.activity_type} - ${reportData.hijri_date}`,
        report_id: report.id
      });
  }

  revalidateTag('financial_reports', 'max');
  revalidateTag('budget', 'max');
  revalidateTag('budget_transactions', 'max');
  return report;
}

// Budget actions - single budget record with transaction history
export async function createOrUpdateBudget(amount: number, description?: string) {
  const supabase = await createClient();
  
  const { data: existing } = await supabase
    .from('budget')
    .select()
    .single();

  const previousBalance = existing?.current_balance || 0;
  const isDeposit = amount > previousBalance;
  const transactionAmount = Math.abs(amount - previousBalance);

  if (existing) {
    const { error } = await supabase
      .from('budget')
      .update({ 
        current_balance: amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) throw new Error(error.message);
    
    // Create transaction record for the adjustment
    if (transactionAmount > 0) {
      await supabase
        .from('budget_transactions')
        .insert({
          type: isDeposit ? 'deposit' : 'adjustment',
          amount: transactionAmount,
          balance_before: previousBalance,
          balance_after: amount,
          description: description || (isDeposit ? 'إيداع ميزانية' : 'تعديل ميزانية')
        });
    }
  } else {
    const { error } = await supabase
      .from('budget')
      .insert({
        current_balance: amount
      });

    if (error) throw new Error(error.message);
    
    // Create initial deposit transaction
    await supabase
      .from('budget_transactions')
      .insert({
        type: 'deposit',
        amount: amount,
        balance_before: 0,
        balance_after: amount,
        description: description || 'ميزانية أولية'
      });
  }

  revalidateTag('budget', 'max');
  revalidateTag('budget_transactions', 'max');
}

// Photo upload action - for uploading before report creation
export async function uploadPhoto(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  
  if (!file) throw new Error('No file provided');

  const blob = await put(`reports/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  return blob.url;
}

// Photo upload action - for uploading to existing report
export async function uploadReportPhoto(reportId: string, formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) throw new Error('No file provided');

  const blob = await put(`reports/${reportId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from('report_photos')
    .insert({
      report_id: reportId,
      photo_url: blob.url
    });

  if (error) throw new Error(error.message);
  
  revalidateTag('financial_reports', 'max');
  return blob.url;
}

// Get inactive students for reactivation
export async function getInactiveStudents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('students')
    .select('*, teacher:teachers(*)')
    .eq('is_active', false)
    .order('name');

  if (error) throw new Error(error.message);
  return data;
}
