'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { useTeachers, useBudget, useActivityTypes, useBudgetTransactions } from '@/lib/hooks/use-data';
import { createTeacher, createOrUpdateBudget, getInactiveStudents, reactivateStudent, createActivityType, deleteTeacher, deleteActivityType } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
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
  Wallet, 
  UserCheck, 
  RefreshCw,
  User,
  Database,
  ListChecks,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  History
} from 'lucide-react';
import type { Student } from '@/lib/types';

export default function SettingsPage() {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const { data: teachers } = useTeachers();
  const { data: budget } = useBudget();
  const { data: activityTypes } = useActivityTypes();
  const { data: transactions } = useBudgetTransactions(10);

  // Teacher form
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  // Activity type form
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

  // Budget form
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetDescription, setBudgetDescription] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Inactive students
  const [inactiveStudents, setInactiveStudents] = useState<Student[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  useEffect(() => {
    if (budget) {
      setBudgetAmount(budget.current_balance.toString());
    }
  }, [budget]);

  const loadInactiveStudents = async () => {
    setLoadingInactive(true);
    try {
      const students = await getInactiveStudents();
      setInactiveStudents(students || []);
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
      await createTeacher({
        name: newTeacherName,
        is_active: true
      });
      toast({ title: 'تمت إضافة المعلم بنجاح' });
      mutate('teachers');
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
      await deleteTeacher(id);
      toast({ title: 'تم حذف المعلم' });
      mutate('teachers');
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setDeletingTeacherId(null);
    }
  };

  const handleAddActivityType = async () => {
    if (!newActivityName.trim()) {
      toast({ title: 'يرجى إدخال اسم النشاط', variant: 'destructive' });
      return;
    }

    setIsAddingActivity(true);
    try {
      await createActivityType(newActivityName);
      toast({ title: 'تمت إضافة نوع النشاط بنجاح' });
      mutate('activity_types');
      setNewActivityName('');
      setShowActivityForm(false);
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleDeleteActivityType = async (id: string) => {
    setDeletingActivityId(id);
    try {
      await deleteActivityType(id);
      toast({ title: 'تم حذف نوع النشاط' });
      mutate('activity_types');
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setDeletingActivityId(null);
    }
  };

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'يرجى إدخال مبلغ صحيح', variant: 'destructive' });
      return;
    }

    setIsSavingBudget(true);
    try {
      await createOrUpdateBudget(amount, budgetDescription || undefined);
      toast({ title: 'تم حفظ الميزانية' });
      mutate('budget');
      mutate(['budget_transactions', 10]);
      setBudgetDescription('');
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleReactivate = async (studentId: string) => {
    setReactivatingId(studentId);
    try {
      await reactivateStudent(studentId);
      toast({ title: 'تم إعادة تفعيل الطالب' });
      setInactiveStudents(prev => prev.filter(s => s.id !== studentId));
      mutate('students');
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setReactivatingId(null);
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'deposit': return 'إيداع';
      case 'expense': return 'مصروف';
      case 'adjustment': return 'تعديل';
      default: return type;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header title="الإعدادات" showDate={false} />
      
      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Teachers Section */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                المعلمون
              </CardTitle>
              <Sheet open={showTeacherForm} onOpenChange={setShowTeacherForm}>
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
              </Sheet>
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

        {/* Activity Types Section */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                أنواع الأنشطة
              </CardTitle>
              <Sheet open={showActivityForm} onOpenChange={setShowActivityForm}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader>
                    <SheetTitle>إضافة نوع نشاط جديد</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 p-4">
                    <div className="space-y-2">
                      <Label>اسم النشاط</Label>
                      <Input 
                        value={newActivityName}
                        onChange={(e) => setNewActivityName(e.target.value)}
                        placeholder="مثال: رحلة ترفيهية"
                      />
                    </div>
                    <Button 
                      onClick={handleAddActivityType} 
                      className="w-full"
                      disabled={isAddingActivity}
                    >
                      {isAddingActivity ? <Spinner className="ml-2" /> : null}
                      إضافة النشاط
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {!activityTypes || activityTypes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                لا يوجد أنواع أنشطة بعد
              </p>
            ) : (
              <div className="space-y-2">
                {activityTypes.map(type => (
                  <div 
                    key={type.id} 
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <span className="text-sm">{type.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive">
                          {deletingActivityId === type.id ? (
                            <Spinner className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف نوع النشاط</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف "{type.name}"؟
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteActivityType(type.id)}>
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

        {/* Budget Section */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              ميزانية الحلقة
            </CardTitle>
            <CardDescription>
              تحديث الميزانية الحالية للحلقة - الرصيد يتراكم شهرياً
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {budget && (
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">الرصيد الحالي</p>
                <p className={`text-3xl font-bold ${budget.current_balance < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {budget.current_balance.toLocaleString()} <span className="text-lg">ريال</span>
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>تعديل الرصيد (ريال)</Label>
                <Input 
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="أدخل المبلغ الجديد"
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (اختياري)</Label>
                <Input 
                  value={budgetDescription}
                  onChange={(e) => setBudgetDescription(e.target.value)}
                  placeholder="مثال: إيداع ميزانية شهر رجب"
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveBudget} 
              className="w-full"
              disabled={isSavingBudget}
            >
              {isSavingBudget ? <Spinner className="ml-2" /> : null}
              حفظ التعديل
            </Button>
          </CardContent>
        </Card>

        {/* Budget Transactions History */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              سجل المعاملات المالية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {!transactions || transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                لا توجد معاملات بعد
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => (
                  <div 
                    key={tx.id} 
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className={`p-1.5 rounded-full ${
                      tx.type === 'deposit' ? 'bg-green-100' : 
                      tx.type === 'expense' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {tx.type === 'deposit' ? (
                        <ArrowUpCircle className="w-4 h-4 text-green-600" />
                      ) : tx.type === 'expense' ? (
                        <ArrowDownCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {formatTransactionType(tx.type)}
                        </Badge>
                        <span className={`font-bold text-sm ${
                          tx.type === 'deposit' ? 'text-green-600' : 
                          tx.type === 'expense' ? 'text-red-600' : ''
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()}
                        </span>
                      </div>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {tx.description}
                        </p>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>الرصيد: {tx.balance_after.toLocaleString()}</span>
                        <span>{new Date(tx.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
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
