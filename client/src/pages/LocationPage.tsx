import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@shared/schema";
import { Loader2, MessageCircle, Phone, MapPin, Award, TrendingUp } from "lucide-react";
import { locations } from "@/data/locations";
import { Badge } from "@/components/ui/badge";

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

      {(!ads || ads.length === 0) ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-10 rounded text-center">
          <p className="text-lg">No ads found in {decodedLocation}</p>
          <p className="mt-2 text-sm text-gray-500">Be the first to post an ad in this location</p>
          <Link href="/post-ad">
            <button className="mt-4 bg-[#4ebb78] text-white px-4 py-2 rounded-md hover:bg-opacity-90">
              Post An Ad
            </button>
          </Link>
        </div>
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
                  className={`border rounded-xl overflow-hidden hover:shadow-md transition-shadow
                    ${isRank1 ? 'border-amber-300 bg-amber-50' : 
                      isTop10 ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`
                  }
                >
                  <div className="flex">
                    {/* Promotion badge - if applicable */}
                    {ad.promotionId && (
                      <div className="absolute mt-2 ml-2">
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
                    )}
                    
                    {/* Image Thumbnail - Left Side */}
                    <div className="w-36 h-36 flex-shrink-0">
                      {ad.photoUrls && ad.photoUrls.length > 0 ? (
                        <Link href={`/ad/${ad.id}`}>
                          <img 
                            src={ad.photoUrls[0]} 
                            alt={ad.title} 
                            className="w-full h-full object-cover"
                          />
                        </Link>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Ad Info - Middle */}
                    <div className="flex-1 p-3">
                      {/* Title - Clickable to open full profile */}
                      <Link href={`/ad/${ad.id}`}>
                        <h2 className={`text-sm font-bold hover:underline cursor-pointer 
                          ${isRank1 ? 'text-amber-900' : isTop10 ? 'text-blue-900' : 'text-gray-900'}`}>
                          {ad.title}
                        </h2>
                      </Link>
                      
                      {/* Short Description */}
                      <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                        {ad.description}
                      </p>
                      
                      {/* Location & Age */}
                      <div className="flex items-center mt-2 text-xs text-gray-700">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{ad.location}</span>
                        {ad.age && <span className="ml-2">| Age {ad.age}</span>}
                      </div>
                    </div>
                    
                    {/* Phone & WhatsApp - Right Side */}
                    <div className="flex flex-col items-center justify-center p-3 w-32">
                      <a 
                        href={`tel:${ad.contactNumber}`}
                        className="flex items-center justify-center bg-green-50 px-3 py-1 rounded-xl text-center mb-1 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        <span className="text-sm font-semibold text-gray-800">{ad.contactNumber}</span>
                      </a>
                      
                      <a 
                        href={`https://wa.me/${ad.contactNumber}?text=Hi`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" 
                          alt="WhatsApp" 
                          className="w-6 h-6"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}