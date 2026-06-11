'use client';

export const dynamic = 'force-dynamic';

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
import { BookCheck, BookX, Zap, Trophy, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart as RechartsLineChart, Line, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
const PAGE_SIZE = 10;

export default function PolicyInsightsPage() {
  const [timeRange, setTimeRange] = useState(0); // All Time default
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
        totalPolicies, triggeredStats, dailyTrend, topPolicies,
        effectivenessScores, effectivenessTrend, alertsTrend,
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
      { name: 'Triggered', value: data.triggeredStats.triggeredCount, fill: 'hsl(var(--chart-1))' },
      { name: 'Inactive', value: data.triggeredStats.notTriggeredCount, fill: 'hsl(var(--chart-2))' },
    ];
  }, [data]);
  
  const handleCardClick = async (type: DialogDataType) => {
    setDialogType(type); setIsDialogOpen(true); setIsDialogLoading(true);
    const details = type === 'triggered' ? await getTriggeredPoliciesDetails(timeRange) : await getNotTriggeredPoliciesDetails(timeRange);
    setDialogContent(details); setIsDialogLoading(false);
  };

  const getTimeLabel = (r: number) => r === 0 ? "overall history" : r === 1 ? "today" : `last ${r} days (including today)`;

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Policy Insights</h1>
            <div className="flex items-center gap-4"><SupabaseStatus /><ThemeSwitcher /></div>
          </header>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Time Filter</CardTitle>
              <div className="flex gap-2">
                <Button variant={timeRange === 0 ? 'default' : 'outline'} onClick={() => setTimeRange(0)}>All Time</Button>
                <Button variant={timeRange === 1 ? 'default' : 'outline'} onClick={() => setTimeRange(1)}>Today</Button>
                <Button variant={timeRange === 7 ? 'default' : 'outline'} onClick={() => setTimeRange(7)}>Last 7 Days</Button>
                <Button variant={timeRange === 30 ? 'default' : 'outline'} onClick={() => setTimeRange(30)}>Last 30 Days</Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard title="Total Policies" value={data?.totalPolicies} icon={BookCheck} loading={loading} />
            <div className="cursor-pointer" onClick={() => handleCardClick('triggered')}>
                <KPICard title="Triggered" value={data?.triggeredStats.triggeredCount} icon={Zap} loading={loading} description={getTimeLabel(timeRange)} />
            </div>
            <div className="cursor-pointer" onClick={() => handleCardClick('notTriggered')}>
                <KPICard title="Inactive" value={data?.triggeredStats.notTriggeredCount} icon={BookX} loading={loading} description={getTimeLabel(timeRange)} />
            </div>
            <KPICard title="Top Volume" value={data?.triggeredStats.mostTriggered} icon={Trophy} loading={loading} textBreak />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle>Activation Trend</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-64 w-full" /> : <DailyTrendChart data={data?.dailyTrend || []} />}</CardContent></Card>
            <Card><CardHeader><CardTitle>Coverage</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-64 w-full" /> : <PolicyCoverageChart data={coverageData} />}</CardContent></Card>
          </div>

          {/* Full-width vertical blocks for TP and FP Rates */}
          <div className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Policy True Positive Rate</CardTitle>
                <CardDescription>Most effective rules identifying real threats.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-[400px] w-full" /> : <EffectivenessTable data={data?.effectivenessScores || []} type="TP" />}
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader>
                <CardTitle>Policy False Positive Rate</CardTitle>
                <CardDescription>Rules generating the most noise.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-[400px] w-full" /> : <EffectivenessTable data={data?.effectivenessScores || []} type="FP" />}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle>Accuracy Trend</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-64 w-full" /> : <OverallEffectivenessChart data={data?.effectivenessTrend || []} />}</CardContent></Card>
            <Card><CardHeader><CardTitle>Noise Reduction</CardTitle></CardHeader><CardContent>{loading ? <Skeleton className="h-64 w-full" /> : <AlertNoiseReductionChart data={data?.alertsTrend || []} />}</CardContent></Card>
          </div>
        </div>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl bg-card">
          <DialogHeader><DialogTitle>{dialogType === 'triggered' ? 'Triggered' : 'Inactive'} Policies</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {isDialogLoading ? <div className="p-20 text-center">Loading...</div> : dialogType === 'triggered' ? <TriggeredTable data={dialogContent as any} /> : <InactiveTable data={dialogContent as any} />}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

