'use client';

import { useState, useMemo } from 'react';
import { RiskyUserDetail, TopPolicySummary } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, ShieldAlert, UserPlus, TrendingUp } from 'lucide-react';
import { subDays } from 'date-fns';
import { KPICard } from './kpi-card';
import { RiskyUsersTable } from './risky-users-table';
import { MostViolatedPoliciesChart } from './most-violated-policies-chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RiskyUsersViewProps {
    totalRiskyUsers: number;
    highRiskUsersCount: number;
    newRiskyUsersCount: number;
    escalatingUsersCount: number;
    riskyUsersDetails: RiskyUserDetail[];
    mostViolatedPolicies: TopPolicySummary[];
}

export function RiskyUsersView({
    totalRiskyUsers,
    highRiskUsersCount,
    newRiskyUsersCount,
    escalatingUsersCount,
    riskyUsersDetails,
    mostViolatedPolicies,
}: RiskyUsersViewProps) {
  const [dialogState, setDialogState] = useState<{ open: boolean; title: string; users: RiskyUserDetail[] }>({ open: false, title: '', users: [] });

  const highRiskUsers = useMemo(() => riskyUsersDetails.filter(u => u.risk_level === 'High'), [riskyUsersDetails]);
  
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);
  const newRiskyUsers = useMemo(() => riskyUsersDetails.filter(u => u.first_violation !== 'N/A' && new Date(u.first_violation) >= sevenDaysAgo), [riskyUsersDetails, sevenDaysAgo]);

  const escalatingUsers = useMemo(() => riskyUsersDetails.filter(u => u.trend === 'Increasing'), [riskyUsersDetails]);
  
  const handleOpenDialog = (title: string, users: RiskyUserDetail[]) => {
    setDialogState({ open: true, title, users });
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Risky Users" value={totalRiskyUsers} icon={Users} tooltipText="Shows the total number of users who have been identified as a potential risk based on their activity." />
        
        <div className="cursor-pointer" onClick={() => handleOpenDialog('High Risk Users', highRiskUsers)}>
            <KPICard title="High Risk Users" value={highRiskUsersCount} icon={ShieldAlert} description="Users with 6 or more violations" tooltipText="This is the count of users who are considered high-risk because they have a significant number of policy violations (6 or more)." />
        </div>

        <div className="cursor-pointer" onClick={() => handleOpenDialog('New Risky Users', newRiskyUsers)}>
            <KPICard title="New Risky Users" value={newRiskyUsersCount} icon={UserPlus} description="First violation in last 7 days" tooltipText="This shows the number of users whose first security violation occurred within the last 7 days." />
        </div>

        <div className="cursor-pointer" onClick={() => handleOpenDialog('Escalating Users', escalatingUsers)}>
            <KPICard title="Escalating Users" value={escalatingUsersCount} icon={TrendingUp} description="Violation trend increasing" tooltipText="This is the count of users whose rate of security violations is increasing over time, indicating a growing risk." />
        </div>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card>
                  <CardHeader>
                    <CardTitle>Risky Users Details</CardTitle>
                    <CardDescription>Click on a user to see more details.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RiskyUsersTable users={riskyUsersDetails} />
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This table lists all users identified as 'risky' and provides key details like their risk score, violation history, and current risk trend. Click on a user for an in-depth analysis.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card>
                  <CardHeader>
                    <CardTitle>Most Violated Policies</CardTitle>
                    <CardDescription>Policies most frequently violated by risky users.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MostViolatedPoliciesChart data={mostViolatedPolicies} />
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This chart shows which policies are most frequently violated by the group of users identified as 'risky', helping to pinpoint common areas of non-compliance for this high-risk cohort.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState({ ...dialogState, open })}>
        <DialogContent className="max-w-7xl bg-[#292828]">
          <DialogHeader>
            <DialogTitle>{dialogState.title}</DialogTitle>
            <DialogDescription>A list of users matching the "{dialogState.title}" criteria.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <RiskyUsersTable users={dialogState.users} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
