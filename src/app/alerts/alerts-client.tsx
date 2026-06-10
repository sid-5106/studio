
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

const ALERTS_PER_PAGE = 10;
type SortableColumn = keyof Alert;
type SortRule = { key: SortableColumn; direction: 'asc' | 'desc' };
type SortableRedundancyColumn = keyof Redundancy;


export function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [loading, setLoading] = useState(false);
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
      // Search filter
      if (filter) {
        const found = Object.entries(alert).some(([key, value]) =>
          key !== 'fingerprint' && String(value).toLowerCase().includes(filter.toLowerCase())
        );
        if (!found) return false;
      }

      // Date filter
      if (dateFilter?.from) {
        const alertDate = new Date(alert.last_seen_at);
        if (alertDate < dateFilter.from) return false;
      }
      if (dateFilter?.to) {
        const toDate = new Date(dateFilter.to);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(alert.last_seen_at) > toDate) return false;
      }

      // Classification filter
      if (classificationFilter.length > 0) {
        if (!alert.classification || !classificationFilter.includes(alert.classification)) {
          return false;
        }
      }

      // Behavior filter
      if (behaviorFilter.length > 0) {
        if (!alert.behavior || !behaviorFilter.includes(alert.behavior)) {
          return false;
        }
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

          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
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

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getSortIcon = (columnKey: SortableColumn) => {
    if (['fingerprint', 'SOP_Instructions', 'behavior_reason', 'classification_reason', 'whatNotToDoNextTime', 'Feedback_L1'].includes(columnKey as string)) return null;
    
    const sortRuleIndex = sortConfig.findIndex(rule => rule.key === columnKey);
    const sortRule = sortRuleIndex > -1 ? sortConfig[sortRuleIndex] : null;

    if (!sortRule) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    
    const SortIndicator = () => (
      <div className="flex items-center">
        {sortRule.direction === 'asc' 
            ? <ArrowUp className="h-4 w-4" />
            : <ArrowDown className="h-4 w-4" />}
        {sortConfig.length > 1 && (
          <span className="ml-1 text-xs font-bold text-muted-foreground">{sortRuleIndex + 1}</span>
        )}
      </div>
    );

    return <SortIndicator />;
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
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
    if (redundancySortConfig !== null) {
      return [...redundancyData].sort((a, b) => {
        const aValue = a[redundancySortConfig.key];
        const bValue = b[redundancySortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return redundancySortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return redundancySortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return redundancyData;
  }, [redundancyData, redundancySortConfig]);

  const handleRedundancySort = (key: SortableRedundancyColumn) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (redundancySortConfig && redundancySortConfig.key === key && redundancySortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setRedundancySortConfig({ key, direction });
  };
  
  const getRedundancySortIcon = (columnKey: SortableRedundancyColumn) => {
    if (columnKey === 'classification_reason') return null;
    if (!redundancySortConfig || redundancySortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
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
  
  const MultiSortControl = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [localConfig, setLocalConfig] = useState<SortRule[]>(sortConfig);

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(sortConfig);
        }
    }, [isOpen, sortConfig]);

    const availableColumns = useMemo(() => Object.keys(alerts[0] || {})
      .filter(key => ![
          'fingerprint', 'SOP_Instructions', 'classification_reason',
          'whatNotToDoNextTime', 'behavior_reason', 'Feedback_L1'
        ].includes(key)
      ) as SortableColumn[],
    [alerts]);

    const handleAddRule = (column: SortableColumn) => {
      if (!localConfig.some(rule => rule.key === column)) {
        setLocalConfig([...localConfig, { key: column, direction: 'desc' }]);
      }
    };

    const handleRemoveRule = (index: number) => {
      setLocalConfig(localConfig.filter((_, i) => i !== index));
    };
    
    const handleDirectionChange = (index: number, checked: boolean) => {
      const newConfig = [...localConfig];
      newConfig[index].direction = checked ? 'asc' : 'desc';
      setLocalConfig(newConfig);
    };

    const handleApply = () => {
      setSortConfig(localConfig);
      setCurrentPage(1);
      setIsOpen(false);
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <ListFilter className="mr-2 h-4 w-4" />
            Sort by {sortConfig.length} rule{sortConfig.length === 1 ? '' : 's'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Sort Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Add up to 5 sort rules. They will be applied in order.
              </p>
            </div>
            <div className="grid gap-2">
              {localConfig.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                  <span className="text-sm font-bold">{index + 1}.</span>
                  <span className="font-semibold text-sm">{rule.key}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <label htmlFor={`asc-switch-${index}`} className="text-sm text-muted-foreground">Asc</label>
                    <Switch
                      id={`asc-switch-${index}`}
                      checked={rule.direction === 'asc'}
                      onCheckedChange={(checked) => handleDirectionChange(index, checked)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRule(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {localConfig.length < 5 && (
              <Select onValueChange={handleAddRule} disabled={localConfig.length >= 5}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick another column to sort by" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns
                    .filter(col => !localConfig.some(rule => rule.key === col))
                    .map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            
            <Button onClick={handleApply}>Apply sorting</Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };
  
  const filterCount = [dateFilter, classificationFilter, behaviorFilter].filter(f => (Array.isArray(f) ? f.length > 0 : f !== undefined)).length;

  const clearAllFilters = () => {
    setDateFilter(undefined);
    setClassificationFilter([]);
    setBehaviorFilter([]);
    setCurrentPage(1);
  };

  const MultiFilterControl = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [localDate, setLocalDate] = useState<DateRange | undefined>(dateFilter);
    const [localClassifications, setLocalClassifications] = useState<string[]>(classificationFilter);
    const [localBehaviors, setLocalBehaviors] = useState<string[]>(behaviorFilter);

    useEffect(() => {
        if (isOpen) {
            setLocalDate(dateFilter);
            setLocalClassifications(classificationFilter);
            setLocalBehaviors(behaviorFilter);
        }
    }, [isOpen]);
    
    const handleClassificationChange = (classification: string, checked: boolean) => {
        if (checked) {
            setLocalClassifications(prev => [...prev, classification]);
        } else {
            setLocalClassifications(prev => prev.filter(c => c !== classification));
        }
    };
    
    const handleBehaviorChange = (behavior: string, checked: boolean) => {
        if (checked) {
            setLocalBehaviors(prev => [...prev, behavior]);
        } else {
            setLocalBehaviors(prev => prev.filter(b => b !== behavior));
        }
    };

    const handleApply = () => {
        setDateFilter(localDate);
        setClassificationFilter(localClassifications);
        setBehaviorFilter(localBehaviors);
        setIsOpen(false);
        setCurrentPage(1);
    };
    
    const handleClear = () => {
        setLocalDate(undefined);
        setLocalClassifications([]);
        setLocalBehaviors([]);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter {filterCount > 0 ? `(${filterCount})` : ''}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Filter Alerts</h4>
                        <p className="text-sm text-muted-foreground">Filter alerts by date, classification, and behavior.</p>
                    </div>
                    <div className="grid gap-4">
                        <div>
                            <h5 className="mb-2 font-medium text-sm">Date Range (Last Seen)</h5>
                            <div className="flex items-center gap-2">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="date-from">From</Label>
                                    <Input
                                        id="date-from"
                                        type="date"
                                        value={localDate?.from ? format(localDate.from, 'yyyy-MM-dd') : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const [y, m, d] = e.target.value.split('-').map(Number);
                                                const from = new Date(y, m - 1, d);
                                                setLocalDate(prev => ({ from, to: prev?.to }));
                                            } else {
                                                setLocalDate(prev => ({ from: undefined, to: prev?.to }));
                                            }
                                        }}
                                        className="w-full"
                                    />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="date-to">To</Label>
                                    <Input
                                        id="date-to"
                                        type="date"
                                        value={localDate?.to ? format(localDate.to, 'yyyy-MM-dd') : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const [y, m, d] = e.target.value.split('-').map(Number);
                                                const to = new Date(y, m - 1, d);
                                                setLocalDate(prev => ({ from: prev?.from, to }));
                                            } else {
                                                setLocalDate(prev => ({ from: prev?.from, to: undefined }));
                                            }
                                        }}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h5 className="mb-2 font-medium text-sm">Classification</h5>
                            <ScrollArea className="h-24">
                                <div className="space-y-2 pr-4">
                                    {uniqueClassifications.map(c => (
                                        <div key={c} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`class-${c}`}
                                                checked={localClassifications.includes(c)}
                                                onCheckedChange={(checked) => handleClassificationChange(c, !!checked)}
                                            />
                                            <Label htmlFor={`class-${c}`}>{c.replace(/_/g, ' ')}</Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <div>
                            <h5 className="mb-2 font-medium text-sm">Behavior</h5>
                             <ScrollArea className="h-24">
                                <div className="space-y-2 pr-4">
                                    {uniqueBehaviors.map(b => (
                                        <div key={b} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`behav-${b}`}
                                                checked={localBehaviors.includes(b)}
                                                onCheckedChange={(checked) => handleBehaviorChange(b, !!checked)}
                                            />
                                            <Label htmlFor={`behav-${b}`}>{b}</Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                    <div className="flex justify-between">
                         <Button variant="ghost" onClick={handleClear}>Clear</Button>
                        <Button onClick={handleApply}>Apply Filters</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

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
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>All Alerts</CardTitle>
                  <CardDescription>
                    A comprehensive list of all detected security alerts. You can sort, filter, and search to investigate specific events.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="p-2 rounded-full bg-primary/10">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Record Count</p>
                            <p className="text-2xl font-bold">{sortedAndFilteredAlerts.length.toLocaleString()}</p>
                        </div>
                    </div>
                    {filter && (
                         <p className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            Filtered from {alerts.length.toLocaleString()} total
                         </p>
                    )}
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    <Input
                      placeholder="Search alerts..."
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="max-w-sm"
                    />
                    <MultiSortControl />
                    <MultiFilterControl />
                    {filterCount > 0 && (
                        <Button variant="ghost" onClick={clearAllFilters}>
                            <X className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    )}
                  </div>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(ALERTS_PER_PAGE)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : sortedAndFilteredAlerts && sortedAndFilteredAlerts.length > 0 ? (
                    <>
                      <div className="overflow-hidden rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('Title')}>
                                  Title
                                  {getSortIcon('Title')}
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('policy_name')}>
                                  Policy Name
                                  {getSortIcon('policy_name')}
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('classification')}>
                                  Classification
                                  {getSortIcon('classification')}
                                </Button>
                              </TableHead>
                              <TableHead>Classification Reason</TableHead>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('behavior')}>
                                  Behavior
                                  {getSortIcon('behavior')}
                                </Button>
                              </TableHead>
                              <TableHead>Behavior Reason</TableHead>
                              <TableHead>Action to be taken</TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => handleSort('duplicate_count')}>
                                      Count
                                      {getSortIcon('duplicate_count')}
                                  </Button>
                              </TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => handleSort('risk_score')}>
                                      Risk
                                      {getSortIcon('risk_score')}
                                  </Button>
                              </TableHead>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('user_principal_name')}>
                                  User
                                  {getSortIcon('user_principal_name')}
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('email_sender')}>
                                  Sender
                                  {getSortIcon('email_sender')}
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('email_subject')}>
                                  Subject
                                  {getSortIcon('email_subject')}
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('email_recipient')}>
                                  Recipient
                                  {getSortIcon('email_recipient')}
                                </Button>
                              </TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => handleSort('evidence_createdDateTime')}>
                                      Evidence Created At
                                      {getSortIcon('evidence_createdDateTime')}
                                  </Button>
                              </TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => handleSort('alert_upload_time')}>
                                      Upload Time
                                      {getSortIcon('alert_upload_time')}
                                  </Button>
                              </TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => handleSort('first_seen_at')}>
                                      First Seen
                                      {getSortIcon('first_seen_at')}
                                  </Button>
                              </TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => handleSort('last_seen_at')}>
                                      Last Seen
                                      {getSortIcon('last_seen_at')}
                                  </Button>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentAlerts.map((alert, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{alert.Title}</TableCell>
                                <TableCell>{alert.policy_name}</TableCell>
                                <TableCell>{alert.classification}</TableCell>
                                <TableCell><div className="whitespace-pre-wrap break-words min-w-[250px]">{alert.classification_reason}</div></TableCell>
                                <TableCell>{alert.behavior}</TableCell>
                                <TableCell><div className="whitespace-pre-wrap break-words min-w-[250px]">{alert.behavior_reason}</div></TableCell>
                                <TableCell><div className="whitespace-pre-wrap break-words min-w-[250px]">{alert.SOP_Instructions}</div></TableCell>
                                <TableCell>
                                  {alert.duplicate_count > 1 ? (
                                    <Button variant="link" className="p-0 h-auto" onClick={() => handleCountClick(alert)}>
                                      {alert.duplicate_count}
                                    </Button>
                                  ) : (
                                    alert.duplicate_count
                                  )}
                                </TableCell>
                                <TableCell>{renderRiskScore(alert.risk_score)}</TableCell>
                                <TableCell>{alert.user_principal_name}</TableCell>
                                <TableCell>
                                  {alert.email_sender && (
                                    <div className="group relative flex items-center justify-start gap-2">
                                      <span>{alert.email_sender}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => window.location.href = `mailto:${alert.email_sender}?body=${encodeURIComponent(alert.whatNotToDoNextTime || '')}`}
                                      >
                                        <Mail className="h-4 w-4" />
                                        <span className="sr-only">Send Email</span>
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{alert.email_subject}</TableCell>
                                <TableCell>{alert.email_recipient}</TableCell>
                                <TableCell suppressHydrationWarning>{formatDate(alert.evidence_createdDateTime)}</TableCell>
                                <TableCell suppressHydrationWarning>{formatDate(alert.alert_upload_time)}</TableCell>
                                <TableCell suppressHydrationWarning>{formatDate(alert.first_seen_at)}</TableCell>
                                <TableCell suppressHydrationWarning>{formatDate(alert.last_seen_at)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={handleNext}
                            disabled={currentPage === totalPages || sortedAndFilteredAlerts.length === 0}
                            variant="outline"
                            size="sm"
                          >
                            Next
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages} | Showing {currentAlerts.length} of {sortedAndFilteredAlerts.length} filtered records
                        </div>
                      </div>
                    </>
                  ) : (
                    <UiAlert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Alerts Found</AlertTitle>
                      <AlertDescription>
                        There are currently no alerts to display.
                      </AlertDescription>
                    </UiAlert>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>This table displays a real-time stream of all security alerts detected by the system. You can sort, filter, and search to investigate specific events.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-7xl bg-[#292828]">
          <DialogHeader>
            <DialogTitle>Redundant Alerts for: {selectedAlert?.Title}</DialogTitle>
            <DialogDescription>
              Showing {isRedundancyLoading ? '...' : redundancyData.length} redundant alerts associated with this event.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {isRedundancyLoading ? (
              <div className="flex justify-center items-center h-40">
                  <p>Loading redundant alerts...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleRedundancySort('Title')}>
                        Title {getRedundancySortIcon('Title')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleRedundancySort('policy_name')}>
                        Policy Name {getRedundancySortIcon('policy_name')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleRedundancySort('category')}>
                        Category {getRedundancySortIcon('category')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleRedundancySort('classification')}>
                        Classification {getRedundancySortIcon('classification')}
                      </Button>
                    </TableHead>
                    <TableHead>Classification Reason</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleRedundancySort('time')}>
                        Time {getRedundancySortIcon('time')}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRedundancyData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.Title}</TableCell>
                      <TableCell>{item.policy_name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.classification}</TableCell>
                      <TableCell><div className="whitespace-pre-wrap break-words">{item.classification_reason}</div></TableCell>
                      <TableCell suppressHydrationWarning>{formatDate(item.time)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
