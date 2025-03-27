import { useState } from "react";
import LocationGrid from "@/components/LocationGrid";
import CountryGrid from "@/components/CountryGrid";
import { useLocation } from "wouter";

export default function HomePage() {
  const popularCities = ["Delhi", "Mumbai", "Kolkata", "Chennai", "Pune", "Jaipur"];
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const handleCityClick = (city: string) => {
    // Instead of just selecting, we'll navigate to the location page
    navigate(`/location/${encodeURIComponent(city)}`);
  };

  return (
    <div>
      {/* Hero Banner Section */}
      <div className="bg-[#4ebb78] py-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-2xl font-semibold mb-2">Explore World's Escort Directory</h1>
          <p className="text-white text-sm">Search from over 20k+ Active Ads in 500+ Cities for Free</p>
        </div>
      </div>

      {/* Popular Locations Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-md shadow p-6 mb-8">
          <h2 className="text-gray-800 font-semibold text-lg mb-2">Popular locations:</h2>
          <p className="text-gray-600 text-sm mb-4">
            Find a date tonight to fulfill your needs. You can browse through the best call girls in India for free
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
          <h2 className="text-gray-800 font-semibold text-lg mb-2">Genuine Platform For Discerning Gentlemen Worldwide</h2>
          <p className="text-gray-600 text-sm mb-4">
            We are not an escort agency - our site is a specialized advertising space for independent professional ladies and independent escort agencies. We are not involved in providing or prostitution business. We take no responsibility for the content or actions of third-party websites or individuals that you may access following from here, either, or phone numbers from this portal.
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Schloka - Browse escort directory with more than 50,000 profiles to choose from.
          </p>
          
          {/* Country Grid */}
          <CountryGrid />
        </div>
      </div>
    </div>
  );
}
