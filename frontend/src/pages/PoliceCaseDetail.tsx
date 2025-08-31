import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { 
  Scale, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Upload,
  Download,
  Building2,
  Phone,
  FileText,
  Plus,
  FileBarChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Judge {
  _id: string;
  name: string;
  courtName: string;
}

interface FIR {
  _id: string;
  firNumber: string;
  sections: string[];
  complaintId: {
    title: string;
    description: string;
    complainantId: {
      name: string;
      nid: string;
      phone: string;
    };
  };
}

interface CaseDetail {
  _id: string;
  caseNumber: string;
  status: 'PENDING' | 'ONGOING' | 'CLOSED';
  firId: FIR;
  assignedJudgeId: Judge;
  investigatingOfficerIds: Array<{
    _id: string;
    name: string;
    rank: string;
    station: string;
  }>;
  hearingDates: string[];
  evidenceFiles?: Array<{
    fileName: string;
    ipfsHash: string;
    description: string;
    uploadedBy: string;
    uploadedAt: string;
    fileSize?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const PoliceCaseDetail = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  
  // Evidence form state
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetail();
    }
  }, [caseId]);

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/police/cases/${caseId}`);
      
      if (response.data.success) {
        setCaseDetail(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch case details');
      }
    } catch (err: any) {
      console.error('Error fetching case:', err);
      setError(err.response?.data?.message || 'Failed to fetch case details');
    } finally {
      setLoading(false);
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
      formData.append('documentType', 'EVIDENCE');
      formData.append('description', evidenceDescription);
      
      Array.from(evidenceFiles).forEach(file => {
        formData.append('documents', file);
      });

      const response = await api.post(`/police/cases/${caseId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Documents submitted successfully",
        });
        setShowEvidenceForm(false);
        setEvidenceDescription("");
        setEvidenceFiles(null);
        fetchCaseDetail(); // Refresh data
      }
    } catch (err: any) {
      console.error('Error submitting documents:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to submit documents',
        variant: "destructive"
      });
    } finally {
      setSubmittingEvidence(false);
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

  const getNextHearing = (hearingDates: string[]) => {
    if (!hearingDates || hearingDates.length === 0) return null;
    
    const upcoming = hearingDates
      .map(date => new Date(date))
      .filter(date => date > new Date())
      .sort((a, b) => a.getTime() - b.getTime());
    
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !caseDetail) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Case not found'}</AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    );
  }

  const nextHearing = getNextHearing(caseDetail.hearingDates);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" onClick={() => navigate('/police/cases')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{caseDetail.caseNumber}</h1>
                <p className="text-muted-foreground">Case Investigation & Evidence Management</p>
              </div>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between mb-6">
            <Badge className={`flex items-center gap-2 text-base px-4 py-2 ${getStatusColor(caseDetail.status)}`}>
              {getStatusIcon(caseDetail.status)}
              {caseDetail.status}
            </Badge>
            
            <div className="flex gap-2">
              {caseDetail.status !== 'CLOSED' && (
                <Button onClick={() => setShowEvidenceForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Evidence
                </Button>
              )}
            </div>
          </div>

          {/* Next Hearing Alert */}
          {nextHearing && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div className="text-orange-800">
                <strong>Next Hearing:</strong> {formatDate(nextHearing.toISOString())}
              </div>
            </Alert>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* FIR Details */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>FIR Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">FIR Number</Label>
                      <p className="mt-1 font-medium">{caseDetail.firId.firNumber}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Legal Sections</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {caseDetail.firId.sections.map((section, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Original Complaint</Label>
                    <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium">{caseDetail.firId.complaintId.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {caseDetail.firId.complaintId.description}
                      </p>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{caseDetail.firId.complaintId.complainantId.name}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">NID</Label>
                      <p className="text-sm mt-1">{caseDetail.firId.complaintId.complainantId.nid}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{caseDetail.firId.complaintId.complainantId.phone}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evidence Files */}
              {caseDetail.evidenceFiles && caseDetail.evidenceFiles.length > 0 && (
                <Card className="card-elegant">
                  <CardHeader>
                    <CardTitle>Evidence Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {caseDetail.evidenceFiles.map((evidence, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-blue-500" />
                              <div>
                                <p className="font-medium">{evidence.fileName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(evidence.fileSize)} • {formatDate(evidence.uploadedAt)}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                            {evidence.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Case Info */}
            <div className="space-y-6">
              {/* Judge Information */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Assigned Judge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="p-2 rounded-full bg-purple-100">
                      <Scale className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{caseDetail.assignedJudgeId.name}</p>
                      <p className="text-sm text-muted-foreground">{caseDetail.assignedJudgeId.courtName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Investigating Officers */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Investigating Officers</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseDetail.investigatingOfficerIds?.length > 0 ? (
                    <div className="space-y-3">
                      {caseDetail.investigatingOfficerIds.map((officer) => (
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

              {/* Hearing Schedule */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Hearing Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseDetail.hearingDates.length > 0 ? (
                    <div className="space-y-3">
                      {caseDetail.hearingDates
                        .map(date => new Date(date))
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((date, index) => {
                          const isPast = date < new Date();
                          const isNext = !isPast && (!nextHearing || date.getTime() === nextHearing.getTime());
                          
                          return (
                            <div key={index} className={`flex items-center gap-3 p-3 border rounded-lg ${
                              isNext ? 'border-orange-200 bg-orange-50' : isPast ? 'opacity-60' : ''
                            }`}>
                              <Calendar className={`h-4 w-4 ${
                                isNext ? 'text-orange-600' : isPast ? 'text-gray-400' : 'text-blue-600'
                              }`} />
                              <div>
                                <p className="font-medium">{formatDate(date.toISOString())}</p>
                                <p className="text-xs text-muted-foreground">
                                  {isPast ? 'Completed' : isNext ? 'Next Hearing' : 'Scheduled'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No hearings scheduled</p>
                  )}
                </CardContent>
              </Card>

              {/* Case Timeline */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Case Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <Scale className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Case Created</p>
                        <p className="text-sm text-muted-foreground">{formatDate(caseDetail.createdAt)}</p>
                      </div>
                    </div>
                    
                    {caseDetail.status !== 'PENDING' && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <FileBarChart className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Investigation Ongoing</p>
                          <p className="text-sm text-muted-foreground">{formatDate(caseDetail.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {caseDetail.status === 'CLOSED' && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-gray-100">
                          <CheckCircle className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">Case Closed</p>
                          <p className="text-sm text-muted-foreground">{formatDate(caseDetail.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Evidence Form Modal */}
          {showEvidenceForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-lg mx-4">
                <CardHeader>
                  <CardTitle>Submit Evidence</CardTitle>
                  <CardDescription>
                    Add additional evidence for this case
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
