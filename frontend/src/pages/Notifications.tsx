import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/layout/Layout";
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
  RefreshCw
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
  
  // Polling state
  const [lastPolled, setLastPolled] = useState<Date>(new Date());
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async (page = 1, unreadOnly = false, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        unreadOnly: unreadOnly.toString()
      });
      
      const response = await api.get(`/citizens/notifications?${params}`);
      
      if (response.data.success) {
        setNotifications(response.data.data);
        setPagination(response.data.pagination);
        setLastPolled(new Date());
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

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const interval = setInterval(() => {
      fetchNotifications(pagination.currentPage, filter === 'unread', true);
    }, 30000); // Poll every 30 seconds
    
    setPollingInterval(interval);
  }, [fetchNotifications, pagination.currentPage, filter]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  useEffect(() => {
    fetchNotifications(1, filter === 'unread');
    startPolling();
    
    return () => stopPolling();
  }, [filter]);

  useEffect(() => {
    // Update polling when page changes
    if (pollingInterval) {
      stopPolling();
      startPolling();
    }
  }, [pagination.currentPage]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await api.put(`/citizens/notifications/${notificationId}/read`);
      
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
      const response = await api.put('/citizens/notifications/read-all');
      
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
        return <Scale className="h-4 w-4 text-blue-500" />;
      case 'FIR_REGISTERED':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'EVIDENCE_SUBMITTED':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'STATUS_CHANGED':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
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
      {[...Array(5)].map((_, index) => (
        <Card key={index} className="card-elegant">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">
                  Stay updated with your case progress and important updates
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(pagination.currentPage, filter === 'unread')}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={markingAllRead}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {markingAllRead ? 'Marking...' : 'Mark All Read'}
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pagination.totalItems}</p>
                    <p className="text-sm text-muted-foreground">Total Notifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <BellRing className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unreadCount}</p>
                    <p className="text-sm text-muted-foreground">Unread</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="font-medium text-sm">{formatDate(lastPolled.toISOString())}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Notifications List */}
          {loading ? (
            <LoadingSkeleton />
          ) : notifications.length === 0 ? (
            <Card className="card-elegant">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'unread' 
                    ? "You have no unread notifications."
                    : "You don't have any notifications yet."
                  }
                </p>
                {filter === 'unread' && (
                  <Button onClick={() => setFilter('all')} variant="outline">
                    View All Notifications
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const NotificationContent = (
                  <Card 
                    className={`card-elegant transition-all duration-200 ${
                      !notification.isRead ? 'border-primary/20 bg-primary/5' : ''
                    } ${link ? 'hover:shadow-md cursor-pointer' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-full ${!notification.isRead ? 'bg-primary/10' : 'bg-muted'}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className={`font-medium ${!notification.isRead ? 'text-primary' : ''}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  New
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          {/* Related Information */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {notification.caseId && (
                              <span className="flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                Case: {notification.caseId.caseNumber}
                              </span>
                            )}
                            {notification.complaintId && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Complaint: {notification.complaintId.title}
                              </span>
                            )}
                            {notification.firId && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                FIR: {notification.firId.firNumber}
                              </span>
                            )}
                            {notification.metadata?.hearingDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(notification.metadata.hearingDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2">
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
