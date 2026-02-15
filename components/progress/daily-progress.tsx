'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';
import { useStudents, useTeachers, useDailyProgress } from '@/lib/hooks/use-data';
import { toHijri, formatHijriShort, getDaysInHijriMonth, getHijriMonthName } from '@/lib/hijri';
import { getSheetsConfig } from '@/lib/sheets-config';
import { saveDailyProgressClient } from '@/lib/client-mutations';
import { saveDailyProgressSupabase, markAttendanceOnlySupabase } from '@/lib/supabase-client-mutations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  User, 
  Calendar,
  UserCheck
} from 'lucide-react';

interface ProgressEntry {
  student_id: string;
  pages_memorized: number;
  pages_reviewed: number;
  notes: string;
  attendance_only: boolean;
}

export function DailyProgressEntry() {
  const { mutate } = useSWRConfig();
  const { data: students, isLoading: loadingStudents } = useStudents();
  const { data: teachers } = useTeachers();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const hijri = toHijri();
    return `${hijri.year}-${String(hijri.month).padStart(2, '0')}-${String(hijri.day).padStart(2, '0')}`;
  });
  
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [entries, setEntries] = useState<Record<string, ProgressEntry>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null);

  const { data: existingProgress, isLoading: loadingProgress } = useDailyProgress(selectedDate);

  // Parse selected date
  const [year, month, day] = selectedDate.split('-').map(Number);
  const daysInMonth = getDaysInHijriMonth(month, year);
  const monthName = getHijriMonthName(month);

  // Filter students by teacher
  const filteredStudents = students?.filter(
    s => selectedTeacher === 'all' || s.teacher_id === selectedTeacher
  ) || [];

  // Initialize entries when students or existing progress changes
  useEffect(() => {
    if (!students) return;

    const newEntries: Record<string, ProgressEntry> = {};
    
    students.forEach(student => {
      const existing = existingProgress?.find(p => p.student_id === student.id);
      newEntries[student.id] = {
        student_id: student.id,
        pages_memorized: existing?.pages_memorized || 0,
        pages_reviewed: existing?.pages_reviewed || 0,
        notes: existing?.notes || '',
        attendance_only: existing?.attendance_only || false,
      };
    });
    
    setEntries(newEntries);
  }, [students, existingProgress]);

  const updateEntry = (studentId: string, field: keyof ProgressEntry, value: number | string | boolean) => {
    setEntries(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const useSheets = !!getSheetsConfig();

  const handleMarkAttendanceOnly = async (studentId: string) => {
    setMarkingAttendance(studentId);
    try {
      const hijriMonth = `${monthName} ${year}`;
      if (useSheets) {
        await saveDailyProgressClient([{
          student_id: studentId,
          hijri_date: selectedDate,
          hijri_month: hijriMonth,
          day_number: day,
          attendance_only: true,
          pages_memorized: 0,
          pages_reviewed: 0,
        }]);
      } else {
        await markAttendanceOnlySupabase({
          student_id: studentId,
          hijri_date: selectedDate,
          hijri_month: hijriMonth,
          day_number: day,
        });
      }
      setEntries(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          attendance_only: true,
          pages_memorized: 0,
          pages_reviewed: 0,
        }
      }));
      toast({ title: 'تم تسجيل الحضور' });
      mutate(['daily_progress', selectedDate]);
    } catch (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      console.error(error);
    } finally {
      setMarkingAttendance(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const hijriMonth = `${monthName} ${year}`;
      const progressEntries = Object.values(entries)
        .filter(entry => !entry.attendance_only)
        .map(entry => ({
          id: existingProgress?.find(p => p.student_id === entry.student_id)?.id,
          student_id: entry.student_id,
          hijri_date: selectedDate,
          hijri_month: hijriMonth,
          day_number: day,
          pages_memorized: entry.pages_memorized,
          pages_reviewed: entry.pages_reviewed,
          notes: entry.notes || undefined,
        }));

      if (progressEntries.length > 0) {
        if (useSheets) {
          await saveDailyProgressClient(progressEntries);
        } else {
          await saveDailyProgressSupabase(progressEntries.map(({ id, ...e }) => e));
        }
      }
      toast({ title: 'تم حفظ التقدم بنجاح' });
      mutate(['daily_progress', selectedDate]);
    } catch (error) {
      toast({ title: 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const changeDay = (delta: number) => {
    let newDay = day + delta;
    let newMonth = month;
    let newYear = year;

    if (newDay < 1) {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
      newDay = getDaysInHijriMonth(newMonth, newYear);
    } else if (newDay > daysInMonth) {
      newDay = 1;
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }

    setSelectedDate(`${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`);
  };

  // Calculate totals - attendance_only counts as present
  const totalMemorized = Object.values(entries).reduce((sum, e) => sum + (e.pages_memorized || 0), 0);
  const studentsPresent = Object.values(entries).filter(
    e => e.pages_memorized > 0 || e.pages_reviewed > 0 || e.attendance_only
  ).length;
  const studentsAbsent = filteredStudents.length - studentsPresent;

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Date Navigation */}
      <div className="sticky top-[76px] z-30 bg-background p-4 -mx-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" onClick={() => changeDay(-1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-bold text-lg">{day}</span>
              <span className="text-muted-foreground">{monthName}</span>
              <span className="text-muted-foreground">{year}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatHijriShort(new Date())} - اليوم
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={() => changeDay(1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Teacher Filter */}
        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger>
            <SelectValue placeholder="جميع المعلمين" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المعلمين</SelectItem>
            {teachers?.map(teacher => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-2 px-4">
        <Card className="bg-primary/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {studentsPresent}
            </p>
            <p className="text-xs text-muted-foreground">حاضر</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">
              {studentsAbsent}
            </p>
            <p className="text-xs text-muted-foreground">غائب</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-accent-foreground">
              {totalMemorized.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">صفحات</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Entries */}
      <div className="px-4 space-y-3">
        {loadingStudents || loadingProgress ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا يوجد طلاب</p>
          </div>
        ) : (
          filteredStudents.map(student => {
            const entry = entries[student.id];
            if (!entry) return null;

            const isPresent = entry.pages_memorized > 0 || entry.pages_reviewed > 0 || entry.attendance_only;

            return (
              <Card key={student.id} className={`overflow-hidden ${entry.attendance_only ? 'border-blue-200 bg-blue-50/30' : ''}`}>
                <CardHeader className="p-3 pb-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPresent ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <User className={`w-4 h-4 ${isPresent ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{student.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{student.current_surah || 'لم يحدد'}</p>
                      </div>
                    </div>
                    {entry.attendance_only && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <UserCheck className="w-3 h-3 ml-1" />
                        حضور فقط
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-3 pt-2">
                  {entry.attendance_only ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      تم تسجيل الحضور بدون إدخال صفحات
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            حفظ (صفحات)
                          </label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.pages_memorized || ''}
                            onChange={(e) => updateEntry(
                              student.id, 
                              'pages_memorized', 
                              parseFloat(e.target.value) || 0
                            )}
                            className="h-9"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            مراجعة (صفحات)
                          </label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.pages_reviewed || ''}
                            onChange={(e) => updateEntry(
                              student.id, 
                              'pages_reviewed', 
                              parseFloat(e.target.value) || 0
                            )}
                            className="h-9"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      {/* Attendance Only Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                        onClick={() => handleMarkAttendanceOnly(student.id)}
                        disabled={markingAttendance === student.id}
                      >
                        {markingAttendance === student.id ? (
                          <Spinner className="w-4 h-4 ml-1" />
                        ) : (
                          <UserCheck className="w-4 h-4 ml-1" />
                        )}
                        حضور فقط
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-20 right-4 left-4">
        <Button 
          className="w-full shadow-lg" 
          size="lg"
          onClick={handleSave}
          disabled={isSaving || filteredStudents.length === 0}
        >
          {isSaving ? (
            <>
              <Spinner className="ml-2" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 ml-2" />
              حفظ التقدم
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
