import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { Search, Users, Building, Star, Phone, Mail, MapPin } from "lucide-react";

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

export const FindLawyer = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLawyers();
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
                      className="flex-1"
                      size="sm"
                    >
                      Contact
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implement view profile functionality
                        alert('Profile view coming soon!');
                      }}
                    >
                      View Profile
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
};
