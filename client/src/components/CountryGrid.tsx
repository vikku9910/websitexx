import { useState } from "react";
import { countries } from "@/data/countries";

export default function CountryGrid() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  // Split countries into 3 columns
  const columns = [
    countries.slice(0, 2),
    countries.slice(2, 4),
    countries.slice(4, 5)
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column, colIndex) => (
        <div key={colIndex}>
          {column.map((country, i) => (
            <div key={i} className="flex items-center mb-2 last:mb-0">
              <input 
                type="checkbox" 
                id={`country-${country.id}`} 
                className="mr-2"
                checked={selectedCountries.includes(country.name)}
                onChange={() => toggleCountry(country.name)}
              />
              <label 
                htmlFor={`country-${country.id}`} 
                className="text-gray-600 text-sm cursor-pointer"
              >
                {country.name}
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
