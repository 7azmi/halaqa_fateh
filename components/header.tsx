'use client';

import { formatHijriDate } from '@/lib/hijri';
import { BookOpenCheck } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showDate?: boolean;
}

export function Header({ title = 'حلقة القرآن', showDate = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground safe-area-pt">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-foreground/10 rounded-lg">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{title}</h1>
            {showDate && (
              <p className="text-sm opacity-90">{formatHijriDate()}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
