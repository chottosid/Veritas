import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Shield, 
  Hash,
  ExternalLink,
  Eye,
  Download,
  Copy,
  Verified,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface CaseVerification {
  caseId: string;
  verification: {
    verified: boolean;
    timestamp: string;
    blockchainHash: string;
  };
  metadata: {
    caseNumber: string;
    status: string;
    createdAt: number;
    lastUpdated: number;
    assignedJudge: string;
    investigatingOfficer: string;
    isActive: boolean;
  };
  evidence: Array<{
    evidenceId: string;
    type: string;
    ipfsHash: string;
    description: string;
    submittedAt: string;
    verified: boolean;
  }>;
  documents: Array<{
    documentId: string;
    type: string;
    ipfsHash: string;
    description: string;
    submittedAt: string;
    submittedBy: string;
    verified: boolean;
  }>;
  updates: Array<{
    type: string;
    description: string;
    actor: string;
    timestamp: string;
    metadata: string;
  }>;
  blockchain: {
    network: string;
    contractAddress: string;
    lastVerified: string;
  };
}

interface EvidenceVerification {
  evidenceId: string;
  verification: {
    verified: boolean;
    timestamp: string;
    blockchainHash: string;
  };
  blockchain: {
    network: string;
    contractAddress: string;
    lastVerified: string;
  };
}

