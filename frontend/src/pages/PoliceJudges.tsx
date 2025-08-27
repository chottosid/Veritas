import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface Judge {
  _id: string;
  name: string;
  courtName: string;
  jid: string;
}

export function PoliceJudges() {
  const { user, token } = useAuthStore();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchJudges();
  }, []);

  const fetchJudges = async () => {
    try {
      setLoading(true);
      const response = await api.get('/police/judges');
      
      if (response.data.success) {
        setJudges(response.data.data || []);
      } else {
        throw new Error('Failed to fetch judges');
      }
    } catch (error) {
      console.error('Error fetching judges:', error);
      toast.error("Failed to load judges");
    } finally {
      setLoading(false);
    }
  };

  const filteredJudges = judges.filter(judge =>
    judge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    judge.courtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    judge.jid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-lg text-muted-foreground">Loading judges...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Judges Directory</h1>
            <p className="text-muted-foreground">
              Browse and contact judges for case proceedings
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredJudges.length} judge{filteredJudges.length !== 1 ? 's' : ''} found
          </Badge>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">
                  Search judges
                </Label>
                <Input
                  id="search"
                  placeholder="Search by name, court, or judge ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Judges Grid */}
        {filteredJudges.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No judges found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No judges match your search criteria." : "No judges are currently available."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJudges.map((judge) => (
              <Card key={judge._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{judge.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {judge.jid}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      ACTIVE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{judge.courtName}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        toast.info("Contact information not available in current system");
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.info("Judge profile feature coming soon");
                      }}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
