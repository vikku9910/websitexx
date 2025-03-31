import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import PostAdPage from "@/pages/PostAdPage";
import EditAdPage from "@/pages/EditAdPage";
import AuthPage from "@/pages/auth-page";
import LocationPage from "@/pages/LocationPage";
import AdDetailPage from "@/pages/AdDetailPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import SitemapPage from "@/pages/SitemapPage";
import AdminPage from "@/pages/AdminPage";
import ProfilePage from "@/pages/ProfilePage";
import MyListingsPage from "@/pages/MyListingsPage";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import FirstAdminSetup from "@/components/FirstAdminSetup";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/post-ad" component={PostAdPage} />
        <ProtectedRoute path="/edit-ad/:id" component={EditAdPage} />
        <Route path="/location/:location" component={LocationPage} />
        <Route path="/ad/:id" component={AdDetailPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/sitemap" component={SitemapPage} />
        <AdminRoute path="/admin" component={AdminPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/my-listings" component={MyListingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <FirstAdminSetup />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
