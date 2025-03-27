import { useState } from "react";
import { locations } from "@/data/locations";

export default function LocationGrid() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const toggleLocation = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(loc => loc !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  // Create columns from the locations array
  const columns = [
    locations.slice(0, 10),
    locations.slice(10, 20),
    locations.slice(20, 30),
    locations.slice(30, 40)
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="border border-gray-200 p-4 rounded">
          {column.map((location, i) => (
            <div key={i} className="flex items-center mb-2 last:mb-0">
              <input 
                type="checkbox" 
                id={`loc-${location.id}`} 
                className="mr-2"
                checked={selectedLocations.includes(location.name)}
                onChange={() => toggleLocation(location.name)}
              />
              <label 
                htmlFor={`loc-${location.id}`} 
                className="text-gray-600 text-sm cursor-pointer"
              >
                {location.name}
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
