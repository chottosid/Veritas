import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  User, 
  Calendar,
  Clock,
  Search,
  AlertCircle,
  CheckCircle,
  Eye,
  Shield,
  Phone,
  Scale,
  Gavel,
  Users,
  Badge as BadgeIcon
} from "lucide-react";

interface Complainant {
  _id: string;
  name: string;
  nid: string;
  phone: string;
}

interface Judge {
  _id: string;
  name: string;
  courtName: string;
}

interface Lawyer {
  _id: string;
  name: string;
  firmName?: string;
}

interface Officer {
  _id: string;
  name: string;
  rank: string;
  station: string;
}

interface FIR {
  _id: string;
  firNumber: string;
  sections: string[];
  complaintId: {
    _id: string;
    title: string;
    description: string;
    complainantId: Complainant;
  };
}

interface Case {
  _id: string;
  caseNumber: string;
  status: 'PENDING' | 'ONGOING' | 'CLOSED';
  hearingDates: string[];
  verdict?: string;
  firId: FIR;
  assignedJudgeId?: Judge;
  accusedLawyerId?: Lawyer;
  prosecutorLawyerId?: Lawyer;
  investigatingOfficerIds: Officer[];
  createdAt: string;
  updatedAt: string;
}

export const OCCases = () => {
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/police/oc/cases');
      setCases(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching OC cases:', err);
      setError('Failed to load cases');
      toast({
        title: "Error",
        description: "Failed to load jurisdiction cases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'ONGOING': return <Scale className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ONGOING': return 'bg-blue-100 text-blue-800';
      case 'CLOSED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNextHearing = (hearingDates: string[]) => {
    const now = new Date();
    const upcoming = hearingDates
      .map(date => new Date(date))
      .filter(date => date > now)
      .sort((a, b) => a.getTime() - b.getTime());
    
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  const filteredCases = cases.filter(case_ =>
    case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.firId.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.firId.complaintId.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.firId.complaintId.complainantId.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const caseStats = {
    total: filteredCases.length,
    pending: filteredCases.filter(c => c.status === 'PENDING').length,
    ongoing: filteredCases.filter(c => c.status === 'ONGOING').length,
    closed: filteredCases.filter(c => c.status === 'CLOSED').length
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4">
              {[...Array(5)].map((_, index) => (
                <Card key={index} className="w-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">OC - Jurisdiction Cases</h1>
              <p className="text-muted-foreground">
                Monitor cases investigated by officers in your station
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Officer in Charge
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search and Stats */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search cases by number, FIR, or complainant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 text-sm">
              <Badge variant="outline" className="bg-gray-50">
                Total: {caseStats.total}
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                Pending: {caseStats.pending}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Ongoing: {caseStats.ongoing}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Closed: {caseStats.closed}
              </Badge>
            </div>
          </div>

          {/* Cases List */}
          <div className="grid gap-4">
            {filteredCases.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "No cases match your search." : "No cases from your jurisdiction at the moment."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCases.map((case_) => {
                const nextHearing = getNextHearing(case_.hearingDates);
                
                return (
                  <Card key={case_._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BadgeIcon className="h-4 w-4" />
                            Case {case_.caseNumber}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            FIR: {case_.firId.firNumber}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(case_.status)}>
                            {getStatusIcon(case_.status)}
                            <span className="ml-1">{case_.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Case Details */}
                        <div>
                          <h4 className="font-medium text-sm mb-2">{case_.firId.complaintId.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {case_.firId.complaintId.description}
                          </p>
                        </div>

                        {/* Complainant & Sections */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {case_.firId.complaintId.complainantId.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {case_.firId.complaintId.complainantId.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Sections: {case_.firId.sections.join(', ')}
                          </div>
                        </div>

                        {/* Case Participants */}
                        <div className="space-y-2">
                          {case_.assignedJudgeId && (
                            <div className="flex items-center gap-2 text-sm">
                              <Gavel className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">Judge:</span>
                              <span>{case_.assignedJudgeId.name}</span>
                              <span className="text-muted-foreground">({case_.assignedJudgeId.courtName})</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Investigating Officers:</span>
                            <span>{case_.investigatingOfficerIds.map(officer => 
                              `${officer.name} (${officer.rank})`
                            ).join(', ')}</span>
                          </div>

                          {(case_.accusedLawyerId || case_.prosecutorLawyerId) && (
                            <div className="flex items-center gap-2 text-sm">
                              <Scale className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Lawyers:</span>
                              <div className="flex gap-4">
                                {case_.prosecutorLawyerId && (
                                  <span>Prosecutor: {case_.prosecutorLawyerId.name}</span>
                                )}
                                {case_.accusedLawyerId && (
                                  <span>Defense: {case_.accusedLawyerId.name}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Hearing & Verdict Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created: {formatDate(case_.createdAt)}
                          </div>
                          {nextHearing && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Clock className="h-4 w-4" />
                              Next Hearing: {formatDate(nextHearing.toISOString())}
                            </div>
                          )}
                        </div>

                        {case_.verdict && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                              <CheckCircle className="h-4 w-4" />
                              Verdict
                            </div>
                            <p className="text-sm text-green-700 mt-1">{case_.verdict}</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <Link to={`/police/cases/${case_._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                          
                          <div className="text-xs text-muted-foreground">
                            Last updated: {formatDate(case_.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
