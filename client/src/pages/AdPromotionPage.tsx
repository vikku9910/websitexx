import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Ad, AdPromotionPlan } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { useTitle } from "@/hooks/use-title";

export default function AdPromotionPage() {
  const { id } = useParams<{ id: string }>();
  const adId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  
  useTitle("Promote Your Ad");

  // Fetch ad details
  const { data: ad, isLoading: adLoading } = useQuery<Ad>({
    queryKey: [`/api/ads/${adId}`],
    enabled: !!adId && !!user,
  });

  // Fetch promotion plans
  const { data: promotionPlans, isLoading: plansLoading } = useQuery<AdPromotionPlan[]>({
    queryKey: ["/api/promotion-plans"],
    enabled: !!user,
  });

  // Check if user can promote (has enough points)
  const canPromote = (planId: number): boolean => {
    if (!user || !promotionPlans) return false;
    const plan = promotionPlans.find(p => p.id === planId);
    return plan ? (user.points || 0) >= plan.pointsCost : false;
  };

  // Promotion mutation
  const promoteMutation = useMutation({
    mutationFn: async (planId: number) => {
      // First, promote the ad with the selected plan
      const response = await apiRequest("POST", `/api/ads/${adId}/promote`, { planId });
      const promotionData = await response.json();
      
      // Then, automatically make the ad public if it's not already
      if (ad && !ad.isPublic) {
        await apiRequest("PATCH", `/api/ads/${adId}/toggle-public`, { isPublic: true });
      }
      
      return promotionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ads/${adId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // To update points
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] }); // Update the public ads list
      
      toast({
        title: "Ad promoted successfully",
        description: "Your ad has been promoted and is now public. It is visible to everyone!",
      });
      
      // Redirect to ad details page
      setLocation(`/ad/${adId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to promote ad",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Make sure the ad belongs to the current user and user is mobile verified
  useEffect(() => {
    if (ad && user) {
      // Check if ad belongs to user
      if (ad.userId !== user.id) {
        toast({
          title: "Unauthorized",
          description: "You can only promote your own ads.",
          variant: "destructive",
        });
        setLocation("/my-listings");
        return;
      }
      
      // Check if user's mobile is verified
      if (!user.isMobileVerified) {
        toast({
          title: "Mobile Verification Required",
          description: "You need to verify your mobile number before promoting an ad. Please go to My Listings page to verify.",
          variant: "destructive",
        });
        setLocation("/my-listings");
        return;
      }
    }
  }, [ad, user, setLocation, toast]);

  const handlePromote = () => {
    if (selectedPlan !== null) {
      promoteMutation.mutate(selectedPlan);
    } else {
      toast({
        title: "No plan selected",
        description: "Please select a promotion plan first.",
        variant: "destructive",
      });
    }
  };

  const isLoading = adLoading || plansLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Ad Not Found</CardTitle>
            <CardDescription>
              The ad you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/my-listings")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Promote Your Ad</CardTitle>
          <CardDescription>
            Choose a promotion plan to make your ad visible to everyone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">Ad Details</h3>
            <div className="border rounded-lg p-4 mb-4">
              <h4 className="font-medium text-primary">{ad.title}</h4>
              <p className="text-sm text-gray-500 mb-2">Location: {ad.location}</p>
              <p className="text-sm line-clamp-2 mb-2">{ad.description.substring(0, 150)}...</p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-red-500 bg-red-50">
                  Not Listed Yet
                </Badge>
              </div>
            </div>
            <div className="text-red-500 font-medium mb-6">
              Status: Your ad is not listed yet. Please Promote it to make it visible to everyone.
            </div>
          </div>

          <Separator className="my-4" />

          <div className="mb-6">
            <h3 className="font-medium text-lg mb-4">Available Promotion Plans</h3>
            <div className="space-y-4">
              {promotionPlans && promotionPlans.length > 0 ? (
                promotionPlans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPlan === plan.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium flex items-center">
                          {selectedPlan === plan.id && (
                            <Check className="h-4 w-4 mr-2 text-primary" />
                          )}
                          {plan.name} - {plan.durationDays} {plan.durationDays === 1 ? "day" : "days"}
                        </h4>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{plan.pointsCost} points</div>
                        {!canPromote(plan.id) && (
                          <div className="text-xs text-red-500">
                            Not enough points
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No promotion plans available.</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/my-listings")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Listings
            </Button>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">Your Points Balance:</span>{" "}
                <span className="text-primary font-bold">{user?.points || 0} points</span>
              </div>
              <Button
                onClick={handlePromote}
                disabled={
                  selectedPlan === null || 
                  !canPromote(selectedPlan) || 
                  promoteMutation.isPending
                }
              >
                {promoteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Promote Now"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}