import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function NotFound() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  const siteName = settings?.siteName || "Schloka";
  const footerText = settings?.footerText || `© ${new Date().getFullYear()} ${siteName} - All Rights Reserved.`;

  return (
    <div className="container min-h-[70vh] flex items-center justify-center py-16">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 pb-8">
          <div className="text-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">404 - Page Not Found</h1>
          </div>

          <p className="mt-4 text-center text-gray-600 mb-6">
            The page you are looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col space-y-3 mt-6">
            <Link href="/">
              <Button className="w-full bg-[#4ebb78] hover:bg-[#3da967]">
                Return to Homepage
              </Button>
            </Link>
            
            <Link href="/sitemap">
              <Button variant="outline" className="w-full">
                View Sitemap
              </Button>
            </Link>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-8">
            {footerText.replace(/\d{4}/g, new Date().getFullYear().toString())}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
