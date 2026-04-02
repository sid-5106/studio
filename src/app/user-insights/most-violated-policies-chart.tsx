'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { type TopPolicySummary } from '@/app/actions';
import { AlertCircle } from 'lucide-react';

interface MostViolatedPoliciesChartProps {
  data: TopPolicySummary[];
}

const chartConfig = {
  count: {
    label: 'Violations',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function MostViolatedPoliciesChart({ data }: MostViolatedPoliciesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
        <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No data available.</p>
        </div>
      </div>
    );
  }
  
  const chartData = data.slice().reverse();

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            dataKey="policy_name"
            type="category"
            width={150}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
