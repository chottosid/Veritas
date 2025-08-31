import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { Layout } from '../components/layout/Layout';
import { 
  FileText, 
  Search, 
  Check, 
  X, 
  Clock,
  User,
  Phone,
  Scale,
  AlertCircle,
  Filter
} from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { useAuthStore } from '../store/authStore';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface LawyerRequest {
  _id: string;
  id?: string; // For backward compatibility
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  citizenId: {
    name: string;
    nid: string;
    phone: string;
  };
  caseId: {
    caseNumber: string;
  };
  message?: string;
  createdAt: string;
}

const LawyerRequests: React.FC = () => {
  const [requests, setRequests] = useState<LawyerRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LawyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<LawyerRequest | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.LAWYERS_REQUESTS),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = requests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.citizenId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.caseId.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.citizenId.nid.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleRequestAction = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      setActionLoading(requestId);
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.ENDPOINTS.LAWYERS_REQUESTS}/${requestId}`),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Update the request in the local state
        setRequests(prev => 
          prev.map(request => 
            request._id === requestId 
              ? { ...request, status }
              : request
          )
        );

        toast({
          title: status === 'ACCEPTED' ? "Request Accepted" : "Request Rejected",
          description: status === 'ACCEPTED' 
            ? `You have agreed to represent ${requests.find(r => r._id === requestId)?.citizenId.name} in case ${requests.find(r => r._id === requestId)?.caseId.caseNumber}. The client will be notified.`
            : `You have declined the request from ${requests.find(r => r._id === requestId)?.citizenId.name}. The client will be notified.`,
        });
      } else {
        throw new Error(`Failed to ${status.toLowerCase()} request`);
      }
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status.toLowerCase()} request`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'ACCEPTED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
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

  const getRequestStats = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const accepted = requests.filter(r => r.status === 'ACCEPTED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;
    
    return { total, pending, accepted, rejected };
  };

  const stats = getRequestStats();

  if (loading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lawyer Requests</h1>
            <p className="text-gray-600 mt-1">Manage client requests for representation</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
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
                  placeholder="Search by client name, case number, or NID..."
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
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Requests ({filteredRequests.length})</CardTitle>
            <CardDescription>
              {statusFilter === 'ALL' ? 'All requests' : `${statusFilter.toLowerCase()} requests`} from clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <div key={request._id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{request.citizenId.name}</span>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            <span>Case: {request.caseId.caseNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>NID: {request.citizenId.nid}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{request.citizenId.phone}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Requested on {formatDate(request.createdAt)}
                        </div>

                        {request.message && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">{request.message}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Request Details</DialogTitle>
                              <DialogDescription>
                                Client request for legal representation
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Client Name</label>
                                    <p className="text-sm text-gray-900">{selectedRequest.citizenId.name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Case Number</label>
                                    <p className="text-sm text-gray-900">{selectedRequest.caseId.caseNumber}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">NID</label>
                                    <p className="text-sm text-gray-900">{selectedRequest.citizenId.nid}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Phone</label>
                                    <p className="text-sm text-gray-900">{selectedRequest.citizenId.phone}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Requested On</label>
                                    <p className="text-sm text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                                  </div>
                                </div>
                                {selectedRequest.message && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Message</label>
                                    <div className="mt-1 bg-gray-50 p-3 rounded-lg">
                                      <p className="text-sm text-gray-700">{selectedRequest.message}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {request.status === 'PENDING' && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  disabled={actionLoading === request._id}
                                  className="gap-2"
                                >
                                  <Check className="h-4 w-4" />
                                  Accept
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Accept Legal Representation Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to accept the request from {request.citizenId.name} for case {request.caseId.caseNumber}? 
                                    This will establish you as their legal representative for this case.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRequestAction(request._id, 'ACCEPTED')}
                                    disabled={actionLoading === request._id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {actionLoading === request._id ? 'Accepting...' : 'Accept Request'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading === request._id}
                                  className="gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Legal Representation Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject the request from {request.citizenId.name} for case {request.caseId.caseNumber}?
                                    The client will be notified of your decision.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRequestAction(request._id, 'REJECTED')}
                                    disabled={actionLoading === request._id}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {actionLoading === request._id ? 'Rejecting...' : 'Reject Request'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'ALL' 
                      ? 'Try adjusting your filters to see more requests.'
                      : 'You haven\'t received any client requests yet.'
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

export default LawyerRequests;
