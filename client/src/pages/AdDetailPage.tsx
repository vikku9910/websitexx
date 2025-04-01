import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ad, AdPromotionPlan } from "@shared/schema";
import { Loader2, Phone, MapPin, Calendar, MessageCircle, Award, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdDetailPage() {
  const { id } = useParams();
  const adId = id ? parseInt(id) : 0;
  const [activeImage, setActiveImage] = useState(0);
  const [similarAds, setSimilarAds] = useState<Ad[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Query to get ad details
  const { data: ad, isLoading, error } = useQuery<Ad>({
    queryKey: ["/api/ads", adId],
    queryFn: async () => {
      const response = await fetch(`/api/ads/${adId}`);
      if (!response.ok) {
        throw new Error(`Error fetching ad: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!adId,
  });
  
  // Query to get promotion plans
  const { data: promotionPlans = [], isLoading: plansLoading } = useQuery<AdPromotionPlan[]>({
    queryKey: ["/api/promotion-plans"],
    queryFn: async () => {
      const response = await fetch("/api/promotion-plans");
      if (!response.ok) {
        throw new Error("Failed to load promotion plans");
      }
      return response.json();
    },
    enabled: Boolean(user && ad && user.id === ad.userId && ad.isVerified), // Only load if user owns the ad and it's verified
  });
  
  // Mutation to promote ad
  const promoteMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", `/api/ads/${adId}/promote`, { planId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ad promoted successfully",
        description: "Your ad will now get more visibility!",
      });
      setPromotionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/ads", adId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Promotion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Fetch similar ads based on location
  useEffect(() => {
    if (ad) {
      const fetchSimilarAds = async () => {
        try {
          const response = await fetch(`/api/ads/location/${ad.location}`);
          if (response.ok) {
            const data = await response.json();
            // Filter out the current ad and limit to 3 ads
            const filtered = data.filter((a: Ad) => a.id !== adId).slice(0, 3);
            setSimilarAds(filtered);
          }
        } catch (error) {
          console.error("Failed to fetch similar ads:", error);
        }
      };
      
      fetchSimilarAds();
    }
  }, [ad, adId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ebb78]" />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading ad: {error ? (error as Error).message : "Ad not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-[#4ebb78]">Home</Link>
        <span>{">"}</span>
        <Link href={`/location/${encodeURIComponent(ad.location)}`} className="hover:text-[#4ebb78]">
          {ad.location}
        </Link>
        <span>{">"}</span>
        <span className="text-gray-800">{ad.title}</span>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Gallery */}
          <div className="w-full md:w-1/2 p-4">
            {/* Main Image */}
            <div className="mb-4 relative">
              {ad.photoUrls && ad.photoUrls.length > 0 ? (
                <AlertDialog open={!!fullscreenImage} onOpenChange={(open) => !open && setFullscreenImage(null)}>
                  <AlertDialogTrigger asChild>
                    <img 
                      src={ad.photoUrls[activeImage]} 
                      alt={ad.title} 
                      className="w-full h-80 object-contain bg-gray-50 rounded-md cursor-pointer"
                      onClick={() => setFullscreenImage(ad.photoUrls![activeImage])}
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-screen-lg max-h-[90vh] p-1 bg-black/90 border-none">
                    <div className="relative w-full h-full">
                      <img 
                        src={fullscreenImage || ''} 
                        alt="Enlarged view" 
                        className="w-full h-full object-contain"
                      />
                      <button 
                        onClick={() => setFullscreenImage(null)}
                        className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                      {ad.photoUrls && ad.photoUrls.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const prevIndex = ad.photoUrls!.indexOf(fullscreenImage!) === 0 
                                ? ad.photoUrls!.length - 1 
                                : ad.photoUrls!.indexOf(fullscreenImage!) - 1;
                              setFullscreenImage(ad.photoUrls![prevIndex]);
                              setActiveImage(prevIndex);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m15 18-6-6 6-6"/></svg>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextIndex = ad.photoUrls!.indexOf(fullscreenImage!) === ad.photoUrls!.length - 1
                                ? 0
                                : ad.photoUrls!.indexOf(fullscreenImage!) + 1;
                              setFullscreenImage(ad.photoUrls![nextIndex]);
                              setActiveImage(nextIndex);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m9 18 6-6-6-6"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div className="w-full h-80 bg-gray-200 flex items-center justify-center rounded-md">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              
              {/* Navigation arrows for images */}
              {ad.photoUrls && ad.photoUrls.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveImage(prev => prev === 0 ? ad.photoUrls!.length - 1 : prev - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button 
                    onClick={() => setActiveImage(prev => prev === ad.photoUrls!.length - 1 ? 0 : prev + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails */}
            {ad.photoUrls && ad.photoUrls.length > 1 && (
              <div className="flex flex-wrap gap-2 pb-2 justify-center">
                {ad.photoUrls.map((url, index) => (
                  <div 
                    key={index}
                    className={`w-20 h-20 flex-shrink-0 cursor-pointer border-2 ${
                      index === activeImage ? "border-[#4ebb78] ring-2 ring-[#4ebb78]/20" : "border-gray-200"
                    } rounded-md transition-all`}
                    onClick={() => {
                      setActiveImage(index);
                      setFullscreenImage(url);
                    }}
                  >
                    <img 
                      src={url} 
                      alt={`Thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover rounded-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Ad Details */}
          <div className="w-full md:w-1/2 p-4 border-t md:border-t-0 md:border-l border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">{ad.title}</h1>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{ad.location}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <span>Category: {ad.category || 'Unspecified'}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {ad.isVerified && (
              <div className="mb-4">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Verified
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{ad.description}</p>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-gray-800">Contact Information</h2>
              
              <div className="flex flex-col items-center w-48">
                <a 
                  href={`tel:${ad.contactNumber}`}
                  className="bg-green-50 px-4 py-2 rounded-md text-center mb-2 w-full block"
                >
                  <span className="text-base font-semibold text-gray-800">{ad.contactNumber}</span>
                </a>
                
                <a 
                  href={`https://wa.me/${ad.contactNumber}?text=Hi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" 
                    alt="WhatsApp" 
                    className="w-10 h-10"
                  />
                </a>
              </div>
              
              <div className="flex justify-between mt-4">
                <a 
                  href={`tel:${ad.contactNumber}`} 
                  className="bg-[#4ebb78] text-white px-4 py-2 rounded-md hover:bg-opacity-90 inline-flex items-center"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </a>
                
                <a 
                  href={`https://wa.me/${ad.contactNumber}?text=Hi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-opacity-90 inline-flex items-center"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" 
                    alt="WhatsApp" 
                    className="h-4 w-4 mr-2"
                  />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Promotion Status or Button */}
        {ad.promotionId && ad.promotionPosition && ad.promotionExpiresAt && (
          <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
            <Award className="text-amber-500" />
            <div>
              <p className="font-medium text-amber-800">
                This ad is promoted as {ad.promotionPosition === 'rank1' ? 'Top Position' : 'Top 10'}
              </p>
              <p className="text-sm text-amber-700">
                Promotion ends on {new Date(ad.promotionExpiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
        
        {/* Promotion Button */}
        {user && ad.userId === user.id && ad.isVerified && !ad.promotionId && (
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <Dialog open={promotionDialogOpen} onOpenChange={setPromotionDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-white" 
                  onClick={() => setPromotionDialogOpen(true)}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Promote this Ad
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Promote Your Ad</DialogTitle>
                  <DialogDescription>
                    Increase visibility and reach more potential customers by promoting your ad.
                  </DialogDescription>
                </DialogHeader>
                
                {plansLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : promotionPlans && promotionPlans.length > 0 ? (
                  <div className="py-4">
                    <Label className="mb-2 block">Select a promotion plan:</Label>
                    <RadioGroup 
                      value={selectedPlanId?.toString() || ""} 
                      onValueChange={(value) => setSelectedPlanId(parseInt(value))}
                      className="grid gap-4"
                    >
                      {promotionPlans.map((plan) => (
                        <div key={plan.id} className="flex items-start space-x-3">
                          <RadioGroupItem value={plan.id.toString()} id={`plan-${plan.id}`} className="mt-1" />
                          <Label 
                            htmlFor={`plan-${plan.id}`} 
                            className="flex-1 cursor-pointer"
                          >
                            <Card className={selectedPlanId === plan.id ? "border-amber-500" : ""}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base flex justify-between">
                                  <span>{plan.name} - {plan.durationDays} days</span>
                                  <span className="text-amber-600">{plan.pointsCost} points</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  Position: {plan.position === 'rank1' ? 'Top Position' : 'Top 10'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-0 text-sm">
                                <p>{plan.description}</p>
                              </CardContent>
                            </Card>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    {user && (
                      <div className="mt-4 px-4 py-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium">Your current balance: {user.points || 0} points</p>
                        {selectedPlanId !== null && (
                          <p className={(user.points || 0) < (promotionPlans.find(p => p.id === selectedPlanId)?.pointsCost || 0) 
                            ? "text-red-500" : "text-green-600"}>
                            {(user.points || 0) < (promotionPlans.find(p => p.id === selectedPlanId)?.pointsCost || 0)
                              ? "Insufficient points for this plan"
                              : "You have enough points for this plan"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    No promotion plans are currently available.
                  </div>
                )}
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPromotionDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedPlanId !== null) promoteMutation.mutate(selectedPlanId);
                    }}
                    disabled={
                      selectedPlanId === null || 
                      promoteMutation.isPending || 
                      (user && selectedPlanId !== null && promotionPlans.length > 0 && 
                        (user.points || 0) < (promotionPlans.find(p => p.id === selectedPlanId)?.pointsCost || 0))
                    }
                    className={promoteMutation.isPending ? "opacity-70" : ""}
                  >
                    {promoteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      "Promote Ad"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      {/* Similar Ads Section */}
      {similarAds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Similar Ads in {ad.location}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similarAds.map((similarAd) => (
              <Link key={similarAd.id} href={`/ad/${similarAd.id}`}>
                <div className="border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition-shadow">
                  {/* Ad Image */}
                  <div className="h-48 w-full">
                    {similarAd.photoUrls && similarAd.photoUrls.length > 0 ? (
                      <img 
                        src={similarAd.photoUrls[0]} 
                        alt={similarAd.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Ad Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1 truncate">{similarAd.title}</h3>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">{similarAd.location}</span>
                      <span className="text-gray-600">{similarAd.category || 'Unspecified'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}