'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/components/ui/use-mobile';
import { getSheetsConfig } from '@/lib/sheets-config';
import { createStudentClient } from '@/lib/client-mutations';
import { createStudentSupabase } from '@/lib/supabase-client-mutations';
import { QURAN_SURAHS } from '@/lib/types';
import type { Teacher, Student } from '@/lib/types';

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: Teacher[];
  student?: Student;
}

interface FormData {
  name: string;
  age: number;
  current_surah: string;
  teacher_id: string;
}

function StudentForm({ 
  teachers, 
  student, 
  onSuccess 
}: { 
  teachers: Teacher[]; 
  student?: Student;
  onSuccess: () => void;
}) {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: student?.name || '',
      age: student?.age || 10,
      current_surah: student?.current_surah || 'الفاتحة',
      teacher_id: student?.teacher_id || teachers[0]?.id || '',
    }
  });

  const selectedSurah = watch('current_surah');
  const selectedTeacher = watch('teacher_id');

  const useSheets = !!getSheetsConfig();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (useSheets) {
        await createStudentClient({
          name: data.name,
          age: data.age,
          current_surah: data.current_surah,
          teacher_id: data.teacher_id,
          is_active: true
        });
      } else {
        await createStudentSupabase({
          name: data.name,
          age: data.age,
          current_surah: data.current_surah,
          teacher_id: data.teacher_id,
          is_active: true
        });
      }
      toast({ title: 'تمت إضافة الطالب بنجاح' });
      mutate('students');
      onSuccess();
    } catch (error) {
      toast({ title: 'حدث خطأ أثناء حفظ البيانات', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="name">اسم الطالب</Label>
        <Input
          id="name"
          placeholder="أدخل اسم الطالب"
          {...register('name', { required: 'اسم الطالب مطلوب' })}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">العمر</Label>
        <Input
          id="age"
          type="number"
          min={5}
          max={50}
          {...register('age', { 
            required: 'العمر مطلوب',
            valueAsNumber: true,
            min: { value: 5, message: 'العمر يجب أن يكون 5 سنوات على الأقل' }
          })}
        />
        {errors.age && (
          <p className="text-sm text-destructive">{errors.age.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>يحفظ في سورة</Label>
        <Select 
          value={selectedSurah} 
          onValueChange={(v) => setValue('current_surah', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر السورة" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {QURAN_SURAHS.map(surah => (
              <SelectItem key={surah} value={surah}>{surah}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>المعلم</Label>
        <Select 
          value={selectedTeacher} 
          onValueChange={(v) => setValue('teacher_id', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر المعلم" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map(teacher => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner className="ml-2" />
            جاري الحفظ...
          </>
        ) : (
          'حفظ الطالب'
        )}
      </Button>
    </form>
  );
}

export function StudentFormDialog({ 
  open, 
  onOpenChange, 
  teachers,
  student 
}: StudentFormDialogProps) {
  const isMobile = useIsMobile();
  const title = student ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد';

  const handleSuccess = () => {
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <StudentForm 
            teachers={teachers} 
            student={student} 
            onSuccess={handleSuccess}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <StudentForm 
          teachers={teachers} 
          student={student} 
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
