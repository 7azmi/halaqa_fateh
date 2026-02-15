'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { useTeachers } from '@/lib/hooks/use-data';
import { createTeacher, getInactiveStudents, reactivateStudent, deleteTeacher } from '@/lib/actions';
import { getSheetsConfig, setSheetsConfig } from '@/lib/sheets-config';
import { getSpreadsheetId, setSpreadsheetId, getGoogleClientId, setGoogleClientId } from '@/lib/config';
import { useGoogleAuth } from '@/components/google-auth-provider';
import {
  createTeacherClient,
  softDeleteTeacherClient,
  reactivateStudentClient,
} from '@/lib/client-mutations';
import { getCachedData } from '@/lib/offline-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Sheet as SheetUI,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  GraduationCap, 
  Plus, 
  UserCheck, 
  RefreshCw,
  User,
  Database,
  Trash2,
  FileSpreadsheet,
  LogIn,
  LogOut,
} from 'lucide-react';
import type { Student } from '@/lib/types';

export default function SettingsPage() {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const { data: teachers } = useTeachers();
  const { accessToken, isSignedIn, signIn, signOut, isReady } = useGoogleAuth();
  const useSheets = !!getSheetsConfig();

  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [googleClientIdInput, setGoogleClientIdInput] = useState('');

  // Teacher form
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  // Inactive students
  const [inactiveStudents, setInactiveStudents] = useState<Student[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  useEffect(() => {
    setSpreadsheetIdInput(getSpreadsheetId() ?? '');
    setGoogleClientIdInput(getGoogleClientId() ?? '');
  }, []);

  const handleSaveSpreadsheetId = () => {
    const id = spreadsheetIdInput.trim() || null;
    setSpreadsheetId(id);
    if (accessToken) setSheetsConfig(id, accessToken);
    toast({ title: id ? 'تم حفظ معرف الجدول' : 'تم مسح معرف الجدول' });
  };

  const handleSaveGoogleClientId = () => {
    const id = googleClientIdInput.trim() || null;
    setGoogleClientId(id);
    toast({ title: id ? 'تم حفظ معرف Google' : 'تم مسح معرف Google' });
  };

  const loadInactiveStudents = async () => {
    setLoadingInactive(true);
    try {
      if (useSheets) {
        const students = await getCachedData<Student>('students');
        setInactiveStudents(students.filter((s) => !s.is_active));
      } else {
        const students = await getInactiveStudents();
        setInactiveStudents(students || []);
      }
    } catch {
      toast({ title: 'حدث خطأ في تحميل الطلاب غير النشطين', variant: 'destructive' });
    } finally {
      setLoadingInactive(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim()) {
      toast({ title: 'يرجى إدخال اسم المعلم', variant: 'destructive' });
      return;
    }
    setIsAddingTeacher(true);
    try {
      if (useSheets) {
        await createTeacherClient({ name: newTeacherName.trim(), is_active: true });
        toast({ title: 'تمت إضافة المعلم بنجاح' });
        mutate('teachers');
      } else {
        await createTeacher({ name: newTeacherName.trim(), is_active: true });
        toast({ title: 'تمت إضافة المعلم بنجاح' });
        mutate('teachers');
      }
      setNewTeacherName('');
      setShowTeacherForm(false);
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setIsAddingTeacher(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    setDeletingTeacherId(id);
    try {
      if (useSheets) {
        await softDeleteTeacherClient(id);
        toast({ title: 'تم حذف المعلم' });
        mutate('teachers');
      } else {
        await deleteTeacher(id);
        toast({ title: 'تم حذف المعلم' });
        mutate('teachers');
      }
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setDeletingTeacherId(null);
    }
  };

  const handleReactivate = async (studentId: string) => {
    setReactivatingId(studentId);
    try {
      if (useSheets) {
        await reactivateStudentClient(studentId);
        toast({ title: 'تم إعادة تفعيل الطالب' });
        setInactiveStudents(prev => prev.filter(s => s.id !== studentId));
        mutate('students');
      } else {
        await reactivateStudent(studentId);
        toast({ title: 'تم إعادة تفعيل الطالب' });
        setInactiveStudents(prev => prev.filter(s => s.id !== studentId));
        mutate('students');
      }
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header title="الإعدادات" showDate={false} />
      
      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Google Sheets & Sign-in */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Google Sheets
            </CardTitle>
            <CardDescription>
              معرف الجدول ومعرف Google للاتصال بالجدول (بدون سيرفر)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <Label>معرف الجدول (Spreadsheet ID)</Label>
              <div className="flex gap-2">
                <Input
                  value={spreadsheetIdInput}
                  onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                  placeholder="من الرابط: docs.google.com/.../d/المعرف/edit"
                />
                <Button variant="outline" onClick={handleSaveSpreadsheetId}>حفظ</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>معرف Google (Client ID)</Label>
              <div className="flex gap-2">
                <Input
                  value={googleClientIdInput}
                  onChange={(e) => setGoogleClientIdInput(e.target.value)}
                  placeholder="xxx.apps.googleusercontent.com"
                />
                <Button variant="outline" onClick={handleSaveGoogleClientId}>حفظ</Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSignedIn ? (
                <>
                  <Badge className="bg-green-100 text-green-800">متصل بـ Google</Badge>
                  <Button variant="outline" size="sm" onClick={signOut} disabled={!isReady}>
                    <LogOut className="w-4 h-4 ml-1" />
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={signIn} disabled={!getGoogleClientId() || !isReady}>
                  {!isReady ? <Spinner className="w-4 h-4 ml-1" /> : <LogIn className="w-4 h-4 ml-1" />}
                  تسجيل الدخول بـ Google
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teachers Section */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                المعلمون
              </CardTitle>
              <SheetUI open={showTeacherForm} onOpenChange={setShowTeacherForm}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader>
                    <SheetTitle>إضافة معلم جديد</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 p-4">
                    <div className="space-y-2">
                      <Label>اسم المعلم</Label>
                      <Input 
                        value={newTeacherName}
                        onChange={(e) => setNewTeacherName(e.target.value)}
                        placeholder="أدخل اسم المعلم"
                      />
                    </div>
                    <Button 
                      onClick={handleAddTeacher} 
                      className="w-full"
                      disabled={isAddingTeacher}
                    >
                      {isAddingTeacher ? <Spinner className="ml-2" /> : null}
                      إضافة المعلم
                    </Button>
                  </div>
                </SheetContent>
              </SheetUI>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {!teachers || teachers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                لا يوجد معلمون بعد
              </p>
            ) : (
              <div className="space-y-2">
                {teachers.map(teacher => (
                  <div 
                    key={teacher.id} 
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{teacher.name}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive">
                          {deletingTeacherId === teacher.id ? (
                            <Spinner className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف المعلم</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف "{teacher.name}"؟ لن يؤثر هذا على الطلاب المسجلين.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTeacher(teacher.id)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Students Section */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                الطلاب غير النشطين
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={loadInactiveStudents}
                disabled={loadingInactive}
              >
                {loadingInactive ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
            <CardDescription>
              إعادة تفعيل الطلاب الذين تم إلغاء تفعيلهم
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {inactiveStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                اضغط على زر التحديث لتحميل الطلاب غير النشطين
              </p>
            ) : (
              <div className="space-y-2">
                {inactiveStudents.map(student => (
                  <div 
                    key={student.id} 
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.teacher?.name} - {student.current_surah}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReactivate(student.id)}
                      disabled={reactivatingId === student.id}
                    >
                      {reactivatingId === student.id ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        'تفعيل'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">نظام حلقة القرآن</p>
                <p className="text-xs text-muted-foreground">
                  يعمل بدون إنترنت - البيانات تُحفظ محلياً
                </p>
              </div>
              <Badge variant="outline">v1.0</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNav />
    </main>
  );
}