const CaseTransparencyPortal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [caseVerification, setCaseVerification] = useState<CaseVerification | null>(null);
  const [evidenceVerification, setEvidenceVerification] = useState<EvidenceVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('case');

  const searchCase = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a case ID or number to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setCaseVerification(null);

    try {
      const response = await api.get(`/blockchain/verify/case/${searchQuery}`);
      setCaseVerification(response.data.data);
      setActiveTab('case');
      toast({
        title: "Case Found",
        description: "Case verification completed successfully",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify case';
      setError(errorMessage);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchEvidence = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter an evidence ID to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setEvidenceVerification(null);

    try {
      const response = await api.get(`/blockchain/verify/evidence/${searchQuery}`);
      setEvidenceVerification(response.data.data);
      setActiveTab('evidence');
      toast({
        title: "Evidence Found",
        description: "Evidence verification completed successfully",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify evidence';
      setError(errorMessage);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatTimestamp = (timestamp: string | number) => {
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000).toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  const getTimeAgo = (timestamp: string | number) => {
    const now = new Date();
    const time = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'STATUS_CHANGE':
        return 'bg-blue-100 text-blue-800';
      case 'EVIDENCE_SUBMITTED':
        return 'bg-green-100 text-green-800';
      case 'HEARING_SCHEDULED':
        return 'bg-purple-100 text-purple-800';
      case 'JUDGMENT_PASSED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Case Transparency Portal</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Public verification portal for legal cases, evidence, and blockchain records. 
          Verify the authenticity and integrity of any case or evidence in our system.
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Verify
          </CardTitle>
          <CardDescription>
            Enter a case number (e.g., CASE-2025-001) or case ID to verify on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search Query</Label>
              <Input
                id="search"
                placeholder="Enter case number (e.g., CASE-2025-001)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCase()}
              />
            </div>
            <Button onClick={searchCase} disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Case
                </>
              )}
            </Button>
            <Button onClick={searchEvidence} variant="outline" disabled={loading}>
              <Eye className="h-4 w-4 mr-2" />
              Search Evidence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Tabs */}
      {caseVerification || evidenceVerification ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="case" disabled={!caseVerification}>
              Case Verification
            </TabsTrigger>
            <TabsTrigger value="evidence" disabled={!evidenceVerification}>
              Evidence Verification
            </TabsTrigger>
          </TabsList>

          {/* Case Verification Tab */}
          <TabsContent value="case" className="space-y-4">
            {caseVerification && (
              <div className="space-y-4">
                {/* Verification Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Verified className="h-5 w-5 text-green-500" />
                      Verification Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verification Result:</span>
                      <Badge 
                        variant={caseVerification.verification.verified ? 'default' : 'destructive'}
                        className="flex items-center gap-1"
                      >
                        {caseVerification.verification.verified ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            VERIFIED
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            NOT VERIFIED
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Blockchain Hash:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {caseVerification.verification.blockchainHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(caseVerification.verification.blockchainHash, 'Hash')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verified At:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(caseVerification.verification.timestamp)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Case Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Case Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Case Number</Label>
                        <p className="text-sm text-muted-foreground">{caseVerification.metadata.caseNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge className={getStatusColor(caseVerification.metadata.status)}>
                          {caseVerification.metadata.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Assigned Judge</Label>
                        <p className="text-sm text-muted-foreground">{caseVerification.metadata.assignedJudge || 'Not assigned'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Investigating Officer</Label>
                        <p className="text-sm text-muted-foreground">{caseVerification.metadata.investigatingOfficer || 'Not assigned'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(caseVerification.metadata.createdAt)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Updated</Label>
                        <p className="text-sm text-muted-foreground">
                          {getTimeAgo(caseVerification.metadata.lastUpdated)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Evidence */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Evidence ({caseVerification.evidence.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {caseVerification.evidence.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No evidence submitted yet</p>
                    ) : (
                      <div className="space-y-3">
                        {caseVerification.evidence.map((evidence, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={evidence.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {evidence.verified ? 'VERIFIED' : 'PENDING'}
                              </Badge>
                              <div>
                                <p className="font-medium text-sm">{evidence.type}</p>
                                <p className="text-xs text-muted-foreground">{evidence.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {evidence.ipfsHash}
                              </code>
                              <Button variant="ghost" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documents ({caseVerification.documents?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!caseVerification.documents || caseVerification.documents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No documents submitted yet</p>
                    ) : (
                      <div className="space-y-3">
                        {caseVerification.documents.map((document, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {document.type}
                              </Badge>
                              <div>
                                <p className="font-medium text-sm">{document.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted by {document.submittedBy} • {getTimeAgo(document.submittedAt)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {document.ipfsHash}
                              </code>
                              <Button variant="ghost" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Case Updates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Case Timeline ({caseVerification.updates.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {caseVerification.updates.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No updates recorded yet</p>
                    ) : (
                      <div className="space-y-3">
                        {caseVerification.updates.map((update, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={getUpdateTypeColor(update.type)}>
                                  {update.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {getTimeAgo(update.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{update.description}</p>
                              {update.metadata && (
                                <p className="text-xs text-muted-foreground mt-1">{update.metadata}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Blockchain Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Blockchain Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Network</Label>
                        <p className="text-sm text-muted-foreground">{caseVerification.blockchain.network}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Contract Address</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {caseVerification.blockchain.contractAddress}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(caseVerification.blockchain.contractAddress, 'Contract address')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Verified</Label>
                        <p className="text-sm text-muted-foreground">
                          {getTimeAgo(caseVerification.blockchain.lastVerified)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Evidence Verification Tab */}
          <TabsContent value="evidence" className="space-y-4">
            {evidenceVerification && (
              <div className="space-y-4">
                {/* Evidence Verification Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Verified className="h-5 w-5 text-green-500" />
                      Evidence Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Evidence ID:</span>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {evidenceVerification.evidenceId}
                      </code>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verification Result:</span>
                      <Badge 
                        variant={evidenceVerification.verification.verified ? 'default' : 'destructive'}
                        className="flex items-center gap-1"
                      >
                        {evidenceVerification.verification.verified ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            VERIFIED
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            NOT VERIFIED
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Blockchain Hash:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {evidenceVerification.verification.blockchainHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(evidenceVerification.verification.blockchainHash, 'Hash')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verified At:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(evidenceVerification.verification.timestamp)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Blockchain Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Blockchain Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Network</Label>
                        <p className="text-sm text-muted-foreground">{evidenceVerification.blockchain.network}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Contract Address</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {evidenceVerification.blockchain.contractAddress}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(evidenceVerification.blockchain.contractAddress, 'Contract address')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Verified</Label>
                        <p className="text-sm text-muted-foreground">
                          {getTimeAgo(evidenceVerification.blockchain.lastVerified)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : null}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>About This Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This transparency portal provides public access to verify the authenticity and integrity 
            of legal cases and evidence stored on our blockchain-based justice system. All data is 
            immutable and verifiable on the Polygon Amoy testnet.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-medium">Immutable Records</h3>
              <p className="text-xs text-muted-foreground">All case data is permanently stored on the blockchain</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Verified className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-medium">Public Verification</h3>
              <p className="text-xs text-muted-foreground">Anyone can verify the authenticity of cases and evidence</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-medium">Real-time Updates</h3>
              <p className="text-xs text-muted-foreground">Live updates as cases progress through the system</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaseTransparencyPortal;
