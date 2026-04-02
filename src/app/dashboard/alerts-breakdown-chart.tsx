'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { type ClassificationSummary } from '@/app/actions';

interface AlertsBreakdownChartProps {
  data: ClassificationSummary[];
}

const chartConfig = {
  'Actual Alerts': {
    label: 'Actual Alerts',
    color: 'hsl(var(--chart-1))',
  },
  'Redundant Alerts': {
    label: 'Redundant Alerts',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function AlertsBreakdownChart({ data }: AlertsBreakdownChartProps) {
  const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
  
  if (!data || total === 0) {
    return (
      <div className="flex h-full min-h-[150px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
        <p className="text-muted-foreground">Not enough data to display chart.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="flex flex-col gap-2 text-sm">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: chartConfig[item.name as keyof typeof chartConfig]?.color }}>
              {item.value}
            </span>
            <span className="text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
      <ChartContainer
        config={chartConfig}
        className="relative min-h-[150px] w-full max-w-[150px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={60}
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={chartConfig[entry.name as keyof typeof chartConfig]?.color}
                stroke={'hsl(var(--background))'}
              />
            ))}
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
          {total}
        </div>
      </ChartContainer>
    </div>
  );
}
