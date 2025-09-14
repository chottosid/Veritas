import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: (otp: string) => void;
  onBack: () => void;
  type?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
}

export const OTPVerification = ({ email, onVerificationSuccess, onBack, type = 'REGISTRATION' }: OTPVerificationProps) => {
  const { toast } = useToast();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/otp/verify', {
        email,
        otp,
        type
      });

      if (response.data.success) {
        setIsRedirecting(true);
        toast({
          title: 'Email Verified',
          description: 'Your email has been successfully verified! Redirecting...',
        });
        
        // Add a small delay to show the success message
        setTimeout(() => {
          onVerificationSuccess(otp);
        }, 1500);
      } else {
        setError(response.data.message || 'Verification failed');
        toast({
          title: 'Verification Failed',
          description: response.data.message || 'Invalid OTP. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const resendOTP = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await api.post('/otp/resend', {
        email,
        type
      });

      if (response.data.success) {
        toast({
          title: 'OTP Resent',
          description: 'A new verification code has been sent to your email.',
        });
        setOtp(''); // Clear the current OTP input
      } else {
        setError(response.data.message || 'Failed to resend OTP');
        toast({
          title: 'Resend Failed',
          description: response.data.message || 'Failed to resend OTP. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Resend Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    
    setIsResending(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle className="text-xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="otp">Enter 6-digit verification code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtp(value);
            }}
            maxLength={6}
            className="text-center text-lg tracking-widest"
            disabled={isLoading || isRedirecting}
          />
          <p className="text-sm text-muted-foreground text-center">
            Code sent to <span className="font-medium">{email}</span>
          </p>
        </div>

        <div className="space-y-3">
          {isRedirecting ? (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting to dashboard...</span>
              </div>
              <p className="text-sm text-muted-foreground">Please wait while we complete your registration</p>
            </div>
          ) : (
            <Button
              onClick={verifyOTP}
              disabled={isLoading || otp.length !== 6}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
          )}

          {!isRedirecting && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={resendOTP}
                disabled={isResending || isLoading}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Code
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={onBack}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  );
};
