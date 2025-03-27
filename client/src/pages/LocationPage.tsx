import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@shared/schema";
import { Loader2, MessageCircle, Phone, MapPin } from "lucide-react";

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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebb78]"
              defaultValue={decodedLocation}
              onChange={(e) => {
                if (e.target.value) {
                  window.location.href = `/location/${e.target.value}`;
                }
              }}
            >
              <option value="">Select Location</option>
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
              <option value="Jaipur">Jaipur</option>
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
            <div key={ad.id} className="border border-gray-200 rounded-md p-4 bg-white hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="w-48 h-48 flex-shrink-0">
                  {ad.photoUrls && ad.photoUrls.length > 0 ? (
                    <img 
                      src={ad.photoUrls[0]} 
                      alt={ad.title} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <Link href={`/ad/${ad.id}`}>
                    <h2 className="text-lg font-semibold text-[#4ebb78] hover:underline cursor-pointer">
                      {ad.title}
                    </h2>
                  </Link>
                  
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {ad.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{ad.location}</span>
                    </div>
                    
                    {ad.age && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span>Age: {ad.age}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-1" />
                      <span>{ad.contactNumber}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      {ad.isVerified && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Views: {ad.viewCount || 0}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-between ml-2">
                  <a 
                    href={`https://wa.me/${ad.contactNumber}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                  
                  <span className="text-xs text-gray-500">
                    {new Date(ad.createdAt).toLocaleDateString()}
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