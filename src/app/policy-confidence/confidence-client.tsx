
'use client';

import { useState, useMemo } from 'react';
import { type Alert } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert as UiAlert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function ConfidenceClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts] = useState<Alert[]>(initialAlerts);
  const [filter, setFilter] = useState('');

  const groupedAndFilteredAlerts = useMemo(() => {
    const grouped = alerts.reduce((acc, alert) => {
      const policy = alert.policy_name || 'Uncategorized';
      if (!acc[policy]) {
        acc[policy] = [];
      }
      acc[policy].push(alert);
      return acc;
    }, {} as Record<string, Alert[]>);

    if (!filter) {
      return grouped;
    }

    const lowercasedFilter = filter.toLowerCase();
    return Object.entries(grouped).reduce((acc, [policyName, policyAlerts]) => {
      if (policyName.toLowerCase().includes(lowercasedFilter)) {
        acc[policyName] = policyAlerts;
      }
      return acc;
    }, {} as Record<string, Alert[]>);

  }, [alerts, filter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const policyNames = Object.keys(groupedAndFilteredAlerts).sort();

  return (
    <Card>
        <CardHeader>
            <CardTitle>Low Confidence Alerts</CardTitle>
            <CardDescription>
                Alerts where the AI-confidence score is below 75%. These records may require manual review to validate AI reasoning.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mb-4">
                <Input
                    placeholder="Search by policy name..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            {policyNames.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {policyNames.map((policyName) => (
                        <AccordionItem value={policyName} key={policyName}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-lg">{policyName}</span>
                                    <Badge variant="secondary" className="font-normal">
                                        {groupedAndFilteredAlerts[policyName].length} Alert{groupedAndFilteredAlerts[policyName].length === 1 ? '' : 's'}
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="overflow-auto rounded-md border mt-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[300px]">Alert Title</TableHead>
                                                <TableHead className="w-[200px]">Timestamp</TableHead>
                                                <TableHead className="w-[150px]">Confidence</TableHead>
                                                <TableHead>AI Reasoning</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupedAndFilteredAlerts[policyName].map((alert, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{alert.Title}</TableCell>
                                                    <TableCell suppressHydrationWarning>{formatDate(alert.first_seen_at)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-full max-w-[60px]">
                                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-orange-500" 
                                                                        style={{ width: `${alert.AI_confidence}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <span className="font-bold text-orange-600">{alert.AI_confidence}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="whitespace-pre-wrap break-words max-w-[500px] text-muted-foreground italic">
                                                            {alert.classification_reason}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <UiAlert>
                    <ShieldAlert className="h-4 w-4" />
                    <UiAlertTitle>No Low Confidence Alerts Found</UiAlertTitle>
                    <AlertDescription>
                        All alerts currently have a confidence score of 75% or higher, or none match your search criteria.
                    </AlertDescription>
                </UiAlert>
            )}
        </CardContent>
    </Card>
  );
}
