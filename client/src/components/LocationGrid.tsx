import { locations } from "@/data/locations";

interface LocationGridProps {
  onLocationClick?: (location: string) => void;
}

export default function LocationGrid({ onLocationClick }: LocationGridProps) {
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
            <div key={i} className="mb-2 last:mb-0">
              <a 
                href={`/location/${encodeURIComponent(location.name)}`}
                className="text-gray-600 text-sm hover:text-[#4ebb78] hover:underline cursor-pointer"
                onClick={(e) => {
                  if (onLocationClick) {
                    e.preventDefault();
                    onLocationClick(location.name);
                  }
                }}
              >
                {location.name}
              </a>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
