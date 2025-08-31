import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: (otp: string) => void;
  onBack: () => void;
}

export const OTPVerification = ({ email, onVerificationSuccess, onBack }: OTPVerificationProps) => {
  const { toast } = useToast();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');

  const verifyOTP = () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simple mock OTP verification
    if (otp === '661233') {
      setIsRedirecting(true);
      toast({
        title: 'Email Verified',
        description: 'Your email has been successfully verified! Redirecting to dashboard...',
      });
      
      // Add a small delay to show the success message
      setTimeout(() => {
        onVerificationSuccess(otp);
      }, 1500);
    } else {
      setError('Invalid OTP. Please enter the correct verification code (661233).');
      toast({
        title: 'Verification Failed',
        description: 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
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
          />
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
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>


      </CardContent>
    </Card>
  );
};
