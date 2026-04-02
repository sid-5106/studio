import { AppLayout } from '@/components/app-layout';
import { getPromptLibraryInsights } from '@/app/actions';
import { InsightsClient } from './insights-client';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { SupabaseStatus } from '@/components/supabase-status';

export default async function PromptLibraryInsightsPage() {
  const insights = await getPromptLibraryInsights();

  return (
    <AppLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Prompt Library Insights</h1>
                <p className="text-muted-foreground">
                  Browse a library of AI classification reasons that have been validated and refined by L1 feedback.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <SupabaseStatus />
                <ThemeSwitcher />
              </div>
            </header>
            <InsightsClient initialInsights={insights} />
        </div>
    </AppLayout>
  );
}
