import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { StudentList } from '@/components/students/student-list';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header title="حلقة القرآن" />
      <div className="px-4 py-4">
        <StudentList />
      </div>
      <BottomNav />
    </main>
  );
}
