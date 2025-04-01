import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Ad } from "@shared/schema";
import { Loader2, Edit, Trash, Eye, EyeOff, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MyListingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
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

  return (
    <div className="container mx-auto px-4 py-8">
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
                      <Button
                        variant={ad.isPublic ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleTogglePublic(ad)}
                        disabled={togglePublicMutation.isPending}
                      >
                        {togglePublicMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : ad.isPublic ? (
                          <EyeOff className="h-4 w-4 mr-1" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        {ad.isPublic ? "Make Private" : "Make Public"}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/edit-ad/${ad.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
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
                        ) : (
                          <Trash className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
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
    </div>
  );
}