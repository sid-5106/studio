
'use client';

import { useState, useEffect, useMemo } from 'react';
import { type Alert, getRedundancyData, type Redundancy } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert as UiAlert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowUpDown, Mail, ListFilter, X, ArrowUp, ArrowDown, Filter, ShieldAlert } from 'lucide-react';
import { SupabaseStatus } from '@/components/supabase-status';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { type DateRange } from 'react-day-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const ALERTS_PER_PAGE = 25;
type SortableColumn = keyof Alert;
type SortRule = { key: SortableColumn; direction: 'asc' | 'desc' };
type SortableRedundancyColumn = keyof Redundancy;


export function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortRule[]>([{ key: 'last_seen_at', direction: 'desc' }]);
  const [filter, setFilter] = useState('');

  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  const [classificationFilter, setClassificationFilter] = useState<string[]>([]);
  const [behaviorFilter, setBehaviorFilter] = useState<string[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [redundancyData, setRedundancyData] = useState<Redundancy[]>([]);
  const [isRedundancyLoading, setIsRedundancyLoading] = useState(false);
  const [redundancySortConfig, setRedundancySortConfig] = useState<{ key: SortableRedundancyColumn; direction: 'asc' | 'desc' } | null>({ key: 'time', direction: 'desc' });

  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);


  const handleSort = (key: SortableColumn) => {
    if (['fingerprint', 'SOP_Instructions', 'behavior_reason', 'classification_reason', 'whatNotToDoNextTime', 'Feedback_L1'].includes(key as string)) return;
    
    let newSortConfig = [...sortConfig];
    const existingRuleIndex = newSortConfig.findIndex(rule => rule.key === key);

    if (existingRuleIndex > -1) {
        if (newSortConfig[existingRuleIndex].direction === 'desc') {
            newSortConfig[existingRuleIndex].direction = 'asc';
        } else {
            newSortConfig.splice(existingRuleIndex, 1);
        }
    } else {
        if (newSortConfig.length < 5) {
            newSortConfig.unshift({ key, direction: 'desc' });
        }
    }
    setSortConfig(newSortConfig);
    setCurrentPage(1);
  };
  
  const uniqueClassifications = useMemo(() => [...new Set(initialAlerts.map(a => a.classification).filter(Boolean))], [initialAlerts]);
  const uniqueBehaviors = useMemo(() => [...new Set(initialAlerts.map(a => a.behavior).filter(Boolean))], [initialAlerts]);
  
  const sortedAndFilteredAlerts = useMemo(() => {
    let filteredAlerts = alerts.filter(alert => {
      if (filter) {
        const found = Object.entries(alert).some(([key, value]) =>
          key !== 'fingerprint' && String(value).toLowerCase().includes(filter.toLowerCase())
        );
        if (!found) return false;
      }

      if (dateFilter?.from) {
        const alertDate = new Date(alert.last_seen_at);
        if (alertDate < dateFilter.from) return false;
      }
      if (dateFilter?.to) {
        const toDate = new Date(dateFilter.to);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(alert.last_seen_at) > toDate) return false;
      }

      if (classificationFilter.length > 0) {
        if (!alert.classification || !classificationFilter.includes(alert.classification)) return false;
      }

      if (behaviorFilter.length > 0) {
        if (!alert.behavior || !behaviorFilter.includes(alert.behavior)) return false;
      }
      return true;
    });
    
    if (sortConfig.length > 0) {
      return [...filteredAlerts].sort((a, b) => {
        for (const sort of sortConfig) {
          const { key, direction } = sort;
          const aValue = a[key];
          const bValue = b[key];

          if (aValue === null || aValue === undefined) return 1;
          if (bValue === null || bValue === undefined) return -1;
          
          let comparison = 0;
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else if (key === 'first_seen_at' || key === 'last_seen_at' || key === 'evidence_createdDateTime' || key === 'alert_upload_time') {
            comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
          }
          else {
            comparison = String(aValue).localeCompare(String(bValue));
          }

          if (comparison !== 0) return direction === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }
    return filteredAlerts;
  }, [alerts, filter, sortConfig, dateFilter, classificationFilter, behaviorFilter]);

  const totalPages = sortedAndFilteredAlerts.length > 0 ? Math.ceil(sortedAndFilteredAlerts.length / ALERTS_PER_PAGE) : 1;
  const startIndex = (currentPage - 1) * ALERTS_PER_PAGE;
  const endIndex = startIndex + ALERTS_PER_PAGE;
  const currentAlerts = sortedAndFilteredAlerts.slice(startIndex, endIndex);

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const getSortIcon = (columnKey: SortableColumn) => {
    if (['fingerprint', 'SOP_Instructions', 'behavior_reason', 'classification_reason', 'whatNotToDoNextTime', 'Feedback_L1'].includes(columnKey as string)) return null;
    const idx = sortConfig.findIndex(rule => rule.key === columnKey);
    const rule = idx > -1 ? sortConfig[idx] : null;
    if (!rule) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return (
      <div className="flex items-center">
        {rule.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        {sortConfig.length > 1 && <span className="ml-1 text-xs font-bold text-muted-foreground">{idx + 1}</span>}
      </div>
    );
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleString(); } catch { return dateString; }
  };

  const handleCountClick = async (alert: Alert) => {
    if (alert.duplicate_count > 1 && alert.fingerprint) {
      setSelectedAlert(alert);
      setIsRedundancyLoading(true);
      setIsDialogOpen(true);
      const data = await getRedundancyData(alert.fingerprint);
      setRedundancyData(data);
      setIsRedundancyLoading(false);
    }
  };
  
  const sortedRedundancyData = useMemo(() => {
    if (!redundancySortConfig) return redundancyData;
    return [...redundancyData].sort((a, b) => {
      const av = a[redundancySortConfig.key];
      const bv = b[redundancySortConfig.key];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const comp = av < bv ? -1 : av > bv ? 1 : 0;
      return redundancySortConfig.direction === 'asc' ? comp : -comp;
    });
  }, [redundancyData, redundancySortConfig]);

  const renderRiskScore = (score: number) => {
    let color = score <= 30 ? 'bg-green-600' : score <= 70 ? 'bg-yellow-500 text-black' : 'bg-red-600';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color} text-white`}>{score}</span>;
  };
  
  const MultiSortControl = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [localConfig, setLocalConfig] = useState<SortRule[]>(sortConfig);

    useEffect(() => { if (isOpen) setLocalConfig(sortConfig); }, [isOpen, sortConfig]);

    const availableColumns = useMemo(() => Object.keys(alerts[0] || {})
      .filter(key => !['fingerprint', 'SOP_Instructions', 'classification_reason', 'whatNotToDoNextTime', 'behavior_reason', 'Feedback_L1'].includes(key)) as SortableColumn[],
    [alerts]);

    const handleApply = () => { setSortConfig(localConfig); setCurrentPage(1); setIsOpen(false); };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild><Button variant="outline"><ListFilter className="mr-2 h-4 w-4" />Sort ({sortConfig.length})</Button></PopoverTrigger>
        <PopoverContent className="w-96">
          <div className="grid gap-4">
            <h4 className="font-medium">Sort Alerts (Up to 5)</h4>
            <div className="grid gap-2">
              {localConfig.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
                  <span className="font-bold">{idx + 1}.</span>
                  <span className="flex-1">{rule.key}</span>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Asc</Label>
                    <Switch checked={rule.direction === 'asc'} onCheckedChange={(c) => {
                      const nc = [...localConfig]; nc[idx].direction = c ? 'asc' : 'desc'; setLocalConfig(nc);
                    }} />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLocalConfig(localConfig.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
            {localConfig.length < 5 && (
              <Select onValueChange={(v) => setLocalConfig([...localConfig, { key: v as SortableColumn, direction: 'desc' }])}>
                <SelectTrigger><SelectValue placeholder="Add sorting column" /></SelectTrigger>
                <SelectContent>{availableColumns.filter(c => !localConfig.some(r => r.key === c)).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };
  
  return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Security Alerts</h1>
          <div className="flex items-center gap-4">
            <SupabaseStatus />
            <ThemeSwitcher />
          </div>
        </header>
        
        <TooltipProvider>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>All Alerts</CardTitle>
              <CardDescription>A comprehensive stream of all detected security incidents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3 text-primary">
                    <div className="p-2 rounded-full bg-primary/10"><ShieldAlert className="h-5 w-5" /></div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Record Count</p>
                        <p className="text-2xl font-bold">{sortedAndFilteredAlerts.length.toLocaleString()}</p>
                    </div>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <Input
                  placeholder="Search alerts..."
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                  className="max-w-sm"
                />
                <MultiSortControl />
                <Button variant="outline" onClick={() => {setDateFilter(undefined); setClassificationFilter([]); setBehaviorFilter([]); setFilter(''); setCurrentPage(1);}}>Reset</Button>
              </div>

              {sortedAndFilteredAlerts.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('Title')}>Title {getSortIcon('Title')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('policy_name')}>Policy {getSortIcon('policy_name')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('classification')}>Class {getSortIcon('classification')}</Button></TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('behavior')}>Behavior {getSortIcon('behavior')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('duplicate_count')}>Cnt {getSortIcon('duplicate_count')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('risk_score')}>Risk {getSortIcon('risk_score')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('email_sender')}>Sender {getSortIcon('email_sender')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('evidence_createdDateTime')}>Evid. At {getSortIcon('evidence_createdDateTime')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('alert_upload_time')}>Upload {getSortIcon('alert_upload_time')}</Button></TableHead>
                          <TableHead><Button variant="ghost" onClick={() => handleSort('last_seen_at')}>Last Seen {getSortIcon('last_seen_at')}</Button></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentAlerts.map((alert, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium text-xs truncate max-w-[200px]">{alert.Title}</TableCell>
                            <TableCell className="text-xs">{alert.policy_name}</TableCell>
                            <TableCell className="text-xs">{alert.classification}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">{alert.classification_reason}</TableCell>
                            <TableCell className="text-xs">{alert.behavior}</TableCell>
                            <TableCell className="text-xs text-center">
                              {alert.duplicate_count > 1 ? (
                                <Button variant="link" size="sm" className="p-0" onClick={() => handleCountClick(alert)}>{alert.duplicate_count}</Button>
                              ) : alert.duplicate_count}
                            </TableCell>
                            <TableCell>{renderRiskScore(alert.risk_score)}</TableCell>
                            <TableCell className="text-xs truncate max-w-[150px]">{alert.email_sender}</TableCell>
                            <TableCell className="text-[10px]" suppressHydrationWarning>{formatDate(alert.evidence_createdDateTime)}</TableCell>
                            <TableCell className="text-[10px]" suppressHydrationWarning>{formatDate(alert.alert_upload_time)}</TableCell>
                            <TableCell className="text-[10px]" suppressHydrationWarning>{formatDate(alert.last_seen_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Button onClick={handlePrevious} disabled={currentPage === 1} variant="outline" size="sm">Prev</Button>
                      <Button onClick={handleNext} disabled={currentPage === totalPages} variant="outline" size="sm">Next</Button>
                    </div>
                    <div>Page {currentPage} of {totalPages} | Total Filtered: {sortedAndFilteredAlerts.length.toLocaleString()}</div>
                  </div>
                </>
              ) : (
                <UiAlert><AlertTriangle className="h-4 w-4" /><AlertTitle>No Alerts Found</AlertTitle><AlertDescription>Try adjusting your search or filters.</AlertDescription></UiAlert>
              )}
            </CardContent>
          </Card>
        </TooltipProvider>
      </div>
  );
}
