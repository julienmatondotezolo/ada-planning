import { Metadata } from 'next';
import { CalendarView } from '@/components/calendar/CalendarView';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Planning du Personnel - AdaPlanning',
  description: 'Vue d\'ensemble du planning du personnel pour L\'Osteria Deerlijk',
};

export default function HomePage() {
  return (
    <AppShell>
      <CalendarView />
    </AppShell>
  );
}
