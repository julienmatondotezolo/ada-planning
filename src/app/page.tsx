'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { MonthlyCalendar } from '@/components/planning/MonthlyCalendar';

export default function Home() {
  return (
    <AppLayout>
      <MonthlyCalendar />
    </AppLayout>
  );
}