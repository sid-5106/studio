import { AppLayout } from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  getTotalRiskyUsersCount,
  getHighRiskUsersCount,
  getNewRiskyUsersCount,
  getEscalatingUsersCount,
  getRiskyUsersDetails,
  getMostViolatedPoliciesByRiskyUsers,
  getNonRiskyUsersDetails,
} from '@/app/actions';
import { RiskyUsersView } from './risky-users-view';
import { SupabaseStatus } from '@/components/supabase-status';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default async function UserInsightsPage() {
  const [
    totalRiskyUsers,
    highRiskUsers,
    newRiskyUsers,
    escalatingUsers,
    riskyUsersDetails,
    mostViolatedPolicies,
    nonRiskyUsersDetails,
  ] = await Promise.all([
    getTotalRiskyUsersCount(),
    getHighRiskUsersCount(),
    getNewRiskyUsersCount(),
    getEscalatingUsersCount(),
    getRiskyUsersDetails(),
    getMostViolatedPoliciesByRiskyUsers(),
    getNonRiskyUsersDetails(),
  ]);

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">User Insights</h1>
            <div className="flex items-center gap-4">
                <SupabaseStatus />
                <ThemeSwitcher />
            </div>
        </header>
        <div className="space-y-6 mt-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card>
                  <CardHeader>
                    <CardTitle>Risky User Monitoring</CardTitle>
                    <CardDescription>High-level insider risk view of users with repeated violations.</CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This section focuses on identifying and analyzing users who pose a potential insider risk based on their pattern of security violations.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <RiskyUsersView
            totalRiskyUsers={totalRiskyUsers}
            highRiskUsersCount={highRiskUsers}
            newRiskyUsersCount={newRiskyUsers}
            escalatingUsersCount={escalatingUsers}
            riskyUsersDetails={riskyUsersDetails}
            mostViolatedPolicies={mostViolatedPolicies}
            nonRiskyUsersDetails={nonRiskyUsersDetails}
          />
        </div>
      </div>
    </AppLayout>
  );
}
