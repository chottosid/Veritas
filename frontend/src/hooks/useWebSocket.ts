import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  caseId?: {
    _id: string;
    caseNumber: string;
  };
  complaintId?: {
    _id: string;
    title: string;
  };
  firId?: {
    _id: string;
    firNumber: string;
  };
  metadata?: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  recipientType: string;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  joinCaseRoom: (caseId: string) => void;
  leaveCaseRoom: (caseId: string) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize WebSocket connection
  const initializeSocket = useCallback(() => {
    if (!user || !token) return;

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      
      // Show error toast
      toast({
        title: "Connection Error",
        description: "Failed to connect to notification service. Some features may not work.",
        variant: "destructive"
      });
    });

    // Notification events
    socket.on('notification', (notification: Notification) => {
      console.log('📨 New notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: notification.priority === 'urgent' ? 10000 : 5000,
      });
    });

    socket.on('case_notification', (notification: Notification) => {
      console.log('📁 Case notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast for case notifications
      toast({
        title: notification.title,
        description: notification.message,
        duration: 8000,
      });
    });

    socket.on('system_notification', (notification: Notification) => {
      console.log('📢 System notification received:', notification);
      
      // Show system notification toast
      toast({
        title: notification.title,
        description: notification.message,
        duration: 10000,
      });
    });

    // Store socket reference
    socketRef.current = socket;
  }, [user, token]);

  // Cleanup socket on unmount
  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Initialize connection when user changes
  useEffect(() => {
    if (user && token) {
      initializeSocket();
    } else {
      cleanupSocket();
    }

    return cleanupSocket;
  }, [user, token, initializeSocket, cleanupSocket]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  }, []);

  // Join case room for real-time updates
  const joinCaseRoom = useCallback((caseId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_case_room', caseId);
      console.log(`📁 Joined case room: ${caseId}`);
    }
  }, [isConnected]);

  // Leave case room
  const leaveCaseRoom = useCallback((caseId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_case_room', caseId);
      console.log(`📁 Left case room: ${caseId}`);
    }
  }, [isConnected]);

  // Reconnection logic
  useEffect(() => {
    if (!isConnected && user && token) {
      const reconnectTimer = setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        initializeSocket();
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected, user, token, initializeSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    joinCaseRoom,
    leaveCaseRoom,
  };
};
