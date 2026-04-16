'use client';

import { useState, useMemo } from 'react';
import { type PromptInsight } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function InsightsClient({ initialInsights }: { initialInsights: PromptInsight[] }) {
  const [insights] = useState<PromptInsight[]>(initialInsights);
  const [filter, setFilter] = useState('');

  const groupedAndFilteredInsights = useMemo(() => {
    const grouped = insights.reduce((acc, insight) => {
      if (!acc[insight.policy_name]) {
        acc[insight.policy_name] = [];
      }
      acc[insight.policy_name].push(insight);
      return acc;
    }, {} as Record<string, PromptInsight[]>);

    if (!filter) {
      return grouped;
    }

    const lowercasedFilter = filter.toLowerCase();
    return Object.entries(grouped).reduce((acc, [policyName, policyInsights]) => {
      if (policyName.toLowerCase().includes(lowercasedFilter)) {
        acc[policyName] = policyInsights;
      }
      return acc;
    }, {} as Record<string, PromptInsight[]>);

  }, [insights, filter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const policyNames = Object.keys(groupedAndFilteredInsights).sort();

  return (
    <Card>
        <CardHeader>
            <CardTitle>Refined AI Reasons</CardTitle>
            <CardDescription>
                A library of alerts where the AI's reasoning has been validated by feedback. This shows the outcome of the AI's learning process.
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
                            <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                    <span>{policyName}</span>
                                    <span className="text-xs font-normal text-muted-foreground">({groupedAndFilteredInsights[policyName].length} insights)</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="overflow-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Alert Title</TableHead>
                                                <TableHead>Timestamp</TableHead>
                                                <TableHead>Refined Reasons by AI Over Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupedAndFilteredInsights[policyName].map((insight, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{insight.Title}</TableCell>
                                                    <TableCell suppressHydrationWarning>{formatDate(insight.first_seen_at)}</TableCell>
                                                    <TableCell><div className="whitespace-pre-wrap break-words min-w-[250px]">{insight.classification_reason}</div></TableCell>
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
                <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>No Refined Insights Found</AlertTitle>
                    <AlertDescription>
                        No alerts have been marked as having referred to feedback yet, or none match your search.
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
    </Card>
  );
}
