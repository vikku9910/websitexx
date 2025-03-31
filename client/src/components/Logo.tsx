import { useQuery } from "@tanstack/react-query";

export default function Logo() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  const siteName = settings?.siteName || "ClassiSpot";
  
  return (
    <span className="text-[#4ebb78] font-bold italic text-2xl cursor-pointer">
      {siteName}
    </span>
  );
}
