import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Scale, Shield, Gavel, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore, UserRole } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { API_CONFIG } from '@/config/api';

const roleConfig = {
  CITIZEN: {
    title: 'Citizen Login',
    description: 'Access your complaints and cases',
    icon: Shield,
    placeholder: 'Enter your NID',
    field: 'nid'
  },
  POLICE: {
    title: 'Police Officer Login',
    description: 'Manage investigations and complaints',
    icon: Shield,
    placeholder: 'Enter your Police ID',
    field: 'pid'
  },
  JUDGE: {
    title: 'Judge Login',
    description: 'Review FIRs and manage cases',
    icon: Gavel,
    placeholder: 'Enter your Judge ID',
    field: 'jid'
  },
  LAWYER: {
    title: 'Lawyer Login',
    description: 'Represent clients and manage cases',
    icon: Users,
    placeholder: 'Enter your Bar ID',
    field: 'bid'
  }
};

export const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();
  
  const [role, setRole] = useState<UserRole>(
    (searchParams.get('role')?.toUpperCase() as UserRole) || 'CITIZEN'
  );
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const config = roleConfig[role];
  const Icon = config.icon;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginData = {
        [config.field]: identifier,
        password
      };

      const endpoint = role === 'CITIZEN' ? API_CONFIG.ENDPOINTS.CITIZENS_LOGIN :
                      role === 'POLICE' ? API_CONFIG.ENDPOINTS.POLICE_LOGIN :
                      role === 'JUDGE' ? API_CONFIG.ENDPOINTS.JUDGES_LOGIN :
                      API_CONFIG.ENDPOINTS.LAWYERS_LOGIN;

      const response = await api.post(endpoint, loginData);
      
      if (response.data.success) {
        const userData = response.data.data;
        login({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: role,
          [config.field]: userData[config.field],
          rank: userData.rank,
          station: userData.station,
          courtName: userData.courtName,
          firmName: userData.firmName,
          isOC: userData.isOC
        }, userData.token);

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userData.name}!`,
        });

        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md card-elegant">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Login as</Label>
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

              {/* Identifier Input */}
              <div className="space-y-2">
                <Label htmlFor="identifier">
                  {role === 'CITIZEN' ? 'National ID' :
                   role === 'POLICE' ? 'Police ID' :
                   role === 'JUDGE' ? 'Judge ID' : 'Bar ID'}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={config.placeholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <Link 
                to="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot your password?
              </Link>
              <div className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to={`/register${role ? `?role=${role.toLowerCase()}` : ''}`}
                  className="text-primary hover:underline font-medium"
                >
                  Register here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};