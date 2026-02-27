'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { shiftsApi, staffApi, type Shift, type Employee } from '@/lib/api';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  Button,
  Avatar,
  AvatarFallback,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from 'ada-design-system';

function fmtTime(t: string): string {
  if (!t) return '';
  const parts = t.split(':');
  return `${parts[0]}:${parts[1]}`;
}

function computeDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

export default function SchedulesPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState<string>('all');

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [shiftsRes, empRes] = await Promise.all([
        shiftsApi.getAll({
          start_date: format(weekStart, 'yyyy-MM-dd'),
          end_date: format(weekEnd, 'yyyy-MM-dd'),
        }),
        staffApi.getAll({ active_only: true }),
      ]);
      if (shiftsRes.success && shiftsRes.data) setShifts(shiftsRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
      setLoading(false);
    };
    fetchData();
  }, [currentWeek]);

  // Group shifts by employee
  const shiftsByEmployee = useMemo(() => {
    const map = new Map<string, { employee: Employee; shifts: Shift[] }>();

    employees.forEach((emp) => {
      map.set(emp.id, { employee: emp, shifts: [] });
    });

    shifts.forEach((shift) => {
      const empId = shift.employee_id;
      if (map.has(empId)) {
        map.get(empId)!.shifts.push(shift);
      } else {
        // Shift for unknown employee — create placeholder from available data
        const empData = shift.employee;
        map.set(empId, {
          employee: {
            id: empId,
            restaurant_id: '',
            first_name: empData?.first_name || 'Inconnu',
            last_name: empData?.last_name || '',
            position: shift.position || empData?.position || '',
            active: true,
          },
          shifts: [shift],
        });
      }
    });

    if (filterEmployee !== 'all') {
      const entry = map.get(filterEmployee);
      const filtered = new Map<string, { employee: Employee; shifts: Shift[] }>();
      if (entry) filtered.set(filterEmployee, entry);
      return filtered;
    }

    return map;
  }, [employees, shifts, filterEmployee]);

  // Stats
  const totalHours = shifts.reduce((sum, s) => sum + computeDuration(s.start_time, s.end_time), 0);
  const totalShifts = shifts.length;

  const getShiftForDay = (empShifts: Shift[], day: Date) =>
    empShifts.filter((s) => isSameDay(new Date(s.date || ''), day));

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getInitials = (e: Employee) =>
    `${e.first_name.charAt(0)}${e.last_name.charAt(0)}`.toUpperCase();

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Horaires
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalShifts} service{totalShifts > 1 ? 's' : ''} · {totalHours.toFixed(1)}h cette semaine
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer employé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout le personnel</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.first_name} {e.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Week navigation */}
        <Card className="mb-4">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="text-center">
                <div className="font-semibold text-foreground">
                  {format(weekStart, 'd MMM', { locale: fr })} — {format(weekEnd, 'd MMM yyyy', { locale: fr })}
                </div>
                <button
                  onClick={() => setCurrentWeek(new Date())}
                  className="text-xs text-primary hover:underline"
                >
                  Aujourd&apos;hui
                </button>
              </div>

              <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule grid */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[180px] sticky left-0 bg-background z-10">
                      Employé
                    </th>
                    {weekDays.map((day) => (
                      <th
                        key={day.toISOString()}
                        className={cn(
                          'text-center py-3 px-2 font-medium text-sm min-w-[100px]',
                          isToday(day) ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        <div className="capitalize">{format(day, 'EEE', { locale: fr })}</div>
                        <div className={cn(
                          'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm mt-0.5',
                          isToday(day) && 'bg-primary text-primary-foreground font-semibold'
                        )}>
                          {format(day, 'd')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(shiftsByEmployee.entries()).map(([empId, { employee, shifts: empShifts }]) => (
                    <tr key={empId} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4 sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(employee)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{employee.position}</div>
                          </div>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const dayShifts = getShiftForDay(empShifts, day);
                        return (
                          <td key={day.toISOString()} className={cn(
                            'py-2 px-1 text-center align-top',
                            isToday(day) && 'bg-primary/5'
                          )}>
                            {dayShifts.length > 0 ? (
                              <div className="space-y-1">
                                {dayShifts.map((s) => {
                                  const dur = computeDuration(s.start_time, s.end_time);
                                  return (
                                    <div
                                      key={s.id}
                                      className={cn(
                                        'rounded-md border px-1.5 py-1 text-xs cursor-pointer hover:opacity-80 transition',
                                        getStatusColor(s.status)
                                      )}
                                      title={`${fmtTime(s.start_time)}–${fmtTime(s.end_time)} (${dur.toFixed(1)}h)`}
                                    >
                                      <div className="font-medium">{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</div>
                                      {dur > 0 && (
                                        <div className="opacity-70">{dur.toFixed(1)}h</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-muted-foreground/30 text-xs py-2">—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {shiftsByEmployee.size === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Aucun horaire pour cette semaine</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
