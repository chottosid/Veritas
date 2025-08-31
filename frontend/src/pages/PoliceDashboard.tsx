import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { 
  FileText, 
  Scale, 
  Bell,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  TrendingUp,
  Activity,
  User,
  Users,
  Shield,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardStats {
  complaints: number;
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

export const PoliceDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    complaints: 0,
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

      const complaintsEndpoint = user?.isOC ? '/police/oc/complaints' : '/police/complaints';
      
      const [complaintsRes, casesRes, notificationsRes] = await Promise.all([
        api.get(complaintsEndpoint).catch(() => ({ data: { data: [] } })),
        api.get('/police/cases').catch(() => ({ data: { data: [] } })),
        api.get('/police/notifications?limit=5').catch(() => ({ data: { data: [] } }))
      ]);

      // Get recent activity from complaints and cases
      const complaints = complaintsRes.data?.data || [];
      const cases = casesRes.data?.data || [];
      const notifications = notificationsRes.data?.data || [];

      const recentActivity = [
        ...complaints.slice(0, 3).map((complaint: any) => ({
          id: complaint._id,
          type: 'complaint',
          title: user?.isOC ? 'Pending Complaint' : 'Complaint Assignment',
          description: complaint.title,
          time: formatTimeAgo(complaint.createdAt),
          status: complaint.status
        })),
        ...cases.slice(0, 2).map((caseItem: any) => ({
          id: caseItem._id,
          type: 'case',
          title: 'Case Update',
          description: `Case ${caseItem.caseNumber}`,
          time: formatTimeAgo(caseItem.updatedAt || caseItem.createdAt),
          status: caseItem.status
        })),
        ...notifications.slice(0, 2).map((notification: any) => ({
          id: notification._id,
          type: 'notification',
          title: notification.title,
          description: notification.message,
          time: formatTimeAgo(notification.createdAt)
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

      setStats({
        complaints: complaints.length,
        cases: cases.length,
        notifications: notifications.filter((n: any) => !n.isRead).length,
        recentActivity
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      
      setStats({
        complaints: 0,
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

  const generateMockActivity = () => [
    {
      id: '1',
      type: 'complaint',
      title: 'New Complaint Assigned',
      description: 'Investigate theft case in Dhanmondi',
      time: '1 hour ago',
      status: 'ASSIGNED'
    },
    {
      id: '2',
      type: 'case',
      title: 'Case Update',
      description: 'Hearing scheduled for CASE-2025-001',
      time: '3 hours ago',
      status: 'ONGOING'
    },
    {
      id: '3',
      type: 'notification',
      title: 'Evidence Submission Due',
      description: 'Submit evidence for FIR-2025-002',
      time: '1 day ago'
    },
    {
      id: '4',
      type: 'complaint',
      title: 'FIR Registration',
      description: 'FIR registered for theft complaint',
      time: '2 days ago',
      status: 'FIR_REGISTERED'
    },
    {
      id: '5',
      type: 'case',
      title: 'Case Assignment',
      description: 'New case assigned for investigation',
      time: '3 days ago',
      status: 'PENDING'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <FileText className="h-4 w-4" />;
      case 'case': return <Scale className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': 
      case 'UNDER_INVESTIGATION': 
      case 'ONGOING': return 'bg-blue-100 text-blue-800';
      case 'FIR_REGISTERED': 
      case 'CLOSED': return 'bg-green-100 text-green-800';
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
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Police Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}. Monitor your investigations and case assignments.
            </p>
            {user?.station && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{user.station}</span>
                {user.rank && <span>• {user.rank}</span>}
                {user.isOC && <Badge variant="secondary" className="ml-2">Officer in Charge</Badge>}
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
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.complaints}</p>
                    <p className="text-sm text-muted-foreground">Assigned Complaints</p>
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
                    <p className="text-2xl font-bold">{stats.complaints + stats.cases}</p>
                    <p className="text-sm text-muted-foreground">Total Workload</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OC Management Section */}
          {user?.isOC && (
            <Card className="card-elegant mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Officer in Charge Dashboard
                </CardTitle>
                <CardDescription>
                  Manage your station and assign officers to complaints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-yellow-400">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Pending Assignments</p>
                          <p className="text-2xl font-bold text-yellow-600">-</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-blue-400">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Station Officers</p>
                          <p className="text-2xl font-bold text-blue-600">-</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-green-400">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Assigned Today</p>
                          <p className="text-2xl font-bold text-green-600">-</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

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
                  Your latest assignments and updates
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
                    <Link to={user?.isOC ? "/police/oc/complaints" : "/police/complaints"}>
                      <FileText className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{user?.isOC ? "Pending Complaints" : "View Complaints"}</div>
                        <div className="text-sm opacity-70">{user?.isOC ? "Assign officers to complaints" : "Manage assigned complaints"}</div>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link to="/police/cases">
                      <Scale className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">View Cases</div>
                        <div className="text-sm opacity-70">Monitor active investigations</div>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <Link to="/police/judges">
                      <Users className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">View Judges</div>
                        <div className="text-sm opacity-70">Browse judges directory</div>
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

                  {user?.isOC && (
                    <>
                      <Button asChild variant="outline" className="justify-start h-auto p-4">
                        <Link to="/police/oc/complaints">
                          <FileText className="h-5 w-5 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Pending Complaints</div>
                            <div className="text-sm opacity-70">Assign officers to complaints</div>
                          </div>
                        </Link>
                      </Button>
                      
                      <Button asChild variant="outline" className="justify-start h-auto p-4">
                        <Link to="/police/oc/officers">
                          <Users className="h-5 w-5 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Station Officers</div>
                            <div className="text-sm opacity-70">Manage your station officers</div>
                          </div>
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          {(stats.complaints > 0 || stats.cases > 0) && (
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Status Overview</CardTitle>
                <CardDescription>
                  Summary of your current workload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Complaint Status
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Assigned:</span>
                        <span className="font-medium">{stats.complaints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Investigation:</span>
                        <span className="font-medium text-yellow-600">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FIR Registered:</span>
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
