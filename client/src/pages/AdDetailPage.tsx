import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ad, AdPromotionPlan } from "@shared/schema";
import { Loader2, Phone, MapPin, Calendar, Award, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
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
    enabled: Boolean(user && ad && user.id === ad.userId && ad.isVerified),
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
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 bg-white">
        {/* Left side - Vertical Image Gallery */}
        <div className="w-full lg:w-2/5 lg:max-w-sm px-2">
          {ad.photoUrls && ad.photoUrls.length > 0 ? (
            <div className="flex flex-col space-y-3">
              {ad.photoUrls.map((url, index) => (
                <div key={index} className="w-full bg-white shadow-sm border border-gray-200 rounded">
                  <AlertDialog open={fullscreenImage === url} onOpenChange={(open) => !open && setFullscreenImage(null)}>
                    <AlertDialogTrigger asChild>
                      <img 
                        src={url} 
                        alt={`${ad.title} - Image ${index + 1}`} 
                        className="w-full object-contain cursor-pointer"
                        onClick={() => setFullscreenImage(url)}
                      />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-screen-lg max-h-[90vh] p-1 bg-black/90 border-none">
                      <AlertDialogTitle className="sr-only">View Image</AlertDialogTitle>
                      <AlertDialogDescription className="sr-only">
                        Enlarged view of the image
                      </AlertDialogDescription>
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
                                const currentIndex = ad.photoUrls!.indexOf(fullscreenImage!);
                                const prevIndex = currentIndex === 0 ? ad.photoUrls!.length - 1 : currentIndex - 1;
                                setFullscreenImage(ad.photoUrls![prevIndex]);
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = ad.photoUrls!.indexOf(fullscreenImage!);
                                const nextIndex = currentIndex === ad.photoUrls!.length - 1 ? 0 : currentIndex + 1;
                                setFullscreenImage(ad.photoUrls![nextIndex]);
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
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-80 bg-gray-200 flex items-center justify-center rounded-md">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        
        {/* Right side - Ad Details */}
        <div className="w-full lg:w-3/5 p-4">
          <div className="flex flex-col">
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
            
            {/* Profile Details */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Advert Type: </span>Personal
                <span className="mx-2">|</span>
                <span className="font-medium">Privacy: </span>{ad.isPublic ? 'Public' : 'Private'}
                {ad.category && (
                  <>
                    <span className="mx-2">|</span>
                    <span className="font-medium">Category: </span>{ad.category}
                  </>
                )}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {ad.age && (
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex-shrink-0 mr-2 text-green-500">✓</div>
                    <p className="text-sm"><span className="font-medium">Age:</span> {ad.age}</p>
                  </div>
                )}
                
                {ad.nationality && (
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex-shrink-0 mr-2 text-green-500">✓</div>
                    <p className="text-sm"><span className="font-medium">Nationality:</span> {ad.nationality}</p>
                  </div>
                )}
                
                {ad.gender && (
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex-shrink-0 mr-2 text-green-500">✓</div>
                    <p className="text-sm"><span className="font-medium">Gender:</span> {ad.gender}</p>
                  </div>
                )}
                
                {ad.eyeColor && (
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex-shrink-0 mr-2 text-green-500">✓</div>
                    <p className="text-sm"><span className="font-medium">Eye Color:</span> {ad.eyeColor}</p>
                  </div>
                )}
                
                {ad.hairColor && (
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex-shrink-0 mr-2 text-green-500">✓</div>
                    <p className="text-sm"><span className="font-medium">Hair Color:</span> {ad.hairColor}</p>
                  </div>
                )}
                
                {ad.height && (
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex-shrink-0 mr-2 text-green-500">✓</div>
                    <p className="text-sm"><span className="font-medium">Height:</span> {ad.height}</p>
                  </div>
                )}
                
                {ad.weight && (
                  <div className="flex items-start">
                    <div className="w-5 h-5 flex-shrink-0 mr-2 text-green-500">✓</div>
                    <p className="text-sm"><span className="font-medium">Weight:</span> {ad.weight}</p>
                  </div>
                )}
              </div>
              
              {ad.services && (
                <div className="mb-4">
                  <h3 className="text-md font-semibold mb-2">Services:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ad.services.split(',').map((service, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-5 h-5 flex-shrink-0 mr-2 text-green-500">✓</div>
                        <p className="text-sm">{service.trim()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{ad.description}</p>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-gray-800">Contact Information</h2>
              
              <div className="bg-green-50 px-4 py-3 rounded-md text-center mb-6 max-w-xs">
                <span className="text-base font-semibold text-gray-800">{ad.contactNumber}</span>
              </div>
              
              <div className="flex justify-between gap-4">
                <a 
                  href={`tel:${ad.contactNumber}`} 
                  className="bg-[#4ebb78] text-white px-4 py-2 rounded-md hover:bg-opacity-90 inline-flex items-center justify-center flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </a>
                
                <a 
                  href={`https://wa.me/${ad.contactNumber}?text=Hi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-opacity-90 inline-flex items-center justify-center flex-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 175.216 175.552"
                    className="mr-2"
                  >
                    <path
                      fill="#ffffff"
                      d="M87.4 13.267c-40.817 0-74.023 33.207-74.023 74.077 0 13.547 3.673 26.253 10.087 37.18L13.2 161.36l38.28-10.087c10.567 5.847 22.707 9.173 35.913 9.173 40.87 0 74.077-33.207 74.077-74.077S128.223 13.22 87.4 13.267zm.053 135.8c-11.093 0-21.653-2.913-30.607-8.173l-21.707 5.73 5.783-21.177c-5.887-9.553-9.067-20.657-9.067-32.5 0-33.833 27.6-61.433 61.433-61.433s61.433 27.6 61.433 61.433-27.547 61.12-57.267 61.12zm33.713-46.02c-1.867-.933-10.973-5.417-12.667-6.017-1.693-.6-2.92-.933-4.193.933-1.227 1.867-4.813 6.017-5.943 7.243-1.087 1.23-2.173 1.397-4.04.467-10.87-5.417-18.04-9.673-25.213-21.933-1.907-3.267 1.907-3.033 5.463-10.107 .607-1.227.303-2.29-.163-3.22-.467-.933-4.193-10.12-5.75-13.86-1.513-3.64-3.033-3.13-4.193-3.177-1.087-.047-2.313-.057-3.54-.057-1.227 0-3.223.467-4.917 2.29-1.693 1.867-6.46 6.327-6.46 15.413s6.607 17.847 7.513 19.073c.933 1.227 13.04 19.927 31.6 27.913 11.757 5.077 16.36 5.507 22.24 4.643 3.59-.54 10.973-4.48 12.533-8.8 1.513-4.333 1.513-8.027 1.08-8.8-.48-.933-1.74-1.447-3.61-2.38z"
                    />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>
            
            {/* Promotion Status - Only visible to ad owner and admins */}
            {ad.promotionId && ad.promotionPosition && ad.promotionExpiresAt && user && 
             (user.id === ad.userId || user.isAdmin) && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-md flex items-center gap-2">
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
              <div className="mt-6">
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
        </div>
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