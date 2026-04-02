'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { type ProcessedAlertsTrendPoint } from '@/app/actions';
import { AlertCircle } from 'lucide-react';

interface ProcessedAlertsChartProps {
  data: ProcessedAlertsTrendPoint[];
}

const NoDataPlaceholder = () => (
    <div className="flex h-full min-h-[350px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
        <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Could not load processed alerts data.</p>
        </div>
    </div>
);

export function ProcessedAlertsChart({ data }: ProcessedAlertsChartProps) {

  // If data has items but all counts are zero, show the chart with a "no alerts" message
  const noActivity = !data || data.every(d => d.count === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processed Alerts Trend</CardTitle>
        <CardDescription>Number of alerts processed in the last hour.</CardDescription>
      </CardHeader>
      <CardContent>
        {data ? (
          <ChartContainer config={{ count: { label: "Alerts", color: "hsl(var(--chart-1))" } }}>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <defs>
                    <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" fill="url(#fillCount)" />
              </AreaChart>
            </ResponsiveContainer>
             {noActivity && (
                <p className="text-sm text-center text-muted-foreground mt-4">No alerts processed in the last hour.</p>
            )}
          </ChartContainer>
        ) : (
          <NoDataPlaceholder />
        )}
      </CardContent>
    </Card>
  );
}
