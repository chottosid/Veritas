import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/layout/Layout";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/lib/api";
import { 
  Bell, 
  BellRing,
  Calendar,
  FileText,
  Scale,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { Link } from "react-router-dom";

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
  metadata?: {
    hearingDate?: string;
    [key: string]: any;
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const Notifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  // WebSocket hook for real-time notifications
  const { 
    isConnected, 
    notifications: wsNotifications, 
    unreadCount: wsUnreadCount,
    markAsRead: wsMarkAsRead,
    markAllAsRead: wsMarkAllAsRead 
  } = useWebSocket();

  const getNotificationEndpoint = () => {
    switch (user?.role) {
      case 'POLICE':
        return '/police/notifications';
      case 'JUDGE':
        return '/judges/notifications';
      case 'LAWYER':
        return '/lawyers/notifications';
      case 'CITIZEN':
      default:
        return '/citizens/notifications';
    }
  };

  const fetchNotifications = useCallback(async (page = 1, unreadOnly = false, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        unreadOnly: unreadOnly.toString()
      });
      
      const endpoint = getNotificationEndpoint();
      const response = await api.get(`${endpoint}?${params}`);
      
      if (response.data.success) {
        setNotifications(response.data.data);
        setPagination(response.data.pagination);
      } else {
        if (!silent) {
          setError(response.data.message || 'Failed to fetch notifications');
        }
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      if (!silent) {
        setError(err.response?.data?.message || 'Failed to fetch notifications');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Load initial notifications
  useEffect(() => {
    fetchNotifications(1, filter === 'unread');
  }, [filter, fetchNotifications]);

  // Sync WebSocket notifications with local state
  useEffect(() => {
    if (wsNotifications.length > 0) {
      // Merge WebSocket notifications with fetched notifications
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n._id));
        const newNotifications = wsNotifications.filter(n => !existingIds.has(n._id));
        return [...newNotifications, ...prev];
      });
    }
  }, [wsNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state immediately
      wsMarkAsRead(notificationId);
      
      // Also update on server
      const endpoint = getNotificationEndpoint();
      const response = await api.put(`${endpoint}/${notificationId}/read`);
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      
      // Update local state immediately
      wsMarkAllAsRead();
      
      // Also update on server
      const endpoint = getNotificationEndpoint();
      const response = await api.put(`${endpoint}/read-all`);
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        // Refresh to get updated counts
        fetchNotifications(pagination.currentPage, filter === 'unread', true);
      }
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'HEARING_SCHEDULED':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'CASE_CREATED':
      case 'CASE_ASSIGNED':
        return <Scale className="h-4 w-4 text-blue-500" />;
      case 'FIR_REGISTERED':
      case 'FIR_SUBMITTED':
      case 'FIR_REJECTED':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'EVIDENCE_SUBMITTED':
      case 'DOCUMENT_FILED':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'STATUS_CHANGED':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'COMPLAINT_SUBMITTED':
      case 'COMPLAINT_ASSIGNED':
        return <AlertCircle className="h-4 w-4 text-indigo-500" />;
      case 'LAWYER_REQUEST_ACCEPTED':
      case 'LAWYER_REQUEST_REJECTED':
      case 'LAWYER_REQUEST_PENDING':
        return <Scale className="h-4 w-4 text-teal-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.caseId) {
      return `/cases/${notification.caseId._id}`;
    }
    if (notification.complaintId) {
      return `/complaints/${notification.complaintId._id}`;
    }
    return null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }, (_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground mt-2">
                Stay updated with real-time notifications about your cases and activities
              </p>
            </div>
            
            {/* WebSocket Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Real-time' : 'Offline'}
              </span>
              {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            </div>
          </div>

          {/* Connection Status Alert */}
          {!isConnected && (
            <Alert className="mb-6">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You are currently offline. Notifications will be updated when you reconnect.
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal ml-2"
                  onClick={() => window.location.reload()}
                >
                  Retry connection
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Filters and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                <Filter className="h-4 w-4 mr-2" />
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Unread
                {wsUnreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {wsUnreadCount}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(pagination.currentPage, filter === 'unread')}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {wsUnreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={markingAllRead}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {filter === 'unread' 
                    ? 'You have no unread notifications'
                    : 'You have no notifications yet'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const link = getNotificationLink(notification);
                
                const NotificationContent = (
                  <Card className={`hover:shadow-md transition-shadow ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Priority indicator */}
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getPriorityColor(notification.priority).replace('bg-', 'text-').replace('-500', '')}`} />
                        
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`font-semibold text-lg ${
                                !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </h3>
                              <p className="text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              
                              {/* Metadata */}
                              {notification.metadata && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  {notification.metadata.hearingDate && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>Hearing: {new Date(notification.metadata.hearingDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  {notification.metadata.caseNumber && (
                                    <div className="flex items-center space-x-1">
                                      <Scale className="h-3 w-3" />
                                      <span>Case: {notification.metadata.caseNumber}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2 mt-3 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(notification.createdAt)}</span>
                                
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPriorityColor(notification.priority).replace('bg-', 'text-').replace('-500', '')}`}
                                >
                                  {notification.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-2 mt-4">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            {link && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={link}>
                                  View Details
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );

                return (
                  <div key={notification._id}>
                    {link ? (
                      <Link 
                        to={link} 
                        className="block"
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification._id);
                          }
                        }}
                      >
                        {NotificationContent}
                      </Link>
                    ) : (
                      NotificationContent
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalItems)} of {pagination.totalItems} notifications
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev || loading}
                  onClick={() => fetchNotifications(pagination.currentPage - 1, filter === 'unread')}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => fetchNotifications(page, filter === 'unread')}
                        disabled={loading}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext || loading}
                  onClick={() => fetchNotifications(pagination.currentPage + 1, filter === 'unread')}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
