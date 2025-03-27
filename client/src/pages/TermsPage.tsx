import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { PageContent } from "@shared/schema";

export default function TermsPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  const siteName = settings?.siteName || "Schloka";
  const currentYear = new Date().getFullYear();
  
  const { data: pageContent, isLoading } = useQuery<PageContent>({
    queryKey: ["/api/page-content/terms"],
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms And Conditions</h1>
          
          <p className="text-gray-600 text-sm mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          {isLoading ? (
            <p className="text-gray-500 py-8">Loading content...</p>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700">
              {pageContent?.content ? (
                pageContent.content.split('\n\n').map((section, index) => {
                  // Check if this section looks like a heading (shorter and doesn't end with period)
                  const isHeading = section.length < 60 && !section.trim().endsWith('.');
                  
                  return isHeading ? (
                    <h2 key={index} className="text-xl font-semibold mt-8 mb-4">{section}</h2>
                  ) : (
                    <p key={index} className="mb-4">{section}</p>
                  );
                })
              ) : (
                <>
                  <p className="mb-4">
                    Please read these Terms and Conditions carefully before using the {siteName}.com website.
                  </p>
                  
                  <h2 className="text-xl font-semibold mt-8 mb-4">General Terms of Use</h2>
                  <p className="mb-4">
                    By accessing or using our website, you agree to be bound by these Terms and Conditions.
                  </p>
                  
                  <h2 className="text-xl font-semibold mt-8 mb-4">Contact</h2>
                  <p className="mb-4">
                    support@{siteName.toLowerCase()}.com
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}