import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Ad } from "@shared/schema";
import { Loader2, Edit, Trash, Eye, EyeOff, Check, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import MobileVerification from "@/components/MobileVerification";

export default function MyListingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showMobileVerification, setShowMobileVerification] = useState(false);
  
  const { data: myAds, isLoading: adsLoading } = useQuery<Ad[]>({
    queryKey: ["/api/my-ads"],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (adId: number) => {
      await apiRequest("DELETE", `/api/ads/${adId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-ads"] });
      toast({
        title: "Ad deleted",
        description: "Your ad has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete ad",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const togglePublicMutation = useMutation({
    mutationFn: async ({ adId, isPublic }: { adId: number; isPublic: boolean }) => {
      const response = await apiRequest("PATCH", `/api/ads/${adId}/toggle-public`, { isPublic });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      toast({
        title: "Ad visibility updated",
        description: "Your ad's visibility has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update ad visibility",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (adId: number) => {
    if (confirm("Are you sure you want to delete this ad?")) {
      deleteMutation.mutate(adId);
    }
  };
  
  const handleTogglePublic = (ad: Ad) => {
    // If ad is not verified, show a warning
    if (!ad.isVerified && !ad.isPublic) {
      toast({
        title: "Action required",
        description: "Your ad needs to be verified before it can be made public. Please complete the verification process first.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the ad is not active
    if (!ad.isActive && !ad.isPublic) {
      toast({
        title: "Action required",
        description: "Your ad is currently inactive. It needs to be activated by an admin before it can be made public.",
        variant: "destructive",
      });
      return;
    }
    
    togglePublicMutation.mutate({ adId: ad.id, isPublic: !ad.isPublic });
  };

  if (adsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle mobile verification completion
  const handleVerificationComplete = () => {
    setShowMobileVerification(false);
    
    // Update user information after mobile verification
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/my-ads"] });
    
    toast({
      title: "Mobile Verification Completed",
      description: "Your mobile number has been verified successfully. You can now promote your ads to make them public.",
      duration: 5000,
    });
  };
  
  // Function to handle verification click
  const handleVerifyClick = () => {
    if (!user?.mobileNumber) {
      toast({
        title: "Mobile number required",
        description: "Please update your profile with a mobile number first.",
        variant: "destructive"
      });
      return;
    }
    
    setShowMobileVerification(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!user?.isMobileVerified && (
        <Card className="mb-6 border-yellow-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Smartphone className="mr-2 h-5 w-5 text-yellow-500" />
              Mobile Verification Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Your mobile number needs to be verified to fully activate your account and make your ads public.
            </p>
            <Button onClick={handleVerifyClick} className="bg-yellow-500 hover:bg-yellow-600">
              Verify Mobile Number
            </Button>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">My Listings</CardTitle>
          <CardDescription>
            Manage your posted advertisements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myAds && myAds.length > 0 ? (
            <div className="space-y-4">
              {myAds.map((ad) => (
                <div key={ad.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg text-primary mb-2">
                        <Link href={`/ad/${ad.id}`} className="hover:underline">
                          {ad.title}
                        </Link>
                      </h3>
                      <p className="text-gray-500 text-sm mb-2">
                        Location: {ad.location}
                      </p>
                      <p className="text-gray-700 line-clamp-2">
                        {ad.description.substring(0, 150)}...
                      </p>
                      
                      {/* Show status message if ad is not public */}
                      {!ad.isPublic && (
                        <div className="mt-2 mb-2 text-red-500 font-medium">
                          Status: Your ad is not listed yet. 
                          {!user?.isMobileVerified ? " Please verify your mobile number and promote it." : " Please promote it."}
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-2 flex-wrap">
                        {ad.isVerified !== null && (
                          <Badge variant={ad.isVerified ? "default" : "outline"} className="mr-2">
                            {ad.isVerified ? "Verified" : "Pending Verification"}
                          </Badge>
                        )}
                        {ad.isActive !== null && (
                          <Badge variant={ad.isActive ? "default" : "destructive"} className="mr-2">
                            {ad.isActive ? "Active" : "Inactive"}
                          </Badge>
                        )}
                        <Badge 
                          variant={ad.isPublic ? "default" : "secondary"}
                          className={ad.isPublic ? "bg-green-600" : ""}
                        >
                          {ad.isPublic ? "Public" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/edit-ad/${ad.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(ad.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : "Delete"}
                      </Button>
                      
                      {!ad.isPublic && (
                        <Button 
                          variant="default" 
                          size="sm"
                          asChild
                          className="bg-green-500 hover:bg-green-600"
                          disabled={!user?.isMobileVerified}
                        >
                          <Link href={`/ad/${ad.id}/promote`}>
                            Promote
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-3 mt-2">
                      <span>Views: {ad.viewCount || 0}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>Posted: {new Date(ad.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have any ads yet.</p>
              <Button asChild>
                <Link href="/post-ad">Post Your First Ad</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Mobile verification modal */}
      {showMobileVerification && user?.mobileNumber && (
        <MobileVerification
          mobileNumber={user.mobileNumber}
          onVerificationComplete={handleVerificationComplete}
          onSkip={() => setShowMobileVerification(false)}
        />
      )}
    </div>
  );
}