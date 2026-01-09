'use client';

import { useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/stores/notification-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Notification } from '@/types/database';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeNotifications() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    setLoading,
  } = useNotificationStore();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data as Notification[]);
    }

    setLoading(false);
  }, [user, setNotifications, setLoading]);

  // Mark notification as read in database
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (!error) {
        markAsRead(notificationId);
      }
    },
    [markAsRead]
  );

  // Mark all as read in database
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      markAllAsRead();
    }
  }, [user, markAllAsRead]);

  // Delete notification from database
  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (!error) {
        removeNotification(notificationId);
      }
    },
    [removeNotification]
  );

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseClient();
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Fetch initial data
      await fetchNotifications();

      // Subscribe to new notifications
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Notification>) => {
            const newNotification = payload.new as Notification;
            addNotification(newNotification);

            // Show browser notification if supported
            if ('Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/favicon.ico',
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Notification>) => {
            const updatedNotification = payload.new as Notification;
            if (updatedNotification.read) {
              markAsRead(updatedNotification.id);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Notification>) => {
            const deletedNotification = payload.old as { id: string };
            removeNotification(deletedNotification.id);
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, fetchNotifications, addNotification, markAsRead, removeNotification]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    refresh: fetchNotifications,
  };
}
