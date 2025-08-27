import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Users, 
  Building, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Scale,
  Send,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Lawyer {
  _id: string;
  name: string;
  firmName: string;
  bid: string;
  specialization?: string[];
  experience?: number;
  location?: string;
  phone?: string;
  email?: string;
  rating?: number;
}

interface Case {
  _id: string;
  caseNumber: string;
  status: string;
  firId: {
    firNumber: string;
    sections?: string[];
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
}

interface LawyerRequestForm {
  lawyerId: string;
  caseId: string;
  message: string;
}

export const FindLawyer = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Request lawyer form state
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [requestForm, setRequestForm] = useState<LawyerRequestForm>({
    lawyerId: '',
    caseId: '',
    message: ''
  });
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    fetchLawyers();
    fetchCases();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = lawyers.filter(
        (lawyer) =>
          lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lawyer.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lawyer.bid.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLawyers(filtered);
    } else {
      setFilteredLawyers(lawyers);
    }
  }, [searchTerm, lawyers]);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/citizens/lawyers');
      
      if (response.data.success) {
        setLawyers(response.data.data);
        setFilteredLawyers(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch lawyers');
      }
    } catch (err: any) {
      console.error('Error fetching lawyers:', err);
      setError(err.response?.data?.message || 'Failed to fetch lawyers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      setCasesLoading(true);
      const response = await api.get('/citizens/cases');
      
      if (response.data.success) {
        // Only show cases that don't have a lawyer assigned yet
        const availableCases = response.data.data.filter((caseItem: Case) => 
          !caseItem.accusedLawyerId && caseItem.status !== 'CLOSED'
        );
        setCases(availableCases);
      }
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      // Don't show error for cases - it's optional functionality
    } finally {
      setCasesLoading(false);
    }
  };

  const handleRequestLawyer = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setRequestForm({
      lawyerId: lawyer._id,
      caseId: '',
      message: `Dear ${lawyer.name},\n\nI would like to request your legal representation for my case. Please review the case details and let me know if you can assist me.\n\nThank you for your consideration.`
    });
    setShowRequestDialog(true);
  };

  const submitLawyerRequest = async () => {
    if (!requestForm.caseId || !requestForm.message.trim()) {
      toast({
        title: "Error",
        description: "Please select a case and provide a message",
        variant: "destructive"
      });
      return;
    }

    try {
      setRequestLoading(true);
      
      const response = await api.post(`/citizens/cases/${requestForm.caseId}/request-lawyer`, {
        lawyerId: requestForm.lawyerId,
        message: requestForm.message
      });

      if (response.data.success) {
        toast({
          title: "Request Sent Successfully",
          description: `Your request has been sent to ${selectedLawyer?.name}. You will be notified when they respond.`,
        });
        setShowRequestDialog(false);
        setRequestForm({ lawyerId: '', caseId: '', message: '' });
      } else {
        throw new Error(response.data.message || 'Failed to send request');
      }
    } catch (err: any) {
      console.error('Error sending lawyer request:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to send lawyer request',
        variant: "destructive"
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleContactLawyer = (lawyer: Lawyer) => {
    // This could open a contact modal or navigate to a contact form
    // For now, we'll show an alert with contact info
    if (lawyer.phone) {
      window.open(`tel:${lawyer.phone}`, '_blank');
    } else if (lawyer.email) {
      window.open(`mailto:${lawyer.email}`, '_blank');
    } else {
      alert(`Contact ${lawyer.name} at ${lawyer.firmName}`);
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="card-elegant">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchLawyers}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Find Lawyer</h1>
              <p className="text-muted-foreground">
                Browse available lawyers and get legal representation
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, firm, or bar ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredLawyers.length}</p>
                  <p className="text-sm text-muted-foreground">Available Lawyers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(lawyers.map(l => l.firmName)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Law Firms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4.8</p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lawyers Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredLawyers.length === 0 ? (
          <Card className="card-elegant">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Lawyers Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "No lawyers match your search criteria. Try adjusting your search terms."
                  : "No lawyers are currently available in the system."
                }
              </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm("")} variant="outline">
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map((lawyer) => (
              <Card key={lawyer._id} className="card-elegant hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{lawyer.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building className="h-3 w-3" />
                        {lawyer.firmName}
                      </CardDescription>
                    </div>
                    {lawyer.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{lawyer.rating}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Bar ID */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      BAR ID: {lawyer.bid}
                    </Badge>
                  </div>

                  {/* Specialization */}
                  {lawyer.specialization && lawyer.specialization.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Specialization:</p>
                      <div className="flex flex-wrap gap-1">
                        {lawyer.specialization.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {lawyer.experience && (
                    <p className="text-sm text-muted-foreground">
                      {lawyer.experience} years of experience
                    </p>
                  )}

                  {/* Location */}
                  {lawyer.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {lawyer.location}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1">
                    {lawyer.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lawyer.phone}
                      </div>
                    )}
                    {lawyer.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {lawyer.email}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleContactLawyer(lawyer)}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                    <Button 
                      onClick={() => handleRequestLawyer(lawyer)}
                      className="flex-1"
                      size="sm"
                      disabled={cases.length === 0}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Request Lawyer Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Legal Representation</DialogTitle>
              <DialogDescription>
                Send a request to {selectedLawyer?.name} from {selectedLawyer?.firmName} for legal representation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Case Selection */}
              <div className="space-y-2">
                <Label htmlFor="case">Select Case</Label>
                {casesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : cases.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      You don't have any cases available for lawyer requests. Cases must be created from FIRs to request legal representation.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select 
                    value={requestForm.caseId} 
                    onValueChange={(value) => setRequestForm(prev => ({ ...prev, caseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a case" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((caseItem) => (
                        <SelectItem key={caseItem._id} value={caseItem._id}>
                          <div className="flex items-center gap-2">
                            <Scale className="h-3 w-3" />
                            <span>{caseItem.caseNumber}</span>
                            <span className="text-xs text-muted-foreground">
                              (FIR: {caseItem.firId.firNumber})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Explain why you need legal representation..."
                  value={requestForm.message}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRequestDialog(false)}
                  disabled={requestLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitLawyerRequest}
                  disabled={requestLoading || !requestForm.caseId || !requestForm.message.trim()}
                >
                  {requestLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
