'use client';

import { useState, useEffect, useMemo, FC } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import {
  getTotalPoliciesCount,
  getTriggeredPoliciesStats,
  getDailyPolicyTrend,
  getTopTriggeredPolicies,
  getPolicyEffectivenessScores,
  getTriggeredPoliciesDetails,
  getNotTriggeredPoliciesDetails,
  getOverallEffectivenessTrend,
  getAlertsTrend,
  TriggeredPoliciesStats,
  DailyPolicyTrend,
  TopTriggeredPolicy,
  PolicyEffectivenessScore,
  TriggeredPolicyDetail,
  NotTriggeredPolicyDetail,
  EffectivenessTrendPoint,
  AlertTrendPoint,
} from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SupabaseStatus } from '@/components/supabase-status';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { BookCheck, BookX, Zap, Trophy, AlertCircle, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart as RechartsLineChart, Line, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type PageData = {
  totalPolicies: number;
  triggeredStats: TriggeredPoliciesStats;
  dailyTrend: DailyPolicyTrend[];
  topPolicies: TopTriggeredPolicy[];
  effectivenessScores: PolicyEffectivenessScore[];
  effectivenessTrend: EffectivenessTrendPoint[];
  alertsTrend: AlertTrendPoint[];
};

type DialogDataType = 'triggered' | 'notTriggered' | null;
const PAGE_SIZE = 6;


export default function PolicyInsightsPage() {
  const [timeRange, setTimeRange] = useState(30);
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<(TriggeredPolicyDetail[] | NotTriggeredPolicyDetail[])>([]);
  const [dialogType, setDialogType] = useState<DialogDataType>(null);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [
        totalPolicies,
        triggeredStats,
        dailyTrend,
        topPolicies,
        effectivenessScores,
        effectivenessTrend,
        alertsTrend,
      ] = await Promise.all([
        getTotalPoliciesCount(),
        getTriggeredPoliciesStats(timeRange),
        getDailyPolicyTrend(timeRange),
        getTopTriggeredPolicies(timeRange, 5),
        getPolicyEffectivenessScores(timeRange),
        getOverallEffectivenessTrend(timeRange),
        getAlertsTrend(timeRange),
      ]);
      setData({ totalPolicies, triggeredStats, dailyTrend, topPolicies, effectivenessScores, effectivenessTrend, alertsTrend });
      setLoading(false);
    }
    fetchData();
  }, [timeRange]);

  const coverageData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Policies Triggered', value: data.triggeredStats.triggeredCount, fill: 'hsl(var(--chart-1))' },
      { name: 'Policies Not Triggered', value: data.triggeredStats.notTriggeredCount, fill: 'hsl(var(--chart-2))' },
    ];
  }, [data]);
  
  const handleTimeRangeChange = (days: number) => {
    if (days !== timeRange) {
        setTimeRange(days);
    }
  };

  const handleCardClick = async (type: DialogDataType) => {
    if (!type) return;
    setDialogType(type);
    setIsDialogOpen(true);
    setIsDialogLoading(true);
    if (type === 'triggered') {
        const details = await getTriggeredPoliciesDetails(timeRange);
        setDialogContent(details);
    } else if (type === 'notTriggered') {
        const details = await getNotTriggeredPoliciesDetails(timeRange);
        setDialogContent(details);
    }
    setIsDialogLoading(false);
  };
  
  const top5Effective = useMemo(() => {
    return data?.effectivenessScores.slice(0, 5) || [];
  }, [data]);

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Policy Insights</h1>
            <p className="text-muted-foreground">Insights into security policy performance and effectiveness.</p>
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
                <Button variant={timeRange === 1 ? 'default' : 'outline'} onClick={() => handleTimeRangeChange(1)}>Today</Button>
                <Button variant={timeRange === 7 ? 'default' : 'outline'} onClick={() => handleTimeRangeChange(7)}>Last 7 Days</Button>
                <Button variant={timeRange === 30 ? 'default' : 'outline'} onClick={() => handleTimeRangeChange(30)}>Last 30 Days</Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/policies" className="no-underline">
            <KPICard title="Total Policies" value={data?.totalPolicies} icon={BookCheck} loading={loading} />
          </Link>
          <div className="cursor-pointer" onClick={() => handleCardClick('triggered')}>
            <KPICard title="Policies Triggered" value={data?.triggeredStats.triggeredCount} icon={Zap} loading={loading} description={`in last ${timeRange} ${timeRange === 1 ? 'day' : 'days'}`} />
          </div>
           <div className="cursor-pointer" onClick={() => handleCardClick('notTriggered')}>
            <KPICard title="Policies Not Triggered" value={data?.triggeredStats.notTriggeredCount} icon={BookX} loading={loading} description={`in last ${timeRange} ${timeRange === 1 ? 'day' : 'days'}`} />
          </div>
          <KPICard title="Most Triggered Policy" value={data?.triggeredStats.mostTriggered} icon={Trophy} loading={loading} description={`in last ${timeRange} ${timeRange === 1 ? 'day' : 'days'}`} textBreak />
        </div>
        
        {/* Security Control Effectiveness */}
        <div className="space-y-4">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Policy True Positive Trend</CardTitle>
                  <CardDescription>Effectiveness score = (True Positives / Total Alerts) %</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-[250px] w-full" /> : <OverallEffectivenessChart data={data?.effectivenessTrend || []} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Most Effective Policies</CardTitle>
                  <CardDescription>Highest true positive rate in the selected time range.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-[250px] w-full" /> : <TopEffectivePoliciesChart data={top5Effective} />}
                </CardContent>
              </Card>
            </div>
        </div>
        
        {/* Alert Noise Reduction */}
        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Alert Noise Reduction</h2>
            <div className="grid grid-cols-1">
                <Card>
                    <CardHeader>
                      <CardTitle>Alert Trend</CardTitle>
                      <CardDescription>False positives vs. True positives over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? <Skeleton className="h-[250px] w-full" /> : <AlertNoiseReductionChart data={data?.alertsTrend || []} />}
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Original charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Coverage</CardTitle>
              <CardDescription>Percentage of triggered vs. not triggered policies.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[250px] w-full" /> : <PolicyCoverageChart data={coverageData} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Daily Policy Trend</CardTitle>
              <CardDescription>Unique policies triggered each day.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[250px] w-full" /> : <DailyTrendChart data={data?.dailyTrend || []} />}
            </CardContent>
          </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Top 5 Triggered Policies</CardTitle>
                <CardDescription>Policies generating the most alerts in the last {timeRange} {timeRange === 1 ? 'day' : 'days'}.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[200px] w-full" /> : <TopTriggeredPoliciesChart data={data?.topPolicies || []} isCount />}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Policy True Positive Rate</CardTitle>
                <CardDescription>Policies by true positive ratio in the last {timeRange} {timeRange === 1 ? 'day' : 'days'}.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[400px] w-full" /> : <EffectivenessTable data={data?.effectivenessScores || []} />}
            </CardContent>
        </Card>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl bg-[#292828]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'triggered' ? 'Triggered Policies' : 'Not Triggered Policies'}
            </DialogTitle>
            <DialogDescription>
              Details for policies {dialogType === 'triggered' ? 'triggered' : 'not triggered'} in the last {timeRange} {timeRange === 1 ? 'day' : 'days'}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {isDialogLoading ? (
              <div className="flex justify-center items-center h-40">
                  <p>Loading details...</p>
              </div>
            ) : dialogType === 'triggered' ? (
                <TriggeredPoliciesTable data={dialogContent as TriggeredPolicyDetail[]} />
            ) : (
                <NotTriggeredPoliciesTable data={dialogContent as NotTriggeredPolicyDetail[]} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

const KPICard: FC<{title: string; value: string | number | undefined; icon: React.ElementType; loading: boolean; description?: string, textBreak?: boolean}> = ({ title, value, icon: Icon, loading, description, textBreak = false }) => (
    <Card className="relative overflow-hidden h-full">
        <div className="absolute top-0 left-0 h-1 w-full bg-[#548118]" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-3/4" /> : <div className={`text-2xl font-bold ${textBreak ? 'break-words' : ''}`}>{value}</div>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
);

const PolicyCoverageChart: FC<{ data: {name: string, value: number, fill: string}[] }> = ({ data }) => {
    const total = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
    if (total === 0) return <NoDataPlaceholder />;

    return (
        <ChartContainer config={{
            'Policies Triggered': { label: 'Policies Triggered' },
            'Policies Not Triggered': { label: 'Policies Not Triggered' },
        }} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                    <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Legend />
                </RechartsPieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

const DailyTrendChart: FC<{data: DailyPolicyTrend[]}> = ({ data }) => {
    if (data.length === 0) return <NoDataPlaceholder />;
    return (
        <ChartContainer config={{ count: { label: "Policies", color: "hsl(var(--chart-1))" } }} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month:'short', day:'numeric'})} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Unique Policies" dot={false} />
                </RechartsLineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

const TopTriggeredPoliciesChart: FC<{ data: TopTriggeredPolicy[] | PolicyEffectivenessScore[], isCount?: boolean }> = ({ data, isCount = false }) => {
    if (data.length === 0) return <NoDataPlaceholder />;
    const dataKey = isCount ? "count" : "score";
    const chartColor = isCount ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))";
    const height = isCount ? 200 : 250;
    
    return (
        <ChartContainer config={{[dataKey]: { label: isCount ? "Count" : "Score", color: chartColor }}} className={`min-h-[${height}px] w-full`}>
            <ResponsiveContainer width="100%" height={height}>
                <RechartsBarChart layout="vertical" data={data} margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={isCount ? [0, 'dataMax'] : [0, 100]} />
                    <YAxis dataKey="policy_name" type="category" tick={{ fontSize: 12 }} width={200} />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={4} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};
const TopEffectivePoliciesChart = TopTriggeredPoliciesChart;

type EffectivenessSortableColumn = keyof PolicyEffectivenessScore;

const EffectivenessTable: FC<{ data: PolicyEffectivenessScore[] }> = ({ data }) => {
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: EffectivenessSortableColumn, direction: 'asc' | 'desc' } | null>({ key: 'score', direction: 'desc' });
    
    const handleSort = (key: EffectivenessSortableColumn) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const getSortIcon = (columnKey: EffectivenessSortableColumn) => {
        if (!sortConfig || sortConfig.key !== columnKey) {
          return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        }
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const sortedAndFilteredData = useMemo(() => {
        let filteredData = data.filter(item => item.policy_name.toLowerCase().includes(filter.toLowerCase()));
        
        if (sortConfig) {
            filteredData.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
    }, [data, filter, sortConfig]);

    const totalPages = Math.ceil(sortedAndFilteredData.length / PAGE_SIZE);
    const paginatedData = sortedAndFilteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    if (data.length === 0) return <NoDataPlaceholder />;
    
    return (
        <div>
            <Input 
                placeholder="Search policies..."
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="max-w-sm mb-4"
            />
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('policy_name')}>
                                    Policy Name {getSortIcon('policy_name')}
                                </Button>
                            </TableHead>
                            <TableHead className="w-[200px]">
                                <Button variant="ghost" onClick={() => handleSort('score')}>
                                    Effectiveness {getSortIcon('score')}
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                              <Button variant="ghost" onClick={() => handleSort('true_positives')}>
                                True Positives {getSortIcon('true_positives')}
                              </Button>
                               / 
                               <Button variant="ghost" onClick={() => handleSort('total')}>
                                Total {getSortIcon('total')}
                               </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map(policy => (
                            <TableRow key={policy.policy_name}>
                                <TableCell className="font-medium">{policy.policy_name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Progress value={policy.score} className="h-2" />
                                        <span>{policy.score.toFixed(0)}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{policy.true_positives} / {policy.total}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} variant="outline" size="sm">Previous</Button>
                    <Button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || paginatedData.length === 0} variant="outline" size="sm">Next</Button>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
            </div>
        </div>
    );
};

type TriggeredSortableColumn = keyof TriggeredPolicyDetail;

const TriggeredPoliciesTable: FC<{ data: TriggeredPolicyDetail[] }> = ({ data }) => {
    const [sortConfig, setSortConfig] = useState<{ key: TriggeredSortableColumn, direction: 'asc' | 'desc' } | null>({ key: 'last_triggered_at', direction: 'desc' });
    const handleSort = (key: TriggeredSortableColumn) => {
        setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    const getSortIcon = (key: TriggeredSortableColumn) => (sortConfig?.key === key) ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead><Button variant="ghost" onClick={() => handleSort('policy_name')}>Policy Name {getSortIcon('policy_name')}</Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => handleSort('description')}>Description {getSortIcon('description')}</Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => handleSort('last_triggered_at')}>Last Triggered {getSortIcon('last_triggered_at')}</Button></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedData.map(p => (
                    <TableRow key={p.policy_name}>
                        <TableCell>{p.policy_name}</TableCell>
                        <TableCell>{p.description}</TableCell>
                        <TableCell suppressHydrationWarning>{new Date(p.last_triggered_at).toLocaleString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

type NotTriggeredSortableColumn = keyof NotTriggeredPolicyDetail;

const NotTriggeredPoliciesTable: FC<{ data: NotTriggeredPolicyDetail[] }> = ({ data }) => {
    const [sortConfig, setSortConfig] = useState<{ key: NotTriggeredSortableColumn, direction: 'asc' | 'desc' } | null>({ key: 'policy_name', direction: 'asc' });
    const handleSort = (key: NotTriggeredSortableColumn) => {
        setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    const getSortIcon = (key: NotTriggeredSortableColumn) => (sortConfig?.key === key) ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead><Button variant="ghost" onClick={() => handleSort('policy_name')}>Policy Name {getSortIcon('policy_name')}</Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => handleSort('description')}>Description {getSortIcon('description')}</Button></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedData.map(p => (
                    <TableRow key={p.policy_name}>
                        <TableCell>{p.policy_name}</TableCell>
                        <TableCell>{p.description}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
};

const OverallEffectivenessChart: FC<{data: EffectivenessTrendPoint[]}> = ({ data }) => {
    if (data.length === 0) return <NoDataPlaceholder />;
    return (
        <ChartContainer config={{ score: { label: "Effectiveness %", color: "hsl(var(--chart-1))" } }} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month:'short', day:'numeric'})} />
                    <YAxis domain={[0, 100]} unit="%" />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <defs>
                        <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#fillScore)" />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

const AlertNoiseReductionChart: FC<{data: AlertTrendPoint[]}> = ({ data }) => {
    if (data.length === 0) return <NoDataPlaceholder />;
    return (
        <ChartContainer config={{ 'True Positives': { label: "True Positives", color: "hsl(var(--chart-1))" }, 'False Positives': { label: "False Positives", color: "hsl(var(--chart-2))" } }} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month:'short', day:'numeric'})} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="True Positives" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="False Positives" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                </RechartsLineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

const NoDataPlaceholder = () => (
    <div className="flex h-full min-h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
        <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Not enough data to display for the selected time range.</p>
        </div>
    </div>
);

    

    

    