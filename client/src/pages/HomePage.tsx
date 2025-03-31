import { useState } from "react";
import LocationGrid from "@/components/LocationGrid";
import CountryGrid from "@/components/CountryGrid";
import { useLocation, Link } from "wouter";
import { useTitle } from "@/hooks/use-title";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@shared/schema";
import { Award, TrendingUp, Loader2, Phone, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  // Set the document title for the home page
  useTitle("Home");
  
  const popularCities = ["Delhi", "Mumbai", "Kolkata", "Chennai", "Pune", "Jaipur"];
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [, navigate] = useLocation();
  
  // Get site settings for dynamic content
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  // Get featured ads for homepage
  const { data: ads, isLoading: adsLoading } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
  });
  
  // Get promoted/featured ads
  const featuredAds = ads?.filter(ad => ad.promotionId !== null && ad.isActive) || [];
  
  // Sort ads by promotion type: "rank1" before "top10"
  const sortedFeaturedAds = [...featuredAds].sort((a, b) => {
    if (a.promotionPosition === "rank1" && b.promotionPosition !== "rank1") return -1;
    if (a.promotionPosition !== "rank1" && b.promotionPosition === "rank1") return 1;
    return 0;
  });
  
  const siteName = settings?.siteName || "ClassiSpot";

  const handleCityClick = (city: string) => {
    // Instead of just selecting, we'll navigate to the location page
    navigate(`/location/${encodeURIComponent(city)}`);
  };

  return (
    <div>
      {/* Hero Banner Section */}
      <div className="bg-[#4ebb78] py-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-2xl font-semibold mb-2">Find Everything You Need on {siteName}</h1>
          <p className="text-white text-sm">Browse thousands of local classified ads across 40+ cities for free</p>
        </div>
      </div>

      {/* Popular Locations Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Featured Ads Section */}
        {sortedFeaturedAds.length > 0 && (
          <div className="bg-white rounded-md shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-800 font-semibold text-lg">Featured Ads</h2>
              <div className="flex space-x-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Premium</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span>Featured</span>
                </div>
              </div>
            </div>
            
            {adsLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-[#4ebb78]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedFeaturedAds.map(ad => {
                  const isRank1 = ad.promotionPosition === "rank1";
                  const isTop10 = ad.promotionPosition === "top10";
                  
                  return (
                    <Link key={ad.id} href={`/ad/${ad.id}`}>
                      <div className={`relative border rounded-md overflow-hidden hover:shadow-md transition-shadow h-full
                        ${isRank1 ? 'border-amber-300' : isTop10 ? 'border-blue-200' : 'border-gray-200'}`}>
                        
                        {/* Promotion badge */}
                        <div className="absolute top-2 left-2 z-10">
                          {isRank1 ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
                              <Award className="h-3 w-3" /> Premium
                            </Badge>
                          ) : isTop10 ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> Featured
                            </Badge>
                          ) : null}
                        </div>

                        {/* Ad Image */}
                        <div className="h-48 w-full bg-gray-100">
                          {ad.photoUrls && ad.photoUrls.length > 0 ? (
                            <img 
                              src={ad.photoUrls[0]} 
                              alt={ad.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Ad Info */}
                        <div className="p-3">
                          <h3 className="font-medium text-sm mb-1 truncate">{ad.title}</h3>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="text-gray-600">{ad.location}</span>
                            </div>
                            <span className="text-gray-600">{ad.category || 'Unspecified'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      
        <div className="bg-white rounded-md shadow p-6 mb-8">
          <h2 className="text-gray-800 font-semibold text-lg mb-2">Popular locations:</h2>
          <p className="text-gray-600 text-sm mb-4">
            Find what you're looking for in your local area. Browse through thousands of listings for jobs, services, real estate and more.
          </p>
          
          {/* Location Buttons */}
          <div className="flex flex-wrap gap-1 mb-4">
            {popularCities.map((city, index) => (
              <button 
                key={index}
                className="px-3 py-1 text-sm rounded bg-[#4ebb78] text-white hover:bg-[#3a8c5c] transition-colors"
                onClick={() => handleCityClick(city)}
              >
                {city}
              </button>
            ))}
          </div>
          
          {/* Location Grid */}
          <LocationGrid onLocationClick={handleCityClick} />
        </div>
        
        {/* Platform Description */}
        <div className="bg-white rounded-md shadow p-6 mb-8">
          <h2 className="text-gray-800 font-semibold text-lg mb-2">Your Trusted Local Classifieds Platform</h2>
          <p className="text-gray-600 text-sm mb-4">
            {siteName} is a free platform connecting local buyers and sellers. We provide a secure marketplace for individuals and businesses to post and browse classified advertisements across multiple categories including services, real estate, jobs, electronics, vehicles, and more.
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Our mission is to make buying and selling simple, safe and rewarding for everyone. Join thousands of satisfied users who find exactly what they need on {siteName} every day.
          </p>
          
          {/* Popular Categories */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 p-3 rounded-md flex items-center">
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Jobs</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-md flex items-center">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm font-medium">Real Estate</span>
            </div>
            <div className="bg-purple-50 p-3 rounded-md flex items-center">
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Electronics</span>
            </div>
            <div className="bg-yellow-50 p-3 rounded-md flex items-center">
              <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Services</span>
            </div>
            <div className="bg-red-50 p-3 rounded-md flex items-center">
              <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Vehicles</span>
            </div>
            <div className="bg-indigo-50 p-3 rounded-md flex items-center">
              <div className="w-8 h-8 bg-indigo-200 rounded-full flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Hobbies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
