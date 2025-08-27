import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/layout/Layout";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { API_CONFIG } from "@/config/api";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Shield,
  Clock
} from "lucide-react";

interface CitizenProfile {
  _id: string;
  name: string;
  address: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  nid: string;
  createdAt: string;
}

interface PoliceProfile {
  _id: string;
  name: string;
  address: string;
  pid: string;
  rank: string;
  station: string;
  isOC: boolean;
  phone?: string;
  email?: string;
  createdAt: string;
}

interface JudgeProfile {
  _id: string;
  name: string;
  address: string;
  jid: string;
  courtName: string;
  rank: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

interface LawyerProfile {
  _id: string;
  name: string;
  address: string;
  bid: string;
  firmName: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

type UserProfile = CitizenProfile | PoliceProfile | JudgeProfile | LawyerProfile;

export const Profile = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const getProfileEndpoint = () => {
    switch (user?.role) {
      case 'POLICE':
        return API_CONFIG.ENDPOINTS.POLICE_PROFILE;
      case 'JUDGE':
        return API_CONFIG.ENDPOINTS.JUDGES_PROFILE;
      case 'LAWYER':
        return API_CONFIG.ENDPOINTS.LAWYERS_PROFILE;
      default:
        return API_CONFIG.ENDPOINTS.CITIZENS_PROFILE;
    }
  };

  const isPoliceProfile = (profile: UserProfile): profile is PoliceProfile => {
    return 'pid' in profile;
  };

  const isCitizenProfile = (profile: UserProfile): profile is CitizenProfile => {
    return 'nid' in profile;
  };

  const isJudgeProfile = (profile: UserProfile): profile is JudgeProfile => {
    return 'jid' in profile;
  };

  const isLawyerProfile = (profile: UserProfile): profile is LawyerProfile => {
    return 'bid' in profile;
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'POLICE':
        return user.isOC ? 'Officer in Charge' : 'Police Officer';
      case 'JUDGE':
        return 'Judge';
      case 'LAWYER':
        return 'Lawyer';
      case 'CITIZEN':
      default:
        return 'Citizen';
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = getProfileEndpoint();
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setEditForm({
          name: profileData.name || "",
          address: profileData.address || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
        });
      } else {
        setError(response.data.message || 'Failed to fetch profile');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setEditForm({
        name: profile.name || "",
        address: profile.address || "",
        phone: profile.phone || "",
        email: profile.email || "",
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const endpoint = getProfileEndpoint();
      const response = await api.put(endpoint, editForm);
      
      if (response.data.success) {
        setProfile({ ...profile!, ...editForm });
        setEditing(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getAccountAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years === 1 ? '' : 's'}`;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-48" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-48" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center mt-4">
              <Button onClick={fetchProfile}>Try Again</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-muted-foreground">
                  Manage your personal information and account settings
                </p>
              </div>
            </div>
            
            {!editing && (
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="card-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    {editing && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email address"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={editForm.address}
                          onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter your full address"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                          <p className="font-medium">{profile.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{profile.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                          <p className="font-medium">{profile.email || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      {isCitizenProfile(profile) && profile.dateOfBirth && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                            <p className="font-medium">
                              {formatDate(profile.dateOfBirth)} ({calculateAge(profile.dateOfBirth)} years old)
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 md:col-span-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Address</p>
                          <p className="font-medium">{profile.address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Government Information */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {isPoliceProfile(profile) ? 'Service Information' : 
                     isJudgeProfile(profile) ? 'Court Information' :
                     isLawyerProfile(profile) ? 'Professional Information' :
                     'Government Information'}
                  </CardTitle>
                  <CardDescription>
                    Official identification details (read-only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isCitizenProfile(profile) && (
                    <>
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">National ID (NID)</p>
                          <p className="font-medium text-lg">{profile.nid}</p>
                        </div>
                      </div>
                      
                      {profile.dateOfBirth && (
                        <>
                          <Separator />
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                              <p className="font-medium text-lg">
                                {new Date(profile.dateOfBirth).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  
                  {isPoliceProfile(profile) && (
                    <>
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Police ID (PID)</p>
                          <p className="font-medium text-lg">{profile.pid}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Rank</p>
                          <p className="font-medium text-lg">{profile.rank}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Station</p>
                          <p className="font-medium text-lg">{profile.station}</p>
                        </div>
                      </div>
                      
                      {profile.isOC && (
                        <>
                          <Separator />
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              Officer in Charge (OC)
                            </Badge>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {isJudgeProfile(profile) && (
                    <>
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Judge ID (JID)</p>
                          <p className="font-medium text-lg">{profile.jid}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Rank</p>
                          <p className="font-medium text-lg">{profile.rank}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Court Name</p>
                          <p className="font-medium text-lg">{profile.courtName}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {isLawyerProfile(profile) && (
                    <>
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Bar ID (BID)</p>
                          <p className="font-medium text-lg">{profile.bid}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Law Firm</p>
                          <p className="font-medium text-lg">{profile.firmName}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Role</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {getRoleDisplayName()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account Status</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verification</span>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Verified
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Member since</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(profile.createdAt)} ({getAccountAge(profile.createdAt)} ago)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Completion */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Profile Completion</CardTitle>
                  <CardDescription>
                    Complete your profile for better experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Basic Info</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Phone Number</span>
                      {profile.phone ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Address</span>
                      {profile.email ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(((profile.phone ? 1 : 0) + (profile.email ? 1 : 0) + 1) / 3 * 100)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
