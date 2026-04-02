import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, ListTodo, ShieldAlert, ShieldCheck, Layers, ArrowRight } from 'lucide-react';
import { SupabaseStatus } from '@/components/supabase-status';
import { ThemeSwitcher } from '@/components/theme-switcher';
import {
  getTotalAlertsCount,
  getTotalPoliciesCount,
  getFalsePositiveCount,
  getFalsePositiveAlerts,
  getTruePositiveCount,
  getTruePositiveAlerts,
  getAlertsClassificationSummaryForPieChart,
  getTotalRedundancyCount,
  getAlertsBreakdownSummaryForPieChart,
  getUserBehaviorSummary,
  getRiskyUsersDistribution,
  getProcessedAlertsTrendLastHour,
  type Alert,
  type UserBehaviorPoint,
} from '@/app/actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RecentActivityChart } from './recent-activity-chart';
import { AlertsBreakdownChart } from './alerts-breakdown-chart';
import { SortableAlertsTable } from './sortable-alerts-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OverallUserBehaviorChart } from './overall-user-behavior-chart';
import { RiskyUsersPieChart } from './risky-users-pie-chart';
import { RealTimeAlerts } from './real-time-alerts';
import { ProcessedAlertsChart } from './processed-alerts-chart';

export default async function DashboardPage() {
  const [
    alertsCount,
    redundancyCount,
    totalPolicies,
    falsePositiveCount,
    falsePositiveAlerts,
    truePositiveCount,
    truePositiveAlerts,
    pieChartData,
    alertsBreakdownData,
    userBehaviorData,
    riskyUsersDistribution,
    processedAlertsTrend,
  ] = await Promise.all([
    getTotalAlertsCount(),
    getTotalRedundancyCount(),
    getTotalPoliciesCount(),
    getFalsePositiveCount(),
    getFalsePositiveAlerts(),
    getTruePositiveCount(),
    getTruePositiveAlerts(),
    getAlertsClassificationSummaryForPieChart(),
    getAlertsBreakdownSummaryForPieChart(),
    getUserBehaviorSummary(),
    getRiskyUsersDistribution(),
    getProcessedAlertsTrendLastHour(),
  ]);
  
  const totalAlerts = alertsCount + redundancyCount;

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
          <div className="flex items-center gap-4">
            <SupabaseStatus />
            <ThemeSwitcher />
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalAlerts}</div>
                    <p className="text-xs text-muted-foreground">Includes primary and redundant alerts</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is the total number of all security alerts, including both unique incidents and repeated ones.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Policies Active</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalPolicies}</div>
                    <p className="text-xs text-muted-foreground">Currently enforced</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This shows the total count of security rules that are currently active and monitoring your system.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Redundant Alerts</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{redundancyCount}</div>
                    <p className="text-xs text-muted-foreground">Total redundant alerts</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is the count of duplicate alerts that have been triggered for the same underlying security event.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Dialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer transition-colors hover:bg-muted/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">False Positive alerts</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">{falsePositiveCount}</div>
                        <p className="text-xs text-muted-foreground">Total false positive alerts</p>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is the total count of alerts that were investigated and found to be non-threatening.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-7xl bg-[#292828]">
              <DialogHeader>
                <DialogTitle>False Positive Alerts</DialogTitle>
                <DialogDescription>A list of all alerts that have been classified as false positives.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-auto">
                <SortableAlertsTable alerts={falsePositiveAlerts} />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer transition-colors hover:bg-muted/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">True Positive alerts</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{truePositiveCount}</div>
                        <p className="text-xs text-muted-foreground">Total true positive alerts</p>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is the total count of alerts that were confirmed to be genuine security threats.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-7xl bg-[#292828]">
              <DialogHeader>
                <DialogTitle>True Positive Alerts</DialogTitle>
                <DialogDescription>A list of all alerts that have been classified as true positives.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-auto">
                <SortableAlertsTable alerts={truePositiveAlerts} />
              </div>
            </DialogContent>
          </Dialog>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/alerts" className="block no-underline h-full">
                  <Card className="cursor-pointer transition-colors hover:bg-muted/50 relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">All Alerts</CardTitle>
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end justify-between">
                      <p className="text-xs text-muted-foreground">Explore all security alerts</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to view and investigate all security alerts on the Alerts page.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>


        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link href="/policy-insights" className="block no-underline">
              <Card className="h-full transition-transform hover:scale-[1.02] hover:shadow-xl">
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">Explore Policy Insights</CardTitle>
                      <CardDescription>Dive deep into policy performance and effectiveness.</CardDescription>
                    </div>
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/user-insights" className="block no-underline">
              <Card className="h-full transition-transform hover:scale-[1.02] hover:shadow-xl">
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">Explore User Insights</CardTitle>
                      <CardDescription>Analyze user behavior and identify potential risks.</CardDescription>
                    </div>
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RealTimeAlerts />
          <ProcessedAlertsChart data={processedAlertsTrend} />
        </div>

        <TooltipProvider>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card>
                  <CardHeader>
                    <CardTitle>Alert Classification</CardTitle>
                    <CardDescription>Comparison of true vs. false positive alerts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentActivityChart data={pieChartData} />
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This chart provides a quick comparison of all alerts, showing the ratio of 'True Positives' (actual threats) to 'False Positives' (non-threats).</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card>
                  <CardHeader>
                    <CardTitle>Alerts Breakdown</CardTitle>
                    <CardDescription>Actual vs. Redundant Alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertsBreakdownChart data={alertsBreakdownData} />
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This chart breaks down the total alert volume into 'Actual Alerts' (unique security events) and 'Redundant Alerts' (duplicate notifications for the same event).</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card>
                  <CardHeader>
                    <CardTitle>User Behavior Distribution</CardTitle>
                    <CardDescription>Behaviors from true positive alerts by known senders.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OverallUserBehaviorChart data={userBehaviorData} />
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This chart shows the distribution of different user behaviors that led to genuine security alerts from known users.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card>
                        <CardHeader>
                            <CardTitle>User Risk Distribution</CardTitle>
                            <CardDescription>Comparison of risky vs. non-risky users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RiskyUsersPieChart data={riskyUsersDistribution} />
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent>
                    <p>This chart provides a breakdown of all users who have triggered alerts into 'Risky' and 'Non-Risky' categories.</p>
                </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </AppLayout>
  );
}
