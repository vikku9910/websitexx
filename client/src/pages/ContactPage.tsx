import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-12">For any support</h1>
          
          <div className="flex justify-center mb-16">
            <div className="flex items-center space-x-3">
              <span className="text-gray-400">📧</span>
              <span className="text-gray-600">support@schloka.com</span>
            </div>
          </div>
          
          <div className="border-t border-gray-200 my-6"></div>
          
          <div className="flex justify-center mt-20 mb-8">
            <span className="text-gray-400">📧 support@schloka.com</span>
          </div>
          
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
        <div className="bg-black text-white py-3 text-center text-sm">
          © 2022 Schloka - Post Free Classifieds Ads. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}