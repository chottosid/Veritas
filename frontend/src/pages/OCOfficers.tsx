import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { 
  Users, 
  User, 
  Search,
  AlertCircle,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Badge as BadgeIcon
} from "lucide-react";

interface Officer {
  _id: string;
  name: string;
  rank: string;
  pid: string;
  station: string;
  phone?: string;
  email?: string;
  isOC: boolean;
  createdAt: string;
}

export const OCOfficers = () => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/police/oc/officers');
      setOfficers(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching officers:', err);
      setError('Failed to load officers');
      toast({
        title: "Error",
        description: "Failed to load station officers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'Inspector': 'bg-blue-100 text-blue-800',
      'Sub-Inspector': 'bg-green-100 text-green-800',
      'Assistant Sub-Inspector': 'bg-yellow-100 text-yellow-800',
      'Head Constable': 'bg-purple-100 text-purple-800',
      'Constable': 'bg-gray-100 text-gray-800'
    };
    return colors[rank] || 'bg-gray-100 text-gray-800';
  };

  const filteredOfficers = officers.filter(officer =>
    officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.pid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="w-full">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Station Officers</h1>
              <p className="text-muted-foreground">
                Manage officers in {user?.station || 'your station'}
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Officer in Charge
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search and Stats */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search officers by name, rank, or PID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Total: {filteredOfficers.length}
              </span>
              <span className="text-blue-600">
                OCs: {filteredOfficers.filter(o => o.isOC).length}
              </span>
            </div>
          </div>

          {/* Officers Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOfficers.length === 0 ? (
              <div className="col-span-full">
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Officers Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "No officers match your search." : "No officers assigned to this station."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredOfficers.map((officer) => (
                <Card key={officer._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          {officer.name}
                          {officer.isOC && (
                            <Badge variant="secondary" className="text-xs">
                              OC
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <BadgeIcon className="h-4 w-4" />
                          PID: {officer.pid}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rank</span>
                        <Badge className={getRankColor(officer.rank)}>
                          {officer.rank}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {officer.station}
                      </div>

                      {officer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {officer.phone}
                        </div>
                      )}

                      {officer.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {officer.email}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Joined {formatDate(officer.createdAt)}
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Status</span>
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Summary Statistics */}
          {officers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Station Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-blue-600">{officers.length}</p>
                    <p className="text-sm text-gray-600">Total Officers</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-600">
                      {officers.filter(o => o.isOC).length}
                    </p>
                    <p className="text-sm text-gray-600">Officer in Charge</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-purple-600">
                      {new Set(officers.map(o => o.rank)).size}
                    </p>
                    <p className="text-sm text-gray-600">Different Ranks</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-orange-600">
                      {officers.filter(o => o.rank === 'Inspector').length}
                    </p>
                    <p className="text-sm text-gray-600">Inspectors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};
