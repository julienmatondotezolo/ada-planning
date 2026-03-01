'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
} from 'ada-design-system';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  restaurant_id: string;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  metadata?: {
    shift_id?: string;
    employee_id?: string;
    employee_name?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
  };
  created_at: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiFetch<Notification[]>('notifications?limit=50');
      return res.success ? res.data : [];
    },
    refetchInterval: 30_000, // poll every 30s
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`notifications/${id}/read`, { method: 'PUT' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiFetch('notifications/read-all', { method: 'PUT' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filtered = (notifications ?? []).filter(
    (n) => filter === 'all' || !n.read
  );

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'shift_accepted':
        return <UserCheck className="w-5 h-5 text-green-600" />;
      case 'shift_declined':
        return <UserX className="w-5 h-5 text-red-600" />;
      case 'shift_pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'shift_accepted':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Accepté</Badge>;
      case 'shift_declined':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Refusé</Badge>;
      case 'shift_pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">En attente</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white hover:bg-red-500 ml-1">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Réponses aux plannings et alertes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                Tout
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  filter === 'unread'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                Non lues ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Tout lire
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </p>
              <p className="text-sm mt-1">
                Les réponses des employés apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => (
              <Card
                key={notif.id}
                className={cn(
                  'transition-colors cursor-pointer',
                  !notif.read && 'border-primary/30 bg-blue-50/30'
                )}
                onClick={() => {
                  if (!notif.read) markRead.mutate(notif.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{notif.title}</span>
                        {getBadge(notif.type)}
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>

                      {notif.message && (
                        <p className="text-sm text-muted-foreground mb-1.5">{notif.message}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {notif.metadata?.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {notif.metadata.date}
                            {notif.metadata.start_time && ` ${notif.metadata.start_time}`}
                            {notif.metadata.end_time && `–${notif.metadata.end_time}`}
                          </span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>

                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          markRead.mutate(notif.id);
                        }}
                        title="Marquer comme lu"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
