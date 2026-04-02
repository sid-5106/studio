
import { getAlerts } from '@/app/actions';
import { AppLayout } from '@/components/app-layout';
import { AlertsClient } from './alerts-client';

export default async function AlertsPage() {
  const alerts = await getAlerts();

  return (
    <AppLayout>
      <AlertsClient initialAlerts={alerts} />
    </AppLayout>
  );
}
