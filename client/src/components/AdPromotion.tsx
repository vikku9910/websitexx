import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface AdPromotionProps {
  adTitle: string;
  adImage: string | null;
  onPromotionComplete: (promotionId: number | null) => void;
  onCancel: () => void;
}

export default function AdPromotion({
  adTitle,
  adImage,
  onPromotionComplete,
  onCancel
}: AdPromotionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<string>("1");
  const [selectedPosition, setSelectedPosition] = useState<string>("top1");
  
  // Get promotion plans
  const { data: promotionPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/promotion-plans'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/promotion-plans");
      return await res.json();
    }
  });
  
  // Calculate promotion points based on duration and position
  const calculatePoints = () => {
    if (!promotionPlans) return 0;
    
    // Base points for position
    let points = 0;
    
    if (selectedPosition === 'top1') points = 300;
    if (selectedPosition === 'top10') points = 200;
    if (selectedPosition === 'top20') points = 100;
    if (selectedPosition === 'top50') points = 50;
    
    // Multiply by duration factor
    const duration = parseInt(selectedDuration);
    
    // Apply discounts for longer durations
    let discount = 0;
    if (duration === 3) discount = 0.1; // 10% discount
    if (duration === 7) discount = 0.2; // 20% discount 
    if (duration === 15) discount = 0.3; // 30% discount
    if (duration === 30) discount = 0.5; // 50% discount
    
    const totalBeforeDiscount = points * duration;
    const discountAmount = totalBeforeDiscount * discount;
    
    return Math.round(totalBeforeDiscount - discountAmount);
  };
  
  const totalPoints = calculatePoints();
  const availablePoints = user?.points || 0;
  const discountedPoints = totalPoints;
  
  // Create promotion mutation
  const createPromotionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ad-promotions", {
        position: selectedPosition,
        durationDays: parseInt(selectedDuration),
        points: totalPoints
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ad Promoted Successfully",
        description: `Your ad will be promoted for ${selectedDuration} days in the ${selectedPosition.replace(/\d+/g, ' $&')} position.`,
      });
      
      // Refresh user data to update points
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      onPromotionComplete(data.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Promotion Failed",
        description: error.message || "Failed to promote the ad. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Skip promotion
  const handleSkip = () => {
    onPromotionComplete(null);
  };
  
  // Apply promotion
  const handlePromote = () => {
    if (availablePoints < totalPoints) {
      toast({
        title: "Insufficient Points",
        description: "You don't have enough points for this promotion. Please buy more points.",
        variant: "destructive",
      });
      return;
    }
    
    createPromotionMutation.mutate();
  };
  
  if (plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Advert to Promote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ad preview */}
        <div className="flex items-center space-x-4 p-4 border rounded-md bg-gray-50">
          {adImage && (
            <img 
              src={adImage} 
              alt={adTitle} 
              className="w-16 h-16 object-cover rounded-md"
            />
          )}
          <div className="font-medium">{adTitle}</div>
        </div>
        
        {/* Duration selection */}
        <div>
          <h3 className="text-sm font-medium mb-3">Select for how many days you want to promote your advert</h3>
          <RadioGroup 
            value={selectedDuration} 
            onValueChange={setSelectedDuration}
            className="grid grid-cols-2 md:grid-cols-4 gap-2"
          >
            <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="1" id="day1" />
              <Label htmlFor="day1" className="cursor-pointer">1 Day</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="3" id="day3" />
              <Label htmlFor="day3" className="cursor-pointer">3 Days</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="7" id="day7" />
              <Label htmlFor="day7" className="cursor-pointer">7 Days</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="15" id="day15" />
              <Label htmlFor="day15" className="cursor-pointer">15 Days</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Position selection */}
        <div>
          <h3 className="text-sm font-medium mb-3">Select the advert position</h3>
          <RadioGroup 
            value={selectedPosition} 
            onValueChange={setSelectedPosition}
            className="grid grid-cols-2 md:grid-cols-4 gap-2"
          >
            <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="top1" id="top1" />
              <Label htmlFor="top1" className="cursor-pointer">Top 1</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="top10" id="top10" />
              <Label htmlFor="top10" className="cursor-pointer">Top 10</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="top20" id="top20" />
              <Label htmlFor="top20" className="cursor-pointer">Top 20</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="top50" id="top50" />
              <Label htmlFor="top50" className="cursor-pointer">Top 50</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Pricing summary */}
        <div className="space-y-2 p-4 border rounded-md bg-gray-50">
          <div className="flex justify-between">
            <span>Total Points:</span>
            <span className="font-medium">{totalPoints}</span>
          </div>
          <div className="flex justify-between">
            <span>Discounted Points:</span>
            <span className="font-medium text-green-600">{discountedPoints}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span>Total Points to Pay:</span>
            <span className="font-bold">{discountedPoints}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span>Your available points:</span>
            <span className={`font-bold ${availablePoints < discountedPoints ? 'text-red-500' : 'text-green-600'}`}>
              {availablePoints}
            </span>
          </div>
          
          {availablePoints < discountedPoints && (
            <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md text-sm">
              You don't have enough points. Please buy more points from your account page.
            </div>
          )}
        </div>
        
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/profile"}
            className="text-primary"
            disabled={createPromotionMutation.isPending}
          >
            Buy Points from Account
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleSkip}
          disabled={createPromotionMutation.isPending}
        >
          Skip Promotion
        </Button>
        <Button 
          onClick={handlePromote}
          disabled={availablePoints < discountedPoints || createPromotionMutation.isPending}
        >
          {createPromotionMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Promoting...
            </>
          ) : (
            "Promote Ad"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}