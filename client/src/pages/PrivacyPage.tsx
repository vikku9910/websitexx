import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="mb-4">
              At Schloka, your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Overview</h2>
            <p className="mb-4">
              We collect information that you provide directly to us when you register for an account, create or modify your profile, or make a purchase. We may use third-party analytics services like Google Analytics to automatically collect certain information.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">What Kind of Information We Collect</h2>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Personal details (name, email)</li>
              <li>Contact information</li>
              <li>IP address</li>
              <li>Browser information</li>
              <li>Device information</li>
              <li>Content you post on our platform</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Why We Use Your Information</h2>
            <p className="mb-4">
              The information we collect allows us to provide our services, improve our platform, communicate with users, and comply with legal obligations.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Data Retention</h2>
            <p className="mb-4">
              We store your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Your Rights</h2>
            <p className="mb-4">
              Depending on your location, you may have rights regarding your personal information, including access, correction, deletion, and objection to processing.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Updates to this Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have questions or comments about this policy, you may email us at support@schloka.com.
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