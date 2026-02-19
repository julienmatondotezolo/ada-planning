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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 bg-card border-r border-border">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Calendar content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-full">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground">
                Planning du Personnel
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestion des horaires de travail pour L'Osteria Deerlijk
              </p>
            </div>
            
            {/* Calendar Grid */}
            <CalendarView />
          </div>
        </main>
      </div>
    </div>
  );
}