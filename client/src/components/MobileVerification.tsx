import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

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
  const { toast } = useToast();

  // Mock OTP verification
  // In a real implementation, this would send an actual OTP to the user's phone
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      // This would be an actual API call to send OTP in production
      // For now, we'll simulate the process
      return { success: true, message: "OTP sent successfully" };
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${mobileNumber}`,
      });
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
      // This would be an actual API call to verify OTP in production
      // For now, we'll simulate the process - any code will be accepted
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Verification Successful",
        description: "Your mobile number has been verified successfully",
      });
      onVerificationComplete();
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
    sendOtpMutation.mutate(mobileNumber);
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Verify Mobile and WhatsApp Number</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">
            Please insert the OTP we have sent you on you mobile Number
          </p>
          <p className="font-medium">{mobileNumber}</p>
          <div>
            <Input 
              type="text" 
              placeholder="Enter OTP" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              className="w-full"
              maxLength={6}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSkip}>
          Skip
        </Button>
        <Button onClick={handleVerify}>
          Validate
        </Button>
      </CardFooter>
    </Card>
  );
}