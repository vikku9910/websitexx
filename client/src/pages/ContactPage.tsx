
import { useQuery } from "@tanstack/react-query";
import { PageContent } from "@shared/schema";

export default function ContactPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  const siteName = settings?.siteName || "Schloka";
  
  const { data: pageContent, isLoading } = useQuery<PageContent>({
    queryKey: ["/api/page-content/contact"],
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Contact {siteName}</h1>
          
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Loading content...</p>
          ) : (
            <div className="text-gray-700 space-y-6">
              {pageContent?.content ? (
                pageContent.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="text-center">{paragraph}</p>
                ))
              ) : (
                <p className="text-center">For any questions or assistance, please reach out to us.</p>
              )}
            </div>
          )}
          
          <div className="border-t border-gray-200 my-8"></div>
        </div>
      </div>
    </div>
  );
}