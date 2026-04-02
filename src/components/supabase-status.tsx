'use client';

import { useEffect, useState } from 'react';
import { checkSupabaseConnection } from '@/app/actions';
import { Badge } from '@/components/ui/badge';

type Status = 'Active' | 'Inactive' | 'Checking...';

export function SupabaseStatus() {
  const [status, setStatus] = useState<Status>('Checking...');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkSupabaseConnection();
        setStatus(result.status);
      } catch (error) {
        setStatus('Inactive');
      } finally {
        setLastRefreshed(new Date());
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Refresh every 1 minute

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'Active':
        return <Badge className="border-transparent bg-active text-active-foreground shadow hover:bg-active/90">Active</Badge>;
      case 'Inactive':
        return <Badge variant="destructive">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Checking...</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {getStatusBadge()}
      <div className="hidden md:block">
        {lastRefreshed ? `Last refresh: ${lastRefreshed.toLocaleTimeString()}` : ''}
      </div>
    </div>
  );
}
