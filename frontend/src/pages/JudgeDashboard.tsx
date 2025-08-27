import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { API_CONFIG } from '@/config/api';
import { 
  Gavel, 
  FileText, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Scale,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  pendingFirs: number;
  activeCases: number;
  hearingsScheduled: number;
  closedCases: number;
}

interface FIR {
  _id: string;
  firNumber: string;
  sections: string[];
  complaintId: {
    title: string;
    description: string;
    area: string;
    complainantId: {
      name: string;
      nid: string;
    };
  };
  registeredBy: {
    name: string;
    pid: string;
    rank: string;
    station: string;
  };
  createdAt: string;
}

interface Case {
  _id: string;
  caseNumber: string;
  status: 'PENDING' | 'ONGOING' | 'CLOSED';
  firId: {
    firNumber: string;
  };
  hearingDates: string[];
  createdAt: string;
}

export const JudgeDashboard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    pendingFirs: 0,
    activeCases: 0,
    hearingsScheduled: 0,
    closedCases: 0
  });
  const [recentFirs, setRecentFirs] = useState<FIR[]>([]);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch FIRs and Cases in parallel
      const [firsResponse, casesResponse] = await Promise.all([
        api.get(API_CONFIG.ENDPOINTS.JUDGES_FIRS),
        api.get(API_CONFIG.ENDPOINTS.JUDGES_CASES)
      ]);

      if (firsResponse.data.success) {
        const firs = firsResponse.data.data || [];
        setRecentFirs(firs.slice(0, 5)); // Show latest 5 FIRs
        
        // Update FIR stats
        setStats(prev => ({
          ...prev,
          pendingFirs: firs.length
        }));
      }

      if (casesResponse.data.success) {
        const cases = casesResponse.data.data || [];
        setRecentCases(cases.slice(0, 5)); // Show latest 5 cases
        
        // Calculate case statistics
        const activeCases = cases.filter((c: Case) => c.status === 'ONGOING').length;
        const closedCases = cases.filter((c: Case) => c.status === 'CLOSED').length;
        const hearingsScheduled = cases.filter((c: Case) => 
          c.hearingDates && c.hearingDates.length > 0
        ).length;

        setStats(prev => ({
          ...prev,
          activeCases,
          closedCases,
          hearingsScheduled
        }));
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'ONGOING':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Ongoing</Badge>;
      case 'CLOSED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error && !isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gavel className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Judge Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name} - {user?.courtName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Scale className="h-4 w-4" />
            <span>Court ID: {user?.jid}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending FIRs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : stats.pendingFirs}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : stats.activeCases}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently ongoing
              </p>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Hearings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : stats.hearingsScheduled}
              </div>
              <p className="text-xs text-muted-foreground">
                With hearing dates
              </p>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Cases</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : stats.closedCases}
              </div>
              <p className="text-xs text-muted-foreground">
                Total completed
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent FIRs */}
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent FIRs
                  </CardTitle>
                  <CardDescription>
                    Latest FIRs submitted for review
                  </CardDescription>
                </div>
                <Link to="/judge/firs">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : recentFirs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No FIRs Found</h3>
                  <p className="text-muted-foreground">No FIRs have been submitted for review yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentFirs.map((fir) => (
                    <div key={fir._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{fir.firNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            {fir.complaintId.title}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {fir.sections.join(', ')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          By {fir.registeredBy.name} ({fir.registeredBy.rank})
                        </span>
                        <span>{formatDate(fir.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Cases */}
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Recent Cases
                  </CardTitle>
                  <CardDescription>
                    Latest cases under your jurisdiction
                  </CardDescription>
                </div>
                <Link to="/judge/cases">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : recentCases.length === 0 ? (
                <div className="text-center py-8">
                  <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Cases Found</h3>
                  <p className="text-muted-foreground">No cases have been assigned yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCases.map((case_) => (
                    <div key={case_._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{case_.caseNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            FIR: {case_.firId.firNumber}
                          </p>
                        </div>
                        {getStatusBadge(case_.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {case_.hearingDates.length > 0 && (
                            <>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Next hearing: {formatDate(case_.hearingDates[0])}
                            </>
                          )}
                        </span>
                        <span>{formatDate(case_.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="card-elegant mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/judge/firs">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Review FIRs</span>
                </Button>
              </Link>
              <Link to="/judge/cases">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Scale className="h-5 w-5" />
                  <span>Manage Cases</span>
                </Button>
              </Link>
              <Link to="/notifications">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Users className="h-5 w-5" />
                  <span>Notifications</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
