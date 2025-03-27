import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAdSchema } from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: any, next: any) => {
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: "Forbidden: Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API routes for locations and countries
  app.get("/api/locations", (_req, res) => {
    res.json({
      locations: [
        // Popular cities
        { id: 1, name: "Delhi" },
        { id: 2, name: "Mumbai" },
        { id: 3, name: "Kolkata" },
        { id: 4, name: "Chennai" },
        { id: 5, name: "Pune" },
        { id: 6, name: "Jaipur" },
        // And more...
      ]
    });
  });

  app.get("/api/countries", (_req, res) => {
    res.json({
      countries: [
        { id: 1, name: "Australia" },
        { id: 2, name: "Bangladesh" },
        { id: 3, name: "India" },
        { id: 4, name: "Sri Lanka" },
        { id: 5, name: "United Kingdom" },
      ]
    });
  });
  
  // Ad related routes
  
  // Get ads by location
  app.get("/api/ads/location/:location", async (req, res) => {
    const { location } = req.params;
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }
    
    try {
      const ads = await storage.getAdsByLocation(location);
      res.json(ads);
    } catch (error) {
      console.error("Error getting ads by location:", error);
      res.status(500).json({ error: "Failed to get ads" });
    }
  });
  
  // Get specific ad by id
  app.get("/api/ads/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ad ID" });
    }
    
    try {
      const ad = await storage.getAd(id);
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }
      
      // Increment view count
      await storage.incrementAdView(id);
      
      res.json(ad);
    } catch (error) {
      console.error("Error getting ad:", error);
      res.status(500).json({ error: "Failed to get ad" });
    }
  });
  
  // Get ads for current logged in user
  app.get("/api/my-ads", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const ads = await storage.getAdsByUserId(userId);
      res.json(ads);
    } catch (error) {
      console.error("Error getting user ads:", error);
      res.status(500).json({ error: "Failed to get user ads" });
    }
  });
  
  // Create new ad
  app.post("/api/ads", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const adData = { ...req.body, userId };
      
      // Validate ad data
      const validatedData = insertAdSchema.parse(adData);
      
      const newAd = await storage.createAd(validatedData);
      res.status(201).json(newAd);
    } catch (error) {
      console.error("Error creating ad:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create ad" });
    }
  });
  
  // Update existing ad
  app.put("/api/ads/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ad ID" });
    }
    
    try {
      const userId = req.user!.id;
      const ad = await storage.getAd(id);
      
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }
      
      // Check if the ad belongs to the current user
      if (ad.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized to update this ad" });
      }
      
      const updatedAd = await storage.updateAd(id, req.body);
      res.json(updatedAd);
    } catch (error) {
      console.error("Error updating ad:", error);
      res.status(500).json({ error: "Failed to update ad" });
    }
  });
  
  // Delete ad
  app.delete("/api/ads/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ad ID" });
    }
    
    try {
      const userId = req.user!.id;
      const ad = await storage.getAd(id);
      
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }
      
      // Check if the ad belongs to the current user
      if (ad.userId !== userId && !req.user!.isAdmin) {
        return res.status(403).json({ error: "Unauthorized to delete this ad" });
      }
      
      const deleted = await storage.deleteAd(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete ad" });
      }
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ error: "Failed to delete ad" });
    }
  });

  // ADMIN ROUTES
  
  // Create first admin (for initial setup)
  app.post("/api/create-first-admin", async (req, res) => {
    try {
      // Check if there are any users with admin rights
      const users = await storage.getAllUsers();
      const admins = users.filter(user => user.isAdmin);
      
      // If there are already admins, don't allow this route to be used
      if (admins.length > 0) {
        return res.status(403).json({ error: "Admin users already exist" });
      }
      
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const updatedUser = await storage.makeUserAdmin(parseInt(userId));
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error creating first admin:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });
  
  // Get all users
  app.get("/api/admin/users", isAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });
  
  // Get all ads for admin
  app.get("/api/admin/ads", isAdmin, async (_req, res) => {
    try {
      const ads = await storage.getAllAds();
      res.json(ads);
    } catch (error) {
      console.error("Error getting all ads:", error);
      res.status(500).json({ error: "Failed to get ads" });
    }
  });
  
  // Make user an admin
  app.post("/api/admin/users/:id/make-admin", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    try {
      const updatedUser = await storage.makeUserAdmin(id);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  // Verify an ad
  app.post("/api/admin/ads/:id/verify", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ad ID" });
    }
    
    try {
      const updatedAd = await storage.verifyAd(id);
      if (!updatedAd) {
        return res.status(404).json({ error: "Ad not found" });
      }
      res.json(updatedAd);
    } catch (error) {
      console.error("Error verifying ad:", error);
      res.status(500).json({ error: "Failed to verify ad" });
    }
  });
  
  // Toggle ad active status
  app.post("/api/admin/ads/:id/toggle-active", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ad ID" });
    }
    
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }
    
    try {
      const updatedAd = await storage.toggleAdActive(id, isActive);
      if (!updatedAd) {
        return res.status(404).json({ error: "Ad not found" });
      }
      res.json(updatedAd);
    } catch (error) {
      console.error("Error toggling ad active status:", error);
      res.status(500).json({ error: "Failed to update ad" });
    }
  });
  
  // Settings and content management routes
  
  // Get site settings
  app.get("/api/site-settings", async (_req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error getting site settings:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });
  
  // Update site settings (admin only)
  app.post("/api/admin/site-settings", isAdmin, async (req, res) => {
    const { key, value } = req.body;
    
    if (!key || typeof value !== "string") {
      return res.status(400).json({ error: "Key and value are required" });
    }
    
    try {
      await storage.setSetting(key, value);
      res.json({ key, value });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });
  
  // Get all page content
  app.get("/api/page-content", async (_req, res) => {
    try {
      const contents = await storage.getAllPageContents();
      res.json(contents);
    } catch (error) {
      console.error("Error getting all page content:", error);
      res.status(500).json({ error: "Failed to get page content" });
    }
  });

  // Get specific page content
  app.get("/api/page-content/:page", async (req, res) => {
    const { page } = req.params;
    
    try {
      const content = await storage.getPageContent(page);
      if (!content) {
        return res.status(404).json({ error: "Page content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error(`Error getting ${page} page content:`, error);
      res.status(500).json({ error: "Failed to get page content" });
    }
  });
  
  // Update page content (admin only)
  app.post("/api/admin/page-content/:page", isAdmin, async (req, res) => {
    const { page } = req.params;
    const { content } = req.body;
    
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }
    
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const updatedContent = await storage.setPageContent(page, content, req.user.id);
      res.json(updatedContent);
    } catch (error) {
      console.error(`Error updating ${page} page content:`, error);
      res.status(500).json({ error: "Failed to update page content" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
