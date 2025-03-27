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
      if (ad.userId !== userId) {
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

  const httpServer = createServer(app);

  return httpServer;
}
