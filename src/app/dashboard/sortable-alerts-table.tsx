
'use client';

import { useState, useMemo, useEffect } from 'react';
import { type Alert, updateAlertFeedback } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Pencil } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SortableAlertsTableProps {
  alerts: Alert[];
}

type SortableColumn = keyof Alert;

export function SortableAlertsTable({ alerts }: SortableAlertsTableProps) {
  const [localAlerts, setLocalAlerts] = useState<Alert[]>(alerts);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn; direction: 'asc' | 'desc' } | null>({ key: 'first_seen_at', direction: 'desc' });
  const [editingRow, setEditingRow] = useState<string | null>(null); // fingerprint of the row being edited
  const [feedbackInput, setFeedbackInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

  const handleSort = (key: SortableColumn) => {
    if (key === 'fingerprint' || key === 'classification_reason' || key === 'SOP_Instructions' || key === 'behavior_reason' || key === 'Feedback_L1') return;
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAlerts = useMemo(() => {
    if (sortConfig !== null) {
      return [...localAlerts].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return localAlerts;
  }, [localAlerts, sortConfig]);

  const getSortIcon = (columnKey: SortableColumn) => {
    if (columnKey === 'fingerprint' || columnKey === 'classification_reason' || columnKey === 'SOP_Instructions' || columnKey === 'behavior_reason' || columnKey === 'Feedback_L1') return null;
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

  const renderRiskScore = (score: number) => {
    let colorClass = '';
    if (score <= 30) {
      colorClass = 'bg-green-600 text-white';
    } else if (score <= 70) {
      colorClass = 'bg-yellow-500 text-black';
    } else {
      colorClass = 'bg-red-600 text-white';
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {score}
      </span>
    );
  };

  const handleEditClick = (alert: Alert) => {
    setEditingRow(alert.fingerprint);
    setFeedbackInput(alert.Feedback_L1 || '');
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setFeedbackInput('');
  };

  const handleSubmitFeedback = async (fingerprint: string) => {
    const result = await updateAlertFeedback(fingerprint, feedbackInput);
    if (result.success) {
      setLocalAlerts(prevAlerts => 
        prevAlerts.map(a => 
          a.fingerprint === fingerprint ? { ...a, Feedback_L1: feedbackInput } : a
        )
      );
      toast({ title: 'Success', description: 'Feedback updated successfully.' });
      handleCancelEdit();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update feedback.' });
    }
  };


  return (
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
            <Button variant="ghost" onClick={() => handleSort('classification')}>
              Classification {getSortIcon('classification')}
            </Button>
          </TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('behavior')}>
              Behavior {getSortIcon('behavior')}
            </Button>
          </TableHead>
          <TableHead>Behavior Reason</TableHead>
          <TableHead>Action to be taken</TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('duplicate_count')}>
              Count {getSortIcon('duplicate_count')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('risk_score')}>
              Risk Score {getSortIcon('risk_score')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('user_principal_name')}>
                User {getSortIcon('user_principal_name')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('email_sender')}>
                Sender {getSortIcon('email_sender')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('email_subject')}>
                Subject {getSortIcon('email_subject')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('email_recipient')}>
                Recipient {getSortIcon('email_recipient')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('first_seen_at')}>
              First Seen {getSortIcon('first_seen_at')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('last_seen_at')}>
              Last Seen {getSortIcon('last_seen_at')}
            </Button>
          </TableHead>
          <TableHead>Feedback</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedAlerts.map((alert: Alert) => (
          <TableRow key={alert.fingerprint}>
            <TableCell className="font-medium">{alert.Title}</TableCell>
            <TableCell>{alert.policy_name}</TableCell>
            <TableCell>{alert.classification}</TableCell>
            <TableCell><div className="whitespace-pre-wrap break-words min-w-[250px]">{alert.classification_reason}</div></TableCell>
            <TableCell>{alert.behavior}</TableCell>
            <TableCell><div className="whitespace-pre-wrap break-words min-w-[250px]">{alert.behavior_reason}</div></TableCell>
            <TableCell><div className="whitespace-pre-wrap break-words min-w-[250px]">{alert.SOP_Instructions}</div></TableCell>
            <TableCell>{alert.duplicate_count}</TableCell>
            <TableCell>{renderRiskScore(alert.risk_score)}</TableCell>
            <TableCell>{alert.user_principal_name}</TableCell>
            <TableCell>{alert.email_sender}</TableCell>
            <TableCell>{alert.email_subject}</TableCell>
            <TableCell>{alert.email_recipient}</TableCell>
            <TableCell suppressHydrationWarning>{formatDate(alert.first_seen_at)}</TableCell>
            <TableCell suppressHydrationWarning>{formatDate(alert.last_seen_at)}</TableCell>
            <TableCell>
              {editingRow === alert.fingerprint ? (
                <div className="flex flex-col gap-2 min-w-[250px]">
                  <Textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSubmitFeedback(alert.fingerprint)}>Submit</Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between min-w-[250px]">
                  <span className="whitespace-pre-wrap break-words mr-2">{alert.Feedback_L1}</span>
                  {alert.Feedback_L1 ? (
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => handleEditClick(alert)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleEditClick(alert)}>
                      Add Feedback
                    </Button>
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
