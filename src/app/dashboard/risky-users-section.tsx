import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  getTotalRiskyUsersCount,
  getHighRiskUsersCount,
  getNewRiskyUsersCount,
  getEscalatingUsersCount,
  getRiskyUsersDetails,
  getMostViolatedPoliciesByRiskyUsers,
} from '@/app/actions';
import { RiskyUsersView } from './risky-users-view';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export async function RiskyUsersSection() {
  const [
    totalRiskyUsers,
    highRiskUsers,
    newRiskyUsers,
    escalatingUsers,
    riskyUsersDetails,
    mostViolatedPolicies,
  ] = await Promise.all([
    getTotalRiskyUsersCount(),
    getHighRiskUsersCount(),
    getNewRiskyUsersCount(),
    getEscalatingUsersCount(),
    getRiskyUsersDetails(),
    getMostViolatedPoliciesByRiskyUsers(),
  ]);

  return (
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
      />
    </div>
  );
}
