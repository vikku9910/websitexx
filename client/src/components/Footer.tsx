import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Footer() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  const siteName = settings?.siteName || "Schloka";
  const currentYear = new Date().getFullYear();
  
  // Use the custom footer text if available, otherwise construct a default one
  const footerText = settings?.footerText 
    ? settings.footerText // Don't replace the year automatically
    : `© ${siteName} - Post Free Classifieds Ads. All Rights Reserved.`;
  
  return (
    <footer className="border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 mb-4">
          <Link href="/about">
            <span className="text-gray-600 hover:text-[#4ebb78] text-sm cursor-pointer">About Us</span>
          </Link>
          <Link href="/contact">
            <span className="text-gray-600 hover:text-[#4ebb78] text-sm cursor-pointer">Contact Us</span>
          </Link>
          <Link href="/post-ad">
            <span className="text-gray-600 hover:text-[#4ebb78] text-sm cursor-pointer">Post Your Ad</span>
          </Link>
          <Link href="/sitemap">
            <span className="text-gray-600 hover:text-[#4ebb78] text-sm cursor-pointer">Sitemap</span>
          </Link>
          <Link href="/terms">
            <span className="text-gray-600 hover:text-[#4ebb78] text-sm cursor-pointer">Terms Of Service</span>
          </Link>
          <Link href="/privacy">
            <span className="text-gray-600 hover:text-[#4ebb78] text-sm cursor-pointer">Privacy Policy</span>
          </Link>
        </div>
        <div className="text-center text-base font-semibold bg-[#4ebb78] text-white py-2 rounded">
          {footerText}
        </div>
      </div>
    </footer>
  );
}