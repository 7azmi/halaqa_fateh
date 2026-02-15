'use client';

import { useState } from 'react';
import { useFinancialReports, useFinancialReportDetails, useBudget } from '@/lib/hooks/use-data';
import { toHijri, getHijriMonthName } from '@/lib/hijri';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Receipt, 
  Calendar, 
  Users, 
  Wallet,
  ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { HIJRI_MONTHS } from '@/lib/hijri';
import type { FinancialReport } from '@/lib/types';

export function FinancialReportsList() {
  const hijri = toHijri();
  const [selectedMonth, setSelectedMonth] = useState(hijri.month);
  const [selectedYear, setSelectedYear] = useState(hijri.year);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const { data: reports, isLoading } = useFinancialReports(selectedMonth, selectedYear);
  const { data: budget } = useBudget(selectedMonth, selectedYear);
  const { data: reportDetails } = useFinancialReportDetails(selectedReport);

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const totalSpent = reports?.reduce((sum, r) => sum + r.total_amount, 0) || 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <span className="font-bold text-lg">{getHijriMonthName(selectedMonth)}</span>
          <span className="text-muted-foreground mr-2">{selectedYear}</span>
        </div>

        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">الميزانية الأولية</span>
            </div>
            <p className="text-xl font-bold text-primary">
              {(budget?.initial_amount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-accent/20 border-accent/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-accent-foreground" />
              <span className="text-xs text-muted-foreground">المتبقي</span>
            </div>
            <p className={`text-xl font-bold ${(budget?.current_amount || 0) < 0 ? 'text-destructive' : 'text-accent-foreground'}`}>
              {(budget?.current_amount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-4 flex gap-2">
        <Badge variant="secondary" className="flex-1 justify-center py-2">
          {reports?.length || 0} تقرير
        </Badge>
        <Badge variant="secondary" className="flex-1 justify-center py-2">
          {totalSpent.toLocaleString()} ريال مصروف
        </Badge>
      </div>

      {/* Reports List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))
        ) : reports?.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد تقارير لهذا الشهر</p>
          </div>
        ) : (
          reports?.map(report => (
            <Card 
              key={report.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{report.activity_type?.name || 'نشاط'}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.hijri_day}/{report.hijri_month}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {report.participant_count} مشارك
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    {report.total_amount.toLocaleString()} ريال
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report Details Sheet */}
      <Sheet open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
          {reportDetails && (
            <>
              <SheetHeader className="text-right">
                <SheetTitle className="text-xl">
                  {reportDetails.report.activity_type?.name}
                </SheetTitle>
                <p className="text-muted-foreground">
                  {reportDetails.report.hijri_day} {getHijriMonthName(reportDetails.report.hijri_month)} {reportDetails.report.hijri_year}
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">نوع النشاط</span>
                      <span className="font-medium">{reportDetails.report.activity_type?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">التاريخ</span>
                      <span className="font-medium">
                        {reportDetails.report.hijri_day}/{reportDetails.report.hijri_month}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">العدد</span>
                      <span className="font-medium">{reportDetails.report.participant_count}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Expenses */}
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">التفاصيل</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {reportDetails.expenses.map((expense, i) => (
                      <div key={i} className="flex justify-between py-2 border-b last:border-0">
                        <span>{expense.description}</span>
                        <span className="font-medium">{expense.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold text-primary">
                      <span>اجمالي النشاط</span>
                      <span>{reportDetails.report.total_amount.toLocaleString()} ريال</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Budget Info */}
                <Card className="bg-primary/5">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ما أخذ من الميزانية</span>
                      <span className="font-bold">{reportDetails.report.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ميزانية الحلقة قبل</span>
                      <span>{reportDetails.report.budget_before.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-primary">
                      <span>ميزانية الحلقة بعد</span>
                      <span>{reportDetails.report.budget_after.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Photos */}
                {reportDetails.photos.length > 0 && (
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        صور النشاط
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        {reportDetails.photos.map((photo, i) => (
                          <div key={i} className="aspect-video rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={photo.photo_url || '/placeholder.svg'} 
                              alt={photo.caption || `صورة ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {reportDetails.report.notes && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">ملاحظات:</p>
                      <p className="mt-1">{reportDetails.report.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
