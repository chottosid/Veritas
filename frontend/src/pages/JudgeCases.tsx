import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { API_CONFIG } from '@/config/api';
import { 
  Scale, 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Eye,
  Gavel,
  Users,
  MapPin,
  Plus,
  Upload,
  UserPlus,
  Settings
} from 'lucide-react';

interface Case {
  _id: string;
  caseNumber: string;
  status: 'PENDING' | 'ONGOING' | 'CLOSED';
  firId: {
    firNumber: string;
    complaintId: {
      title: string;
      description: string;
      complainantId: {
        name: string;
        nid: string;
        phone: string;
      };
    };
    accused: Array<{
      name: string;
      address: string;
      phone?: string;
      email?: string;
      nid?: string;
      age?: number;
      gender?: string;
      occupation?: string;
      relationshipToComplainant?: string;
      addedBy: 'CITIZEN' | 'POLICE' | 'JUDGE';
      addedById: string;
    }>;
  };
  assignedJudgeId: {
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
  investigatingOfficerIds: Array<{
    name: string;
    rank: string;
    station: string;
  }>;
  lawyerRequests?: Array<{
    _id: string;
    citizenId: {
      name: string;
      nid: string;
      phone: string;
    };
    requestedLawyerId: {
      name: string;
      firmName: string;
    };
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    message?: string;
  }>;
  allDocuments?: Array<{
    fileName: string;
    ipfsHash: string;
    fileSize: number;
    uploadedAt: string;
    documentSource: 'COMPLAINT' | 'FIR' | 'CASE_PROCEEDING';
    proceedingType: string;
    proceedingDescription: string;
    createdByRole: string;
    createdAt: string;
  }>;
  documentCount?: number;
  hearingDates: string[];
  verdict?: string;
  createdAt: string;
}

export const JudgeCases = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isSchedulingHearing, setIsSchedulingHearing] = useState(false);
  const [isClosingCase, setIsClosingCase] = useState(false);
  const [hearingDate, setHearingDate] = useState('');
  const [verdict, setVerdict] = useState('');

  // New state for accused person form
  const [isAddingAccused, setIsAddingAccused] = useState(false);
  const [accusedForm, setAccusedForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    nid: '',
    age: '',
    gender: '',
    occupation: '',
    relationshipToComplainant: ''
  });

  // New state for document upload
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    const filtered = cases.filter(case_ =>
      case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.firId.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.firId.complaintId.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCases(filtered);
  }, [searchTerm, cases]);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(API_CONFIG.ENDPOINTS.JUDGES_CASES);
      
      if (response.data.success) {
        setCases(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch cases');
      }
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      setError(err.response?.data?.message || 'Failed to fetch cases');
      toast({
        title: 'Error',
        description: 'Failed to load cases',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleHearing = async (caseId: string) => {
    try {
      setIsSchedulingHearing(true);
      
      const response = await api.post(`/judges/cases/${caseId}/hearing`, {
        hearingDate: new Date(hearingDate).toISOString()
      });
      
      if (response.data.success) {
        toast({
          title: 'Hearing Scheduled',
          description: `Hearing has been scheduled for ${new Date(hearingDate).toLocaleDateString()}`,
        });
        
        // Update the case in the list
        setCases(prev => prev.map(case_ => 
          case_._id === caseId 
            ? { ...case_, hearingDates: [...case_.hearingDates, hearingDate] }
            : case_
        ));
        setHearingDate('');
        setSelectedCase(null);
      } else {
        throw new Error(response.data.message || 'Failed to schedule hearing');
      }
    } catch (err: any) {
      console.error('Error scheduling hearing:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to schedule hearing',
        variant: 'destructive',
      });
    } finally {
      setIsSchedulingHearing(false);
    }
  };

  const handleCloseCase = async (caseId: string) => {
    try {
      setIsClosingCase(true);
      
      const response = await api.post(`/judges/cases/${caseId}/close`, {
        verdict: verdict
      });
      
      if (response.data.success) {
        toast({
          title: 'Case Closed',
          description: 'The case has been closed with the verdict',
        });
        
        // Update the case status in the list
        setCases(prev => prev.map(case_ => 
          case_._id === caseId 
            ? { ...case_, status: 'CLOSED' as const, verdict: verdict }
            : case_
        ));
        setVerdict('');
        setSelectedCase(null);
      } else {
        throw new Error(response.data.message || 'Failed to close case');
      }
    } catch (err: any) {
      console.error('Error closing case:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to close case',
        variant: 'destructive',
      });
    } finally {
      setIsClosingCase(false);
    }
  };

  const handleAddAccused = async (caseId: string) => {
    try {
      setIsAddingAccused(true);
      
      const response = await api.post(`/judges/cases/${caseId}/accused`, accusedForm);
      
      if (response.data.success) {
        toast({
          title: 'Accused Added',
          description: `Accused person "${accusedForm.name}" has been added to the case`,
        });
        
        // Reset form
        setAccusedForm({
          name: '',
          address: '',
          phone: '',
          email: '',
          nid: '',
          age: '',
          gender: '',
          occupation: '',
          relationshipToComplainant: ''
        });
        setSelectedCase(null);
      } else {
        throw new Error(response.data.message || 'Failed to add accused person');
      }
    } catch (err: any) {
      console.error('Error adding accused:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to add accused person',
        variant: 'destructive',
      });
    } finally {
      setIsAddingAccused(false);
    }
  };

  const handleUploadDocuments = async (caseId: string) => {
    try {
      setIsUploadingDocuments(true);
      
      if (!selectedFiles || selectedFiles.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select files to upload',
          variant: 'destructive',
        });
        return;
      }

      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('description', documentDescription);
      
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('documents', selectedFiles[i]);
      }
      
      const response = await api.post(`/judges/cases/${caseId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.success) {
        toast({
          title: 'Documents Uploaded',
          description: `${response.data.data.fileCount} document(s) uploaded successfully`,
        });
        
        // Reset form
        setDocumentType('');
        setDocumentDescription('');
        setSelectedFiles(null);
        setSelectedCase(null);
      } else {
        throw new Error(response.data.message || 'Failed to upload documents');
      }
    } catch (err: any) {
      console.error('Error uploading documents:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to upload documents',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingDocuments(false);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
              <h1 className="text-3xl font-bold">Case Management</h1>
              <p className="text-muted-foreground">
                Manage cases, schedule hearings, and deliver verdicts
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="card-elegant mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by case number, FIR number, or complaint title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="card-elegant">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCases.length === 0 ? (
            <Card className="card-elegant">
              <CardContent className="text-center py-12">
                <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'No Cases Found' : 'No Cases Available'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'No cases match your search criteria.' 
                    : 'No cases have been assigned yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCases.map((case_) => (
              <Card key={case_._id} className="card-elegant hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold">{case_.caseNumber}</h3>
                        {getStatusBadge(case_.status)}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="font-medium">{case_.firId.complaintId.title}</p>
                        <p className="text-sm text-muted-foreground">
                          FIR: {case_.firId.firNumber}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{case_.firId.complaintId.complainantId.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDateShort(case_.createdAt)}</span>
                        </div>
                        {case_.hearingDates.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Next: {formatDateShort(case_.hearingDates[0])}</span>
                          </div>
                        )}
                                                 {case_.investigatingOfficerIds.length > 0 && (
                           <div className="flex items-center gap-2">
                             <Users className="h-4 w-4 text-muted-foreground" />
                             <span>{case_.investigatingOfficerIds[0].name}</span>
                           </div>
                         )}
                         {case_.documentCount !== undefined && (
                           <div className="flex items-center gap-2">
                             <FileText className="h-4 w-4 text-muted-foreground" />
                             <span>{case_.documentCount} document{case_.documentCount !== 1 ? 's' : ''}</span>
                           </div>
                         )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/case/${case_._id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Details
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedCase(case_)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Quick Actions
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Scale className="h-5 w-5" />
                              Case Details - {selectedCase?.caseNumber}
                            </DialogTitle>
                            <DialogDescription>
                              Manage case proceedings, schedule hearings, and deliver verdicts
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedCase && (
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Scale className="h-4 w-4" />
                                  Case Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="text-muted-foreground">Case Number</Label>
                                    <p className="font-medium">{selectedCase.caseNumber}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedCase.status)}</div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">FIR Number</Label>
                                    <p className="font-medium">{selectedCase.firId.firNumber}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Created Date</Label>
                                    <p className="font-medium">{formatDate(selectedCase.createdAt)}</p>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Complaint Details */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Complaint Details
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-muted-foreground">Title</Label>
                                    <p className="font-medium">{selectedCase.firId.complaintId.title}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="text-sm leading-relaxed">{selectedCase.firId.complaintId.description}</p>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Parties Involved */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Parties Involved
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <Label className="text-muted-foreground">Complainant</Label>
                                    <div className="mt-2 space-y-1">
                                      <p className="font-medium">{selectedCase.firId.complaintId.complainantId.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        NID: {selectedCase.firId.complaintId.complainantId.nid}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Phone: {selectedCase.firId.complaintId.complainantId.phone}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {selectedCase.accusedLawyerId && (
                                    <div>
                                      <Label className="text-muted-foreground">Defense Lawyer</Label>
                                      <div className="mt-2 space-y-1">
                                        <p className="font-medium">{selectedCase.accusedLawyerId.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedCase.accusedLawyerId.firmName}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedCase.prosecutorLawyerId && (
                                    <div>
                                      <Label className="text-muted-foreground">Prosecutor</Label>
                                      <div className="mt-2 space-y-1">
                                        <p className="font-medium">{selectedCase.prosecutorLawyerId.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedCase.prosecutorLawyerId.firmName}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Accused Persons */}
                                {selectedCase.firId.accused && selectedCase.firId.accused.length > 0 && (
                                  <div>
                                    <Label className="text-muted-foreground">Accused Persons</Label>
                                    <div className="mt-2 space-y-3">
                                      {selectedCase.firId.accused.map((accused, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/30">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">{accused.name}</span>
                                              <Badge variant="outline" className="text-xs">
                                                {accused.addedBy}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div>
                                              <span className="text-muted-foreground">Address:</span>
                                              <span className="ml-1">{accused.address}</span>
                                            </div>
                                            {accused.phone && (
                                              <div>
                                                <span className="text-muted-foreground">Phone:</span>
                                                <span className="ml-1">{accused.phone}</span>
                                              </div>
                                            )}
                                            {accused.nid && (
                                              <div>
                                                <span className="text-muted-foreground">NID:</span>
                                                <span className="ml-1">{accused.nid}</span>
                                              </div>
                                            )}
                                            {accused.age && (
                                              <div>
                                                <span className="text-muted-foreground">Age:</span>
                                                <span className="ml-1">{accused.age}</span>
                                              </div>
                                            )}
                                            {accused.gender && (
                                              <div>
                                                <span className="text-muted-foreground">Gender:</span>
                                                <span className="ml-1">{accused.gender}</span>
                                              </div>
                                            )}
                                            {accused.occupation && (
                                              <div>
                                                <span className="text-muted-foreground">Occupation:</span>
                                                <span className="ml-1">{accused.occupation}</span>
                                              </div>
                                            )}
                                            {accused.relationshipToComplainant && (
                                              <div className="md:col-span-2">
                                                <span className="text-muted-foreground">Relationship:</span>
                                                <span className="ml-1">{accused.relationshipToComplainant}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Lawyer Requests */}
                                {selectedCase.lawyerRequests && selectedCase.lawyerRequests.length > 0 && (
                                  <div>
                                    <Label className="text-muted-foreground">Lawyer Requests</Label>
                                    <div className="mt-2 space-y-3">
                                      {selectedCase.lawyerRequests.map((request, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/30">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">{request.requestedLawyerId.name}</span>
                                              <Badge 
                                                variant={request.status === 'ACCEPTED' ? 'default' : request.status === 'REJECTED' ? 'destructive' : 'secondary'}
                                                className="text-xs"
                                              >
                                                {request.status}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="space-y-1 text-sm">
                                            <div>
                                              <span className="text-muted-foreground">Firm:</span>
                                              <span className="ml-1">{request.requestedLawyerId.firmName}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Requested by:</span>
                                              <span className="ml-1">{request.citizenId.name}</span>
                                            </div>
                                            {request.message && (
                                              <div>
                                                <span className="text-muted-foreground">Message:</span>
                                                <span className="ml-1">{request.message}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {selectedCase.investigatingOfficerIds.length > 0 && (
                                  <div>
                                    <Label className="text-muted-foreground">Investigating Officers</Label>
                                    <div className="mt-2 space-y-2">
                                      {selectedCase.investigatingOfficerIds.map((officer, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                          <Badge variant="outline">{officer.rank}</Badge>
                                          <span className="font-medium">{officer.name}</span>
                                          <span className="text-muted-foreground">- {officer.station}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                                             </div>

                               <Separator />

                               {/* All Documents */}
                               <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                                   <h4 className="font-semibold flex items-center gap-2">
                                     <FileText className="h-4 w-4" />
                                     All Case Documents
                                   </h4>
                                   {selectedCase.allDocuments && selectedCase.allDocuments.length > 0 && (
                                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                       <span>Total: {selectedCase.allDocuments.length} document{selectedCase.allDocuments.length !== 1 ? 's' : ''}</span>
                                       <span>•</span>
                                       <span>Complaint: {selectedCase.allDocuments.filter(doc => doc.documentSource === 'COMPLAINT').length}</span>
                                       <span>•</span>
                                       <span>FIR: {selectedCase.allDocuments.filter(doc => doc.documentSource === 'FIR').length}</span>
                                       <span>•</span>
                                       <span>Case: {selectedCase.allDocuments.filter(doc => doc.documentSource === 'CASE_PROCEEDING').length}</span>
                                     </div>
                                   )}
                                 </div>
                                                                   {selectedCase.allDocuments && selectedCase.allDocuments.length > 0 ? (
                                    <div className="space-y-3">
                                      {/* Document Timeline Header */}
                                      <div className="p-3 bg-muted/20 rounded-lg border-l-4 border-primary">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                          <FileText className="h-4 w-4" />
                                          Document Timeline
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Documents accumulate throughout the case lifecycle: Complaint → FIR → Case Proceedings
                                        </p>
                                      </div>
                                      
                                      {selectedCase.allDocuments.map((document, index) => (
                                       <div key={index} className="p-4 border rounded-lg bg-muted/30">
                                         <div className="flex items-start justify-between mb-2">
                                           <div className="flex items-center gap-2">
                                             <FileText className="h-4 w-4 text-muted-foreground" />
                                             <span className="font-medium">{document.fileName}</span>
                                             <Badge variant="outline" className="text-xs">
                                               {document.documentSource}
                                             </Badge>
                                             <Badge 
                                               variant={document.createdByRole === 'JUDGE' ? 'default' : 
                                                       document.createdByRole === 'POLICE' ? 'secondary' : 
                                                       document.createdByRole === 'CITIZEN' ? 'outline' : 'secondary'}
                                               className="text-xs"
                                             >
                                               {document.createdByRole}
                                             </Badge>
                                           </div>
                                           <span className="text-xs text-muted-foreground">
                                             {formatDate(document.createdAt)}
                                           </span>
                                         </div>
                                         <div className="space-y-2 text-sm">
                                                                                       <div>
                                              <span className="text-muted-foreground">Type:</span>
                                              <span className="ml-1 font-medium">{document.proceedingType.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Description:</span>
                                              <span className="ml-1">{document.proceedingDescription}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Stage:</span>
                                              <span className="ml-1 font-medium">
                                                {document.documentSource === 'COMPLAINT' ? 'Initial Filing' :
                                                 document.documentSource === 'FIR' ? 'Police Investigation' :
                                                 document.documentSource === 'CASE_PROCEEDING' ? 'Court Proceedings' : 'Unknown'}
                                              </span>
                                            </div>
                                           <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                             <span>Size: {formatFileSize(document.fileSize)}</span>
                                             <span>IPFS: {document.ipfsHash.substring(0, 10)}...</span>
                                           </div>
                                         </div>
                                         <div className="mt-3 pt-2 border-t">
                                           <Button 
                                             variant="outline" 
                                             size="sm"
                                             onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${document.ipfsHash}`, '_blank')}
                                             className="text-xs"
                                           >
                                             <FileText className="h-3 w-3 mr-1" />
                                             View Document
                                           </Button>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 ) : (
                                   <p className="text-sm text-muted-foreground">No documents attached to this case yet.</p>
                                 )}
                               </div>

                               <Separator />

                               {/* Hearing Dates */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Hearing Schedule
                                </h4>
                                {selectedCase.hearingDates.length > 0 ? (
                                  <div className="space-y-2">
                                    {selectedCase.hearingDates.map((date, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm p-2 border rounded">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{formatDate(date)}</span>
                                        <Badge variant="outline" className="ml-auto">
                                          {index === 0 ? 'Next' : `Hearing ${index + 1}`}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No hearings scheduled yet</p>
                                )}
                              </div>

                              {/* Verdict */}
                              {selectedCase.verdict && (
                                <>
                                  <Separator />
                                  <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4" />
                                      Verdict
                                    </h4>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                      <p className="text-sm leading-relaxed">{selectedCase.verdict}</p>
                                    </div>
                                  </div>
                                </>
                              )}

                              <Separator />

                              {/* Actions */}
                              {selectedCase.status !== 'CLOSED' && (
                                <div className="space-y-6">
                                  {/* Schedule Hearing */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Schedule Hearing
                                    </h4>
                                    <div className="flex items-end gap-4">
                                      <div className="flex-1">
                                        <Label htmlFor="hearingDate">Hearing Date & Time</Label>
                                        <Input
                                          id="hearingDate"
                                          type="datetime-local"
                                          value={hearingDate}
                                          onChange={(e) => setHearingDate(e.target.value)}
                                        />
                                      </div>
                                      <Button 
                                        onClick={() => handleScheduleHearing(selectedCase._id)}
                                        disabled={isSchedulingHearing || !hearingDate}
                                        className="flex items-center gap-2"
                                      >
                                        <Calendar className="h-4 w-4" />
                                        {isSchedulingHearing ? 'Scheduling...' : 'Schedule'}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Add Accused Person */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <UserPlus className="h-4 w-4" />
                                      Add Accused Person
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="accusedName">Name *</Label>
                                        <Input
                                          id="accusedName"
                                          value={accusedForm.name}
                                          onChange={(e) => setAccusedForm(prev => ({ ...prev, name: e.target.value }))}
                                          placeholder="Full name"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="accusedAddress">Address *</Label>
                                        <Input
                                          id="accusedAddress"
                                          value={accusedForm.address}
                                          onChange={(e) => setAccusedForm(prev => ({ ...prev, address: e.target.value }))}
                                          placeholder="Full address"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="accusedPhone">Phone</Label>
                                        <Input
                                          id="accusedPhone"
                                          value={accusedForm.phone}
                                          onChange={(e) => setAccusedForm(prev => ({ ...prev, phone: e.target.value }))}
                                          placeholder="Phone number"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="accusedEmail">Email</Label>
                                        <Input
                                          id="accusedEmail"
                                          type="email"
                                          value={accusedForm.email}
                                          onChange={(e) => setAccusedForm(prev => ({ ...prev, email: e.target.value }))}
                                          placeholder="Email address"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="accusedNID">NID</Label>
                                        <Input
                                          id="accusedNID"
                                          value={accusedForm.nid}
                                          onChange={(e) => setAccusedForm(prev => ({ ...prev, nid: e.target.value }))}
                                          placeholder="National ID"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="accusedAge">Age</Label>
                                        <Input
                                          id="accusedAge"
                                          type="number"
                                          value={accusedForm.age}
                                          onChange={(e) => setAccusedForm(prev => ({ ...prev, age: e.target.value }))}
                                          placeholder="Age"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="accusedGender">Gender</Label>
                                        <Select value={accusedForm.gender} onValueChange={(value) => setAccusedForm(prev => ({ ...prev, gender: value }))}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="MALE">Male</SelectItem>
                                            <SelectItem value="FEMALE">Female</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="accusedOccupation">Occupation</Label>
                                        <Input
                                          id="accusedOccupation"
                                          value={accusedForm.occupation}
                                          onChange={(e) => setAccusedForm(prev => ({ ...prev, occupation: e.target.value }))}
                                          placeholder="Occupation"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="accusedRelationship">Relationship to Complainant</Label>
                                      <Input
                                        id="accusedRelationship"
                                        value={accusedForm.relationshipToComplainant}
                                        onChange={(e) => setAccusedForm(prev => ({ ...prev, relationshipToComplainant: e.target.value }))}
                                        placeholder="e.g., neighbor, colleague, relative"
                                      />
                                    </div>
                                    <Button 
                                      onClick={() => handleAddAccused(selectedCase._id)}
                                      disabled={isAddingAccused || !accusedForm.name || !accusedForm.address}
                                      className="flex items-center gap-2"
                                    >
                                      <UserPlus className="h-4 w-4" />
                                      {isAddingAccused ? 'Adding...' : 'Add Accused Person'}
                                    </Button>
                                  </div>

                                  {/* Attach Documents */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <Upload className="h-4 w-4" />
                                      Attach Documents
                                    </h4>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="documentType">Document Type *</Label>
                                        <Select value={documentType} onValueChange={setDocumentType}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select document type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="ORDER">Court Order</SelectItem>
                                            <SelectItem value="SUMMON">Summon</SelectItem>
                                            <SelectItem value="NOTICE">Notice</SelectItem>
                                            <SelectItem value="JUDGMENT">Judgment</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label htmlFor="documentDescription">Description</Label>
                                        <Textarea
                                          id="documentDescription"
                                          value={documentDescription}
                                          onChange={(e) => setDocumentDescription(e.target.value)}
                                          placeholder="Brief description of the document(s)"
                                          rows={3}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="documents">Select Files *</Label>
                                        <Input
                                          id="documents"
                                          type="file"
                                          multiple
                                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                          onChange={(e) => setSelectedFiles(e.target.files)}
                                          className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5 files)
                                        </p>
                                      </div>
                                      <Button 
                                        onClick={() => handleUploadDocuments(selectedCase._id)}
                                        disabled={isUploadingDocuments || !documentType || !selectedFiles}
                                        className="flex items-center gap-2"
                                      >
                                        <Upload className="h-4 w-4" />
                                        {isUploadingDocuments ? 'Uploading...' : 'Upload Documents'}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Close Case */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <Gavel className="h-4 w-4" />
                                      Close Case with Verdict
                                    </h4>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="verdict">Verdict</Label>
                                        <Textarea
                                          id="verdict"
                                          placeholder="Enter the court's verdict and judgment..."
                                          value={verdict}
                                          onChange={(e) => setVerdict(e.target.value)}
                                          rows={4}
                                        />
                                      </div>
                                      <Button 
                                        onClick={() => handleCloseCase(selectedCase._id)}
                                        disabled={isClosingCase || !verdict.trim()}
                                        className="flex items-center gap-2"
                                        variant="destructive"
                                      >
                                        <Gavel className="h-4 w-4" />
                                        {isClosingCase ? 'Closing...' : 'Close Case'}
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Closing this case will mark it as completed and record the final verdict.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {!isLoading && (
          <Card className="card-elegant mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {searchTerm 
                    ? `${filteredCases.length} of ${cases.length} cases match your search`
                    : `${cases.length} cases under your jurisdiction`
                  }
                </span>
                <span>
                  Court: {user?.courtName}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
