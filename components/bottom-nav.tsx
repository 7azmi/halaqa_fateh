'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, BookOpen, Settings, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus, useSyncPendingActions } from '@/lib/hooks/use-data';

const navItems = [
  { href: '/', label: 'الطلاب', icon: Users },
  { href: '/progress', label: 'التقدم', icon: BookOpen },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const isOnline = useOnlineStatus();
  const { pendingCount, isSyncing } = useSyncPendingActions();

  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Online/Offline indicator */}
      <div className={cn(
        'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-3 py-1 rounded-t-lg text-xs flex items-center gap-1.5',
        isOnline ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
      )}>
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>{isSyncing ? 'جاري المزامنة...' : pendingCount > 0 ? `${pendingCount} في الانتظار` : 'متصل'}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>غير متصل</span>
          </>
        )}
      </div>
    </nav>
  );
}
