import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms And Conditions</h1>
          
          <p className="text-gray-600 text-sm mb-6">Last updated: 01/01/2022</p>
          
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="mb-4">
              Please read these Terms and Conditions carefully before using the Schloka.com website.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">General Terms of Use</h2>
            <p className="mb-4">
              By accessing or using our website, you agree to be bound by these Terms and Conditions.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Copyright</h2>
            <p className="mb-4">
              All site content including text, graphics, logos, images, videos, and software is the property of Schloka and is protected by copyright laws. Unauthorized use, reproduction, modification, distribution, or duplication of any content contained on this site is strictly prohibited.
            </p>
            <p className="mb-4">
              The content provided on Schloka.com is for general information purposes only. While we strive to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Responsibility</h2>
            <p className="mb-4">
              Schloka.com acts solely as a platform connecting users with service providers. We do not endorse, guarantee, or have control over any services advertised on our site. Users are solely responsible for verifying the legitimacy and quality of any services before engagement.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Privacy</h2>
            <p className="mb-4">
              Please refer to our Privacy Policy for information on how we collect, use, and handle your personal information.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Indemnity</h2>
            <p className="mb-4">
              You agree to indemnify and hold Schloka.com and its affiliates, officers, agents, and other partners harmless from any loss, liability, claim, or demand, including reasonable attorneys' fees, arising out of your use of the site in violation of these Terms and Conditions.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Cancellation of Ads</h2>
            <p className="mb-4">
              Schloka.com reserves the right to modify or delete any advertisements that violate our terms of service or that we deem inappropriate, misleading, or harmful to our users or the general public.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Contact</h2>
            <p className="mb-4">
              support@schloka.com
            </p>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <div className="text-center text-gray-500 text-sm py-2">
          <p className="mb-1">📧 support@schloka.com</p>
        </div>
        <Footer />
        <div className="bg-black text-white py-3 text-center text-sm">
          © 2022 Schloka - Post Free Classifieds Ads. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}