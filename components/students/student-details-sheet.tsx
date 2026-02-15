'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User, BookOpen, GraduationCap, Calendar, Trash2, Edit } from 'lucide-react';
import { deactivateStudent, updateStudent } from '@/lib/actions';
import { getSheetsConfig } from '@/lib/sheets-config';
import { softDeleteStudentClient, updateStudentClient } from '@/lib/client-mutations';
import type { Student, Teacher } from '@/lib/types';
import { QURAN_SURAHS } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface StudentDetailsSheetProps {
  student: Student | null;
  onClose: () => void;
  teachers: Teacher[];
}

export function StudentDetailsSheet({ student, onClose, teachers }: StudentDetailsSheetProps) {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSurah, setEditedSurah] = useState(student?.current_surah || '');
  const [editedTeacher, setEditedTeacher] = useState(student?.teacher_id || '');
  const [isSaving, setIsSaving] = useState(false);
  const useSheets = !!getSheetsConfig();

  const handleDeactivate = async () => {
    if (!student) return;
    setIsDeleting(true);
    try {
      if (useSheets) {
        await softDeleteStudentClient(student.id);
      } else {
        await deactivateStudent(student.id);
      }
      toast({ title: 'تم إلغاء تفعيل الطالب' });
      mutate('students');
      onClose();
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!student) return;
    setIsSaving(true);
    try {
      if (useSheets) {
        await updateStudentClient(student.id, {
          current_surah: editedSurah,
          teacher_id: editedTeacher,
        });
      } else {
        await updateStudent(student.id, {
          current_surah: editedSurah,
          teacher_id: editedTeacher,
        });
      }
      toast({ title: 'تم تحديث البيانات' });
      mutate('students');
      setIsEditing(false);
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Sheet open={!!student} onOpenChange={() => onClose()}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          {student && (
            <>
              <SheetHeader className="text-right">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-xl">{student.name}</SheetTitle>
                    <p className="text-muted-foreground">{student.age} سنة</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">يحفظ في سورة</p>
                      {isEditing ? (
                        <Select value={editedSurah} onValueChange={setEditedSurah}>
                          <SelectTrigger className="mt-1 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {QURAN_SURAHS.map(surah => (
                              <SelectItem key={surah} value={surah}>{surah}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium">{student.current_surah || 'لم يحدد'}</p>
                      )}
                    </div>
                  </div>
                  <Badge>{student.current_surah || 'لم يحدد'}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-accent-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">المعلم</p>
                      {isEditing ? (
                        <Select value={editedTeacher} onValueChange={setEditedTeacher}>
                          <SelectTrigger className="mt-1 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map(teacher => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium">{student.teacher?.name || 'لم يحدد'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                    <p className="font-medium">
                      {new Date(student.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button 
                        className="flex-1" 
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                      >
                        {isSaving ? <Spinner className="ml-2" /> : null}
                        حفظ التغييرات
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-transparent"
                        onClick={() => setIsEditing(false)}
                      >
                        إلغاء
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setEditedSurah(student.current_surah || '');
                          setEditedTeacher(student.teacher_id || '');
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="w-4 h-4 ml-2" />
                        تعديل
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => setShowDeleteAlert(true)}
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        إلغاء التفعيل
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء تفعيل الطالب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء تفعيل الطالب {student?.name}؟
              يمكنك إعادة تفعيله لاحقاً من الإعدادات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'جاري الحذف...' : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
