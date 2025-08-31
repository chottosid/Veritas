import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  Briefcase, 
  Search, 
  Upload, 
  Eye,
  Calendar,
  User,
  Scale,
  FileText,
  AlertCircle,
  Filter,
  Clock,
  Building2,
  Users,
  Download
} from 'lucide-react';
import { buildApiUrl, API_CONFIG, getIPFSUrl } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { toast } from '../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';

interface LawyerCase {
  _id: string;
  caseNumber: string;
  status: 'PENDING' | 'ONGOING' | 'CLOSED';
  firId: {
    firNumber: string;
    complaintId?: {
      title: string;
      complainantId: {
        name: string;
        nid: string;
        phone: string;
      };
    };
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
  investigatingOfficerIds?: Array<{
    name: string;
    rank: string;
    station: string;
  }>;
  hearingDates: string[];
  verdict?: string;
}

interface CaseDocument {
  fileName: string;
  ipfsHash: string;
  fileSize: number;
  documentType: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Proceeding {
  _id: string;
  type: string;
  createdByRole: string;
  description: string;
  metadata?: any;
  attachments: any[];
  createdAt: string;
}

const LawyerCases: React.FC = () => {
  const [cases, setCases] = useState<LawyerCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<LawyerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<LawyerCase | null>(null);
  const [caseDetails, setCaseDetails] = useState<LawyerCase | null>(null);
  const [proceedings, setProceedings] = useState<Proceeding[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [documentType, setDocumentType] = useState('EVIDENCE');
  const { token } = useAuthStore();

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cases, searchTerm, statusFilter]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.LAWYERS_CASES),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCases(data.data || []);
      } else {
        throw new Error('Failed to fetch cases');
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Error",
        description: "Failed to load cases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (caseId: string) => {
    try {
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.LAWYERS_CASES}/${caseId}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCaseDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
      toast({
        title: "Error",
        description: "Failed to load case details",
        variant: "destructive",
      });
    }
  };

  const fetchProceedings = async (caseId: string) => {
    try {
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.LAWYERS_CASES}/${caseId}/proceedings`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProceedings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching proceedings:', error);
      // Don't show error toast for proceedings as it might not be implemented
    }
  };

  const applyFilters = () => {
    let filtered = cases;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(case_ =>
        case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.firId.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.assignedJudgeId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.assignedJudgeId.courtName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(case_ => case_.status === statusFilter);
    }

    setFilteredCases(filtered);
  };

  const handleSubmitDocuments = async () => {
    if (!selectedCase || !uploadFiles || uploadFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading('upload');
      const formData = new FormData();
      
      formData.append('documentType', documentType);
      formData.append('description', uploadDescription);
      
      Array.from(uploadFiles).forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.LAWYERS_CASES}/${selectedCase._id}/documents`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Documents submitted successfully",
        });
        setShowUploadDialog(false);
        setUploadFiles(null);
        setUploadDescription('');
        setDocumentType('EVIDENCE');
      } else {
        throw new Error('Failed to submit documents');
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast({
        title: "Error",
        description: "Failed to submit documents",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCaseDetails = (case_: LawyerCase) => {
    setSelectedCase(case_);
    fetchCaseDetails(case_._id);
    fetchProceedings(case_._id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'ONGOING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Ongoing</Badge>;
      case 'CLOSED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCaseStats = () => {
    const total = cases.length;
    const pending = cases.filter(c => c.status === 'PENDING').length;
    const ongoing = cases.filter(c => c.status === 'ONGOING').length;
    const closed = cases.filter(c => c.status === 'CLOSED').length;
    
    return { total, pending, ongoing, closed };
  };

  const stats = getCaseStats();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Cases</h1>
              <p className="text-gray-600 mt-1">Manage your assigned legal cases</p>
            </div>
          </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
              <Scale className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.ongoing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by case number, FIR, judge name, or court..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>Cases ({filteredCases.length})</CardTitle>
            <CardDescription>
              {statusFilter === 'ALL' ? 'All cases' : `${statusFilter.toLowerCase()} cases`} assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCases.length > 0 ? (
                filteredCases.map((case_) => (
                  <div key={case_._id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{case_.caseNumber}</span>
                          </div>
                          {getStatusBadge(case_.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>FIR: {case_.firId.firNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Judge: {case_.assignedJudgeId.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{case_.assignedJudgeId.courtName}</span>
                          </div>
                        </div>

                        {case_.hearingDates.length > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-600">Next hearing: </span>
                            <span className="text-purple-600 font-medium">
                              {formatDate(case_.hearingDates[0])}
                            </span>
                          </div>
                        )}

                        {case_.verdict && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-gray-700">Verdict:</div>
                            <div className="text-sm text-gray-600">{case_.verdict}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewCaseDetails(case_)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Case Details - {selectedCase?.caseNumber}</DialogTitle>
                              <DialogDescription>
                                Complete information about the legal case
                              </DialogDescription>
                            </DialogHeader>
                            {caseDetails && (
                              <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Case Number</label>
                                    <p className="text-sm text-gray-900">{caseDetails.caseNumber}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <div className="mt-1">{getStatusBadge(caseDetails.status)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">FIR Number</label>
                                    <p className="text-sm text-gray-900">{caseDetails.firId.firNumber}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Judge</label>
                                    <p className="text-sm text-gray-900">{caseDetails.assignedJudgeId.name}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Court</label>
                                    <p className="text-sm text-gray-900">{caseDetails.assignedJudgeId.courtName}</p>
                                  </div>
                                </div>

                                {/* Complainant Information */}
                                {caseDetails.firId.complaintId && (
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Complainant Information</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Name</label>
                                          <p className="text-sm text-gray-900">{caseDetails.firId.complaintId.complainantId.name}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">NID</label>
                                          <p className="text-sm text-gray-900">{caseDetails.firId.complaintId.complainantId.nid}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Phone</label>
                                          <p className="text-sm text-gray-900">{caseDetails.firId.complaintId.complainantId.phone}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Case Title</label>
                                          <p className="text-sm text-gray-900">{caseDetails.firId.complaintId.title}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Legal Team */}
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900 mb-3">Legal Team</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    {caseDetails.accusedLawyerId && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Defense Lawyer</label>
                                        <p className="text-sm text-gray-900">{caseDetails.accusedLawyerId.name}</p>
                                        <p className="text-xs text-gray-600">{caseDetails.accusedLawyerId.firmName}</p>
                                      </div>
                                    )}
                                    {caseDetails.prosecutorLawyerId && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Prosecutor</label>
                                        <p className="text-sm text-gray-900">{caseDetails.prosecutorLawyerId.name}</p>
                                        <p className="text-xs text-gray-600">{caseDetails.prosecutorLawyerId.firmName}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Investigating Officers */}
                                {caseDetails.investigatingOfficerIds && caseDetails.investigatingOfficerIds.length > 0 && (
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Investigating Officers</h3>
                                    <div className="space-y-2">
                                      {caseDetails.investigatingOfficerIds.map((officer, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                          <div className="flex items-center gap-4">
                                            <div>
                                              <p className="text-sm font-medium text-gray-900">{officer.name}</p>
                                              <p className="text-xs text-gray-600">{officer.rank} - {officer.station}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Hearing Dates */}
                                {caseDetails.hearingDates.length > 0 && (
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Hearing Dates</h3>
                                    <div className="space-y-2">
                                      {caseDetails.hearingDates.map((date, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                          <Calendar className="h-4 w-4 text-gray-500" />
                                          <span>{formatDate(date)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Verdict */}
                                {caseDetails.verdict && (
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Verdict</h3>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <p className="text-sm text-blue-900">{caseDetails.verdict}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Case Proceedings */}
                                {proceedings.length > 0 && (
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Case Timeline</h3>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                      {proceedings.map((proceeding) => (
                                        <div key={proceeding.id} className="border-l-4 border-blue-200 pl-4 py-2">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900">{proceeding.type.replace('_', ' ')}</h4>
                                            <span className="text-xs text-gray-500">{formatDate(proceeding.createdAt)}</span>
                                          </div>
                                          <p className="text-sm text-gray-600">{proceeding.description}</p>
                                          <p className="text-xs text-gray-500">By: {proceeding.createdByRole}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {case_.status !== 'CLOSED' && (
                          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedCase(case_)}
                                className="gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                Submit Documents
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submit Case Documents</DialogTitle>
                                <DialogDescription>
                                  Upload documents for case {selectedCase?.caseNumber}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="documentType">Document Type</Label>
                                  <Select value={documentType} onValueChange={setDocumentType}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="EVIDENCE">Evidence</SelectItem>
                                      <SelectItem value="MOTION">Motion</SelectItem>
                                      <SelectItem value="BRIEF">Brief</SelectItem>
                                      <SelectItem value="WITNESS_STATEMENT">Witness Statement</SelectItem>
                                      <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="description">Description</Label>
                                  <Textarea
                                    id="description"
                                    placeholder="Describe the documents you're submitting..."
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="documents">Documents (Max 5 files)</Label>
                                  <Input
                                    id="documents"
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.avi"
                                    onChange={(e) => setUploadFiles(e.target.files)}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Supported formats: PDF, DOC, DOCX, JPG, PNG, MP4, AVI
                                  </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setShowUploadDialog(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleSubmitDocuments}
                                    disabled={actionLoading === 'upload'}
                                  >
                                    {actionLoading === 'upload' ? 'Uploading...' : 'Submit Documents'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'ALL' 
                      ? 'Try adjusting your filters to see more cases.'
                      : 'You haven\'t been assigned any cases yet.'
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </Layout>
  );
};

export default LawyerCases;
