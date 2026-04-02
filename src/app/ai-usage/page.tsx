
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseStatus } from '@/components/supabase-status';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { getAIAnalyticsData } from '@/app/actions';
import { KPICard } from '@/app/dashboard/kpi-card';
import { Cpu, DollarSign, Puzzle, AlertCircle } from 'lucide-react';
import { AICharts } from './ai-charts';
import { TopAlertsTable } from './top-alerts-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default async function AIUsagePage() {
  const aiData = await getAIAnalyticsData();

  const totalAlerts = aiData.length;
  const totalTokens = aiData.reduce((sum, alert) => sum + alert.total_tokens, 0);
  const totalCost = aiData.reduce((sum, alert) => sum + alert.cost_estimation, 0);
  
  const avgTokensPerAlert = totalAlerts > 0 ? totalTokens / totalAlerts : 0;
  const avgCostPerAlert = totalAlerts > 0 ? totalCost / totalAlerts : 0;

  const mostExpensiveAlert = aiData.reduce((max, alert) => 
    (alert.total_tokens > (max?.total_tokens ?? 0)) ? alert : max, 
    aiData[0] || null
  );

  // Prepare data for charts
  const dailyData = aiData.reduce((acc, item) => {
    const date = new Date(item.first_seen_at).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, tokens: 0, cost: 0 };
    }
    acc[date].tokens += item.total_tokens;
    acc[date].cost += item.cost_estimation;
    return acc;
  }, {} as Record<string, { date: string, tokens: number, cost: number }>);

  const trendData = Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const tokenDistribution = {
    '0–5000': 0, '5000–8000': 0, '8000–10000': 0, '10000+': 0
  };
  aiData.forEach(item => {
    if (item.total_tokens <= 5000) tokenDistribution['0–5000']++;
    else if (item.total_tokens <= 8000) tokenDistribution['5000–8000']++;
    else if (item.total_tokens <= 10000) tokenDistribution['8000–10000']++;
    else tokenDistribution['10000+']++;
  });
  const tokenDistributionData = Object.entries(tokenDistribution).map(([name, alerts]) => ({ name, alerts }));

  const topCostAlerts = [...aiData].sort((a, b) => b.cost_estimation - a.cost_estimation).slice(0, 5);

  const manualInvestigationCost = totalAlerts * 5;
  const costBenefitData = [
    { name: 'Total Manual Cost', value: manualInvestigationCost, fill: 'hsl(var(--chart-4))' },
    { name: 'Total AI Cost', value: totalCost, fill: 'hsl(var(--chart-1))' }
  ];

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Usage</h1>
              <p className="text-muted-foreground">Analytics on AI token usage, cost, and efficiency.</p>
            </div>
            <div className="flex items-center gap-4">
              <SupabaseStatus />
              <ThemeSwitcher />
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <KPICard title="Total AI Tokens Consumed" value={totalTokens.toLocaleString()} icon={Cpu} loading={!aiData} description="Total tokens used for alert processing." tooltipText="This is the total number of tokens consumed by all AI models to process security alerts." />
            <KPICard title="Total AI Processing Cost (USD)" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)} icon={DollarSign} loading={!aiData} description="Total cost for AI processing." tooltipText="This is the total estimated cost incurred for the AI processing of all security alerts." />
            <KPICard title="Average Tokens per Alert" value={avgTokensPerAlert.toFixed(0)} icon={Puzzle} loading={!aiData} tooltipText="This is the average number of AI tokens used to process a single security alert." />
            <KPICard title="Average AI Cost per Alert" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(avgCostPerAlert)} icon={DollarSign} loading={!aiData} tooltipText="This is the average estimated cost to process a single security alert using AI." />
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Expensive Alert</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {mostExpensiveAlert ? (
                      <div>
                        <div className="text-2xl font-bold">{mostExpensiveAlert.total_tokens.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          Cost: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(mostExpensiveAlert.cost_estimation)} on {new Date(mostExpensiveAlert.first_seen_at).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data</p>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>This card shows the single alert that consumed the most AI tokens, including its cost and when it occurred.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <AICharts 
            trendData={trendData}
            tokenDistributionData={tokenDistributionData}
            costBenefitData={costBenefitData}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top AI Cost Alerts</CardTitle>
                      <CardDescription>Top 5 alerts that consumed the most AI resources.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TopAlertsTable alerts={topCostAlerts} />
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This table lists the 5 alerts that were the most expensive to process, helping identify outliers or complex cases.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Efficiency Insight</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between"><span>Total alerts processed:</span> <span className="font-medium">{totalAlerts.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Total tokens consumed:</span> <span className="font-medium">{totalTokens.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Total AI cost:</span> <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)}</span></div>
                        <div className="flex justify-between"><span>Average cost per alert:</span> <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(avgCostPerAlert)}</span></div>
                        <p className="text-muted-foreground pt-2">
                          {`AI automation processed ${totalAlerts.toLocaleString()} alerts using ${totalTokens.toLocaleString()} tokens with a total processing cost of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)}. This automation significantly reduces manual SOC analyst effort.`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This panel provides a high-level summary of the AI system's performance and efficiency.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}
