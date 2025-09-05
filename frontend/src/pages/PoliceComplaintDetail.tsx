import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Upload,
  Download,
  Scale,
  Building2,
  Phone,
  FileBarChart,
  Plus,
  X,
  UserPlus,
  Users,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Complainant {
  _id: string;
  name: string;
  nid: string;
  phone: string;
  email?: string;
}

interface Officer {
  _id: string;
  name: string;
  rank: string;
  station: string;
}

interface Judge {
  _id: string;
  name: string;
  courtName: string;
  jid: string;
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

interface Complaint {
  _id: string;
  title: string;
  description: string;
  area: string;
  status: 'PENDING' | 'UNDER_INVESTIGATION' | 'FIR_REGISTERED' | 'CLOSED';
  complainantId: Complainant;
  assignedOfficerIds: Officer[];
  accused: AccusedPerson[];
  attachments: Array<{
    fileName: string;
    ipfsHash: string;
    uploadedAt: string;
    fileSize?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const PoliceComplaintDetail = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [creatingFIR, setCreatingFIR] = useState(false);
  
  // FIR Form state
  const [showFIRForm, setShowFIRForm] = useState(false);
  const [firNumber, setFirNumber] = useState("");
  const [sections, setSections] = useState("");
  const [selectedJudgeId, setSelectedJudgeId] = useState("");
  const [firAttachments, setFirAttachments] = useState<FileList | null>(null);
  
  // Evidence form state
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);

  // Accused form state
  const [policeAccused, setPoliceAccused] = useState<AccusedPerson[]>([]);

  useEffect(() => {
    if (complaintId) {
      fetchComplaintDetail();
      fetchJudges();
    }
  }, [complaintId]);

