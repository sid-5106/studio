
'use client';

import { useState, useMemo } from 'react';
import { type Alert } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function ConfidenceClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [filter, setFilter] = useState('');

  const summarizedStats = useMemo(() => {
    const grouped = initialAlerts.reduce((acc, alert) => {
      const p = alert.policy_name || 'Uncategorized';
      if (!acc[p]) acc[p] = { count: 0, sum: 0 };
      acc[p].count += 1;
      acc[p].sum += alert.AI_confidence || 0;
      return acc;
    }, {} as Record<string, { count: number; sum: number }>);

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        total: data.count,
        avg: data.sum / data.count,
      }))
      .filter(s => s.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => a.avg - b.avg);
  }, [initialAlerts, filter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uncertain AI Classifications</CardTitle>
        <CardDescription>Summarized by policy. Lower scores indicate rules that might need more context or logic tuning.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10"><BarChart3 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Rules with Issues</p><p className="text-2xl font-bold">{summarizedStats.length}</p></div>
          </div>
          <Input placeholder="Search policies..." value={filter} onChange={e => setFilter(e.target.value)} className="max-w-xs" />
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow><TableHead className="w-1/2">Policy Name</TableHead><TableHead className="text-center">Alerts &lt; 75%</TableHead><TableHead className="w-1/3">Avg. Confidence</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {summarizedStats.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold text-sm">{s.name}</TableCell>
                  <TableCell className="text-center"><Badge variant="secondary" className="font-mono">{s.total}</Badge></TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold"><span className={s.avg < 60 ? "text-destructive" : "text-orange-500"}>{s.avg.toFixed(1)}%</span></div>
                      <Progress value={s.avg} className="h-1.5" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
