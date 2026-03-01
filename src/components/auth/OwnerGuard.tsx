'use client';

import Link from 'next/link';
import { ShieldX, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from 'ada-design-system';

interface OwnerGuardProps {
  children: React.ReactNode;
}

export function OwnerGuard({ children }: OwnerGuardProps) {
  const { user } = useAuth();

  if (user?.role !== 'owner') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <ShieldX className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">Accès réservé</h1>
            <p className="text-gray-600">
              Cette page est réservée aux propriétaires du restaurant.
            </p>
            <p className="text-sm text-gray-500">
              Contactez votre gérant si vous pensez que c&apos;est une erreur.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Retour au calendrier
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
