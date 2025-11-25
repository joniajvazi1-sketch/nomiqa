import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EmailVerificationProps {
  email: string;
  type: 'registration' | 'password_reset' | 'affiliate';
  onVerified: (token?: string) => void;
  onBack?: () => void;
}

export const EmailVerification = ({ email, type, onVerified, onBack }: EmailVerificationProps) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: { email, code, type }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Email verified successfully!");
      // Pass the code as token for password reset flow
      onVerified(type === 'password_reset' ? code : undefined);
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Failed to verify code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      const { error } = await supabase.functions.invoke('resend-verification-code', {
        body: { email, type }
      });

      if (error) throw error;

      toast.success("Code resent! Check your email.");
      setCanResend(false);
      setResendCountdown(60);
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error("Failed to resend code");
    }
  };

  const getTitleText = () => {
    switch (type) {
      case 'registration':
        return 'Verify Your Email';
      case 'password_reset':
        return 'Enter Reset Code';
      case 'affiliate':
        return 'Verify Affiliate Account';
    }
  };

  const getDescriptionText = () => {
    return `Enter the 6-digit code sent to ${email}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-background/40 backdrop-blur-xl border-white/10">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <img 
            src="/nomiqa-logo.jpg" 
            alt="Nomiqa" 
            className="w-24 h-24 rounded-full border-2 border-neon-violet"
          />
        </div>
        <CardTitle className="text-2xl bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
          {getTitleText()}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {getDescriptionText()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <InputOTP 
            maxLength={6} 
            value={code} 
            onChange={setCode}
            disabled={isVerifying}
          >
            <InputOTPGroup className="gap-3">
              <InputOTPSlot 
                index={0} 
                className="w-12 h-14 text-xl border-neon-cyan/30 bg-white/5 backdrop-blur-sm focus:border-neon-cyan"
              />
              <InputOTPSlot 
                index={1} 
                className="w-12 h-14 text-xl border-neon-cyan/30 bg-white/5 backdrop-blur-sm focus:border-neon-cyan"
              />
              <InputOTPSlot 
                index={2} 
                className="w-12 h-14 text-xl border-neon-cyan/30 bg-white/5 backdrop-blur-sm focus:border-neon-cyan"
              />
              <InputOTPSlot 
                index={3} 
                className="w-12 h-14 text-xl border-neon-cyan/30 bg-white/5 backdrop-blur-sm focus:border-neon-cyan"
              />
              <InputOTPSlot 
                index={4} 
                className="w-12 h-14 text-xl border-neon-cyan/30 bg-white/5 backdrop-blur-sm focus:border-neon-cyan"
              />
              <InputOTPSlot 
                index={5} 
                className="w-12 h-14 text-xl border-neon-cyan/30 bg-white/5 backdrop-blur-sm focus:border-neon-cyan"
              />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          onClick={handleVerify} 
          disabled={isVerifying || code.length !== 6}
          className="w-full bg-gradient-to-r from-neon-cyan to-neon-violet hover:opacity-90 transition-opacity"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-neon-cyan hover:underline font-medium"
              >
                Resend
              </button>
            ) : (
              <span className="text-muted-foreground">
                Resend in {resendCountdown}s
              </span>
            )}
          </p>
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Code expires in 15 minutes
        </p>
      </CardContent>
    </Card>
  );
};
