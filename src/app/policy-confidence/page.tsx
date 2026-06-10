
import { AppLayout } from '@/components/app-layout';
import { getLowConfidenceAlerts } from '@/app/actions';
import { ConfidenceClient } from './confidence-client';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { SupabaseStatus } from '@/components/supabase-status';

export default async function PolicyConfidencePage() {
  const alerts = await getLowConfidenceAlerts();

  return (
    <AppLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Policy Confidence</h1>
                <p className="text-muted-foreground">
                  Identify policies and alerts where the AI's classification confidence is below 75%.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <SupabaseStatus />
                <ThemeSwitcher />
              </div>
            </header>
            <ConfidenceClient initialAlerts={alerts} />
        </div>
    </AppLayout>
  );
}
