import { Metadata } from 'next';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Planning du Personnel - AdaPlanning',
  description: 'Vue d\'ensemble du planning du personnel pour L\'Osteria Deerlijk',
};

export default function HomePage() {
  // Authentication is now handled by middleware.ts
  // No need for ProtectedRoute wrapper - users are authenticated before reaching this component
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Calendar View */}
        <main className="flex-1 overflow-auto">
          <CalendarView />
        </main>
      </div>
    </div>
  );
}