import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@shared/schema";
import { Loader2, Phone, MapPin, Calendar, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function AdDetailPage() {
  const { id } = useParams();
  const adId = id ? parseInt(id) : 0;
  const [activeImage, setActiveImage] = useState(0);
  
  const { data: ad, isLoading, error } = useQuery<Ad>({
    queryKey: ["/api/ads", adId],
    queryFn: async () => {
      const response = await fetch(`/api/ads/${adId}`);
      if (!response.ok) {
        throw new Error(`Error fetching ad: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!adId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ebb78]" />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading ad: {error ? (error as Error).message : "Ad not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/" className="hover:text-[#4ebb78]">Home</Link>
        <span>{">"}</span>
        <Link href={`/location/${encodeURIComponent(ad.location)}`} className="hover:text-[#4ebb78]">
          {ad.location}
        </Link>
        <span>{">"}</span>
        <span className="text-gray-800">{ad.title}</span>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Gallery */}
          <div className="w-full md:w-1/2 p-4">
            <div className="mb-4">
              {ad.photoUrls && ad.photoUrls.length > 0 ? (
                <img 
                  src={ad.photoUrls[activeImage]} 
                  alt={ad.title} 
                  className="w-full h-80 object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-80 bg-gray-200 flex items-center justify-center rounded-md">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {ad.photoUrls && ad.photoUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {ad.photoUrls.map((url, index) => (
                  <div 
                    key={index}
                    className={`w-20 h-20 flex-shrink-0 cursor-pointer border-2 rounded-md ${
                      index === activeImage ? "border-[#4ebb78]" : "border-transparent"
                    }`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img 
                      src={url} 
                      alt={`Thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Ad Details */}
          <div className="w-full md:w-1/2 p-4 border-t md:border-t-0 md:border-l border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">{ad.title}</h1>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{ad.location}</span>
              </div>
              
              {ad.age && (
                <div className="flex items-center text-gray-600">
                  <span>Age: {ad.age}</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <span>Views: {ad.viewCount || 0}</span>
              </div>
            </div>
            
            {ad.isVerified && (
              <div className="mb-4">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Verified
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{ad.description}</p>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-gray-800">Contact Information</h2>
              
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-[#4ebb78]" />
                <a 
                  href={`tel:${ad.contactNumber}`} 
                  className="text-gray-700 hover:text-[#4ebb78]"
                >
                  {ad.contactNumber}
                </a>
              </div>
              
              <div className="flex justify-between mt-4">
                <a 
                  href={`tel:${ad.contactNumber}`} 
                  className="bg-[#4ebb78] text-white px-4 py-2 rounded-md hover:bg-opacity-90 inline-flex items-center"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </a>
                
                <a 
                  href={`https://wa.me/${ad.contactNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-opacity-90 inline-flex items-center"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}