'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { type UserDistributionSummary } from '@/app/actions';
import { AlertCircle } from 'lucide-react';

interface RiskyUsersPieChartProps {
  data: UserDistributionSummary[];
}

const chartConfig = {
  'Risky Users': {
    label: 'Risky Users',
    color: 'hsl(var(--chart-2))',
  },
  'Non-Risky Users': {
    label: 'Non-Risky Users',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function RiskyUsersPieChart({ data }: RiskyUsersPieChartProps) {
  const total = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

  if (!data || total === 0) {
    return (
      <div className="flex h-full min-h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
        <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No user data available.</p>
        </div>
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
