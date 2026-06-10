
'use client';

import { useState, useMemo } from 'react';
import { type Alert } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert as UiAlert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PolicyStat {
  name: string;
  totalAlerts: number;
  averageConfidence: number;
}

export function ConfidenceClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts] = useState<Alert[]>(initialAlerts);
  const [filter, setFilter] = useState('');

  const summarizedStats = useMemo(() => {
    const grouped = alerts.reduce((acc, alert) => {
      const policy = alert.policy_name || 'Uncategorized';
      if (!acc[policy]) {
        acc[policy] = { count: 0, sum: 0 };
      }
      acc[policy].count += 1;
      acc[policy].sum += alert.AI_confidence || 0;
      return acc;
    }, {} as Record<string, { count: number; sum: number }>);

    const stats = Object.entries(grouped).map(([name, data]) => ({
      name,
      totalAlerts: data.count,
      averageConfidence: data.count > 0 ? data.sum / data.count : 0,
    }));

    // Default sort by lowest average confidence
    stats.sort((a, b) => a.averageConfidence - b.averageConfidence);

    if (!filter) {
      return stats;
    }

    const lowercasedFilter = filter.toLowerCase();
    return stats.filter((stat) => stat.name.toLowerCase().includes(lowercasedFilter));
  }, [alerts, filter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Confidence Summary</CardTitle>
        <CardDescription>
          A summary of policies with alerts where AI-confidence is below 75%. Use this to identify rules that may need logic refinement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 rounded-full bg-primary/10">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Policies with Issues</p>
              <p className="text-2xl font-bold">{summarizedStats.length}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search by policy name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {summarizedStats.length > 0 ? (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50%]">Policy Name</TableHead>
                  <TableHead className="text-center">Low Confidence Alerts</TableHead>
                  <TableHead className="w-[30%]">Avg. Confidence Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summarizedStats.map((stat, index) => (
                  <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold text-base py-4">{stat.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="px-4 py-1 text-sm font-bold">
                        {stat.totalAlerts}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${stat.averageConfidence < 60 ? 'text-destructive' : 'text-orange-600'}`}>
                            {stat.averageConfidence.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={stat.averageConfidence} className="h-2" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <UiAlert>
            <ShieldAlert className="h-4 w-4" />
            <UiAlertTitle>No Low Confidence Rules Found</UiAlertTitle>
            <AlertDescription>
              All policies currently have high confidence scores, or none match your search criteria.
            </AlertDescription>
          </UiAlert>
        )}
      </CardContent>
    </Card>
  );
}
