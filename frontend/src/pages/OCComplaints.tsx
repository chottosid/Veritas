import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  User, 
  MapPin, 
  Calendar,
  Clock,
  Search,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Eye,
  Shield,
  Phone,
  Mail
} from "lucide-react";

interface Complainant {
  _id: string;
  name: string;
  nid: string;
  phone: string;
  email?: string;
}

interface Complaint {
  _id: string;
  title: string;
  description: string;
  area: string;
  status: 'PENDING' | 'UNDER_INVESTIGATION' | 'FIR_REGISTERED' | 'CLOSED';
  complainantId: Complainant;
  attachments: Array<{
    fileName: string;
    ipfsHash: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Officer {
  _id: string;
  name: string;
  rank: string;
  pid: string;
}

export const OCComplaints = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [complaintsRes, officersRes] = await Promise.all([
        api.get('/police/oc/complaints'),
        api.get('/police/oc/officers')
      ]);

      setComplaints(complaintsRes.data.data || []);
      setOfficers(officersRes.data.data || []);
    } catch (err: any) {
      console.error('Error fetching OC data:', err);
      setError('Failed to load data');
      toast({
        title: "Error",
        description: "Failed to load complaints and officers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOfficer = async () => {
    if (!selectedComplaint || !selectedOfficer) {
      toast({
        title: "Error",
        description: "Please select both complaint and officer",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigning(true);

      await api.post(`/police/oc/complaints/${selectedComplaint}/assign`, {
        officerId: selectedOfficer
      });

      toast({
        title: "Success",
        description: "Officer assigned successfully",
      });

      // Refresh complaints list
      fetchData();
      
      // Reset selection
      setSelectedComplaint(null);
      setSelectedOfficer("");
    } catch (err: any) {
      console.error('Error assigning officer:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to assign officer",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'UNDER_INVESTIGATION': return <Eye className="h-4 w-4" />;
      case 'FIR_REGISTERED': return <FileText className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_INVESTIGATION': return 'bg-blue-100 text-blue-800';
      case 'FIR_REGISTERED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.complainantId.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingComplaints = filteredComplaints.filter(c => c.status === 'PENDING');

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
              <h1 className="text-3xl font-bold tracking-tight">OC - Pending Complaints</h1>
              <p className="text-muted-foreground">
                Manage and assign complaints in your station area
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
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Total: {filteredComplaints.length}</span>
              <span className="text-yellow-600">Pending: {pendingComplaints.length}</span>
            </div>
          </div>

          {/* Complaints List */}
          <div className="grid gap-4">
            {filteredComplaints.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Complaints Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "No complaints match your search." : "No complaints in your area at the moment."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredComplaints.map((complaint) => (
                <Card key={complaint._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{complaint.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {complaint.area}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(complaint.status)}>
                          {getStatusIcon(complaint.status)}
                          <span className="ml-1">{complaint.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {complaint.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {complaint.complainantId.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {complaint.complainantId.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(complaint.createdAt)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <Link to={`/police/complaints/${complaint._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        
                        {complaint.status === 'PENDING' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedComplaint(complaint._id)}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Officer
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Assign Investigating Officer</DialogTitle>
                                <DialogDescription>
                                  Select an officer to investigate "{complaint.title}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Select
                                  value={selectedOfficer}
                                  onValueChange={setSelectedOfficer}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an officer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {officers.map((officer) => (
                                      <SelectItem key={officer._id} value={officer._id}>
                                        {officer.name} - {officer.rank} ({officer.pid})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleAssignOfficer}
                                  disabled={assigning || !selectedOfficer}
                                >
                                  {assigning ? "Assigning..." : "Assign Officer"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
