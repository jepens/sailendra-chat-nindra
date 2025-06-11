import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface Notification {
  id: string;
  type: 'message' | 'call' | 'reminder' | 'system' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true,
  });
  const [isConnected, setIsConnected] = useState(false);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission({
        granted: result === 'granted',
        denied: result === 'denied',
        default: result === 'default',
      });
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!permission.granted) return;

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: notification.type,
      requireInteraction: notification.priority === 'urgent',
      data: {
        id: notification.id,
        actionUrl: notification.actionUrl,
      }
    };

    const browserNotification = new Notification(notification.title, options);

    browserNotification.onclick = () => {
      if (notification.actionUrl) {
        window.focus();
        window.open(notification.actionUrl, '_self');
      }
      browserNotification.close();
    };

    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }, [permission.granted]);

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show browser notification
    showBrowserNotification(newNotification);
    
    // Show toast notification
    toast({
      title: newNotification.title,
      description: newNotification.message,
      variant: newNotification.type === 'error' ? 'destructive' : 'default',
    });

    return newNotification.id;
  }, [showBrowserNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  // Real-time connection simulation (replace with actual WebSocket/SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectInterval: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        // Replace with actual SSE endpoint
        eventSource = new EventSource('/api/notifications/stream');
        
        eventSource.onopen = () => {
          console.log('Notifications connection established');
          setIsConnected(true);
          if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            addNotification(notification);
          } catch (error) {
            console.error('Failed to parse notification:', error);
          }
        };

        eventSource.onerror = () => {
          console.warn('Notifications connection lost');
          setIsConnected(false);
          eventSource?.close();
          
          // Attempt to reconnect after 5 seconds
          if (!reconnectInterval) {
            reconnectInterval = setInterval(connect, 5000);
          }
        };

      } catch (error) {
        console.error('Failed to establish notifications connection:', error);
        setIsConnected(false);
      }
    };

    // Mock real-time notifications for demo
    const mockNotifications = () => {
      const mockData = [
        {
          type: 'message' as const,
          title: 'New Message',
          message: 'You have received a new message from customer',
          priority: 'medium' as const,
          actionUrl: '/chat'
        },
        {
          type: 'reminder' as const,
          title: 'Calendar Reminder',
          message: 'Meeting starts in 15 minutes',
          priority: 'high' as const,
          actionUrl: '/calendar'
        },
        {
          type: 'system' as const,
          title: 'System Update',
          message: 'System maintenance scheduled for tonight',
          priority: 'low' as const,
        }
      ];

      // Simulate periodic notifications
      const interval = setInterval(() => {
        const randomNotification = mockData[Math.floor(Math.random() * mockData.length)];
        addNotification(randomNotification);
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    };

    // Use mock notifications if real connection fails
    connect();
    const cleanup = mockNotifications();

    return () => {
      eventSource?.close();
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
      cleanup();
    };
  }, [addNotification]);

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(notification => !notification.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Initialize permission check
  useEffect(() => {
    if ('Notification' in window) {
      setPermission({
        granted: Notification.permission === 'granted',
        denied: Notification.permission === 'denied',
        default: Notification.permission === 'default',
      });
    }
  }, []);

  return {
    notifications,
    unreadCount,
    permission,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getUnreadNotifications,
    requestPermission,
  };
}; 