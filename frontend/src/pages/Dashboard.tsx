import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  FileText, 
  Scale, 
  Users, 
  Clock, 
  Bell, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Eye,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  status?: string;
}

interface DashboardStats {
  complaints: number;
  cases: number;
  notifications: number;
  recentActivity: ActivityItem[];
}

interface DashboardCard {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  link: string;
}

interface QuickAction {
  title: string;
  description: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: string;
}

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  // Redirect police users to their specific dashboard
  if (user?.role === 'POLICE') {
    return <Navigate to="/police/dashboard" replace />;
  }
  
  // Redirect judge users to their specific dashboard
  if (user?.role === 'JUDGE') {
    return <Navigate to="/judge/dashboard" replace />;
  }
  
  // Redirect lawyer users to their specific dashboard
  if (user?.role === 'LAWYER') {
    return <Navigate to="/lawyer/dashboard" replace />;
  }
  
  const [stats, setStats] = useState<DashboardStats>({
    complaints: 0,
    cases: 0,
    notifications: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const generateMockActivity = (role: string): ActivityItem[] => {
    const activities = {
      CITIZEN: [
        { id: '1', type: 'complaint', title: 'Complaint Filed', description: 'Theft report submitted successfully', time: '2 hours ago', status: 'PENDING' },
        { id: '2', type: 'case', title: 'Case Update', description: 'Your case has been assigned to a judge', time: '1 day ago', status: 'ONGOING' },
        { id: '3', type: 'notification', title: 'Hearing Scheduled', description: 'Court hearing on March 15, 2025', time: '2 days ago' }
      ],
      POLICE: [
        { id: '1', type: 'complaint', title: 'New Complaint Assigned', description: 'Investigate theft case in Dhanmondi', time: '1 hour ago', status: 'ASSIGNED' },
        { id: '2', type: 'fir', title: 'FIR Registered', description: 'FIR-2025-001 submitted to court', time: '3 hours ago', status: 'SUBMITTED' },
        { id: '3', type: 'evidence', title: 'Evidence Submitted', description: 'CCTV footage uploaded for case', time: '1 day ago' }
      ],
      JUDGE: [
        { id: '1', type: 'fir', title: 'New FIR Received', description: 'FIR-2025-002 requires review', time: '30 minutes ago', status: 'PENDING' },
        { id: '2', type: 'hearing', title: 'Hearing Scheduled', description: 'Case hearing set for tomorrow', time: '2 hours ago', status: 'SCHEDULED' },
        { id: '3', type: 'case', title: 'Case Closed', description: 'Verdict delivered for case 2025-001', time: '1 day ago', status: 'CLOSED' }
      ],
      LAWYER: [
        { id: '1', type: 'request', title: 'New Client Request', description: 'Citizen requested representation', time: '45 minutes ago', status: 'PENDING' },
        { id: '2', type: 'case', title: 'Case Documents Filed', description: 'Evidence submitted for client', time: '4 hours ago', status: 'FILED' },
        { id: '3', type: 'hearing', title: 'Hearing Reminder', description: 'Client hearing tomorrow at 10 AM', time: '1 day ago' }
      ]
    };
    return activities[role as keyof typeof activities] || activities.CITIZEN;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const endpoints = {
          CITIZEN: ['/citizens/complaints', '/citizens/cases', '/citizens/notifications?limit=5'],
          POLICE: [user?.isOC ? '/police/oc/complaints' : '/police/complaints', '/police/cases', '/police/notifications?limit=5'],
          JUDGE: ['/judges/firs', '/judges/cases', '/judges/notifications?limit=5'],
          LAWYER: ['/lawyers/requests', '/lawyers/cases', '/lawyers/notifications?limit=5']
        };

        if (user?.role && endpoints[user.role as keyof typeof endpoints]) {
          const roleEndpoints = endpoints[user.role as keyof typeof endpoints];
          const responses = await Promise.all(
            roleEndpoints.map(endpoint => api.get(endpoint).catch(() => ({ data: { data: [] } })))
          );

          const [complaintsRes, casesRes, notificationsRes] = responses;

          setStats({
            complaints: complaintsRes.data?.data?.length || 0,
            cases: casesRes.data?.data?.length || 0,
            notifications: notificationsRes.data?.data?.length || 0,
            recentActivity: generateMockActivity(user.role)
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Using demo data.",
          variant: "destructive"
        });
        
        // Use mock data for demo
        setStats({
          complaints: Math.floor(Math.random() * 10) + 1,
          cases: Math.floor(Math.random() * 5) + 1,
          notifications: Math.floor(Math.random() * 8) + 1,
          recentActivity: generateMockActivity(user?.role || 'CITIZEN')
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);

  const getDashboardCards = (): DashboardCard[] => {
    const baseCards: DashboardCard[] = [
      {
        title: 'Notifications',
        value: stats.notifications,
        description: 'Unread updates',
        icon: Bell,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        link: '/notifications'
      }
    ];

    switch (user?.role) {
      case 'CITIZEN':
        return [
          {
            title: 'My Complaints',
            value: stats.complaints,
            description: 'Filed complaints',
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            link: '/complaints'
          },
          {
            title: 'My Cases',
            value: stats.cases,
            description: 'Active cases',
            icon: Scale,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            link: '/cases'
          },
          ...baseCards
        ];
      case 'POLICE':
        return [
                      {
              title: user?.isOC ? 'Pending Complaints' : 'Assigned Complaints',
              value: stats.complaints,
              description: user?.isOC ? 'Awaiting assignment' : 'Under investigation',
              icon: FileText,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100',
              link: user?.isOC ? '/police/oc/complaints' : '/police/complaints'
            },
          {
            title: 'Active Cases',
            value: stats.cases,
            description: 'Case proceedings',
            icon: Scale,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            link: '/police/cases'
          },
          ...baseCards
        ];
      case 'JUDGE':
        return [
          {
            title: 'Pending FIRs',
            value: stats.complaints,
            description: 'Awaiting review',
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            link: '/firs'
          },
          {
            title: 'My Cases',
            value: stats.cases,
            description: 'Assigned cases',
            icon: Scale,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            link: '/cases'
          },
          ...baseCards
        ];
      case 'LAWYER':
        return [
          {
            title: 'Client Requests',
            value: stats.complaints,
            description: 'Pending requests',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            link: '/requests'
          },
          {
            title: 'My Cases',
            value: stats.cases,
            description: 'Representing clients',
            icon: Scale,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            link: '/cases'
          },
          ...baseCards
        ];
      default:
        return baseCards;
    }
  };

  const getQuickActions = (): QuickAction[] => {
    switch (user?.role) {
      case 'CITIZEN':
        return [
          { title: 'File New Complaint', description: 'Report an incident', link: '/file-complaint', icon: Plus, variant: 'primary' },
          { title: 'Find Lawyer', description: 'Get legal representation', link: '/lawyers', icon: Users, variant: 'secondary' },
          { title: 'Track Case', description: 'View case progress', link: '/cases', icon: Eye, variant: 'secondary' }
        ];
      case 'POLICE':
        return [
          { title: user?.isOC ? 'Review Pending Complaints' : 'View Complaints', description: user?.isOC ? 'Assign officers to cases' : 'Review assigned cases', link: user?.isOC ? '/police/oc/complaints' : '/police/complaints', icon: FileText, variant: 'primary' },
          { title: 'Submit Evidence', description: 'Upload case evidence', link: '/police/cases', icon: Plus, variant: 'secondary' },
          { title: 'View Cases', description: 'Monitor active investigations', link: '/police/cases', icon: Scale, variant: 'secondary' }
        ];
      case 'JUDGE':
        return [
          { title: 'Review FIRs', description: 'Process new FIRs', link: '/firs', icon: FileText, variant: 'primary' },
          { title: 'Schedule Hearing', description: 'Set court dates', link: '/hearings/new', icon: Clock, variant: 'secondary' },
          { title: 'Manage Cases', description: 'View assigned cases', link: '/cases', icon: Scale, variant: 'secondary' }
        ];
      case 'LAWYER':
        return [
          { title: 'View Requests', description: 'Check client requests', link: '/requests', icon: Users, variant: 'primary' },
          { title: 'Submit Documents', description: 'File case documents', link: '/documents/new', icon: Plus, variant: 'secondary' },
          { title: 'My Cases', description: 'Manage client cases', link: '/cases', icon: Scale, variant: 'secondary' }
        ];
      default:
        return [];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'ongoing':
      case 'assigned':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'completed':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleDescription = (role: string | undefined) => {
    switch (role) {
      case 'CITIZEN':
        return 'Manage your complaints and track case progress';
      case 'POLICE':
        return 'Handle complaints and manage investigations';
      case 'JUDGE':
        return 'Process FIRs and manage court proceedings';
      case 'LAWYER':
        return 'Represent clients and manage case documents';
      default:
        return 'Welcome to the justice system dashboard';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 px-4 space-y-8">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold">
            Welcome back, {user?.name}
          </h1>
          <p className="text-lg text-gray-600">
            {getRoleDescription(user?.role)}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {getDashboardCards().map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <Link to={card.link}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.bgColor} group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-gray-600">
                      {card.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks for your role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getQuickActions().map((action, index) => {
                const Icon = action.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={action.link}>Go</Link>
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(activity.status || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        {activity.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <Button variant="ghost" className="w-full text-sm" asChild>
                  <Link to="/notifications">
                    View All Activity
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Platform performance and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Case Resolution Rate</span>
                  <span className="text-sm text-gray-600">87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <span className="text-sm text-gray-600">2.3 days</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};