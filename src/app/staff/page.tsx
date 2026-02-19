'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { StaffList } from '@/components/staff/StaffList';

export default function StaffPage() {
  return (
    <AppLayout>
      <StaffList />
    </AppLayout>
  );
}