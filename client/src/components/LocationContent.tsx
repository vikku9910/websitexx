import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageContent } from "@shared/schema";
import { Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LocationContentProps {
  locationName: string;
  className?: string;
}

export default function LocationContent({ locationName, className = "" }: LocationContentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contentText, setContentText] = useState("");
  
  // Fetch location-specific content
  const { data: locationContent, isLoading } = useQuery<PageContent>({
    queryKey: ["/api/page-content", `location-${locationName}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/page-content/location-${locationName}`);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error(`Error fetching page content: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error("Failed to fetch location content:", error);
        return null;
      }
    },
    enabled: !!locationName,
  });
  
  const saveContentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest(
        "POST", 
        `/api/admin/page-content/location-${locationName}`,
        { content }
      );
      
      if (!response.ok) {
        throw new Error("Failed to save content");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content saved",
        description: "The location page content has been updated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/page-content", `location-${locationName}`] });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving content",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleEditContent = () => {
    setContentText(locationContent?.content || "");
    setEditDialogOpen(true);
  };
  
  const handleSaveContent = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in as an admin to edit content.",
        variant: "destructive",
      });
      return;
    }
    
    saveContentMutation.mutate(contentText);
  };
  
  // If no content and not an admin, don't show anything
  if (!locationContent?.content && !user?.isAdmin) {
    return null;
  }
  
  // Show a loading state while fetching content
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {user?.isAdmin && (
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-xs"
            onClick={handleEditContent}
          >
            <Edit className="h-3 w-3" />
            Edit Content
          </Button>
        </div>
      )}
      
      {locationContent?.content ? (
        <div 
          className="prose prose-sm max-w-none text-gray-600"
          dangerouslySetInnerHTML={{ __html: locationContent.content.replace(/\n/g, '<br>') }}
        />
      ) : user?.isAdmin ? (
        <div className="text-center py-8 text-gray-500">
          <p>No content has been added for {locationName} yet.</p>
          <p className="text-sm mt-2">Click 'Edit Content' to add information.</p>
        </div>
      ) : null}
      
      {/* Content Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>Edit {locationName} Location Content</DialogTitle>
            <DialogDescription>
              This content will be displayed to all visitors on pages related to {locationName}.
              You can use plain text or simple HTML formatting.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              className="min-h-[300px] font-mono text-sm"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder={`Enter content for ${locationName} here...\nYou can include information about the area, special attractions, or service availability.`}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveContent}
              disabled={saveContentMutation.isPending}
            >
              {saveContentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}