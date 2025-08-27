import { useState, useEffect } from 'react';
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
  MapPin
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
  hearingDates: string[];
  verdict?: string;
  createdAt: string;
}

export const JudgeCases = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
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
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedCase(case_)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
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
