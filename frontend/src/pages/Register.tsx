import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Gavel, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore, UserRole } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { API_CONFIG } from '@/config/api';
import { OTPVerification } from '@/components/OTPVerification';

const roleConfig = {
  CITIZEN: {
    title: 'Register as Citizen',
    description: 'Create account to file complaints and track cases',
    icon: Shield,
    extraFields: []
  },
  POLICE: {
    title: 'Register as Police Officer',
    description: 'Join the law enforcement portal',
    icon: Shield,
    extraFields: ['rank', 'station', 'pid', 'isOC']
  },
  JUDGE: {
    title: 'Register as Judge',
    description: 'Access judicial management system',
    icon: Gavel,
    extraFields: ['courtName', 'rank', 'jid']
  },
  LAWYER: {
    title: 'Register as Lawyer',
    description: 'Represent clients in the digital justice system',
    icon: Users,
    extraFields: ['firmName', 'bid']
  }
};

export const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();
  
  const [role, setRole] = useState<UserRole>(
    (searchParams.get('role')?.toUpperCase() as UserRole) || 'CITIZEN'
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    // Role-specific fields
    nid: '',
    pid: '',
    jid: '',
    bid: '',
    rank: '',
    station: '',
    courtName: '',
    firmName: '',
    isOC: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  const config = roleConfig[role];
  const Icon = config.icon;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setError('Email is required to send OTP');
      return false;
    }

    setIsSendingOTP(true);
    setError('');

    try {
      const response = await api.post('/otp/send', {
        email: formData.email,
        type: 'REGISTRATION'
      });

      if (response.data.success) {
        toast({
          title: 'OTP Sent',
          description: 'A verification code has been sent to your email.',
        });
        return true;
      } else {
        setError(response.data.message || 'Failed to send OTP');
        toast({
          title: 'Failed to Send OTP',
          description: response.data.message || 'Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Failed to Send OTP',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleRegister = async (e: React.FormEvent, providedOtp?: string) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      setIsLoading(false);
      return;
    }

    // For all registrations, send OTP and show verification first
    if (!otpCode && !providedOtp) {
      const otpSent = await sendOTP();
      if (otpSent) {
        setShowOTPVerification(true);
      }
      setIsLoading(false);
      return;
    }

    try {
      const registrationData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password
      };

      // Add role-specific fields and OTP for all roles
      const otpToUse = providedOtp || otpCode;
      registrationData.otp = otpToUse; // Include the actual OTP code for all roles
      
      if (role === 'CITIZEN') {
        registrationData.nid = formData.nid;
      } else if (role === 'POLICE') {
        registrationData.pid = formData.pid;
        registrationData.rank = formData.rank;
        registrationData.station = formData.station;
        registrationData.isOC = formData.isOC;
      } else if (role === 'JUDGE') {
        registrationData.jid = formData.jid;
        registrationData.courtName = formData.courtName;
        registrationData.rank = formData.rank;
      } else if (role === 'LAWYER') {
        registrationData.bid = formData.bid;
        registrationData.firmName = formData.firmName;
      }

      const endpoint = role === 'CITIZEN' ? API_CONFIG.ENDPOINTS.CITIZENS_REGISTER :
                      role === 'POLICE' ? API_CONFIG.ENDPOINTS.POLICE_REGISTER :
                      role === 'JUDGE' ? API_CONFIG.ENDPOINTS.JUDGES_REGISTER :
                      API_CONFIG.ENDPOINTS.LAWYERS_REGISTER;

      const response = await api.post(endpoint, registrationData);
      
      if (response.data.success) {
        const userData = response.data.data;
        login({
          id: userData.id,
          name: userData.name,
          email: formData.email,
          role: role,
          nid: userData.nid,
          pid: userData.pid,
          jid: userData.jid,
          bid: userData.bid,
          rank: userData.rank,
          station: userData.station,
          courtName: userData.courtName,
          firmName: userData.firmName,
          isOC: userData.isOC
        }, userData.token);

        toast({
          title: 'Registration Successful',
          description: `Welcome to Veritas, ${userData.name}!`,
        });

        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      toast({
        title: 'Registration Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerificationSuccess = (otp: string) => {
    setOtpCode(otp); // Store the actual OTP code
    setShowOTPVerification(false);
    
    // Continue with registration immediately, passing the OTP directly
    handleRegister(new Event('submit') as any, otp);
  };

  const handleOTPBack = () => {
    setShowOTPVerification(false);
    setOtpCode('');
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        {showOTPVerification ? (
          <OTPVerification
            email={formData.email}
            onVerificationSuccess={handleOTPVerificationSuccess}
            onBack={handleOTPBack}
            type="REGISTRATION"
          />
        ) : (
          <Card className="w-full max-w-2xl card-friendly">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center shadow-soft">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
              <CardDescription className="text-base">{config.description}</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Register as</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CITIZEN">Citizen</SelectItem>
                    <SelectItem value="POLICE">Police Officer</SelectItem>
                    <SelectItem value="JUDGE">Judge</SelectItem>
                    <SelectItem value="LAWYER">Lawyer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+8801234567890"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>

              {/* Role-specific fields */}
              {role === 'CITIZEN' && (
                <div className="space-y-2">
                  <Label htmlFor="nid">National ID (NID)</Label>
                  <Input
                    id="nid"
                    type="text"
                    placeholder="Enter your 13-digit NID"
                    value={formData.nid}
                    onChange={(e) => handleInputChange('nid', e.target.value)}
                    required
                  />
                </div>
              )}

              {role === 'POLICE' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pid">Police ID</Label>
                      <Input
                        id="pid"
                        type="text"
                        placeholder="Enter your Police ID"
                        value={formData.pid}
                        onChange={(e) => handleInputChange('pid', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rank">Rank</Label>
                      <Input
                        id="rank"
                        type="text"
                        placeholder="e.g., Inspector, Sub-Inspector"
                        value={formData.rank}
                        onChange={(e) => handleInputChange('rank', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station">Police Station</Label>
                    <Input
                      id="station"
                      type="text"
                      placeholder="Enter your police station"
                      value={formData.station}
                      onChange={(e) => handleInputChange('station', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isOC"
                      checked={formData.isOC}
                      onCheckedChange={(checked) => handleInputChange('isOC', !!checked)}
                    />
                    <Label htmlFor="isOC">I am an Officer in Charge (OC)</Label>
                  </div>
                </>
              )}

              {role === 'JUDGE' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jid">Judge ID</Label>
                      <Input
                        id="jid"
                        type="text"
                        placeholder="Enter your Judge ID"
                        value={formData.jid}
                        onChange={(e) => handleInputChange('jid', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rank">Rank</Label>
                      <Input
                        id="rank"
                        type="text"
                        placeholder="e.g., Metropolitan Judge"
                        value={formData.rank}
                        onChange={(e) => handleInputChange('rank', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courtName">Court Name</Label>
                    <Input
                      id="courtName"
                      type="text"
                      placeholder="Enter your court name"
                      value={formData.courtName}
                      onChange={(e) => handleInputChange('courtName', e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {role === 'LAWYER' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bid">Bar ID</Label>
                      <Input
                        id="bid"
                        type="text"
                        placeholder="Enter your Bar ID"
                        value={formData.bid}
                        onChange={(e) => handleInputChange('bid', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firmName">Law Firm</Label>
                      <Input
                        id="firmName"
                        type="text"
                        placeholder="Enter your law firm name"
                        value={formData.firmName}
                        onChange={(e) => handleInputChange('firmName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full btn-hero" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                to={`/login${role ? `?role=${role.toLowerCase()}` : ''}`}
                className="text-primary hover:underline font-medium"
              >
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </Layout>
  );
};