import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@shared/schema";
import { Loader2, MessageCircle, Phone, MapPin } from "lucide-react";
import { locations } from "@/data/locations";

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
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="border border-gray-200 bg-amber-50 rounded-md p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* Image Thumbnail - Left Side */}
                <div className="w-32 h-32 flex-shrink-0">
                  {ad.photoUrls && ad.photoUrls.length > 0 ? (
                    <Link href={`/ad/${ad.id}`}>
                      <img 
                        src={ad.photoUrls[0]} 
                        alt={ad.title} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </Link>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                
                {/* Ad Info - Middle */}
                <div className="flex-1 ml-1">
                  {/* Title - Clickable to open full profile */}
                  <Link href={`/ad/${ad.id}`}>
                    <h2 className="text-base font-bold text-[#000000] hover:underline cursor-pointer">
                      {ad.title}
                    </h2>
                  </Link>
                  
                  {/* Short Description - Only 20% */}
                  <p className="text-sm text-gray-700 mt-1">
                    {ad.description && ad.description.length > 50 
                      ? ad.description.substring(0, 50) + '...' 
                      : ad.description}
                  </p>
                  
                  {/* Location & Age */}
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-700">
                      {ad.location} {ad.age ? `• Age: ${ad.age}` : ''}
                    </span>
                  </div>
                  
                  {/* Category & Verification Tags */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <span className="text-xs px-1 py-0.5 rounded bg-green-100 text-green-800 mr-1">
                        {ad.category || 'Escort'}
                      </span>
                      {ad.isVerified && (
                        <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-800">
                          Verified
                        </span>
                      )}
                    </div>
                    
                    {/* Contact Number */}
                    <div className="text-xs text-green-600 font-medium">
                      {ad.contactNumber}
                    </div>
                  </div>
                </div>
                
                {/* WhatsApp & ID - Right Side */}
                <div className="flex flex-col items-end justify-between gap-2">
                  <a 
                    href={`https://wa.me/${ad.contactNumber}`} 
                    className="flex items-center justify-center w-8 h-8"
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" 
                      alt="WhatsApp" 
                      className="w-6 h-6"
                    />
                  </a>
                  
                  <span className="text-xs text-gray-500">
                    {ad.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}