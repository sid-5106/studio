'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EfficiencyChartsProps {
  comparisonData: { name: string; time: number; fill: string }[];
  cumulativeTimeSavedTrend: { date: string; hoursSaved: number }[];
  avgComparisonData: { name: string; time: number; fill: string }[];
  totalAITimeSeconds: number;
  totalManualTimeSeconds: number;
  totalTimeSavedSeconds: number;
  totalAlerts: number;
}

const NoDataPlaceholder = () => (
    <div className="flex h-full min-h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
        <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Not enough data to display chart.</p>
        </div>
    </div>
);

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


export function EfficiencyCharts({ comparisonData, cumulativeTimeSavedTrend, avgComparisonData, totalAITimeSeconds, totalManualTimeSeconds, totalTimeSavedSeconds, totalAlerts }: EfficiencyChartsProps) {
  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardHeader>
                <CardTitle>Total Processing Time (AI vs Human)</CardTitle>
                <CardDescription>Compares total AI time vs. estimated total manual time in hours.</CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonData.some(d => d.time > 0) ? (
                  <ChartContainer config={{ time: { label: "Hours" } }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={comparisonData} layout="vertical" barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} />
                        <XAxis type="number" unit="h" />
                        <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)} hours`} content={<ChartTooltipContent />} />
                        <Bar dataKey="time" name="Total Time" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : <NoDataPlaceholder />}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>This chart shows the stark difference in total hours spent, comparing the AI's actual time to the estimated manual effort.</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Time Saved</CardTitle>
                <CardDescription>Total analyst hours saved over time by the AI agent.</CardDescription>
              </CardHeader>
              <CardContent>
                {cumulativeTimeSavedTrend.length > 0 ? (
                  <ChartContainer config={{ hoursSaved: { label: "Hours Saved", color: "hsl(var(--chart-1))" } }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={cumulativeTimeSavedTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month:'short', day:'numeric'})} />
                        <YAxis unit="h" />
                        <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)} hours`} content={<ChartTooltipContent />} />
                        <defs>
                            <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="hoursSaved" name="Cumulative Hours Saved" stroke="var(--color-hoursSaved)" fill="url(#fillHours)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : <NoDataPlaceholder />}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>This chart tracks the compounding value of the AI by showing the total number of manual work hours saved day after day.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
            <TooltipTrigger asChild>
                <Card>
                    <CardHeader>
                        <CardTitle>Efficiency Summary</CardTitle>
                        <CardDescription>A high-level summary of the AI's efficiency gains.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Based on an estimated manual classification time of 5 minutes per alert, the AI agent has saved approximately <span className="font-bold text-primary">{formatSecondsToHMS(totalTimeSavedSeconds)}</span> of analyst time across <span className="font-bold text-primary">{totalAlerts.toLocaleString()}</span> total alerts.
                            The AI system completed a workload that would have taken human analysts <span className="font-bold text-primary">{formatSecondsToHMS(totalManualTimeSeconds)}</span> in just <span className="font-bold text-primary">{formatSecondsToHMS(totalAITimeSeconds)}</span>.
                        </p>
                    </CardContent>
                </Card>
            </TooltipTrigger>
            <TooltipContent>
                <p>This summary highlights the total time saved and compares the AI workload time to the estimated manual time.</p>
            </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardHeader>
                <CardTitle>Average Classification Time</CardTitle>
                <CardDescription>Compares the average time per alert in seconds.</CardDescription>
              </CardHeader>
              <CardContent>
                {avgComparisonData.some(d => d.time > 0) ? (
                  <ChartContainer config={{ time: { label: "Seconds" } }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={avgComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis unit="s" />
                        <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)} seconds`} content={<ChartTooltipContent />} />
                        <Bar dataKey="time" name="Avg. Time" >
                          {avgComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : <NoDataPlaceholder />}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>This chart visualizes the speed difference, comparing the 5-minute manual average to the AI's seconds-long classification times.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
