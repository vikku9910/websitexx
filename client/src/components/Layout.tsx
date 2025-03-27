import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

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

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500 mb-2">support@schloka.com</p>
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            <Link href="#" className="text-xs text-gray-500 hover:text-[#4ebb78]">About Us</Link>
            <Link href="#" className="text-xs text-gray-500 hover:text-[#4ebb78]">Contact Us</Link>
            <Link href="/post-ad" className="text-xs text-gray-500 hover:text-[#4ebb78]">Post Your Ad</Link>
            <Link href="#" className="text-xs text-gray-500 hover:text-[#4ebb78]">Sitemap</Link>
            <Link href="#" className="text-xs text-gray-500 hover:text-[#4ebb78]">Terms Of Service</Link>
            <Link href="#" className="text-xs text-gray-500 hover:text-[#4ebb78]">Privacy Policy</Link>
          </div>
          <p className="text-xs text-gray-500">© 2025 Schloka - Find Free Classifieds Ads. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
