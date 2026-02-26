import { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from 'ada-design-system';

export const metadata: Metadata = {
  title: 'Accès non autorisé - AdaPlanning',
  description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl text-red-600">Accès non autorisé</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-sm text-gray-500">
            Contactez votre administrateur si vous pensez que c'est une erreur.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                Retour à l'accueil
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="https://adaauth.mindgen.app/dashboard">
                Tableau de bord AdaAuth
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}