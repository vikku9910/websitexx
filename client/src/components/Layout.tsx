import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

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
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 text-sm hover:text-[#4ebb78]"
                >
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
        <div className="bg-black text-white py-3 text-center text-sm">
          © 2022 Schloka - Post Free Classifieds Ads. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
