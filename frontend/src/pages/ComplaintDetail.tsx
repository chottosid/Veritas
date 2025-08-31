import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Badge as BadgeIcon,
  Download,
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
  Phone,
  Mail,
  Shield,
  Building,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { getIPFSUrl } from '@/config/api';

interface Attachment {
  fileName: string;
  ipfsHash: string;
  fileSize: number;
  uploadedAt?: string;
}

interface AssignedOfficer {
  _id: string;
  name: string;
  rank: string;
  station: string;
}

interface Complainant {
  _id: string;
  name: string;
  nid: string;
  phone?: string;
  email?: string;
}

interface AccusedPerson {
  _id?: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  nid?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  occupation?: string;
  relationshipToComplainant?: string;
  addedBy: 'CITIZEN' | 'POLICE';
  addedById: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ComplaintDetail {
  _id: string;
  title: string;
  description: string;
  area: string;
  status: 'PENDING' | 'UNDER_INVESTIGATION' | 'FIR_REGISTERED' | 'CASE_FILED' | 'CLOSED';
  complainantId: Complainant;
  assignedOfficerIds: AssignedOfficer[];
  accused: AccusedPerson[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export const ComplaintDetail = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaintDetail = async () => {
    if (!complaintId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/citizens/complaints/${complaintId}`);
      
      if (response.data.success) {
        setComplaint(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch complaint details');
      }
    } catch (error: any) {
      console.error('Error fetching complaint:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch complaint details';
      setError(errorMessage);
      
      if (error.response?.status === 404) {
        toast({
          title: "Complaint Not Found",
          description: "The complaint you're looking for doesn't exist or you don't have access to it.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetail();
  }, [complaintId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'UNDER_INVESTIGATION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FIR_REGISTERED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CASE_FILED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CLOSED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'UNDER_INVESTIGATION':
        return <Eye className="h-4 w-4" />;
      case 'FIR_REGISTERED':
        return <FileText className="h-4 w-4" />;
      case 'CASE_FILED':
        return <AlertCircle className="h-4 w-4" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    // Use centralized IPFS gateway configuration
    const ipfsGatewayUrl = getIPFSUrl(attachment.ipfsHash);
    window.open(ipfsGatewayUrl, '_blank');
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      case 'OTHER':
        return 'Other';
      default:
        return 'Not specified';
    }
  };

  const getAddedByLabel = (addedBy: string) => {
    switch (addedBy) {
      case 'CITIZEN':
        return 'Added by Complainant';
      case 'POLICE':
        return 'Added by Police';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6">
            <Skeleton className="h-10 w-32 mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          <div className="grid gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !complaint) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/complaints')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Complaints
          </Button>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load complaint details'}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6">
            <Button onClick={fetchComplaintDetail} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/complaints')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Complaints
            </Button>
          </div>
          
          <Button onClick={fetchComplaintDetail} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Title and Status */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {complaint.title}
              </h1>
              <p className="text-gray-600">
                Complaint ID: <span className="font-mono text-sm">{complaint._id}</span>
              </p>
            </div>
            
            <Badge className={`${getStatusColor(complaint.status)} flex items-center gap-2 px-3 py-1`}>
              {getStatusIcon(complaint.status)}
              {complaint.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Filed on {formatDate(complaint.createdAt)}
            </div>
            {complaint.updatedAt !== complaint.createdAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Updated {formatDate(complaint.updatedAt)}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Complaint Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {complaint.description}
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Area:</span>
                  <span>{complaint.area}</span>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            {complaint.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Attachments ({complaint.attachments.length})
                  </CardTitle>
                  <CardDescription>
                    Files uploaded with this complaint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {complaint.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {attachment.fileName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Complainant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {complaint.complainantId.name}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BadgeIcon className="h-4 w-4" />
                  <span>NID: {complaint.complainantId.nid}</span>
                </div>
                
                {complaint.complainantId.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{complaint.complainantId.phone}</span>
                  </div>
                )}
                
                {complaint.complainantId.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{complaint.complainantId.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Officers */}
            {complaint.assignedOfficerIds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Assigned Officers
                  </CardTitle>
                  <CardDescription>
                    Officers handling this complaint
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {complaint.assignedOfficerIds.map((officer) => (
                    <div key={officer._id} className="space-y-2">
                      <p className="font-medium text-gray-900">
                        {officer.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BadgeIcon className="h-4 w-4" />
                        <span>{officer.rank}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>{officer.station}</span>
                      </div>
                      {complaint.assignedOfficerIds.length > 1 && (
                        <Separator className="my-3" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Accused Persons */}
            {complaint.accused.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Accused Persons
                  </CardTitle>
                  <CardDescription>
                    Persons accused in this complaint
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {complaint.accused.map((person, index) => (
                    <div key={index} className="space-y-2">
                      <p className="font-medium text-gray-900">
                        {person.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BadgeIcon className="h-4 w-4" />
                        <span>NID: {person.nid || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{person.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{person.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{person.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BadgeIcon className="h-4 w-4" />
                        <span>{getAddedByLabel(person.addedBy)}</span>
                      </div>
                      {complaint.accused.length > 1 && (
                        <Separator className="my-3" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/complaints">
                    <FileText className="h-4 w-4 mr-2" />
                    View All Complaints
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/file-complaint">
                    <Plus className="h-4 w-4 mr-2" />
                    File New Complaint
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
