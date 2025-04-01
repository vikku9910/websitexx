import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@shared/schema";
import { Loader2, Phone, MapPin, Award, TrendingUp } from "lucide-react";
import { locations } from "@/data/locations";
import { Badge } from "@/components/ui/badge";
import LocationContent from "@/components/LocationContent";

export default function LocationPage() {
  const { location } = useParams();
  const decodedLocation = location ? decodeURIComponent(location) : "";
  
  const { data: ads, isLoading, error } = useQuery<Ad[]>({
    queryKey: ["/api/ads/location", decodedLocation],
    queryFn: async () => {
      const response = await fetch(`/api/ads/location/${decodedLocation}`);
      if (!response.ok) {
        throw new Error(`Error fetching ads: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!decodedLocation,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ebb78]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading ads: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/" className="hover:text-[#4ebb78]">Home</Link>
          <span>{">"}</span>
          {location && <span>{decodedLocation}</span>}
        </div>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">{decodedLocation}</h1>
          <div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78] max-h-60 overflow-y-auto"
              defaultValue={decodedLocation}
              onChange={(e) => {
                if (e.target.value) {
                  window.location.href = `/location/${e.target.value}`;
                }
              }}
            >
              <option value="">Select Location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Ads Section - Shown First */}
      {(!ads || ads.length === 0) ? (
        <>
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-10 rounded text-center mb-8">
            <p className="text-lg">No ads found in {decodedLocation}</p>
            <p className="mt-2 text-sm text-gray-500">Be the first to post an ad in this location</p>
            <Link href="/post-ad">
              <button className="mt-4 bg-[#4ebb78] text-white px-4 py-2 rounded-md hover:bg-opacity-90">
                Post An Ad
              </button>
            </Link>
          </div>
          
          {/* Location Content Block - Shown After Empty Ads Message */}
          <LocationContent 
            locationName={decodedLocation} 
            className=""
          />
        </>
      ) : (
        <>
          {/* Ads Legend */}
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <Award className="h-4 w-4 text-amber-500" />
              <span>Premium Ads</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span>Featured Ads</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Sort ads: promoted at top, by position "rank1" > "top10" > regular */}
            {[...ads].sort((a, b) => {
              // First prioritize ads with promotionId
              if (a.promotionId && !b.promotionId) return -1;
              if (!a.promotionId && b.promotionId) return 1;
              
              // Then sort by promotion position (rank1 > top10)
              if (a.promotionId && b.promotionId) {
                if (a.promotionPosition === "rank1" && b.promotionPosition !== "rank1") return -1;
                if (a.promotionPosition !== "rank1" && b.promotionPosition === "rank1") return 1;
                if (a.promotionPosition === "top10" && b.promotionPosition !== "top10") return -1;
                if (a.promotionPosition !== "top10" && b.promotionPosition === "top10") return 1;
              }
              
              // Finally, sort by createdAt date (newest first)
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }).map((ad) => {
              // Determine if ad is promoted and what type
              const isRank1 = ad.promotionId && ad.promotionPosition === "rank1";
              const isTop10 = ad.promotionId && ad.promotionPosition === "top10";
              
              return (
                <div 
                  key={ad.id} 
                  className={`border rounded-xl overflow-hidden hover:shadow-lg transition-shadow mb-5
                    ${isRank1 ? 'border-amber-300 bg-amber-50' : 
                      isTop10 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`
                  }
                >
                  {/* Promotion badge - if applicable */}
                  {ad.promotionId && (
                    <div className="absolute mt-4 ml-4 z-10">
                      {isRank1 ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 px-3 py-1">
                          <Award className="h-4 w-4" /> Premium
                        </Badge>
                      ) : isTop10 ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 px-3 py-1">
                          <TrendingUp className="h-4 w-4" /> Featured
                        </Badge>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Mobile-friendly layout */}
                  <div className="flex flex-col sm:flex-row p-3">
                    {/* Top row for mobile: Image and Title */}
                    <div className="flex mb-3 sm:mb-0">
                      {/* Image Thumbnail */}
                      <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 flex-shrink-0">
                        {ad.photoUrls && ad.photoUrls.length > 0 ? (
                          <Link href={`/ad/${ad.id}`}>
                            <img 
                              src={ad.photoUrls[0]} 
                              alt={ad.title} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </Link>
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Title and location for mobile */}
                      <div className="flex-1 px-3 sm:hidden">
                        <Link href={`/ad/${ad.id}`}>
                          <h2 className={`text-md font-bold hover:underline cursor-pointer 
                            ${isRank1 ? 'text-amber-900' : isTop10 ? 'text-blue-900' : 'text-gray-900'}`}>
                            {ad.title}
                          </h2>
                        </Link>
                        
                        <div className="flex items-center mt-1 text-xs text-gray-700">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{ad.location}</span>
                          {ad.age && <span className="ml-2">| Age {ad.age}</span>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Middle section - Desktop Title and Description */}
                    <div className="flex-1 hidden sm:block px-3">
                      {/* Title - Clickable to open full profile */}
                      <Link href={`/ad/${ad.id}`}>
                        <h2 className={`text-md md:text-lg font-bold hover:underline cursor-pointer 
                          ${isRank1 ? 'text-amber-900' : isTop10 ? 'text-blue-900' : 'text-gray-900'}`}>
                          {ad.title}
                        </h2>
                      </Link>
                      
                      {/* Short Description */}
                      <p className="text-xs text-gray-700 mt-1 line-clamp-3">
                        {ad.description}
                      </p>
                      
                      {/* Location & Age */}
                      <div className="flex items-center mt-2 text-xs text-gray-700">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{ad.location}</span>
                        {ad.age && <span className="ml-2">| Age {ad.age}</span>}
                      </div>
                    </div>
                    
                    {/* Contact buttons for mobile view */}
                    <div className="flex flex-row sm:flex-col sm:items-center sm:justify-center gap-2 sm:w-40">
                      <a 
                        href={`tel:${ad.contactNumber}`}
                        className="flex-1 flex items-center justify-center bg-green-50 px-2 py-2 sm:px-4 rounded-xl text-center w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="text-sm sm:text-base font-semibold text-gray-800">{ad.contactNumber}</span>
                      </a>
                      
                      <a 
                        href={`https://wa.me/${ad.contactNumber}?text=Hi`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center bg-green-100 px-2 py-2 sm:px-4 rounded-xl w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" 
                          alt="WhatsApp" 
                          className="w-5 h-5 mr-1 sm:mr-2"
                        />
                        <span className="text-sm font-medium text-green-800">WhatsApp</span>
                      </a>
                    </div>
                    
                    {/* Mobile-only description */}
                    <div className="sm:hidden mt-2">
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {ad.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Location Content Block - Shown After Ads */}
          <div className="mt-8">
            <LocationContent 
              locationName={decodedLocation} 
              className=""
            />
          </div>
        </>
      )}
    </div>
  );
}