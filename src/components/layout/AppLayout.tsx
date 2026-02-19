'use client';

import React from 'react';
import { AdaHeader } from '@/components/adaHeader/AdaHeader';
import { PlanningProvider } from '@/stores/planning-store';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <PlanningProvider>
      <div className="min-h-screen bg-gray-50">
        <AdaHeader />
        <main className="h-[calc(100vh-4rem)] overflow-hidden">
          {children}
        </main>
      </div>
    </PlanningProvider>
  );
};