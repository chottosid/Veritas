import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import api from '@/lib/api';

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

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    complaints: 0,
    cases: 0,
    notifications: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const endpoints = {
          CITIZEN: ['/citizens/complaints', '/citizens/cases', '/citizens/notifications?limit=5'],
          POLICE: ['/police/complaints', '/police/cases', '/police/notifications?limit=5'],
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
  }, [user]);

  const generateMockActivity = (role: string) => {
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

  const getDashboardCards = () => {
    const baseCards = [
      {
        title: 'Notifications',
        value: stats.notifications,
        description: 'Unread updates',
        icon: Bell,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
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
            color: 'text-primary',
            bgColor: 'bg-primary/10',
            link: '/complaints'
          },
          {
            title: 'My Cases',
            value: stats.cases,
            description: 'Active cases',
            icon: Scale,
            color: 'text-secondary',
            bgColor: 'bg-secondary/10',
            link: '/cases'
          },
          ...baseCards
        ];
      case 'POLICE':
        return [
          {
            title: 'Assigned Complaints',
            value: stats.complaints,
            description: 'Under investigation',
            icon: FileText,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
            link: '/complaints'
          },
          {
            title: 'Active Cases',
            value: stats.cases,
            description: 'Case proceedings',
            icon: Scale,
            color: 'text-secondary',
            bgColor: 'bg-secondary/10',
            link: '/cases'
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
            color: 'text-primary',
            bgColor: 'bg-primary/10',
            link: '/firs'
          },
          {
            title: 'My Cases',
            value: stats.cases,
            description: 'Assigned cases',
            icon: Scale,
            color: 'text-secondary',
            bgColor: 'bg-secondary/10',
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
            color: 'text-primary',
            bgColor: 'bg-primary/10',
            link: '/requests'
          },
          {
            title: 'My Cases',
            value: stats.cases,
            description: 'Representing clients',
            icon: Scale,
            color: 'text-secondary',
            bgColor: 'bg-secondary/10',
            link: '/cases'
          },
          ...baseCards
        ];
      default:
        return baseCards;
    }
  };

  const getQuickActions = () => {
    switch (user?.role) {
      case 'CITIZEN':
        return [
          { title: 'File New Complaint', description: 'Report an incident', link: '/complaints/new', icon: Plus, variant: 'btn-hero' },
          { title: 'Find Lawyer', description: 'Get legal representation', link: '/lawyers', icon: Users, variant: 'btn-justice' },
          { title: 'Track Case', description: 'View case progress', link: '/cases', icon: Eye, variant: 'btn-justice' }
        ];
      case 'POLICE':
        return [
          { title: 'View Complaints', description: 'Review assigned cases', link: '/complaints', icon: FileText, variant: 'btn-hero' },
          { title: 'Submit Evidence', description: 'Upload case evidence', link: '/evidence/new', icon: Plus, variant: 'btn-justice' },
          { title: 'File FIR', description: 'Register FIR', link: '/firs/new', icon: Scale, variant: 'btn-justice' }
        ];
      case 'JUDGE':
        return [
          { title: 'Review FIRs', description: 'Process new FIRs', link: '/firs', icon: FileText, variant: 'btn-hero' },
          { title: 'Schedule Hearing', description: 'Set court dates', link: '/hearings/new', icon: Clock, variant: 'btn-justice' },
          { title: 'Manage Cases', description: 'View assigned cases', link: '/cases', icon: Scale, variant: 'btn-justice' }
        ];
      case 'LAWYER':
        return [
          { title: 'View Requests', description: 'Check client requests', link: '/requests', icon: Users, variant: 'btn-hero' },
          { title: 'Submit Documents', description: 'File case documents', link: '/documents/new', icon: Plus, variant: 'btn-justice' },
          { title: 'My Cases', description: 'Manage client cases', link: '/cases', icon: Scale, variant: 'btn-justice' }
        ];
      default:
        return [];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'ongoing':
      case 'assigned':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'completed':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
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
          <p className="text-lg text-muted-foreground">
            {user?.role === 'CITIZEN' && 'Manage your complaints and track case progress'}
            {user?.role === 'POLICE' && 'Review assigned cases and manage investigations'}
            {user?.role === 'JUDGE' && 'Process FIRs and manage court proceedings'}
            {user?.role === 'LAWYER' && 'Represent clients and manage case documents'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {getDashboardCards().map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="card-elegant hover:shadow-elegant transition-all duration-300 group cursor-pointer">
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
                    <p className="text-xs text-muted-foreground">
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
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
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
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
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
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-secondary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
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

        {/* Progress Overview (for demonstration) */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Platform performance and your engagement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Case Resolution Rate</span>
                  <span className="text-sm text-muted-foreground">87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <span className="text-sm text-muted-foreground">2.3 days</span>
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