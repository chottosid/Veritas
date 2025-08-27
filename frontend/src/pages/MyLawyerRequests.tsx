import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Building, 
  Scale, 
  Calendar, 
  MessageSquare,
  Send,
  Plus,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface LawyerRequest {
  _id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requestedLawyerId: {
    _id: string;
    name: string;
    firmName: string;
    bid: string;
  };
  caseId: {
    _id: string;
    caseNumber: string;
    firId: {
      firNumber: string;
    };
  };
  message?: string;
  createdAt: string;
  updatedAt?: string;
}

export const MyLawyerRequests = () => {
  const [requests, setRequests] = useState<LawyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [previousRequests, setPreviousRequests] = useState<LawyerRequest[]>([]);

  useEffect(() => {
    fetchLawyerRequests();
    
    // Set up auto-refresh every 30 seconds to check for updates
    const interval = setInterval(() => {
      fetchLawyerRequests(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchLawyerRequests = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }
      
      const response = await api.get('/citizens/lawyer-requests');
      
      if (response.data.success) {
        const newRequests = response.data.data;
        
        // Check for status changes during silent refresh
        if (silent && previousRequests.length > 0) {
          const statusChanges = newRequests.filter((newRequest: LawyerRequest) => {
            const oldRequest = previousRequests.find(req => req._id === newRequest._id);
            return oldRequest && oldRequest.status !== newRequest.status;
          });

          statusChanges.forEach((request: LawyerRequest) => {
            const oldRequest = previousRequests.find(req => req._id === request._id);
            const statusText = request.status === 'ACCEPTED' ? 'accepted' : 'rejected';
            toast({
              title: "Request Status Updated",
              description: `${request.requestedLawyerId.name} has ${statusText} your request for case ${request.caseId.caseNumber}`,
              variant: request.status === 'ACCEPTED' ? 'default' : 'destructive',
            });
          });
        }

        setPreviousRequests(requests); // Store current requests before updating
        setRequests(newRequests);
      } else {
        setError(response.data.message || 'Failed to fetch lawyer requests');
      }
    } catch (err: any) {
      console.error('Error fetching lawyer requests:', err);
      if (!silent) {
        setError(err.response?.data?.message || 'Failed to fetch lawyer requests');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="card-elegant">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={() => fetchLawyerRequests()}>Try Again</Button>
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
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Lawyer Requests</h1>
              <p className="text-muted-foreground">
                Track your requests for legal representation
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => fetchLawyerRequests()}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
              <Link to="/find-lawyer">
                <Plus className="h-4 w-4 mr-2" />
                Request New Lawyer
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{requests.length}</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'PENDING').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'ACCEPTED').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'REJECTED').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        {loading ? (
          <LoadingSkeleton />
        ) : requests.length === 0 ? (
          <Card className="card-elegant">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Lawyer Requests Found</h3>
              <p className="text-muted-foreground mb-4">
                You haven't requested any lawyers yet. Browse available lawyers and request representation for your cases.
              </p>
              <Button asChild variant="outline">
                <Link to="/find-lawyer">Find Lawyers</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request._id} className="card-elegant hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{request.requestedLawyerId.name}</CardTitle>
                        <Badge className={`${getStatusColor(request.status)} border`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status}
                          </div>
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Building className="h-3 w-3" />
                        {request.requestedLawyerId.firmName}
                        <span className="text-xs">
                          • BAR ID: {request.requestedLawyerId.bid}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Case Information */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="h-4 w-4 text-primary" />
                      <p className="font-medium">Case Information</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Case Number:</span>
                        <span className="ml-2 font-medium">{request.caseId.caseNumber}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">FIR Number:</span>
                        <span className="ml-2 font-medium">{request.caseId.firId.firNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status-specific content */}
                  {request.status === 'ACCEPTED' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <p className="font-medium">Request Accepted!</p>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        {request.requestedLawyerId.name} has agreed to represent you in this case.
                      </p>
                    </div>
                  )}

                  {request.status === 'REJECTED' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-800">
                        <XCircle className="h-4 w-4" />
                        <p className="font-medium">Request Declined</p>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        {request.requestedLawyerId.name} is unable to take on this case at this time.
                      </p>
                    </div>
                  )}

                  {request.status === 'PENDING' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Clock className="h-4 w-4" />
                        <p className="font-medium">Awaiting Response</p>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your request is pending review by {request.requestedLawyerId.name}.
                      </p>
                    </div>
                  )}

                  {/* Message */}
                  {request.message && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Your Message</p>
                      </div>
                      <p className="text-sm bg-muted/30 rounded-lg p-3 italic">
                        "{request.message}"
                      </p>
                    </div>
                  )}

                  {/* Request Timeline */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Requested: {formatDate(request.createdAt)}</span>
                      </div>
                      {request.updatedAt && request.updatedAt !== request.createdAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Updated: {formatDate(request.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/cases/${request.caseId._id}`}>
                          <Scale className="h-3 w-3 mr-1" />
                          View Case
                        </Link>
                      </Button>
                      {request.status === 'ACCEPTED' && (
                        <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                          <Link to={`/find-lawyer`}>
                            <Users className="h-3 w-3 mr-1" />
                            Contact Lawyer
                          </Link>
                        </Button>
                      )}
                      {request.status === 'REJECTED' && (
                        <Button asChild size="sm" variant="outline">
                          <Link to="/find-lawyer">
                            <Send className="h-3 w-3 mr-1" />
                            Find Another Lawyer
                          </Link>
                        </Button>
                      )}
                      {request.status === 'PENDING' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => fetchLawyerRequests()}
                          disabled={refreshing}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                          Check Status
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
