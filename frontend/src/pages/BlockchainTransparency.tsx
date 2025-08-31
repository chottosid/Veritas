import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Shield, 
  Search, 
  Database, 
  Network, 
  Hash,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import BlockchainDashboard from '@/components/BlockchainDashboard';
import CaseTransparencyPortal from '@/components/CaseTransparencyPortal';

const BlockchainTransparency: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleExploreCases = () => {
    setActiveTab('transparency');
  };

  const handleViewOnExplorer = () => {
    // Open blockchain explorer in new tab
    const explorerUrl = 'https://www.oklink.com/amoy';
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Blockchain Transparency
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience the future of transparent and verifiable legal case management. 
          Our blockchain-based system ensures immutability, credibility, and public verification.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Network className="h-3 w-3 mr-1" />
            Polygon Amoy Testnet
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Database className="h-3 w-3 mr-1" />
            Real-time Updates
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Shield className="h-3 w-3 mr-1" />
            Immutable Records
          </Badge>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Live Blockchain Status</CardTitle>
            <CardDescription>
              Real-time monitoring of blockchain network status, gas prices, and transaction activity
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Case Verification Portal</CardTitle>
            <CardDescription>
              Public verification portal for cases and evidence with blockchain proof
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Hash className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>
              Complete audit trail and transaction history for all legal actions
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Blockchain Dashboard
          </TabsTrigger>
          <TabsTrigger value="transparency" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Case Transparency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <BlockchainDashboard />
        </TabsContent>

        <TabsContent value="transparency" className="space-y-6">
          <CaseTransparencyPortal />
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Experience Transparency?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join us in building a more transparent and credible legal system. 
            Our blockchain technology ensures that every action is verifiable and immutable.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleExploreCases}
            >
              Explore Cases
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleViewOnExplorer}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Technical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Technical Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Blockchain Network</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="font-mono">Polygon Amoy Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span>Chain ID:</span>
                  <span className="font-mono">80002</span>
                </div>
                <div className="flex justify-between">
                  <span>Consensus:</span>
                  <span>Proof of Stake</span>
                </div>
                <div className="flex justify-between">
                  <span>Block Time:</span>
                  <span>~2 seconds</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Smart Contract</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Language:</span>
                  <span>Solidity 0.8.24</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard:</span>
                  <span>ERC-20 Compatible</span>
                </div>
                <div className="flex justify-between">
                  <span>Security:</span>
                  <span>Access Control</span>
                </div>
                <div className="flex justify-between">
                  <span>Upgradeable:</span>
                  <span>Yes</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainTransparency;
