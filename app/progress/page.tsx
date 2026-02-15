import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { DailyProgressEntry } from '@/components/progress/daily-progress';

export default function ProgressPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header title="تسجيل التقدم اليومي" />
      <div className="px-4 py-4">
        <DailyProgressEntry />
      </div>
      <BottomNav />
    </main>
  );
}
