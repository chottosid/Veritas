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
  FileText, 
  User, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  FileBarChart,
  Scale
} from "lucide-react";
import { Link } from "react-router-dom";

interface Complainant {
  _id: string;
  name: string;
  nid: string;
  phone: string;
}

interface Officer {
  _id: string;
  name: string;
  rank: string;
  station: string;
}

interface Complaint {
  _id: string;
  title: string;
  description: string;
  area: string;
  status: 'PENDING' | 'UNDER_INVESTIGATION' | 'FIR_REGISTERED' | 'CLOSED';
  complainantId: Complainant;
  assignedOfficerIds: Officer[];
  attachments: Array<{
    fileName: string;
    ipfsHash: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const PoliceComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/police/complaints');
      
      if (response.data.success) {
        setComplaints(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch complaints');
      }
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      setError(err.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'UNDER_INVESTIGATION': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FIR_REGISTERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'UNDER_INVESTIGATION': return <FileBarChart className="h-4 w-4" />;
      case 'FIR_REGISTERED': return <CheckCircle className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.complainantId.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    const pending = complaints.filter(c => c.status === 'PENDING').length;
    const investigating = complaints.filter(c => c.status === 'UNDER_INVESTIGATION').length;
    const firRegistered = complaints.filter(c => c.status === 'FIR_REGISTERED').length;
    const closed = complaints.filter(c => c.status === 'CLOSED').length;

    return { pending, investigating, firRegistered, closed, total: complaints.length };
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
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
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
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Assigned Complaints</h1>
                <p className="text-muted-foreground">
                  Manage and investigate assigned complaints
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
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
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
                    <FileBarChart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.investigating}</p>
                    <p className="text-sm text-muted-foreground">Investigating</p>
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
                    <p className="text-2xl font-bold">{stats.firRegistered}</p>
                    <p className="text-sm text-muted-foreground">FIR Registered</p>
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
                placeholder="Search complaints by title, description, or complainant..."
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
                <option value="UNDER_INVESTIGATION">Under Investigation</option>
                <option value="FIR_REGISTERED">FIR Registered</option>
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

          {/* Complaints List */}
          {loading ? (
            <LoadingSkeleton />
          ) : filteredComplaints.length === 0 ? (
            <Card className="card-elegant">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Complaints Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No complaints match your current filters."
                    : "You don't have any assigned complaints yet."
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
              {filteredComplaints.map((complaint) => (
                <Card key={complaint._id} className="card-elegant hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold">{complaint.title}</h3>
                            <Badge className={`flex items-center gap-1 ${getStatusColor(complaint.status)}`}>
                              {getStatusIcon(complaint.status)}
                              {formatStatus(complaint.status)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">
                            {complaint.description}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{complaint.complainantId.name}</span>
                            <p className="text-xs text-muted-foreground">{complaint.complainantId.nid}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{complaint.area}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(complaint.createdAt)}</span>
                        </div>
                      </div>

                      {/* Assigned Officers */}
                      {complaint.assignedOfficerIds.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Assigned Officers:</p>
                          <div className="flex flex-wrap gap-2">
                            {complaint.assignedOfficerIds.map((officer) => (
                              <Badge key={officer._id} variant="secondary" className="text-xs">
                                {officer.name} ({officer.rank})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attachments */}
                      {complaint.attachments.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {complaint.attachments.map((attachment, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {attachment.fileName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Contact: {complaint.complainantId.phone}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/police/complaints/${complaint._id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                          
                          {complaint.status === 'UNDER_INVESTIGATION' && (
                            <Button size="sm" asChild>
                              <Link to={`/police/complaints/${complaint._id}?action=register-fir`}>
                                <Scale className="h-4 w-4 mr-2" />
                                Register FIR
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
