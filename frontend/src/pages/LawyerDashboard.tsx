import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Layout } from '../components/layout/Layout';
import { 
  Scale, 
  Briefcase, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Bell,
  TrendingUp,
  Activity,
  User,
  Users,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { toast } from '../hooks/use-toast';

interface DashboardStats {
  requests: number;
  cases: number;
  notifications: number;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
    status?: string;
  }>;
}

interface LawyerRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  citizenId: {
    name: string;
    nid: string;
    phone: string;
  };
  caseId: {
    caseNumber: string;
  };
  message?: string;
  createdAt: string;
}

interface LawyerCase {
  id: string;
  caseNumber: string;
  status: 'PENDING' | 'ONGOING' | 'CLOSED';
  firId: {
    firNumber: string;
  };
  assignedJudgeId: {
    name: string;
    courtName: string;
  };
  hearingDates: string[];
  updatedAt?: string;
  createdAt: string;
}

const LawyerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    requests: 0,
    cases: 0,
    notifications: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsRes, casesRes, notificationsRes] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LAWYERS_REQUESTS), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LAWYERS_CASES), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.LAWYERS_NOTIFICATIONS}?limit=5`), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] }))
      ]);

      // Get recent activity from requests and cases
      const requests = requestsRes.data || [];
      const cases = casesRes.data || [];
      const notifications = notificationsRes.data || [];

      const recentActivity = [
        ...requests.slice(0, 3).map((request: LawyerRequest) => ({
          id: request.id,
          type: 'request',
          title: 'Client Request',
          description: `${request.citizenId.name} requested representation`,
          time: formatTimeAgo(request.createdAt),
          status: request.status
        })),
        ...cases.slice(0, 2).map((caseItem: LawyerCase) => ({
          id: caseItem.id,
          type: 'case',
          title: 'Case Update',
          description: `Case ${caseItem.caseNumber}`,
          time: formatTimeAgo(caseItem.updatedAt || caseItem.createdAt),
          status: caseItem.status
        })),
        ...notifications.slice(0, 2).map((notification: any) => ({
          id: notification._id || notification.id,
          type: 'notification',
          title: notification.title,
          description: notification.message,
          time: formatTimeAgo(notification.createdAt)
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

      setStats({
        requests: requests.length,
        cases: cases.length,
        notifications: notifications.filter((n: any) => !n.isRead).length,
        recentActivity
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      
      setStats({
        requests: 0,
        cases: 0,
        notifications: 0,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };



  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'request': return <Users className="h-4 w-4" />;
      case 'case': return <Scale className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
      case 'ONGOING': return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-elegant">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-elegant">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <LoadingSkeleton />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Lawyer Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}. Manage your client requests and case proceedings.
            </p>
            {user?.firmName && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{user.firmName}</span>
                {user.bid && <span>• BID: {user.bid}</span>}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="card-elegant">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.requests}</p>
                    <p className="text-sm text-muted-foreground">Client Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Scale className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.cases}</p>
                    <p className="text-sm text-muted-foreground">Active Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-100">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.notifications}</p>
                    <p className="text-sm text-muted-foreground">New Notifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.requests + stats.cases}</p>
                    <p className="text-sm text-muted-foreground">Total Workload</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Activity */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest client requests and case updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            {activity.status && (
                              <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                                {activity.status.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and navigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button asChild className="justify-start h-auto p-4">
                    <Link to="/lawyer/requests">
                      <Users className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Client Requests</div>
                        <div className="text-sm opacity-70">Manage representation requests</div>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link to="/lawyer/cases">
                      <Scale className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">My Cases</div>
                        <div className="text-sm opacity-70">View assigned cases</div>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link to="/notifications">
                      <Bell className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Notifications</div>
                        <div className="text-sm opacity-70">Check latest updates</div>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link to="/profile">
                      <User className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">My Profile</div>
                        <div className="text-sm opacity-70">View professional details</div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          {(stats.requests > 0 || stats.cases > 0) && (
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Status Overview</CardTitle>
                <CardDescription>
                  Summary of your current client workload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Client Request Status
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Requests:</span>
                        <span className="font-medium">{stats.requests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Review:</span>
                        <span className="font-medium text-yellow-600">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accepted:</span>
                        <span className="font-medium text-green-600">-</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Case Status
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Cases:</span>
                        <span className="font-medium">{stats.cases}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ongoing:</span>
                        <span className="font-medium text-blue-600">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-medium text-green-600">-</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LawyerDashboard;
