import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@shared/schema";
import { Loader2, Phone, MapPin, Calendar, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdDetailPage() {
  const { id } = useParams();
  const adId = id ? parseInt(id) : 0;
  const [activeImage, setActiveImage] = useState(0);
  const [similarAds, setSimilarAds] = useState<Ad[]>([]);
  
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
  
  // Fetch similar ads based on location
  useEffect(() => {
    if (ad) {
      const fetchSimilarAds = async () => {
        try {
          const response = await fetch(`/api/ads/location/${ad.location}`);
          if (response.ok) {
            const data = await response.json();
            // Filter out the current ad and limit to 3 ads
            const filtered = data.filter((a: Ad) => a.id !== adId).slice(0, 3);
            setSimilarAds(filtered);
          }
        } catch (error) {
          console.error("Failed to fetch similar ads:", error);
        }
      };
      
      fetchSimilarAds();
    }
  }, [ad, adId]);

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
            {/* Main Image */}
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
              <div className="flex flex-wrap gap-2 pb-2">
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
              
              <div className="flex items-center text-gray-600">
                <span>Category: {ad.category || 'Unspecified'}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
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
              
              <div className="flex flex-col items-center w-48">
                <a 
                  href={`tel:${ad.contactNumber}`}
                  className="bg-green-50 px-4 py-2 rounded-md text-center mb-2 w-full block"
                >
                  <span className="text-base font-semibold text-gray-800">{ad.contactNumber}</span>
                </a>
                
                <a 
                  href={`https://wa.me/${ad.contactNumber}?text=Hi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" 
                    alt="WhatsApp" 
                    className="w-10 h-10"
                  />
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
                  href={`https://wa.me/${ad.contactNumber}?text=Hi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-opacity-90 inline-flex items-center"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" 
                    alt="WhatsApp" 
                    className="h-4 w-4 mr-2"
                  />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar Ads Section */}
      {similarAds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Similar Ads in {ad.location}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similarAds.map((similarAd) => (
              <Link key={similarAd.id} href={`/ad/${similarAd.id}`}>
                <div className="border border-gray-200 rounded-md overflow-hidden hover:shadow-md transition-shadow">
                  {/* Ad Image */}
                  <div className="h-48 w-full">
                    {similarAd.photoUrls && similarAd.photoUrls.length > 0 ? (
                      <img 
                        src={similarAd.photoUrls[0]} 
                        alt={similarAd.title} 
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
                    <h3 className="font-medium text-sm mb-1 truncate">{similarAd.title}</h3>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">{similarAd.location}</span>
                      <span className="text-gray-600">{similarAd.category || 'Unspecified'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}