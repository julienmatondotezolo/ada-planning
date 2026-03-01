'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, type Employee, staffApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Euro,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ada-design-system';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';

type Period = 'weekly' | 'monthly';

interface LaborCostData {
  period: string;
  total_cost: number;
  total_hours: number;
  breakdown: {
    employee_id: string;
    employee_name: string;
    hours: number;
    hourly_rate: number;
    cost: number;
  }[];
  daily_totals: {
    date: string;
    cost: number;
    hours: number;
  }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateRange = useMemo(() => {
    if (period === 'weekly') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    }
  }, [period, currentDate]);

  const startStr = format(dateRange.start, 'yyyy-MM-dd');
  const endStr = format(dateRange.end, 'yyyy-MM-dd');

  // Fetch labor cost data from backend
  const { data: laborData, isLoading: laborLoading } = useQuery<LaborCostData>({
    queryKey: ['labor-cost', period, startStr, endStr],
    queryFn: async () => {
      const res = await apiFetch<LaborCostData>(
        `analytics/labor-cost?period=${period}&start_date=${startStr}&end_date=${endStr}`
      );
      if (res.success) return res.data;
      throw new Error(res.error || 'Failed to fetch analytics');
    },
    staleTime: 30_000,
  });

  // Fetch employees for fallback display
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await staffApi.getAll({ active_only: true });
      return res.success ? res.data : [];
    },
    staleTime: 60_000,
  });

  const navigate = (direction: -1 | 1) => {
    if (period === 'weekly') {
      setCurrentDate((d) => (direction === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    } else {
      setCurrentDate((d) => (direction === 1 ? addMonths(d, 1) : subMonths(d, 1)));
    }
  };

  const periodLabel = period === 'weekly'
    ? `${format(dateRange.start, 'd MMM', { locale: fr })} – ${format(dateRange.end, 'd MMM yyyy', { locale: fr })}`
    : format(dateRange.start, 'MMMM yyyy', { locale: fr });

  const totalCost = laborData?.total_cost ?? 0;
  const totalHours = laborData?.total_hours ?? 0;
  const avgCostPerHour = totalHours > 0 ? totalCost / totalHours : 0;
  const employeeCount = laborData?.breakdown?.length ?? 0;

  // Bar chart: daily totals
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const maxDailyCost = Math.max(
    ...(laborData?.daily_totals?.map((d) => d.cost) ?? [0]),
    1
  );

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Analytiques
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Coûts de main-d&apos;œuvre et heures planifiées
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v: string) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semaine</SelectItem>
                <SelectItem value="monthly">Mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Period navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize">{periodLabel}</h2>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Euro className="w-4 h-4" />
                <span className="text-xs font-medium">Coût total</span>
              </div>
              {laborLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  €{totalCost.toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Heures planifiées</span>
              </div>
              {laborLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {totalHours.toFixed(1)}h
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Coût moyen/h</span>
              </div>
              {laborLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  €{avgCostPerHour.toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">Employés planifiés</span>
              </div>
              {laborLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {employeeCount}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily bar chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Coûts par jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            {laborLoading ? (
              <div className="flex items-end gap-1 h-40">
                {days.map((_, i) => (
                  <Skeleton key={i} className="flex-1 h-full" />
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {days.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayData = laborData?.daily_totals?.find(
                    (d) => d.date === dayStr
                  );
                  const cost = dayData?.cost ?? 0;
                  const heightPct = maxDailyCost > 0 ? (cost / maxDailyCost) * 100 : 0;
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={dayStr}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${format(day, 'EEEE d MMM', { locale: fr })}: €${cost.toFixed(2)}`}
                    >
                      <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                        <div
                          className={cn(
                            'w-full max-w-[40px] rounded-t transition-all',
                            isToday ? 'bg-primary' : 'bg-primary/30',
                            cost === 0 && 'bg-gray-100'
                          )}
                          style={{ height: `${Math.max(heightPct, cost > 0 ? 4 : 1)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {format(day, 'EEE', { locale: fr })}
                      </span>
                      {cost > 0 && (
                        <span className="text-[9px] text-muted-foreground font-medium">
                          €{cost >= 100 ? Math.round(cost) : cost.toFixed(0)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Détail par employé
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {laborLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !laborData?.breakdown?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune donnée pour cette période</p>
              </div>
            ) : (
              <div className="divide-y">
                {laborData.breakdown
                  .sort((a, b) => b.cost - a.cost)
                  .map((emp) => (
                    <div key={emp.employee_id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {emp.employee_name
                            .split(' ')
                            .map((n) => n.charAt(0))
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{emp.employee_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {emp.hours.toFixed(1)}h × €{emp.hourly_rate.toFixed(2)}/h
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">€{emp.cost.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalCost > 0 ? ((emp.cost / totalCost) * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Total row */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 font-semibold">
                  <span className="text-sm">Total</span>
                  <div className="text-right">
                    <div className="text-sm">€{totalCost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {totalHours.toFixed(1)}h
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
