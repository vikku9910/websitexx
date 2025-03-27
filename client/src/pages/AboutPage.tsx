import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { PageContent } from "@shared/schema";

export default function AboutPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  const siteName = settings?.siteName || "Schloka";
  
  const { data: pageContent, isLoading } = useQuery<PageContent>({
    queryKey: ["/api/page-content/about"],
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">About {siteName}</h1>
          
          <div className="border-t border-b border-gray-200 py-8 my-6">
            {isLoading ? (
              <p className="text-gray-500">Loading content...</p>
            ) : (
              <div className="text-gray-700 space-y-4">
                {pageContent?.content ? (
                  pageContent.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  <p>Welcome to {siteName}, your trusted classified ads platform.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}