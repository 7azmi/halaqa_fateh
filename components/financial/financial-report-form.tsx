'use client';

import React from "react"

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useSWRConfig } from 'swr';
import { useActivityTypes, useBudget } from '@/lib/hooks/use-data';
import { createFinancialReport, createActivityType, uploadPhoto, deleteActivityType } from '@/lib/actions';
import { toHijri, getHijriMonthName, HIJRI_MONTHS } from '@/lib/hijri';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Trash2, Camera, ImageIcon, X, Receipt, Wallet, Calculator, CalendarDays } from 'lucide-react';

interface ExpenseItemInput {
  description: string;
  amount: number;
}

interface PhotoItem {
  file: File;
  preview: string;
}

interface FormData {
  activity_type: string;
  hijri_day: number;
  hijri_month: number;
  hijri_year: number;
  participant_count: number;
  notes: string;
  expenses: ExpenseItemInput[];
}

export function FinancialReportForm() {
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const { data: activityTypes } = useActivityTypes();
  
  const hijri = toHijri();
  const { data: budget } = useBudget();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, watch, reset, setValue } = useForm<FormData>({
    defaultValues: {
      activity_type: '',
      hijri_day: hijri.day,
      hijri_month: hijri.month,
      hijri_year: hijri.year,
      participant_count: 0,
      notes: '',
      expenses: [{ description: '', amount: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'expenses'
  });

  const expenses = watch('expenses');
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const currentBalance = budget?.current_balance || 0;
  const budgetAfter = currentBalance - totalAmount;

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoItem[] = [];
    Array.from(files).forEach(file => {
      const preview = URL.createObjectURL(file);
      newPhotos.push({ file, preview });
    });
    
    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAddActivityType = async () => {
    if (!newTypeName.trim()) return;
    
    setIsAddingType(true);
    try {
      await createActivityType(newTypeName);
      toast({ title: 'تمت إضافة نوع النشاط' });
      mutate('activity_types');
      setNewTypeName('');
      setShowNewTypeForm(false);
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setIsAddingType(false);
    }
  };

  const handleDeleteActivityType = async (id: string) => {
    setDeletingTypeId(id);
    try {
      await deleteActivityType(id);
      toast({ title: 'تم حذف نوع النشاط' });
      mutate('activity_types');
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setDeletingTypeId(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (photos.length === 0) {
      toast({ title: 'يجب إضافة صورة واحدة على الأقل كإثبات', variant: 'destructive' });
      return;
    }

    if (totalAmount <= 0) {
      toast({ title: 'يجب إدخال المصاريف', variant: 'destructive' });
      return;
    }

    if (!data.activity_type) {
      toast({ title: 'يجب اختيار نوع النشاط', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload photos using server action
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo.file);
        const url = await uploadPhoto(formData);
        photoUrls.push(url);
      }

      const reportData = {
        activity_type: data.activity_type,
        hijri_date: `${data.hijri_day}/${data.hijri_month}/${data.hijri_year}`,
        participant_count: data.participant_count,
        total_cost: totalAmount,
        budget_before: currentBalance,
        budget_after: budgetAfter,
        notes: data.notes || undefined,
      };

      const expenseItems = data.expenses
        .filter(e => e.description && e.amount > 0)
        .map(e => ({ description: e.description, amount: e.amount }));

      await createFinancialReport(reportData, expenseItems, photoUrls);
      
      toast({ title: 'تم حفظ التقرير المالي بنجاح' });
      mutate('financial_reports');
      mutate('budget');
      mutate('budget_transactions');
      
      // Reset form
      reset();
      setPhotos([]);
    } catch (error) {
      toast({ title: 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-24">
      {/* Budget Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ميزانية الحلقة</p>
                <p className="text-sm text-muted-foreground">
                  {getHijriMonthName(hijri.month)} {hijri.year}
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-primary">
                {currentBalance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">ريال</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Type */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            نوع النشاط
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex gap-2">
            <Select 
              value={watch('activity_type')} 
              onValueChange={(v) => setValue('activity_type', v)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="اختر نوع النشاط" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes?.map(type => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Sheet open={showNewTypeForm} onOpenChange={setShowNewTypeForm}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>إدارة أنواع الأنشطة</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 p-4">
                  {/* Add new type */}
                  <div className="space-y-2">
                    <Label>إضافة نوع جديد</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="مثال: رحلة ترفيهية"
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleAddActivityType} 
                        disabled={isAddingType || !newTypeName.trim()}
                      >
                        {isAddingType ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Existing types */}
                  <div className="space-y-2">
                    <Label>الأنواع الحالية</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {activityTypes?.map(type => (
                        <div key={type.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <span>{type.name}</span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="w-8 h-8 text-destructive hover:text-destructive"
                              >
                                {deletingTypeId === type.id ? (
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
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Date and Participants */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            التاريخ والعدد
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">اليوم</Label>
              <Input 
                type="number"
                min={1}
                max={30}
                {...register('hijri_day', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">الشهر</Label>
              <Select 
                value={watch('hijri_month')?.toString()} 
                onValueChange={(v) => setValue('hijri_month', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HIJRI_MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">السنة</Label>
              <Input 
                type="number"
                {...register('hijri_year', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>عدد المشاركين</Label>
            <Input 
              type="number"
              min={0}
              {...register('participant_count', { valueAsNumber: true })}
              placeholder="عدد المشاركين في النشاط"
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              التفاصيل
            </span>
            <Badge variant="secondary">
              الإجمالي: {totalAmount.toLocaleString()} ريال
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                placeholder="البند (مثال: فاصوليا)"
                {...register(`expenses.${index}.description`)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="المبلغ"
                {...register(`expenses.${index}.amount`, { valueAsNumber: true })}
                className="w-24"
              />
              {fields.length > 1 && (
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => append({ description: '', amount: 0 })}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة بند
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>اجمالي النشاط</span>
            <span className="font-bold">{totalAmount.toLocaleString()} ريال</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>ما أخذ من الميزانية</span>
            <span className="font-bold">{totalAmount.toLocaleString()} ريال</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span>ميزانية الحلقة المتبقية</span>
            <span className={`font-bold ${budgetAfter < 0 ? 'text-destructive' : 'text-primary'}`}>
              {budgetAfter.toLocaleString()} ريال
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            صور إثبات النشاط
            <Badge variant="destructive" className="mr-auto">مطلوب</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={photo.preview || "/placeholder.svg"} 
                    alt={`صورة ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 left-1 w-6 h-6"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Photo Capture Buttons */}
          <div className="flex gap-2">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoCapture}
            />
            
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="w-4 h-4 ml-2" />
              التقاط صورة
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-4 h-4 ml-2" />
              اختيار صورة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="p-4">
          <Label>ملاحظات</Label>
          <Textarea
            {...register('notes')}
            placeholder="أي ملاحظات إضافية..."
            className="mt-2"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="fixed bottom-20 right-4 left-4">
        <Button 
          type="submit"
          className="w-full shadow-lg" 
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="ml-2" />
              جاري الحفظ...
            </>
          ) : (
            'حفظ التقرير المالي'
          )}
        </Button>
      </div>
    </form>
  );
}
