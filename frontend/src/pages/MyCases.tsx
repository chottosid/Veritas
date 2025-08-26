import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Scale, Calendar, FileText, Eye, Plus, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

interface Case {
  _id: string;
  caseNumber: string;
  status: string;
  firId: {
    firNumber: string;
    sections?: string[];
  };
  assignedJudgeId?: {
    name: string;
    courtName: string;
  };
  accusedLawyerId?: {
    name: string;
    firmName: string;
  };
  prosecutorLawyerId?: {
    name: string;
    firmName: string;
  };
  investigatingOfficerIds?: Array<{
    name: string;
    rank: string;
    station: string;
  }>;
  hearingDates?: string[];
  createdAt: string;
}

export const MyCases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/citizens/cases');
      
      if (response.data.success) {
        setCases(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch cases');
      }
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      setError(err.response?.data?.message || 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ONGOING':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DISMISSED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ONGOING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLOSED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DISMISSED':
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
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextHearingDate = (hearingDates: string[] = []) => {
    if (!hearingDates.length) return null;
    
    const now = new Date();
    const futureDates = hearingDates
      .map(date => new Date(date))
      .filter(date => date > now)
      .sort((a, b) => a.getTime() - b.getTime());
    
    return futureDates.length > 0 ? futureDates[0] : null;
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
            <Skeleton className="h-10 w-24" />
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
            <Button onClick={fetchCases}>Try Again</Button>
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
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Cases</h1>
              <p className="text-muted-foreground">
                Track the progress of your legal cases
              </p>
            </div>
          </div>
          <Button asChild className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white">
            <Link to="/file-complaint">
              <Plus className="h-4 w-4 mr-2" />
              File New Complaint
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cases.length}</p>
                  <p className="text-sm text-muted-foreground">Total Cases</p>
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
                    {cases.filter(c => c.status.toUpperCase() === 'PENDING').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {cases.filter(c => c.status.toUpperCase() === 'ONGOING').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Ongoing</p>
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
                    {cases.filter(c => c.status.toUpperCase() === 'CLOSED').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cases List */}
        {loading ? (
          <LoadingSkeleton />
        ) : cases.length === 0 ? (
          <Card className="card-elegant">
            <CardContent className="p-8 text-center">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any cases yet. Cases are created when your complaints are converted to FIRs and then to legal cases.
              </p>
              <Button asChild variant="outline">
                <Link to="/file-complaint">File Your First Complaint</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cases.map((caseItem) => {
              const nextHearing = getNextHearingDate(caseItem.hearingDates);
              
              return (
                <Card key={caseItem._id} className="card-elegant hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{caseItem.caseNumber}</CardTitle>
                          <Badge className={`${getStatusColor(caseItem.status)} border`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(caseItem.status)}
                              {caseItem.status.replace('_', ' ')}
                            </div>
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          FIR: {caseItem.firId.firNumber}
                          {caseItem.firId.sections && caseItem.firId.sections.length > 0 && (
                            <span className="text-xs">
                              • Sections: {caseItem.firId.sections.join(', ')}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Case Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Judge Information */}
                      {caseItem.assignedJudgeId && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Assigned Judge</p>
                          <p className="text-sm">{caseItem.assignedJudgeId.name}</p>
                          <p className="text-xs text-muted-foreground">{caseItem.assignedJudgeId.courtName}</p>
                        </div>
                      )}

                      {/* Next Hearing */}
                      {nextHearing && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Next Hearing</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-primary" />
                            <p className="text-sm font-medium text-primary">
                              {formatDateTime(nextHearing.toISOString())}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Lawyers */}
                      {(caseItem.accusedLawyerId || caseItem.prosecutorLawyerId) && (
                        <div className="space-y-2 md:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Legal Representation</p>
                          <div className="flex flex-wrap gap-2">
                            {caseItem.accusedLawyerId && (
                              <Badge variant="outline" className="text-xs">
                                Defense: {caseItem.accusedLawyerId.name} ({caseItem.accusedLawyerId.firmName})
                              </Badge>
                            )}
                            {caseItem.prosecutorLawyerId && (
                              <Badge variant="outline" className="text-xs">
                                Prosecution: {caseItem.prosecutorLawyerId.name} ({caseItem.prosecutorLawyerId.firmName})
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Investigating Officers */}
                      {caseItem.investigatingOfficerIds && caseItem.investigatingOfficerIds.length > 0 && (
                        <div className="space-y-2 md:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Investigating Officers</p>
                          <div className="flex flex-wrap gap-2">
                            {caseItem.investigatingOfficerIds.map((officer, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {officer.rank} {officer.name} - {officer.station}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Case Date */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Case created: {formatDate(caseItem.createdAt)}
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link 
                          to={`/cases/${caseItem._id}`}
                          state={{ caseData: caseItem }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};
