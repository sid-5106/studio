'use client';
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { UserBehaviorPoint } from '@/app/actions';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';

interface UserBehaviorDistributionChartProps {
  data: UserBehaviorPoint[];
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export function UserBehaviorDistributionChart({ data }: UserBehaviorDistributionChartProps) {
    if (!data || data.length === 0) {
        return (
          <div className="flex h-full min-h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
             <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No behavior data for this user.</p>
            </div>
          </div>
        );
    }
    
    const chartConfig = data.reduce((acc, item, index) => {
        acc[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length]
        };
        return acc;
    }, {} as ChartConfig);

    return (
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <RechartsTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};
