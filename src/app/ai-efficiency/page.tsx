
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { SupabaseStatus } from '@/components/supabase-status';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { getAIEfficiencyData, type AIEfficiencyData } from '@/app/actions';
import { KPICard } from '@/app/dashboard/kpi-card';
import { Clock, Zap, Users, Hourglass, TrendingUp } from 'lucide-react';
import { EfficiencyCharts } from './efficiency-charts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';

function formatSecondsToHMS(seconds: number) {
  if (seconds < 0) seconds = 0;
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= (3600 * 24);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);

  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || result === '') result += `${minutes}m`;

  return result.trim();
}

export default function AIEfficiencyPage() {
  const [timeRange, setTimeRange] = useState(0); // Default to All Time
  const [efficiencyData, setEfficiencyData] = useState<AIEfficiencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getAIEfficiencyData(timeRange);
      setEfficiencyData(data);
      setLoading(false);
    }
    fetchData();
  }, [timeRange]);

  const totalAITimeSeconds = efficiencyData?.totalAITimeSeconds ?? 0;
  const totalManualTimeSeconds = efficiencyData?.totalManualTimeSeconds ?? 0;
  const totalTimeSavedSeconds = efficiencyData?.totalTimeSavedSeconds ?? 0;
  const totalAlerts = efficiencyData?.totalAlerts ?? 0;
  const cumulativeTimeSavedTrend = efficiencyData?.cumulativeTimeSavedTrend ?? [];

  const avgTimeSavedPerAlert = totalAlerts > 0 ? totalTimeSavedSeconds / totalAlerts : 0;
  const efficiencyGain = totalManualTimeSeconds > 0 ? (totalTimeSavedSeconds / totalManualTimeSeconds) * 100 : 0;
  
  const comparisonData = [
    { name: 'Estimated Manual Time', time: totalManualTimeSeconds / 3600, fill: 'hsl(var(--chart-2))' },
    { name: 'Actual AI Time', time: totalAITimeSeconds / 3600, fill: 'hsl(var(--chart-1))' }
  ];

  const avgComparisonData = [
      { name: 'Human', time: 300, fill: 'hsl(var(--chart-2))'},
      { name: 'AI (True Positive)', time: 52.5, fill: 'hsl(var(--chart-1))'},
      { name: 'AI (False Positive)', time: 42.5, fill: 'hsl(var(--chart-3))'},
      { name: 'AI (Redundant)', time: 6.5, fill: 'hsl(var(--chart-4))'}
  ];

  const getTimeLabel = (range: number) => {
    if (range === 0) return "overall";
    if (range === 1) return "today";
    return `in last ${range} days`;
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI vs Human Efficiency</h1>
            <p className="text-muted-foreground">Comparing AI-powered alert classification with manual effort estimates.</p>
          </div>
          <div className="flex items-center gap-4">
            <SupabaseStatus />
            <ThemeSwitcher />
          </div>
        </header>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Time Filter</CardTitle>
              <div className="flex gap-2">
                <Button variant={timeRange === 0 ? 'default' : 'outline'} onClick={() => setTimeRange(0)}>All Time</Button>
                <Button variant={timeRange === 1 ? 'default' : 'outline'} onClick={() => setTimeRange(1)}>Today</Button>
                <Button variant={timeRange === 7 ? 'default' : 'outline'} onClick={() => setTimeRange(7)}>Last 7 Days</Button>
                <Button variant={timeRange === 30 ? 'default' : 'outline'} onClick={() => setTimeRange(30)}>Last 30 Days</Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KPICard title="Total Time Saved" value={formatSecondsToHMS(totalTimeSavedSeconds)} icon={Clock} loading={loading} description={`Saved ${getTimeLabel(timeRange)}`} tooltipText="This is the total estimated time saved by automating alert classification, calculated as (Total Manual Time) - (Total AI Time)." />
          <KPICard title="Avg. Time Saved Per Alert" value={`${avgTimeSavedPerAlert.toFixed(1)}s`} icon={Hourglass} loading={loading} description="Approx. time saved per alert" tooltipText="The average amount of time saved for each alert processed by the AI instead of a human analyst." />
          <KPICard title="Efficiency Gain" value={`${efficiencyGain.toFixed(1)}%`} icon={TrendingUp} loading={loading} description="Approx. time reduction" tooltipText="The percentage of time saved by using AI compared to manual classification." />
          <KPICard title="Estimated Manual Time" value={formatSecondsToHMS(totalManualTimeSeconds)} icon={Users} loading={loading} description={`For ${totalAlerts.toLocaleString()} alerts`} tooltipText="This is the total estimated time it would take for human analysts to process all alerts, assuming 5 minutes per alert." />
          <KPICard title="Total AI Time" value={formatSecondsToHMS(totalAITimeSeconds)} icon={Zap} loading={loading} description={`For ${totalAlerts.toLocaleString()} alerts`} tooltipText="This is the total actual time the AI agent spent processing all alerts." />
        </div>
        
        {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        ) : (
            <EfficiencyCharts
              comparisonData={comparisonData}
              cumulativeTimeSavedTrend={cumulativeTimeSavedTrend}
              avgComparisonData={avgComparisonData}
              totalAITimeSeconds={totalAITimeSeconds}
              totalManualTimeSeconds={totalManualTimeSeconds}
              totalTimeSavedSeconds={totalTimeSavedSeconds}
              totalAlerts={totalAlerts}
            />
        )}

      </div>
    </AppLayout>
  );
}
