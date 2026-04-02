'use client';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { UserViolationTrendPoint } from '@/app/actions';
import { AlertCircle } from 'lucide-react';

interface UserViolationTrendChartProps {
  data: UserViolationTrendPoint[];
}

export function UserViolationTrendChart({ data }: UserViolationTrendChartProps) {
    if (!data || data.length === 0) {
        return (
          <div className="flex h-full min-h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
            <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No violation data for this user.</p>
            </div>
          </div>
        );
    }

    return (
        <ChartContainer config={{ count: { label: "Violations", color: "hsl(var(--chart-1))" } }} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month:'short', day:'numeric'})} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Violations" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};