const KPICard: FC<{ title: string; value: any; icon: any; loading: boolean; description?: string; textBreak?: boolean }> = ({ title, value, icon: Icon, loading, description, textBreak }) => (
    <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : <div className={`text-2xl font-bold ${textBreak ? 'break-words' : ''}`}>{String(value ?? '0')}</div>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const EffectivenessTable: FC<{ data: PolicyEffectivenessScore[], type: 'TP' | 'FP' }> = ({ data, type }) => {
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(1);
    const enriched = useMemo(() => data.map(i => ({ ...i, fpr: 100 - i.score, fps: i.total - i.true_positives })), [data]);
    const filtered = enriched.filter(i => i.policy_name.toLowerCase().includes(filter.toLowerCase())).sort((a,b) => type === 'TP' ? b.score - a.score : b.fpr - a.fpr);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    return (
        <div className="space-y-4">
            <Input placeholder="Search policies..." value={filter} onChange={e => {setFilter(e.target.value); setPage(1);}} className="max-w-sm" />
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50"><TableRow><TableHead>Policy Name</TableHead><TableHead>{type === 'TP' ? 'TP Rate' : 'FP Rate'}</TableHead><TableHead className="text-right">Alert Breakdown</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {paginated.map(p => (
                            <TableRow key={p.policy_name}>
                                <TableCell className="font-medium text-xs">{p.policy_name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                      <Progress value={type === 'TP' ? p.score : p.fpr} className="h-2 flex-1" />
                                      <span className="text-xs font-bold w-10">{(type === 'TP' ? p.score : p.fpr).toFixed(0)}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-xs font-mono">{type === 'TP' ? p.true_positives : p.fps} / {p.total}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page === totalPages || filtered.length === 0} onClick={() => setPage(p => p + 1)}>Next</Button></div>
                <span>Page {page} of {Math.max(1, totalPages)} | {filtered.length} matching policies</span>
            </div>
        </div>
    );
};

const DailyTrendChart: FC<{ data: any[] }> = ({ data }) => (
    <ChartContainer config={{ count: { label: "Unique Policies", color: "hsl(var(--chart-1))" } }} className="h-64 w-full">
        <ResponsiveContainer><RechartsLineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={s => new Date(s).toLocaleDateString([], {month:'short', day:'numeric'})} /><YAxis allowDecimals={false} /><RechartsTooltip content={<ChartTooltipContent />} /><Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" dot={false} /></RechartsLineChart></ResponsiveContainer>
    </ChartContainer>
);

const PolicyCoverageChart: FC<{ data: any[] }> = ({ data }) => (
    <ChartContainer config={{}} className="h-64 w-full">
        <ResponsiveContainer><RechartsPieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>{data.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><RechartsTooltip /><Legend /></RechartsPieChart></ResponsiveContainer>
    </ChartContainer>
);

const OverallEffectivenessChart: FC<{ data: any[] }> = ({ data }) => (
    <ChartContainer config={{ score: { label: "Effectiveness %", color: "hsl(var(--chart-3))" } }} className="h-64 w-full">
        <ResponsiveContainer><AreaChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={s => new Date(s).toLocaleDateString([], {month:'short', day:'numeric'})} /><YAxis domain={[0, 100]} unit="%" /><RechartsTooltip content={<ChartTooltipContent />} /><Area type="monotone" dataKey="score" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
    </ChartContainer>
);

const AlertNoiseReductionChart: FC<{ data: any[] }> = ({ data }) => (
    <ChartContainer config={{}} className="h-64 w-full">
        <ResponsiveContainer><RechartsLineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={s => new Date(s).toLocaleDateString([], {month:'short', day:'numeric'})} /><YAxis /><RechartsTooltip content={<ChartTooltipContent />} /><Legend /><Line type="monotone" dataKey="True Positives" stroke="hsl(var(--chart-1))" dot={false} /><Line type="monotone" dataKey="False Positives" stroke="hsl(var(--chart-2))" dot={false} /></RechartsLineChart></ResponsiveContainer>
    </ChartContainer>
);

const TriggeredTable = ({ data }: { data: TriggeredPolicyDetail[] }) => (
    <Table><TableHeader><TableRow><TableHead>Policy</TableHead><TableHead>Description</TableHead><TableHead>Last Triggered</TableHead></TableRow></TableHeader>
    <TableBody>{data.map(p => <TableRow key={p.policy_name}><TableCell className="text-xs font-bold">{p.policy_name}</TableCell><TableCell className="text-xs">{p.description}</TableCell><TableCell className="text-[10px]">{new Date(p.last_triggered_at).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table>
);

const InactiveTable = ({ data }: { data: NotTriggeredPolicyDetail[] }) => (
    <Table><TableHeader><TableRow><TableHead>Policy</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
    <TableBody>{data.map(p => <TableRow key={p.policy_name}><TableCell className="text-xs font-bold">{p.policy_name}</TableCell><TableCell className="text-xs">{p.description}</TableCell></TableRow>)}</TableBody></Table>
);
