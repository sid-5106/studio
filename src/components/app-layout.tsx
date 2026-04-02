'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { ShieldCheck } from 'lucide-react';
import { SidebarProvider } from './ui/sidebar';
import { getAlerts } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const knownAlerts = new Set<string>();
    let isInitialLoad = true;

    const checkAndNotify = async () => {
      try {
        const currentAlerts = await getAlerts();
        
        if (isInitialLoad) {
          currentAlerts.forEach(a => knownAlerts.add(a.fingerprint));
          isInitialLoad = false;
          return;
        }

        const newAlerts = currentAlerts.filter(a => !knownAlerts.has(a.fingerprint));

        if (newAlerts.length > 0) {
          newAlerts.forEach(a => knownAlerts.add(a.fingerprint));
          toast({
            title: `🚨 ${newAlerts.length} New Alert${newAlerts.length > 1 ? 's' : ''}`,
            description: newAlerts[0].Title,
            duration: 10000,
            action: (
              <ToastAction asChild altText="View alerts">
                <Link href="/alerts">View</Link>
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        console.error("Failed to check for new alerts:", error);
      }
    };

    // Initial check to set the baseline
    checkAndNotify();

    const interval = setInterval(() => {
      router.refresh();
      checkAndNotify();
    }, 60000); // 1 minute in milliseconds

    return () => clearInterval(interval);
  }, [router, toast]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            <h1 className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">Godrej DLP</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
