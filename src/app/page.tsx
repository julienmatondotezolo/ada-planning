import { Metadata } from 'next';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Planning du Personnel - AdaPlanning',
  description: 'Vue d\'ensemble du planning du personnel pour L\'Osteria Deerlijk',
};

export default function HomePage() {
  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Calendar — full screen */}
      <main className="flex-1 overflow-hidden">
        <CalendarView />
      </main>
    </div>
  );
}
