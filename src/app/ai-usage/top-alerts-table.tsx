'use client';

import { useState, useMemo } from 'react';
import { type AIAnalyticsData } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TopAlertsTableProps {
  alerts: AIAnalyticsData[];
}

type SortableColumn = keyof AIAnalyticsData;

export function TopAlertsTable({ alerts }: TopAlertsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'asc' | 'desc' } | null>({ key: 'cost_estimation', direction: 'desc' });

  const handleSort = (key: SortableColumn) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAlerts = useMemo(() => {
    if (!sortConfig) return alerts;
    return [...alerts].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [alerts, sortConfig]);

  const getSortIcon = (columnKey: SortableColumn) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('Title')}>
                Title {getSortIcon('Title')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('policy_name')}>
                Policy Name {getSortIcon('policy_name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('first_seen_at')}>
                Timestamp {getSortIcon('first_seen_at')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('total_tokens')}>
                Total Tokens {getSortIcon('total_tokens')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('cost_estimation')}>
                Cost (USD) {getSortIcon('cost_estimation')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('classification')}>
                Classification {getSortIcon('classification')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('email_sender')}>
                Sender {getSortIcon('email_sender')}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAlerts.map((alert, index) => (
            <TableRow key={index}>
              <TableCell>{alert.Title}</TableCell>
              <TableCell>{alert.policy_name}</TableCell>
              <TableCell suppressHydrationWarning>{formatDate(alert.first_seen_at)}</TableCell>
              <TableCell>{alert.total_tokens.toLocaleString()}</TableCell>
              <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(alert.cost_estimation)}</TableCell>
              <TableCell>
                <Badge variant={alert.classification === 'True_Positive' ? 'default' : 'secondary'}>
                  {alert.classification}
                </Badge>
              </TableCell>
              <TableCell>{alert.email_sender}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
