'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CreditCard,
  FolderKanban,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  message: string;
  type: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  alert: AlertTriangle,
  payment: CreditCard,
  project: FolderKanban,
  message: MessageSquare,
  consultation: Calendar,
};

const typeColors: Record<string, string> = {
  info: 'text-blue-400 bg-blue-500/20',
  success: 'text-green-400 bg-green-500/20',
  warning: 'text-yellow-400 bg-yellow-500/20',
  error: 'text-red-400 bg-red-500/20',
  alert: 'text-orange-400 bg-orange-500/20',
  payment: 'text-green-400 bg-green-500/20',
  project: 'text-purple-400 bg-purple-500/20',
  message: 'text-cyan-400 bg-cyan-500/20',
  consultation: 'text-pink-400 bg-pink-500/20',
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotifications(data as Notification[]);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    const supabase = getSupabaseClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    setMarkingAll(true);
    const supabase = getSupabaseClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-MX');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-slate-400">
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificaciones sin leer`
              : 'Todas las notificaciones leídas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="border-slate-700 hover:bg-slate-800"
          >
            {markingAll ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center">
            <BellOff className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No tienes notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const Icon = typeIcons[notification.type] || Info;
            const colorClass = typeColors[notification.type] || typeColors.info;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`bg-slate-900 border-slate-800 ${
                    !notification.read ? 'border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              className={`font-medium ${
                                notification.read ? 'text-slate-300' : 'text-white'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                              {notification.message || notification.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-500">
                              {formatDate(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-slate-400 hover:text-white h-8 w-8 p-0"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
