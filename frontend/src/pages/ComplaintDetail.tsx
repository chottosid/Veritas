import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Calendar,
  User,
  Badge as BadgeIcon,
  MapPin,
  Phone,
  Mail,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import api, { isAuthenticated } from '@/lib/api';

interface Attachment {
  fileName: string;
  ipfsHash: string;
  uploadedAt: string;
}

interface AssignedOfficer {
  id: string;
  name: string;
  rank: string;
  station?: string;
}

interface Complainant {
  name: string;
  nid: string;
  phone: string;
}

interface ComplaintDetail {
  id: string;
  title: string;
  description: string;
  area: string;
  status: 'PENDING' | 'UNDER_INVESTIGATION' | 'FIR_REGISTERED' | 'CASE_FILED' | 'CLOSED';
  complainantId: Complainant;
  assignedOfficerIds: AssignedOfficer[];
  attachments: Attachment[];
  createdAt: string;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Complaint is awaiting assignment to an investigating officer'
  },
  UNDER_INVESTIGATION: {
    label: 'Under Investigation',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: AlertCircle,
    description: 'Complaint is being actively investigated by assigned officer'
  },
  FIR_REGISTERED: {
    label: 'FIR Registered',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: FileText,
    description: 'First Information Report has been filed with the court'
  },
  CASE_FILED: {
    label: 'Case Filed',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: BadgeIcon,
    description: 'Case has been filed in court and assigned to a judge'
  },
  CLOSED: {
    label: 'Closed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Complaint has been resolved and closed'
  }
};

export const ComplaintDetail = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication before making API calls
    if (!isAuthenticated() || !user || !token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view complaint details",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Only allow citizens to access this page
    if (user.role !== 'CITIZEN') {
      toast({
        title: "Access Denied",
        description: "This page is only accessible to citizens",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    if (complaintId) {
      fetchComplaintDetail();
    }
  }, [complaintId, user, token, navigate]);

  const fetchComplaintDetail = async () => {
    try {
      setIsLoading(true);
      
      // Double-check authentication before API call
      if (!isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      console.log('Fetching complaint detail with token:', token ? 'Present' : 'Missing');
      console.log('Complaint ID:', complaintId);
      
      const response = await api.get(`/citizens/complaints/${complaintId}`);
      
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        setComplaint(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch complaint details');
      }
    } catch (error: any) {
      console.error('Error fetching complaint details:', error);
      
      if (error.response?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to access complaint details",
          variant: "destructive",
        });
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this complaint",
          variant: "destructive",
        });
        navigate('/complaints');
      } else if (error.response?.status === 404) {
        toast({
          title: "Complaint Not Found",
          description: "The complaint you're looking for doesn't exist",
          variant: "destructive",
        });
        navigate('/complaints');
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message || "Failed to fetch complaint details",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadAttachment = (attachment: Attachment) => {
    // Implement IPFS download logic here
    toast({
      title: "Download",
      description: `Downloading ${attachment.fileName}...`,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!complaint) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Complaint not found
              </h3>
              <p className="text-gray-500 mb-6">
                The complaint you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button asChild>
                <Link to="/complaints">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Complaints
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const statusInfo = statusConfig[complaint.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button and Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" asChild>
              <Link to="/complaints">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Complaints
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchComplaintDetail}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{complaint.title}</h1>
              <p className="text-slate-600">
                Complaint ID: {complaint.id}
              </p>
              {user && (
                <p className="text-sm text-slate-500 mt-1">
                  Viewing as: {user.name} ({user.nid})
                </p>
              )}
            </div>
            <Badge className={`${statusInfo.color} border font-medium px-4 py-2 text-lg w-fit`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon className="h-5 w-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">{statusInfo.description}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span>Filed on {formatDate(complaint.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Complaint Details */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Complaint Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Description</h4>
                  <p className="text-slate-600 leading-relaxed">{complaint.description}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Area/Station</p>
                      <p className="text-sm text-slate-600">{complaint.area}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Filed Date</p>
                      <p className="text-sm text-slate-600">{formatDate(complaint.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            {complaint.attachments.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Evidence & Attachments</CardTitle>
                  <CardDescription>
                    {complaint.attachments.length} file(s) attached to this complaint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {complaint.attachments.map((attachment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-700 truncate">{attachment.fileName}</p>
                            <p className="text-sm text-slate-500">
                              Uploaded: {formatDate(attachment.uploadedAt)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAttachment(attachment)}
                            className="ml-2"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Complainant Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Complainant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-slate-700">{complaint.complainantId.name}</p>
                  <p className="text-sm text-slate-500">National ID: {complaint.complainantId.nid}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-4 w-4" />
                  <span>{complaint.complainantId.phone}</span>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Officers */}
            {complaint.assignedOfficerIds.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Investigating Officer(s)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {complaint.assignedOfficerIds.map((officer, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-medium text-slate-700">{officer.name}</p>
                      <p className="text-sm text-slate-600">{officer.rank}</p>
                      {officer.station && (
                        <p className="text-sm text-slate-500">{officer.station}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Officer
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
