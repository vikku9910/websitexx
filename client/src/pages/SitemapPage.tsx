import { Link } from "wouter";
import Footer from "@/components/Footer";
import { locations } from "@/data/locations";

// Define a type for location
type Location = {
  id: number;
  name: string;
};

export default function SitemapPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Sitemap</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Main Pages</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/">
                    <span className="text-[#4ebb78] hover:underline cursor-pointer">Home</span>
                  </Link>
                </li>
                <li>
                  <Link href="/about">
                    <span className="text-[#4ebb78] hover:underline cursor-pointer">About Us</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <span className="text-[#4ebb78] hover:underline cursor-pointer">Contact Us</span>
                  </Link>
                </li>
                <li>
                  <Link href="/post-ad">
                    <span className="text-[#4ebb78] hover:underline cursor-pointer">Post Your Ad</span>
                  </Link>
                </li>
                <li>
                  <Link href="/terms">
                    <span className="text-[#4ebb78] hover:underline cursor-pointer">Terms of Service</span>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy">
                    <span className="text-[#4ebb78] hover:underline cursor-pointer">Privacy Policy</span>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Locations</h2>
              <ul className="space-y-2">
                {locations.slice(0, 15).map((location) => (
                  <li key={location.id}>
                    <Link href={`/location/${location.name.toLowerCase()}`}>
                      <span className="text-[#4ebb78] hover:underline cursor-pointer">{location.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">More Locations</h2>
              <ul className="space-y-2">
                {locations.slice(15, 30).map((location) => (
                  <li key={location.id}>
                    <Link href={`/location/${location.name.toLowerCase()}`}>
                      <span className="text-[#4ebb78] hover:underline cursor-pointer">{location.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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