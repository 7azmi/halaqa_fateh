'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { FinancialReportForm } from '@/components/financial/financial-report-form';
import { FinancialReportsList } from '@/components/financial/financial-reports-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, List } from 'lucide-react';

export default function FinancialPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header title="التقارير المالية" />
      
      <Tabs defaultValue="new" className="w-full">
        <div className="px-4 pt-4 sticky top-[76px] z-30 bg-background">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="gap-2">
              <Plus className="w-4 h-4" />
              تقرير جديد
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <List className="w-4 h-4" />
              السجل
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="new" className="px-4 py-4 mt-0">
          <FinancialReportForm />
        </TabsContent>
        
        <TabsContent value="history" className="py-4 mt-0">
          <FinancialReportsList />
        </TabsContent>
      </Tabs>
      
      <BottomNav />
    </main>
  );
}
