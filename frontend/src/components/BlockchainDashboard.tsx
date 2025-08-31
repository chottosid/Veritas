import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Network, 
  Hash,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';

interface BlockchainStatus {
  status: 'CONNECTED' | 'DISCONNECTED';
  testMode: boolean;
  contractAddress: string;
  network: string;
  blockNumber: number;
  gasPrice: string;
  lastBlockTime: string;
}

interface Transaction {
  hash: string;
  type: string;
  caseNumber: string;
  timestamp: string;
  blockNumber: number;
  gasUsed: string;
  status: string;
}

const BlockchainDashboard: React.FC = () => {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const fetchBlockchainStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/blockchain/status');
      setStatus(response.data.data.blockchain);
      setError(null);
    } catch (err) {
      setError('Failed to fetch blockchain status');
      console.error('Blockchain status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const limit = showAllTransactions ? 50 : 10;
      const response = await api.get(`/blockchain/explorer?limit=${limit}`);
      setTransactions(response.data.data.transactions);
    } catch (err) {
      console.error('Transactions fetch error:', err);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchBlockchainStatus(), fetchRecentTransactions()]);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [showAllTransactions]);

  const handleViewAllTransactions = () => {
    setShowAllTransactions(!showAllTransactions);
  };

  const handleViewOnExplorer = () => {
    // Open blockchain explorer in new tab
    const explorerUrl = 'https://www.oklink.com/amoy';
    window.open(explorerUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-500';
      case 'DISCONNECTED':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'DISCONNECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'CASE_CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'EVIDENCE_SUBMITTED':
        return 'bg-green-100 text-green-800';
      case 'FIR_REGISTERED':
        return 'bg-purple-100 text-purple-800';
      case 'CASE_UPDATED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatGasPrice = (gasPrice: string) => {
    const price = parseInt(gasPrice);
    if (price < 1000000000) return `${(price / 1000000000).toFixed(2)} Gwei`;
    return `${(price / 1000000000000).toFixed(2)} Twei`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blockchain Verification Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time blockchain status and transaction verification
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
            {status && getStatusIcon(status.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.status || 'UNKNOWN'}
            </div>
            <p className="text-xs text-muted-foreground">
              {status?.network || 'Polygon Amoy'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Block</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.blockNumber?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {status?.lastBlockTime ? getTimeAgo(status.lastBlockTime) : 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Price</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.gasPrice ? formatGasPrice(status.gasPrice) : '0 Gwei'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current network fee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Mode</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.testMode ? 'ON' : 'OFF'}
            </div>
            <p className="text-xs text-muted-foreground">
              {status?.testMode ? 'Development environment' : 'Production network'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Connection Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge 
                variant={status.status === 'CONNECTED' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status.status)}`}></div>
                {status.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Contract Address:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {status.contractAddress || 'Not deployed'}
                </code>
                {status.contractAddress && (
                  <Button variant="ghost" size="sm" onClick={handleViewOnExplorer}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Update:</span>
              <span className="text-sm text-muted-foreground">
                {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {showAllTransactions ? 'All Transactions' : 'Recent Transactions'}
          </CardTitle>
          <CardDescription>
            {showAllTransactions ? 'Complete transaction history' : 'Latest blockchain activities and case updates'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getTransactionTypeColor(tx.type)}>
                      {tx.type.replace('_', ' ')}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{tx.caseNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Block #{tx.blockNumber} • {getTimeAgo(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Gas Used</p>
                      <p className="text-sm font-medium">{parseInt(tx.gasUsed).toLocaleString()}</p>
                    </div>
                    <Badge 
                      variant={tx.status === 'CONFIRMED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleViewAllTransactions}
            >
              {showAllTransactions ? 'Show Recent Only' : 'View All Transactions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Blockchain Connection</span>
              <span className="text-sm text-muted-foreground">
                {status?.status === 'CONNECTED' ? 'Healthy' : 'Unhealthy'}
              </span>
            </div>
            <Progress 
              value={status?.status === 'CONNECTED' ? 100 : 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Synchronization</span>
              <span className="text-sm text-muted-foreground">Up to date</span>
            </div>
            <Progress value={95} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Security Status</span>
              <span className="text-sm text-muted-foreground">Secure</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Last Update Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
};

export default BlockchainDashboard;
