import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

export default function FirstAdminSetup() {
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if admin exists by calling the endpoint
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        await apiRequest("POST", "/api/create-first-admin", { userId: -1 });
        // Should never reach here due to 403 if admin exists
        setAdminExists(false);
      } catch (error) {
        // If we get a 403, it means admin already exists
        if ((error as Error).message.includes("403")) {
          setAdminExists(true);
        } else {
          // Any other error means no admin exists yet
          setAdminExists(false);
        }
      }
    };

    if (user) {
      checkAdminExists();
    }
  }, [user]);

  const makeAdminMutation = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      const res = await apiRequest("POST", "/api/create-first-admin", { userId: user.id });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setAdminExists(true);
      toast({
        title: "Success",
        description: "You are now an admin! Refresh the page to see admin options.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Show nothing if no user is logged in or if we're still loading
  if (!user || adminExists === null) {
    return null;
  }

  // Show nothing if admin already exists
  if (adminExists) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-xs border border-amber-300">
      <div className="flex items-center space-x-2 mb-2">
        <ShieldCheck className="h-5 w-5 text-amber-500" />
        <h3 className="font-medium text-amber-800">Admin Setup Required</h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        No admin user has been created yet. Would you like to become an admin to manage the site?
      </p>
      <Button 
        onClick={() => makeAdminMutation.mutate()}
        disabled={makeAdminMutation.isPending}
        className="w-full bg-amber-500 hover:bg-amber-600"
      >
        {makeAdminMutation.isPending ? "Processing..." : "Become Admin"}
      </Button>
    </div>
  );
}