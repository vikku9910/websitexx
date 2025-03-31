import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  const siteName = settings?.siteName || "ClassiSpot";
  const currentYear = new Date().getFullYear();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex space-x-2 items-center">
            {!user ? (
              <Link href="/auth" className="text-gray-600 text-sm hover:text-[#4ebb78]">
                Login
              </Link>
            ) : (
              <>
                <span className="text-gray-600 text-sm mr-2">
                  Welcome, {user.firstName || user.username}
                </span>
                <Link 
                  href="/profile" 
                  className="text-gray-600 text-sm hover:text-[#4ebb78] mr-3 flex items-center"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                  Profile
                </Link>

                {user.isAdmin && (
                  <Link 
                    href="/admin" 
                    className="text-gray-600 text-sm hover:text-[#4ebb78] mr-3 flex items-center"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                    Admin Panel
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 text-sm hover:text-[#4ebb78] flex items-center"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                    />
                  </svg>
                  Logout
                </button>
              </>
            )}
            <Link 
              href="/post-ad" 
              className="text-sm bg-[#4ebb78] text-white px-4 py-1 rounded hover:bg-opacity-90"
            >
              Post Your Ad
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Custom Footer Component */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
