import { Metadata } from 'next';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Header } from '@/components/layout/Header';
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

      {/* Main Content — fills all remaining space */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Slim Header */}
        <Header />

        {/* Calendar — full screen */}
        <main className="flex-1 overflow-hidden">
          <CalendarView />
        </main>
      </div>
    </div>
  );
}
