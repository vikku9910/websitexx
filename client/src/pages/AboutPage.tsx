import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">About Schloka</h1>
          
          <div className="border-t border-b border-gray-200 py-8 my-6">
            <p className="text-gray-700 mb-4">
              We provide advertising platform for adult entertainment in the form of Shloka website, and for adults seeking adult entertainment services. Schloka is not a escort agency and does not play any role in booking any service.
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