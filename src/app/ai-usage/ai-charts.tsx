'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AIChartsProps {
  trendData: { date: string; tokens: number; cost: number }[];
  tokenDistributionData: { name: string; alerts: number }[];
  costBenefitData: { name: string; value: number; fill: string }[];
}

const NoDataPlaceholder = () => (
    <div className="flex h-full min-h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-muted p-4 text-center">
        <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Not enough data to display chart.</p>
        </div>
    </div>
);

export function AICharts({ trendData, tokenDistributionData, costBenefitData }: AIChartsProps) {
  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardHeader>
                <CardTitle>AI Token Consumption Trend</CardTitle>
                <CardDescription>Shows how AI token usage has grown over time.</CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ChartContainer config={{ tokens: { label: "Tokens", color: "hsl(var(--chart-1))" } }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month:'short', day:'numeric'})} />
                        <YAxis />
                        <RechartsTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="tokens" name="Total Tokens" stroke="var(--color-tokens)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : <NoDataPlaceholder />}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>This chart tracks the daily total of AI tokens used for processing alerts, indicating trends in processing load.</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardHeader>
                <CardTitle>AI Cost Trend</CardTitle>
                <CardDescription>Shows daily AI spending for alert processing.</CardDescription>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ChartContainer config={{ cost: { label: "Cost (USD)", color: "hsl(var(--chart-2))" } }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', {month:'short', day:'numeric'})} />
                        <YAxis tickFormatter={(val) => `$${val.toFixed(2)}`} />
                        <RechartsTooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="cost" name="Total Cost" stroke="var(--color-cost)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : <NoDataPlaceholder />}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>This chart visualizes the daily estimated cost of AI processing, helping to monitor and manage operational expenses.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardHeader>
                <CardTitle>Token Usage Distribution</CardTitle>
                <CardDescription>Shows how many alerts fall into different token count buckets.</CardDescription>
              </CardHeader>
              <CardContent>
                {tokenDistributionData.some(d => d.alerts > 0) ? (
                  <ChartContainer config={{ alerts: { label: "Alerts", color: "hsl(var(--chart-3))" } }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={tokenDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="alerts" name="Number of Alerts" fill="var(--color-alerts)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : <NoDataPlaceholder />}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>This histogram shows the distribution of alerts based on how many tokens were required to process them, highlighting processing complexity.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardHeader>
                <CardTitle>Cost Benefit Analysis: AI vs. Manual Investigation</CardTitle>
                <CardDescription>Compares total AI processing cost to estimated manual investigation cost.</CardDescription>
              </CardHeader>
              <CardContent>
                {costBenefitData.some(d => d.value > 0) ? (
                  <ChartContainer config={{ value: { label: "Cost (USD)" } }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={costBenefitData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(val) => `$${val.toLocaleString()}`} />
                        <RechartsTooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} content={<ChartTooltipContent />} />
                        <Bar dataKey="value" name="Total Cost" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : <NoDataPlaceholder />}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>This chart demonstrates the cost savings of using AI by comparing the total AI cost to the estimated cost of manual investigation (assuming $5 per alert).</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
