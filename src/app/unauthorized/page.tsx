'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Accès Refusé
          </CardTitle>
          <CardDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">
                <p><strong>Utilisateur:</strong> {user?.first_name} {user?.last_name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Rôle:</strong> <span className="capitalize">{user?.role || 'Non défini'}</span></p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              Contactez votre administrateur pour demander les permissions appropriées.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGoHome}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}