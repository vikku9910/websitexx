import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { PageContent } from "@shared/schema";

export default function PrivacyPage() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  const siteName = settings?.siteName || "Schloka";
  
  const { data: pageContent, isLoading } = useQuery<PageContent>({
    queryKey: ["/api/page-content/privacy"],
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
          
          {isLoading ? (
            <p className="text-gray-500 py-8">Loading content...</p>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700">
              {pageContent?.content ? (
                pageContent.content.split('\n\n').map((section, index) => {
                  // Check if this section looks like a heading (shorter and doesn't end with period)
                  if (section.length < 60 && !section.trim().endsWith('.')) {
                    return <h2 key={index} className="text-xl font-semibold mt-8 mb-4">{section}</h2>;
                  }
                  
                  // Check if section looks like a list (contains multiple lines starting with '-')
                  if (section.includes('\n-')) {
                    const [listTitle, ...listItems] = section.split('\n');
                    return (
                      <div key={index}>
                        <p className="mb-2">{listTitle}</p>
                        <ul className="list-disc pl-5 mb-4 space-y-2">
                          {listItems.map((item, i) => (
                            <li key={i}>{item.replace(/^-\s*/, '')}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  
                  return <p key={index} className="mb-4">{section}</p>;
                })
              ) : (
                <>
                  <p className="mb-4">
                    At {siteName}, your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                  </p>
                  
                  <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
                  <p className="mb-4">
                    If you have questions or comments about this policy, you may email us at support@{siteName.toLowerCase()}.com.
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