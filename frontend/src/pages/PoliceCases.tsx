import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { 
  Scale, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  User,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";

interface Judge {
  _id: string;
  name: string;
  courtName: string;
}

interface FIR {
  _id: string;
  firNumber: string;
  sections: string[];
}

interface Case {
  _id: string;
  caseNumber: string;
  status: 'PENDING' | 'ONGOING' | 'CLOSED';
  firId: FIR;
  assignedJudgeId: Judge;
  hearingDates: string[];
  createdAt: string;
  updatedAt: string;
}

export const PoliceCases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/police/cases');
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ONGOING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'ONGOING': return <Scale className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextHearing = (hearingDates: string[]) => {
    if (!hearingDates || hearingDates.length === 0) return null;
    
    const upcoming = hearingDates
      .map(date => new Date(date))
      .filter(date => date > new Date())
      .sort((a, b) => a.getTime() - b.getTime());
    
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.firId?.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.assignedJudgeId?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    const pending = cases.filter(c => c.status === 'PENDING').length;
    const ongoing = cases.filter(c => c.status === 'ONGOING').length;
    const closed = cases.filter(c => c.status === 'CLOSED').length;
    
    const upcomingHearings = cases.filter(c => {
      const nextHearing = getNextHearing(c.hearingDates);
      return nextHearing && nextHearing <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
    }).length;

    return { pending, ongoing, closed, upcomingHearings, total: cases.length };
  };

  const stats = getStats();

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <Card key={index} className="card-elegant">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Assigned Cases</h1>
                <p className="text-muted-foreground">
                  Monitor and manage cases under investigation
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Scale className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
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
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Scale className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.ongoing}</p>
                    <p className="text-sm text-muted-foreground">Ongoing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.upcomingHearings}</p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <CheckCircle className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.closed}</p>
                    <p className="text-sm text-muted-foreground">Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases by case number, FIR, or judge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ONGOING">Ongoing</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Cases List */}
          {loading ? (
            <LoadingSkeleton />
          ) : filteredCases.length === 0 ? (
            <Card className="card-elegant">
              <CardContent className="p-8 text-center">
                <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No cases match your current filters."
                    : "You don't have any assigned cases yet."
                  }
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((caseItem) => {
                const nextHearing = getNextHearing(caseItem.hearingDates);
                return (
                  <Card key={caseItem._id} className="card-elegant hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-semibold">{caseItem.caseNumber}</h3>
                              <Badge className={`flex items-center gap-1 ${getStatusColor(caseItem.status)}`}>
                                {getStatusIcon(caseItem.status)}
                                {caseItem.status}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              FIR: {caseItem.firId?.firNumber}
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{caseItem.assignedJudgeId?.name}</span>
                              <p className="text-xs text-muted-foreground">Assigned Judge</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span>{caseItem.assignedJudgeId?.courtName}</span>
                              <p className="text-xs text-muted-foreground">Court</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span>{formatDate(caseItem.createdAt)}</span>
                              <p className="text-xs text-muted-foreground">Case Created</p>
                            </div>
                          </div>
                        </div>

                        {/* FIR Sections */}
                        {caseItem.firId?.sections && caseItem.firId.sections.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Legal Sections:</p>
                            <div className="flex flex-wrap gap-2">
                              {caseItem.firId.sections.map((section, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {section}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Next Hearing */}
                        {nextHearing && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-orange-800">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">Next Hearing:</span>
                              <span>{formatDate(nextHearing.toISOString())}</span>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Total Hearings: {caseItem.hearingDates?.length || 0}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/police/cases/${caseItem._id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </Button>
                            
                            <Button size="sm" asChild>
                              <Link to={`/police/cases/${caseItem._id}/evidence`}>
                                Submit Evidence
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
