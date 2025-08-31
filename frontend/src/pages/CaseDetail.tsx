import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { 
  Scale, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Users,
  Gavel,
  History
} from "lucide-react";

interface CaseDetail {
  _id: string;
  caseNumber: string;
  status: string;
  firId: {
    firNumber: string;
    sections?: string[];
    complaintId: {
      title: string;
      description: string;
      complainantId: {
        name: string;
        nid: string;
        phone: string;
      };
      accused?: Array<{
        name: string;
        address: string;
        phone?: string;
        email?: string;
        nid?: string;
        age?: number;
        gender?: string;
        occupation?: string;
        relationshipToComplainant?: string;
      }>;
      attachments?: Array<{
        fileName: string;
        ipfsHash: string;
        fileSize: number;
        uploadedAt: string;
      }>;
    };
    accused?: Array<{
      name: string;
      address: string;
      phone?: string;
      email?: string;
      nid?: string;
      age?: number;
      gender?: string;
      occupation?: string;
      relationshipToComplainant?: string;
    }>;
    attachments?: Array<{
      fileName: string;
      ipfsHash: string;
      fileSize: number;
      uploadedAt: string;
    }>;
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
  verdict?: string;
  createdAt: string;
  allAccused?: Array<{
    name: string;
    address: string;
    phone?: string;
    email?: string;
    nid?: string;
    age?: number;
    gender?: string;
    occupation?: string;
    relationshipToComplainant?: string;
  }>;
  allDocuments?: Array<{
    fileName: string;
    ipfsHash: string;
    fileSize: number;
    uploadedAt: string;
    documentSource: string;
    proceedingType: string;
    proceedingDescription: string;
    createdByRole: string;
    createdAt: string;
  }>;
}

interface Proceeding {
  _id: string;
  type: string;
  createdByRole: string;
  description: string;
  metadata?: any;
  attachments?: Array<{
    fileName: string;
    ipfsHash: string;
  }>;
  createdAt: string;
}

export const CaseDetail = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [proceedings, setProceedings] = useState<Proceeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [proceedingsLoading, setProceedingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        
        // Get case data from navigation state
        const passedCaseData = location.state?.caseData;
        
        if (passedCaseData) {
          setCaseDetail(passedCaseData);
          // Fetch proceedings if needed
          fetchProceedings();
        } else if (caseId && user?.role === 'JUDGE') {
          // For judges, fetch case details directly from API
          const response = await api.get(`/judges/cases/${caseId}`);
          if (response.data.success) {
            console.log('Judge case details received:', {
              allDocuments: response.data.data.allDocuments?.length || 0,
              documents: response.data.data.allDocuments?.map(d => ({
                fileName: d.fileName,
                documentSource: d.documentSource,
                ipfsHash: d.ipfsHash
              }))
            });
            setCaseDetail(response.data.data);
          } else {
            setError("Failed to fetch case details");
          }
        } else if (caseId && user?.role === 'CITIZEN') {
          // For citizens, try to fetch case details from citizen API
          try {
            const response = await api.get(`/citizens/cases/${caseId}`);
            if (response.data.success) {
              setCaseDetail(response.data.data);
            } else {
              setError("Failed to fetch case details");
            }
          } catch (err) {
            setError("No case data provided. Please select a case from the list.");
          }
        } else {
          // If no data passed and not a judge or citizen, redirect back to cases list
          setError("No case data provided. Please select a case from the list.");
        }
      } catch (err: any) {
        console.error('Error fetching case data:', err);
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message
        });
        setError(err.response?.data?.message || err.message || "Failed to fetch case details");
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [location.state, caseId, user?.role]);

  const fetchProceedings = async () => {
    try {
      setProceedingsLoading(true);
      
      const response = await api.get(`/citizens/cases/${caseId}/proceedings`);
      
      if (response.data.success) {
        setProceedings(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching proceedings:', err);
      // Don't show error for proceedings, it's optional
    } finally {
      setProceedingsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'ONGOING':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'CLOSED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'DISMISSED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
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
      month: 'long',
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

  const getProceedingIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CASE_CREATED':
        return <Scale className="h-4 w-4 text-blue-500" />;
      case 'HEARING_SCHEDULED':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'EVIDENCE_SUBMITTED':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'DOCUMENT_FILED':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'JUDGMENT':
        return <Gavel className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-48" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !caseDetail) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Case not found'}</AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" asChild>
              <Link to="/cases">Back to Cases</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const nextHearing = caseDetail.hearingDates && caseDetail.hearingDates.length > 0 
    ? caseDetail.hearingDates
        .map(date => new Date(date))
        .filter(date => date > new Date())
        .sort((a, b) => a.getTime() - b.getTime())[0]
    : null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link to={user?.role === 'JUDGE' ? '/judge/cases' : '/cases'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{caseDetail.caseNumber}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <FileText className="h-3 w-3" />
                FIR: {caseDetail.firId.firNumber}
              </p>
            </div>
            <Badge className={`${getStatusColor(caseDetail.status)} border ml-auto`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(caseDetail.status)}
                {caseDetail.status.replace('_', ' ')}
              </div>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Case Information */}
                <Card className="card-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Case Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* FIR Details */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-1">FIR Information</h4>
                        <p className="text-sm font-medium">FIR Number: {caseDetail.firId.firNumber}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This case was created from the registered FIR.
                        </p>
                      </div>
                    </div>

                    {/* Sections */}
                    {caseDetail.firId.sections && caseDetail.firId.sections.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Legal Sections</h4>
                        <div className="flex flex-wrap gap-2">
                          {caseDetail.firId.sections.map((section, index) => (
                            <Badge key={index} variant="secondary">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verdict */}
                    {caseDetail.verdict && (
                      <div className="p-4 rounded-lg bg-muted">
                        <h4 className="font-medium mb-1 flex items-center gap-2">
                          <Gavel className="h-4 w-4" />
                          Final Verdict
                        </h4>
                        <p className="text-sm">{caseDetail.verdict}</p>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Case created on {formatDate(caseDetail.createdAt)}
                    </p>
                  </CardContent>
                </Card>

                {/* Parties Involved */}
                <Card className="card-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Parties Involved
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Note about complainant */}
                    {user?.role === 'CITIZEN' ? (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> You are the complainant in this case. Your complaint was converted to an FIR and then to this legal case.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-sm text-green-800">
                          <strong>Complainant:</strong> {caseDetail.firId.complaintId.complainantId.name} (NID: {caseDetail.firId.complaintId.complainantId.nid})
                        </p>
                      </div>
                    )}

                    {/* Legal Representation */}
                    {(caseDetail.accusedLawyerId || caseDetail.prosecutorLawyerId) && (
                      <div>
                        <h4 className="font-medium mb-3">Legal Representation</h4>
                        <div className="space-y-3">
                          {caseDetail.accusedLawyerId && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <Scale className="h-5 w-5 text-muted-foreground mt-1" />
                              <div>
                                <p className="font-medium">{caseDetail.accusedLawyerId.name}</p>
                                <p className="text-sm text-muted-foreground">Defense Lawyer</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {caseDetail.accusedLawyerId.firmName}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {caseDetail.prosecutorLawyerId && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <Scale className="h-5 w-5 text-muted-foreground mt-1" />
                              <div>
                                <p className="font-medium">{caseDetail.prosecutorLawyerId.name}</p>
                                <p className="text-sm text-muted-foreground">Prosecution Lawyer</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {caseDetail.prosecutorLawyerId.firmName}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Investigating Officers */}
                    {caseDetail.investigatingOfficerIds && caseDetail.investigatingOfficerIds.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Investigating Officers</h4>
                        <div className="space-y-2">
                          {caseDetail.investigatingOfficerIds.map((officer, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <User className="h-5 w-5 text-muted-foreground mt-1" />
                              <div>
                                <p className="font-medium">{officer.rank} {officer.name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {officer.station}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Accused Information */}
                    {caseDetail.allAccused && caseDetail.allAccused.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Accused Persons</h4>
                        <div className="space-y-3">
                          {caseDetail.allAccused.map((accused, index) => (
                            <div key={index} className="p-4 rounded-lg border border-red-200 bg-red-50">
                              <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-red-600 mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-medium text-red-900">{accused.name}</h5>
                                    {accused.age && (
                                      <Badge variant="outline" className="text-xs">
                                        Age: {accused.age}
                                      </Badge>
                                    )}
                                    {accused.gender && (
                                      <Badge variant="outline" className="text-xs">
                                        {accused.gender}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium text-red-800">Address:</span>
                                      <p className="text-red-700">{accused.address}</p>
                                    </div>
                                  
                                    {accused.phone && (
                                      <div>
                                        <span className="font-medium text-red-800">Phone:</span>
                                        <p className="text-red-700 flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {accused.phone}
                                        </p>
                                      </div>
                                    )}
                                  
                                    {accused.email && (
                                      <div>
                                        <span className="font-medium text-red-800">Email:</span>
                                        <p className="text-red-700 flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {accused.email}
                                        </p>
                                      </div>
                                    )}
                                  
                                    {accused.nid && (
                                      <div>
                                        <span className="font-medium text-red-800">NID:</span>
                                        <p className="text-red-700">{accused.nid}</p>
                                      </div>
                                    )}
                                  
                                    {accused.occupation && (
                                      <div>
                                        <span className="font-medium text-red-800">Occupation:</span>
                                        <p className="text-red-700">{accused.occupation}</p>
                                      </div>
                                    )}
                                  
                                    {accused.relationshipToComplainant && (
                                      <div>
                                        <span className="font-medium text-red-800">Relationship:</span>
                                        <p className="text-red-700">{accused.relationshipToComplainant}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6">
                <Card className="card-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Case Timeline
                    </CardTitle>
                    <CardDescription>
                      Chronological record of all case activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {proceedingsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="flex gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : proceedings.length > 0 ? (
                      <div className="space-y-4">
                        {proceedings.map((proceeding, index) => (
                          <div key={proceeding._id} className="flex gap-3">
                            <div className="flex-shrink-0">
                              <div className="p-2 rounded-full bg-muted">
                                {getProceedingIcon(proceeding.type)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">
                                  {proceeding.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {proceeding.createdByRole}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {proceeding.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(proceeding.createdAt)}
                              </p>
                              {proceeding.attachments && proceeding.attachments.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-1">Attachments:</p>
                                  {proceeding.attachments.map((attachment, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs mr-1">
                                      {attachment.fileName}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No timeline events available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card className="card-elegant">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Case Documents
                    </CardTitle>
                    <CardDescription>
                      All documents and evidence related to this case
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {caseDetail.allDocuments && caseDetail.allDocuments.length > 0 ? (
                      <div className="space-y-4">
                        {caseDetail.allDocuments.map((document, index) => (
                          <div key={`${document.ipfsHash}-${document.documentSource}-${index}`} className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <FileText className="h-5 w-5 text-primary mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium">{document.fileName}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {document.documentSource}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {document.createdByRole}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {document.proceedingDescription}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Size: {(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>Uploaded: {formatDateTime(document.uploadedAt)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${document.ipfsHash}`, '_blank')}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `https://gateway.pinata.cloud/ipfs/${document.ipfsHash}`;
                                    link.download = document.fileName;
                                    link.click();
                                  }}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No documents available for this case</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Court Information */}
            {caseDetail.assignedJudgeId && (
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Court Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Presiding Judge</p>
                    <p className="text-sm text-muted-foreground">{caseDetail.assignedJudgeId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Court</p>
                    <p className="text-sm text-muted-foreground">{caseDetail.assignedJudgeId.courtName}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Hearing */}
            {nextHearing && (
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Next Hearing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {formatDate(nextHearing.toISOString())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {nextHearing.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Hearings */}
            {caseDetail.hearingDates && caseDetail.hearingDates.length > 0 && (
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    All Hearings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {caseDetail.hearingDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDateTime(date)}</span>
                        {new Date(date) > new Date() && (
                          <Badge variant="secondary" className="text-xs">Upcoming</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks for your case
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/lawyers">
                    <Users className="h-4 w-4 mr-2" />
                    Find Lawyer
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/file-complaint">
                    <FileText className="h-4 w-4 mr-2" />
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