  // Check if FIR form should be opened automatically
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'register-fir' && complaint && complaint.status === 'UNDER_INVESTIGATION') {
      setShowFIRForm(true);
      // Clear the action parameter from URL
      navigate(`/police/complaints/${complaintId}`, { replace: true });
    }
  }, [complaint, searchParams, complaintId, navigate]);

  const fetchComplaintDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/police/complaints/${complaintId}`);
      
      if (response.data.success) {
        setComplaint(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch complaint details');
      }
    } catch (err: any) {
      console.error('Error fetching complaint:', err);
      setError(err.response?.data?.message || 'Failed to fetch complaint details');
    } finally {
      setLoading(false);
    }
  };

  const fetchJudges = async () => {
    try {
      const response = await api.get('/police/judges');
      if (response.data.success) {
        setJudges(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching judges:', err);
    }
  };

  const addPoliceAccused = () => {
    const newAccused: AccusedPerson = {
      _id: `temp_${Date.now()}`, // Use a temporary ID that won't conflict with MongoDB ObjectIds
      name: '',
      address: '',
      phone: '',
      email: '',
      nid: '',
      age: undefined,
      gender: undefined,
      occupation: '',
      relationshipToComplainant: '',
      addedBy: 'POLICE',
      addedById: ''
    };
    setPoliceAccused(prev => [...prev, newAccused]);
  };

  const removePoliceAccused = (id: string) => {
    setPoliceAccused(prev => prev.filter(acc => acc._id !== id));
  };

  const updatePoliceAccused = (id: string, field: keyof AccusedPerson, value: any) => {
    setPoliceAccused(prev => prev.map(acc => 
      acc._id === id ? { ...acc, [field]: value } : acc
    ));
  };

  // Save accused persons to the complaint
  const saveAccusedToComplaint = async () => {
    if (!validatePoliceAccused()) {
      return;
    }

    try {
      // Combine existing accused from complaint with new police accused
      const allAccused = [...(complaint?.accused || []), ...policeAccused];
      
      const response = await api.put(`/police/complaints/${complaintId}/accused`, {
        accused: allAccused
      });

      if (response.data.success) {
        toast({
          title: "Accused Persons Updated",
          description: "Accused persons have been successfully updated",
        });
        setComplaint(response.data.data);
        setPoliceAccused([]); // Clear the local state
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to update accused persons",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Error updating accused persons:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update accused persons",
        variant: "destructive",
      });
    }
  };

  // Remove accused person from complaint
  const removeAccusedFromComplaint = async (accusedId: string) => {
    try {
      const updatedAccused = complaint?.accused.filter(acc => acc._id !== accusedId) || [];
      
      const response = await api.put(`/police/complaints/${complaintId}/accused`, {
        accused: updatedAccused
      });

      if (response.data.success) {
        toast({
          title: "Accused Person Removed",
          description: "Accused person has been successfully removed",
        });
        setComplaint(response.data.data);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to remove accused person",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Error removing accused person:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to remove accused person",
        variant: "destructive",
      });
    }
  };

  const validatePoliceAccused = (): boolean => {
    for (const acc of policeAccused) {
      if (!acc.name.trim()) {
        toast({
          title: "Validation Error",
          description: "All accused must have a name",
          variant: "destructive",
        });
        return false;
      }
      if (!acc.address.trim()) {
        toast({
          title: "Validation Error",
          description: "All accused must have an address",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
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

  const handleCreateFIR = async () => {
    if (!firNumber.trim() || !sections.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide FIR number and legal sections",
        variant: "destructive"
      });
      return;
    }

    // Accused persons validation is not needed for FIR creation
    // as they are already managed in the complaint detail view

    try {
      setCreatingFIR(true);
      const formData = new FormData();
      formData.append('firNumber', firNumber);
      formData.append('sections', JSON.stringify(sections.split(',').map(s => s.trim())));
      
      if (selectedJudgeId) {
        formData.append('judgeId', selectedJudgeId);
      }
      
      // Accused persons are already managed in the complaint detail view
      // No need to include them again in FIR creation
      
      if (firAttachments) {
        Array.from(firAttachments).forEach(file => {
          formData.append('attachments', file);
        });
      }

      const response = await api.post(`/police/complaints/${complaintId}/fir`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: "FIR Created Successfully",
          description: "The FIR has been registered and the case is now active",
        });
        setShowFIRForm(false);
        fetchComplaintDetail(); // Refresh to show updated status
      } else {
        throw new Error(response.data.message || 'Failed to create FIR');
      }
    } catch (error: any) {
      console.error('Error creating FIR:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create FIR",
        variant: "destructive",
      });
    } finally {
      setCreatingFIR(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!evidenceDescription.trim() || !evidenceFiles || evidenceFiles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide description and upload evidence files",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmittingEvidence(true);
      const formData = new FormData();
      formData.append('description', evidenceDescription);
      
      Array.from(evidenceFiles).forEach(file => {
        formData.append('evidence', file);
      });

      const response = await api.post(`/police/complaints/${complaintId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Evidence submitted successfully",
        });
        setShowEvidenceForm(false);
        setEvidenceDescription("");
        setEvidenceFiles(null);
        fetchComplaintDetail(); // Refresh data
      }
    } catch (err: any) {
      console.error('Error submitting evidence:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to submit evidence',
        variant: "destructive"
      });
    } finally {
      setSubmittingEvidence(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !complaint) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Complaint not found'}</AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => navigate('/police/complaints')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Complaints
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{complaint.title}</h1>
                <p className="text-muted-foreground">Complaint Details & Investigation</p>
              </div>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between mb-6">
            <Badge className={`flex items-center gap-2 text-base px-4 py-2 ${getStatusColor(complaint.status)}`}>
              {getStatusIcon(complaint.status)}
              {formatStatus(complaint.status)}
            </Badge>
            
            <div className="flex gap-2">
              {complaint.status === 'UNDER_INVESTIGATION' && (
                <>
                  <Button onClick={() => setShowEvidenceForm(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Evidence
                  </Button>
                  <Button onClick={() => setShowFIRForm(true)}>
                    <Scale className="h-4 w-4 mr-2" />
                    Register FIR
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Complaint Details */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Complaint Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm">{complaint.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Area</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{complaint.area}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Filed On</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(complaint.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complainant Details */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Complainant Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{complaint.complainantId.name}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">NID</Label>
                      <p className="text-sm mt-1">{complaint.complainantId.nid}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{complaint.complainantId.phone}</span>
                      </div>
                    </div>
                    
                    {complaint.complainantId.email && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm mt-1">{complaint.complainantId.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Accused Persons */}
                <Card className="card-elegant">
                  <CardHeader>
                    <CardTitle>Accused Persons</CardTitle>
                  </CardHeader>
                  <CardContent>
                  {/* Existing Accused Persons */}
                  {complaint.accused.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {complaint.accused.map((accused, index) => (
                        <div key={accused._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <User className="h-8 w-8 text-red-500" />
                            <div>
                              <p className="font-medium">{accused.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Address: {accused.address}, Phone: {accused.phone || 'N/A'}, NID: {accused.nid || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Added by: {getAddedByLabel(accused.addedBy)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeAccusedFromComplaint(accused._id!)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Accused Persons Form */}
                  {policeAccused.length > 0 && (
                    <div className="space-y-4 mb-4 p-4 border-2 border-dashed border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-700">New Accused Persons to Add</h4>
                      {policeAccused.map((accused, index) => (
                        <div key={accused._id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${accused._id}`}>Name *</Label>
                            <Input
                              id={`name-${accused._id}`}
                              value={accused.name}
                              onChange={(e) => updatePoliceAccused(accused._id!, 'name', e.target.value)}
                              placeholder="Full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`address-${accused._id}`}>Address *</Label>
                            <Input
                              id={`address-${accused._id}`}
                              value={accused.address}
                              onChange={(e) => updatePoliceAccused(accused._id!, 'address', e.target.value)}
                              placeholder="Full address"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`phone-${accused._id}`}>Phone</Label>
                            <Input
                              id={`phone-${accused._id}`}
                              value={accused.phone}
                              onChange={(e) => updatePoliceAccused(accused._id!, 'phone', e.target.value)}
                              placeholder="Phone number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`nid-${accused._id}`}>NID</Label>
                            <Input
                              id={`nid-${accused._id}`}
                              value={accused.nid}
                              onChange={(e) => updatePoliceAccused(accused._id!, 'nid', e.target.value)}
                              placeholder="National ID"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`age-${accused._id}`}>Age</Label>
                            <Input
                              id={`age-${accused._id}`}
                              type="number"
                              value={accused.age || ''}
                              onChange={(e) => updatePoliceAccused(accused._id!, 'age', parseInt(e.target.value) || undefined)}
                              placeholder="Age"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`gender-${accused._id}`}>Gender</Label>
                            <select
                              id={`gender-${accused._id}`}
                              value={accused.gender || ''}
                              onChange={(e) => updatePoliceAccused(accused._id!, 'gender', e.target.value || undefined)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select gender</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`occupation-${accused._id}`}>Occupation</Label>
                            <Input
                              id={`occupation-${accused._id}`}
                              value={accused.occupation}
                              onChange={(e) => updatePoliceAccused(accused._id!, 'occupation', e.target.value)}
                              placeholder="Occupation"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={`relationship-${accused._id}`}>Relationship to Complainant</Label>
                            <Input
                              id={`relationship-${accused._id}`}
                              value={accused.relationshipToComplainant}
                              onChange={(e) => updatePoliceAccused(accused._id!, 'relationshipToComplainant', e.target.value)}
                              placeholder="Relationship to complainant"
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => removePoliceAccused(accused._id!)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Button onClick={saveAccusedToComplaint} className="bg-blue-600 hover:bg-blue-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Accused Persons
                        </Button>
                        <Button variant="outline" onClick={() => setPoliceAccused([])}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Add New Accused Button */}
                  <Button variant="outline" onClick={addPoliceAccused} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Accused Person
                    </Button>
                  </CardContent>
                </Card>

              {/* Attachments */}
              {complaint.attachments.length > 0 && (
                <Card className="card-elegant">
                  <CardHeader>
                    <CardTitle>Evidence Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {complaint.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="font-medium">{attachment.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(attachment.fileSize)} • {formatDate(attachment.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
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

            {/* Right Column - Officers & Actions */}
            <div className="space-y-6">
              {/* Assigned Officers */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Assigned Officers</CardTitle>
                </CardHeader>
                <CardContent>
                  {complaint.assignedOfficerIds.length > 0 ? (
                    <div className="space-y-3">
                      {complaint.assignedOfficerIds.map((officer) => (
                        <div key={officer._id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="p-2 rounded-full bg-blue-100">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{officer.name}</p>
                            <p className="text-sm text-muted-foreground">{officer.rank}</p>
                            <p className="text-xs text-muted-foreground">{officer.station}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No officers assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Complaint Filed</p>
                        <p className="text-sm text-muted-foreground">{formatDate(complaint.createdAt)}</p>
                      </div>
                    </div>
                    
                    {complaint.status !== 'PENDING' && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <FileBarChart className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Investigation Started</p>
                          <p className="text-sm text-muted-foreground">{formatDate(complaint.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {complaint.status === 'FIR_REGISTERED' && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Scale className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">FIR Registered</p>
                          <p className="text-sm text-muted-foreground">{formatDate(complaint.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FIR Form Modal */}
          {showFIRForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>Register FIR</CardTitle>
                  <CardDescription>
                    Convert this complaint to a formal FIR for court proceedings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firNumber">FIR Number *</Label>
                      <Input
                        id="firNumber"
                        value={firNumber}
                        onChange={(e) => setFirNumber(e.target.value)}
                        placeholder="e.g., FIR-2025-001"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="judge">Assign to Judge (Optional)</Label>
                      <select
                        id="judge"
                        value={selectedJudgeId}
                        onChange={(e) => setSelectedJudgeId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                      >
                        <option value="">Select a judge...</option>
                        {judges.map((judge) => (
                          <option key={judge._id} value={judge._id}>
                            {judge.name} - {judge.courtName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="sections">Legal Sections *</Label>
                    <Input
                      id="sections"
                      value={sections}
                      onChange={(e) => setSections(e.target.value)}
                      placeholder="e.g., IPC-379, IPC-380"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter comma-separated legal sections
                    </p>
                  </div>

                  {/* Accused persons are already managed in the complaint detail view above */}

                    {/* Removed redundant accused persons form from FIR registration */}
                    {false && (
                      <div className="space-y-4">
                        {policeAccused.map((acc, index) => (
                          <Card key={acc._id} className="border border-slate-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Users className="h-5 w-5" />
                                  Accused Person {index + 1}
                                </CardTitle>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePoliceAccused(acc._id!)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Full Name *</Label>
                                  <Input
                                    placeholder="Enter full name"
                                    value={acc.name}
                                    onChange={(e) => updatePoliceAccused(acc._id!, 'name', e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Address *</Label>
                                  <Input
                                    placeholder="Enter address"
                                    value={acc.address}
                                    onChange={(e) => updatePoliceAccused(acc._id!, 'address', e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Phone Number</Label>
                                  <Input
                                    placeholder="Enter phone number"
                                    value={acc.phone || ''}
                                    onChange={(e) => updatePoliceAccused(acc._id!, 'phone', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Email</Label>
                                  <Input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={acc.email || ''}
                                    onChange={(e) => updatePoliceAccused(acc._id!, 'email', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">NID Number</Label>
                                  <Input
                                    placeholder="Enter NID number"
                                    value={acc.nid || ''}
                                    onChange={(e) => updatePoliceAccused(acc._id!, 'nid', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Age</Label>
                                  <Input
                                    type="number"
                                    placeholder="Enter age"
                                    value={acc.age || ''}
                                    onChange={(e) => updatePoliceAccused(acc._id!, 'age', e.target.value ? parseInt(e.target.value) : undefined)}
                                    min="1"
                                    max="120"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Gender</Label>
                                  <select
                                    value={acc.gender || ''}
                                    onChange={(e) => updatePoliceAccused(acc._id!, 'gender', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                                  >
                                    <option value="">Select gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Occupation</Label>
                                  <Input
                                    placeholder="Enter occupation"
                                    value={acc.occupation || ''}
                                    onChange={(e) => updatePoliceAccused(acc._id!, 'occupation', e.target.value)}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  
                  <div>
                    <Label htmlFor="firAttachments">Attachments (Optional)</Label>
                    <Input
                      id="firAttachments"
                      type="file"
                      multiple
                      onChange={(e) => setFirAttachments(e.target.files)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                    />
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 p-6 pt-0">
                  <Button variant="outline" onClick={() => setShowFIRForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFIR} disabled={creatingFIR}>
                    {creatingFIR ? 'Registering...' : 'Register FIR'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Evidence Form Modal */}
          {showEvidenceForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-lg mx-4">
                <CardHeader>
                  <CardTitle>Submit Evidence</CardTitle>
                  <CardDescription>
                    Add additional evidence for this complaint
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="evidenceDescription">Description *</Label>
                    <Textarea
                      id="evidenceDescription"
                      value={evidenceDescription}
                      onChange={(e) => setEvidenceDescription(e.target.value)}
                      placeholder="Describe the evidence you're submitting..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="evidenceFiles">Evidence Files *</Label>
                    <Input
                      id="evidenceFiles"
                      type="file"
                      multiple
                      onChange={(e) => setEvidenceFiles(e.target.files)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum 5 files allowed
                    </p>
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 p-6 pt-0">
                  <Button variant="outline" onClick={() => setShowEvidenceForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitEvidence} disabled={submittingEvidence}>
                    {submittingEvidence ? 'Submitting...' : 'Submit Evidence'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
