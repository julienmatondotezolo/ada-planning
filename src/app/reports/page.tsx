'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SimpleCard as Card, SimpleCardContent as CardContent, SimpleCardHeader as CardHeader, SimpleCardTitle as CardTitle } from '@/components/ui/simple-card';
import { BarChart3, Clock, Users, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, change }: {
  title: string;
  value: string;
  icon: any;
  change?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className="text-xs text-muted-foreground">{change}</p>
      )}
    </CardContent>
  </Card>
);

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Rapports</h1>
        
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Heures cette semaine"
            value="320h"
            icon={Clock}
            change="+12% par rapport à la semaine dernière"
          />
          <StatCard
            title="Personnel actif"
            value="8"
            icon={Users}
            change="2 nouveau ce mois"
          />
          <StatCard
            title="Taux de couverture"
            value="94%"
            icon={TrendingUp}
            change="+2% depuis le mois dernier"
          />
          <StatCard
            title="Coût de la main-d'œuvre"
            value="€4,725"
            icon={BarChart3}
            change="Dans le budget prévu"
          />
        </div>

        {/* Charts placeholder */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Heures par jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Graphique des heures par jour
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition par poste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Graphique de répartition
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Résumé hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { day: 'Lundi', scheduled: '45h', actual: '43h', coverage: '95%' },
                { day: 'Mardi', scheduled: '48h', actual: '48h', coverage: '100%' },
                { day: 'Mercredi', scheduled: '42h', actual: '40h', coverage: '90%' },
                { day: 'Jeudi', scheduled: '46h', actual: '46h', coverage: '100%' },
                { day: 'Vendredi', scheduled: '52h', actual: '51h', coverage: '98%' },
                { day: 'Samedi', scheduled: '58h', actual: '56h', coverage: '97%' },
                { day: 'Dimanche', scheduled: '38h', actual: '37h', coverage: '97%' },
              ].map((day) => (
                <div key={day.day} className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">{day.day}</span>
                  <div className="flex space-x-8 text-sm text-muted-foreground">
                    <span>Planifiées: {day.scheduled}</span>
                    <span>Réelles: {day.actual}</span>
                    <span className={`font-medium ${
                      parseInt(day.coverage) >= 95 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      Couverture: {day.coverage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}