import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { API_CONFIG, getIPFSUrl } from '@/config/api';
import { 
  FileText, 
  Search, 
  Gavel, 
  User, 
  MapPin, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Eye,
  Download,
  Plus
} from 'lucide-react';

interface FIR {
  _id: string;
  firNumber: string;
  sections: string[];
  complaintId: {
    title: string;
    description: string;
    area: string;
    complainantId: {
      name: string;
      nid: string;
      phone: string;
    };
  };
  registeredBy: {
    name: string;
    pid: string;
    rank: string;
    station: string;
  };
  attachments: Array<{
    fileName: string;
    ipfsHash: string;
    fileSize?: number;
  }>;
  createdAt: string;
}

export const JudgeFIRs = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [firs, setFirs] = useState<FIR[]>([]);
  const [filteredFirs, setFilteredFirs] = useState<FIR[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFir, setSelectedFir] = useState<FIR | null>(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');

  useEffect(() => {
    fetchFirs();
  }, []);

  useEffect(() => {
    const filtered = firs.filter(fir =>
      fir.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fir.complaintId.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fir.complaintId.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fir.sections.some(section => section.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredFirs(filtered);
  }, [searchTerm, firs]);

  const fetchFirs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(API_CONFIG.ENDPOINTS.JUDGES_FIRS);
      
      if (response.data.success) {
        setFirs(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch FIRs');
      }
    } catch (err: any) {
      console.error('Error fetching FIRs:', err);
      setError(err.response?.data?.message || 'Failed to fetch FIRs');
      toast({
        title: 'Error',
        description: 'Failed to load FIRs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCase = async (firId: string) => {
    try {
      setIsCreatingCase(true);
      
      const response = await api.post(`/judges/firs/${firId}/case`, {
        caseNumber: caseNumber
      });
      
      if (response.data.success) {
        toast({
          title: 'Case Created Successfully',
          description: `Case ${caseNumber} has been created from the FIR`,
        });
        
        // Remove the FIR from the list since it's now converted to a case
        setFirs(prev => prev.filter(fir => fir._id !== firId));
        setSelectedFir(null);
        setCaseNumber('');
      } else {
        throw new Error(response.data.message || 'Failed to create case');
      }
    } catch (err: any) {
      console.error('Error creating case:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create case',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingCase(false);
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
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
            <Button onClick={fetchFirs}>Try Again</Button>
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
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">FIR Management</h1>
              <p className="text-muted-foreground">
                Review FIRs and convert them to cases
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
                placeholder="Search by FIR number, complaint title, area, or sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* FIRs List */}
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
          ) : filteredFirs.length === 0 ? (
            <Card className="card-elegant">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'No FIRs Found' : 'No FIRs Available'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'No FIRs match your search criteria.' 
                    : 'No FIRs have been submitted for review yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFirs.map((fir) => (
              <Card key={fir._id} className="card-elegant hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold">{fir.firNumber}</h3>
                        <div className="flex flex-wrap gap-2">
                          {fir.sections.map((section, index) => (
                            <Badge key={index} variant="outline">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="font-medium">{fir.complaintId.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {fir.complaintId.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{fir.complaintId.area}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{fir.registeredBy.name} ({fir.registeredBy.rank})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(fir.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedFir(fir)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              FIR Details - {selectedFir?.firNumber}
                            </DialogTitle>
                            <DialogDescription>
                              Review FIR details and convert to case if appropriate
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedFir && (
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  FIR Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="text-muted-foreground">FIR Number</Label>
                                    <p className="font-medium">{selectedFir.firNumber}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Sections</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {selectedFir.sections.map((section, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {section}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Registered By</Label>
                                    <p className="font-medium">
                                      {selectedFir.registeredBy.name} ({selectedFir.registeredBy.rank})
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Station</Label>
                                    <p className="font-medium">{selectedFir.registeredBy.station}</p>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Complaint Details */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Complaint Details
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-muted-foreground">Title</Label>
                                    <p className="font-medium">{selectedFir.complaintId.title}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="text-sm leading-relaxed">{selectedFir.complaintId.description}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-muted-foreground">Area</Label>
                                      <p className="font-medium">{selectedFir.complaintId.area}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Date Filed</Label>
                                      <p className="font-medium">{formatDate(selectedFir.createdAt)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Complainant Information */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Complainant Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="text-muted-foreground">Name</Label>
                                    <p className="font-medium">{selectedFir.complaintId.complainantId.name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">NID</Label>
                                    <p className="font-medium">{selectedFir.complaintId.complainantId.nid}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{selectedFir.complaintId.complainantId.phone}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Attachments */}
                              {selectedFir.attachments.length > 0 && (
                                <>
                                  <Separator />
                                  <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <Download className="h-4 w-4" />
                                      Attachments
                                    </h4>
                                    <div className="space-y-2">
                                      {selectedFir.attachments.map((attachment, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                          <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                              <p className="font-medium text-sm">{attachment.fileName}</p>
                                              {attachment.fileSize && (
                                                <p className="text-xs text-muted-foreground">
                                                  {formatFileSize(attachment.fileSize)}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => window.open(getIPFSUrl(attachment.ipfsHash), '_blank')}
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            View
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}

                              <Separator />

                              {/* Create Case Section */}
                              <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Gavel className="h-4 w-4" />
                                  Convert to Case
                                </h4>
                                <div className="flex items-end gap-4">
                                  <div className="flex-1">
                                    <Label htmlFor="caseNumber">Case Number</Label>
                                    <Input
                                      id="caseNumber"
                                      placeholder="e.g., CASE-2025-001"
                                      value={caseNumber}
                                      onChange={(e) => setCaseNumber(e.target.value)}
                                    />
                                  </div>
                                  <Button 
                                    onClick={() => handleCreateCase(selectedFir._id)}
                                    disabled={isCreatingCase || !caseNumber.trim()}
                                    className="flex items-center gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    {isCreatingCase ? 'Creating...' : 'Create Case'}
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Converting this FIR to a case will remove it from the pending FIRs list and create a new case for judicial proceedings.
                                </p>
                              </div>
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
                    ? `${filteredFirs.length} of ${firs.length} FIRs match your search`
                    : `${firs.length} FIRs awaiting review`
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
