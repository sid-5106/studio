'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, Loader } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface ProcessingAlert {
  id: number;
  alert_id: string;
  title: string;
  status: 'Processing' | 'Completed' | 'Failed' | 'processing' | 'completed' | 'failed';
  current_step: string;
  total_steps?: number;
  started_at: string;
  updated_at: string;
}

export function RealTimeAlerts() {
  const [alerts, setAlerts] = useState<ProcessingAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('processing_alerts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error && error.message !== 'relation "public.processing_alerts" does not exist') {
        console.error('Error fetching initial alerts:', error);
      } else if (data) {
        setAlerts(data);
      }
      setLoading(false);
    };

    fetchInitialData();

    const channel = supabase.channel('real-time-alerts');
    channel.on<ProcessingAlert>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'processing_alerts' },
        (payload) => {
           setAlerts(currentAlerts => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            const findAndMerge = (id: number, newRec: Partial<ProcessingAlert>) => {
              return currentAlerts.map(alert => {
                if (alert.id === id) {
                    // Create a merged object, ensuring title from the old record persists if the new one doesn't have it
                    const updatedAlert = { ...alert, ...newRec };
                    if (!updatedAlert.title && alert.title) {
                        updatedAlert.title = alert.title;
                    }
                    return updatedAlert;
                }
                return alert;
              });
            }

            if (eventType === 'INSERT') {
              // Prepend new alert and remove potential duplicates by id
              const existingIds = new Set(currentAlerts.map(a => a.id));
              if (existingIds.has((newRecord as ProcessingAlert).id)) {
                  return findAndMerge((newRecord as ProcessingAlert).id, newRecord);
              }
              return [newRecord as ProcessingAlert, ...currentAlerts];
            }
            
            if (eventType === 'UPDATE') {
              return findAndMerge((newRecord as ProcessingAlert).id, newRecord);
            }

            if (eventType === 'DELETE') {
              return currentAlerts.filter(a => a.id !== (oldRecord as { id: number }).id);
            }

            return currentAlerts;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [visibleAlerts, setVisibleAlerts] = useState<ProcessingAlert[]>([]);

  useEffect(() => {
    setVisibleAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      setVisibleAlerts(prevAlerts => 
        prevAlerts.filter(alert => {
          const status = alert.status?.toLowerCase().trim();
          if ((status === 'completed' || status === 'failed') && alert.updated_at) {
            const updatedAt = new Date(alert.updated_at).getTime();
            // Remove after 10 seconds
            return (now - updatedAt) < 10000;
          }
          return true;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  
  const sortedAlerts = useMemo(() => {
      return [...visibleAlerts].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [visibleAlerts]);
  
  const getStatusIcon = (status: ProcessingAlert['status']) => {
    switch (status?.toLowerCase().trim()) {
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    try {
        return new Date(timestamp).toLocaleString();
    } catch {
        return timestamp;
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Real-Time Alert Processing</CardTitle>
        <CardDescription>Live feed of alerts being processed by the analysis workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {loading && (!sortedAlerts || sortedAlerts.length === 0) && (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            )}
            {!loading && sortedAlerts.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted text-center">
                    <p className="text-muted-foreground">No alerts are currently being processed.</p>
                    <p className="text-xs text-muted-foreground mt-2">Waiting for data from n8n workflow...</p>
                </div>
            )}
            <AnimatePresence>
              {sortedAlerts.map((alert) => (
                <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                    className={`p-4 rounded-lg border ${alert.status?.toLowerCase().trim() === 'failed' ? 'border-red-500/50 bg-red-500/10' : ''}`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                            <p className="font-semibold text-card-foreground">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">
                                Status: <span className="font-medium">{alert.status}</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {getStatusIcon(alert.status)}
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                {formatTimestamp(alert.updated_at)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        {alert.status?.toLowerCase().trim() === 'processing' ? (
                            <>
                                <Loader className="h-4 w-4 animate-spin" />
                                <span>{alert.current_step}</span>
                            </>
                        ) : (
                            <span>{alert.current_step}</span>
                        )}
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
