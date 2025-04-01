import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface MobileVerificationProps {
  mobileNumber: string;
  onVerificationComplete: () => void;
  onSkip: () => void;
}

export default function MobileVerification({
  mobileNumber,
  onVerificationComplete,
  onSkip
}: MobileVerificationProps) {
  const [otp, setOtp] = useState("");
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const { toast } = useToast();

  // OTP verification using development mode
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiRequest("POST", "/api/send-otp", { mobileNumber: phone });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Get the OTP from development info
        if (data.devInfo) {
          setTestOtp(data.devInfo.replace("OTP is: ", ""));
        }
        
        toast({
          title: "OTP Sent",
          description: `A verification code has been sent to ${mobileNumber}`,
        });
      } else {
        throw new Error(data.error || "Failed to send OTP");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/verify-otp", { 
        mobileNumber, 
        otp: code 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Verification Successful",
          description: "Your mobile number has been verified successfully",
        });
        onVerificationComplete();
      } else {
        throw new Error(data.error || "Verification failed");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Auto-send OTP on component mount
  React.useEffect(() => {
    if (mobileNumber && mobileNumber.length === 10) {
      sendOtpMutation.mutate(mobileNumber);
    }
  }, [mobileNumber]);

  const handleVerify = () => {
    if (!otp || otp.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid verification code",
        variant: "destructive",
      });
      return;
    }
    
    verifyOtpMutation.mutate(otp);
  };

  const handleResendOTP = () => {
    sendOtpMutation.mutate(mobileNumber);
  };

  const handleAutoFill = () => {
    if (testOtp) setOtp(testOtp);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Verify Mobile and WhatsApp Number</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">
            Please insert the OTP we have sent you on your mobile number
          </p>
          <p className="font-medium">{mobileNumber}</p>
          <div>
            <Input 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              className="w-full"
              maxLength={6}
            />
          </div>
          
          {/* Always show Development Mode OTP panel */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="font-semibold">Development Mode</h4>
            <div className="flex items-center gap-2 mt-2">
              <span>Test OTP:</span>
              <div className="bg-white px-3 py-1 border border-amber-200 rounded font-mono">
                {testOtp || ""}
              </div>
              <Button 
                variant="outline"
                size="sm"
                className="ml-2 bg-amber-100 hover:bg-amber-200 border-amber-200 text-amber-800"
                onClick={handleAutoFill}
              >
                Auto-fill
              </Button>
            </div>
          </div>
          
          {(sendOtpMutation.isPending || verifyOtpMutation.isPending) && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">
                {sendOtpMutation.isPending ? "Sending OTP..." : "Verifying..."}
              </span>
            </div>
          )}
          <div className="text-sm text-center">
            <button 
              onClick={handleResendOTP} 
              className="text-green-500 hover:underline"
              disabled={sendOtpMutation.isPending}
            >
              Resend OTP
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSkip} disabled={verifyOtpMutation.isPending}>
          Skip
        </Button>
        <Button 
          className="bg-green-500 hover:bg-green-600"
          onClick={handleVerify} 
          disabled={verifyOtpMutation.isPending || !otp || otp.length < 4}
        >
          {verifyOtpMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            "Validate"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}