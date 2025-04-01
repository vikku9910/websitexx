import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAdSchema, insertPointTransactionSchema, insertAdPromotionPlanSchema, insertAdPromotionSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";
import { randomBytes } from "crypto";
import { hashPassword } from "./auth";

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
  
  // Get all public ads for homepage
  app.get("/api/ads", async (_req, res) => {
    try {
      const ads = await storage.getAllPublicAds();
      res.json(ads);
    } catch (error) {
      console.error("Error getting public ads:", error);
      res.status(500).json({ error: "Failed to get ads" });
    }
  });
  
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
  
  // Partially update existing ad (for user editing)
  app.patch("/api/ads/:id", isAuthenticated, async (req, res) => {
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
      
      // Check if the ad belongs to the current user or user is admin
      if (ad.userId !== userId && !req.user!.isAdmin) {
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
  
  // Toggle ad public status - used to publish draft ads
  app.patch("/api/ads/:id/toggle-public", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ad ID" });
    }
    
    try {
      const userId = req.user!.id;
      const { isPublic } = req.body;
      
      if (isPublic === undefined) {
        return res.status(400).json({ error: "isPublic status is required" });
      }
      
      const ad = await storage.getAd(id);
      
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }
      
      // Check if the ad belongs to the current user
      if (ad.userId !== userId && !req.user!.isAdmin) {
        return res.status(403).json({ error: "Unauthorized to update this ad" });
      }
      
      const updatedAd = await storage.toggleAdPublic(id, isPublic);
      
      if (updatedAd) {
        res.status(200).json(updatedAd);
      } else {
        res.status(500).json({ error: "Failed to update ad status" });
      }
    } catch (error) {
      console.error("Error updating ad public status:", error);
      res.status(500).json({ error: "Failed to update ad status" });
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
  
  // Verify user's mobile number by admin
  app.post("/api/admin/users/:id/verify-mobile", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(id, { isMobileVerified: true });
      if (!updatedUser) {
        return res.status(404).json({ error: "Failed to update user" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error verifying user mobile:", error);
      res.status(500).json({ error: "Failed to verify mobile number" });
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

  // Points and transactions routes

  // Get current user's transactions
  app.get("/api/user/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error getting user transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Admin: Manage user points (add or remove)
  app.post("/api/admin/users/:id/points", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { points, description } = req.body;
    if (typeof points !== "number") {
      return res.status(400).json({ error: "Points must be a number" });
    }

    try {
      // If removing points, check if user has enough
      if (points < 0) {
        const user = await storage.getUser(id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if ((user.points || 0) < Math.abs(points)) {
          return res.status(400).json({ error: "User doesn't have enough points" });
        }
      }

      // Update user points
      const updatedUser = await storage.updateUserPoints(id, points);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: id,
        amount: points,
        points: Number(updatedUser.points || 0),
        type: points >= 0 ? "credit" : "debit",
        description: description || (points >= 0 ? "Added by admin" : "Removed by admin")
      });

      res.json({ user: updatedUser, transaction });
    } catch (error) {
      console.error("Error managing user points:", error);
      res.status(500).json({ error: "Failed to update points" });
    }
  });

  // Keeping backward compatibility for now
  app.post("/api/admin/users/:id/add-points", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { points, description } = req.body;
    if (typeof points !== "number" || points <= 0) {
      return res.status(400).json({ error: "Points must be a positive number" });
    }

    try {
      // Update user points
      const updatedUser = await storage.updateUserPoints(id, points);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: id,
        amount: points,
        points: Number(updatedUser.points || 0),
        type: "credit",
        description: description || "Added by admin"
      });

      res.json({ user: updatedUser, transaction });
    } catch (error) {
      console.error("Error adding points to user:", error);
      res.status(500).json({ error: "Failed to add points" });
    }
  });

  // Admin: Remove points from a user
  app.post("/api/admin/users/:id/remove-points", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { points, description } = req.body;
    if (typeof points !== "number" || points <= 0) {
      return res.status(400).json({ error: "Points must be a positive number" });
    }

    try {
      // First, check if user has enough points
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if ((user.points || 0) < points) {
        return res.status(400).json({ error: "User doesn't have enough points" });
      }

      // Update user points
      const updatedUser = await storage.updateUserPoints(id, -points);

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: id,
        amount: -points,
        points: Number(updatedUser!.points || 0),
        type: "debit",
        description: description || "Removed by admin"
      });

      res.json({ user: updatedUser, transaction });
    } catch (error) {
      console.error("Error removing points from user:", error);
      res.status(500).json({ error: "Failed to remove points" });
    }
  });

  // Ad Promotion Plan Routes
  
  // Get all promotion plans
  app.get("/api/promotion-plans", async (_req, res) => {
    try {
      const plans = await storage.getActivePromotionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error getting promotion plans:", error);
      res.status(500).json({ error: "Failed to get promotion plans" });
    }
  });
  
  // Admin: Create promotion plan
  app.post("/api/admin/promotion-plans", isAdmin, async (req, res) => {
    try {
      const planData = req.body;
      
      // Validate plan data
      const validatedData = insertAdPromotionPlanSchema.parse(planData);
      
      const newPlan = await storage.createPromotionPlan(validatedData);
      res.status(201).json(newPlan);
    } catch (error) {
      console.error("Error creating promotion plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create promotion plan" });
    }
  });
  
  // Admin: Update promotion plan
  app.patch("/api/admin/promotion-plans/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid promotion plan ID" });
    }
    
    try {
      const updatedPlan = await storage.updatePromotionPlan(id, req.body);
      if (!updatedPlan) {
        return res.status(404).json({ error: "Promotion plan not found" });
      }
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating promotion plan:", error);
      res.status(500).json({ error: "Failed to update promotion plan" });
    }
  });
  
  // Admin: Delete promotion plan
  app.delete("/api/admin/promotion-plans/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid promotion plan ID" });
    }
    
    try {
      const deleted = await storage.deletePromotionPlan(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Promotion plan not found" });
      }
    } catch (error) {
      console.error("Error deleting promotion plan:", error);
      res.status(500).json({ error: "Failed to delete promotion plan" });
    }
  });
  
  // Ad Promotion Routes
  
  // Get promotions for an ad
  app.get("/api/ads/:id/promotions", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ad ID" });
    }
    
    try {
      const promotions = await storage.getAdPromotionsByAdId(id);
      res.json(promotions);
    } catch (error) {
      console.error("Error getting ad promotions:", error);
      res.status(500).json({ error: "Failed to get ad promotions" });
    }
  });
  
  // Get active promotions
  app.get("/api/active-promotions", async (_req, res) => {
    try {
      const promotions = await storage.getActiveAdPromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error getting active promotions:", error);
      res.status(500).json({ error: "Failed to get active promotions" });
    }
  });
  
  // Direct promotion endpoint
  app.post("/api/ad-promotions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { position, durationDays, points } = req.body;
      
      if (!position || !durationDays || !points) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user has enough points
      if ((user.points || 0) < points) {
        return res.status(400).json({ error: "Insufficient points" });
      }
      
      // Calculate expiration date
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));
      
      // Deduct points from user
      const updatedUser = await storage.updateUserPoints(userId, -points);
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        amount: -points,
        points: Number(updatedUser!.points || 0),
        type: "debit",
        description: `Ad promotion: ${position} for ${durationDays} days`
      });
      
      // Create promotion record without an ad yet (will be linked later)
      const promotion = await storage.createAdPromotion({
        userId,
        position,
        expiresAt,
        pointsSpent: points,
        transactionId: transaction.id
      });
      
      res.status(201).json(promotion);
    } catch (error) {
      console.error("Error creating ad promotion:", error);
      res.status(500).json({ error: "Failed to create ad promotion" });
    }
  });
  
  // Create promotion for an ad
  app.post("/api/ads/:id/promote", isAuthenticated, async (req, res) => {
    const adId = parseInt(req.params.id);
    if (isNaN(adId)) {
      return res.status(400).json({ error: "Invalid ad ID" });
    }
    
    try {
      const userId = req.user!.id;
      const ad = await storage.getAd(adId);
      
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }
      
      // Check if the ad belongs to the current user
      if (ad.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized to promote this ad" });
      }
      
      // We have two promotion paths:
      // 1. Traditional path with planId (existing implementation)
      // 2. New flow with promotionId (linking a pre-created promotion to an ad)
      
      if (req.body.promotionId) {
        // New flow - link existing promotion to ad
        const promotionId = req.body.promotionId;
        
        // Get the promotion
        const promotion = await storage.getAdPromotion(promotionId);
        if (!promotion) {
          return res.status(404).json({ error: "Promotion not found" });
        }
        
        if (promotion.userId !== userId) {
          return res.status(403).json({ error: "You don't own this promotion" });
        }
        
        // Update ad with promotion status
        const updatedAd = await storage.updateAdPromotionStatus(
          adId,
          promotionId,
          promotion.position,
          promotion.expiresAt
        );
        
        return res.json(updatedAd);
      } else {
        // Traditional flow - create promotion from a plan
        const { planId } = req.body;
        if (!planId) {
          return res.status(400).json({ error: "Promotion plan is required" });
        }
        
        // Get the plan
        const plan = await storage.getPromotionPlan(planId);
        if (!plan) {
          return res.status(404).json({ error: "Promotion plan not found" });
        }
        
        // Check if user has enough points
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        if ((user.points || 0) < plan.pointsCost) {
          return res.status(400).json({ error: "Not enough points" });
        }
        
        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
        
        // Deduct points from user
        const updatedUser = await storage.updateUserPoints(userId, -plan.pointsCost);
        
        // Create transaction record
        const transaction = await storage.createTransaction({
          userId,
          amount: -plan.pointsCost,
          points: Number(updatedUser!.points || 0),
          type: "debit",
          description: `Ad promotion: ${plan.name} for ${plan.durationDays} days`
        });
        
        // Create promotion record
        const promotion = await storage.createAdPromotion({
          adId,
          userId,
          planId,
          expiresAt,
          pointsSpent: plan.pointsCost,
          transactionId: transaction.id
        });
        
        // Update ad with promotion status
        const updatedAd = await storage.updateAdPromotionStatus(
          adId, 
          promotion.id, 
          plan.position, 
          expiresAt
        );
        
        res.status(201).json({
          promotion,
          transaction,
          ad: updatedAd
        });
      }
      
    } catch (error) {
      console.error("Error promoting ad:", error);
      res.status(500).json({ error: "Failed to promote ad" });
    }
  });

  // OTP verification endpoints
  
  // Store OTP codes in memory (in a real application, use a database)
  const otpStore = new Map<string, { otp: string, expiresAt: Date }>();

  // Generate a random 6-digit OTP
  function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via Fast2SMS API (with development mode fallback)
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { mobileNumber } = req.body;
      
      if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
        return res.status(400).json({ error: "Invalid mobile number format. Must be a 10-digit Indian mobile number." });
      }
      
      // Generate a new OTP
      const otp = generateOTP();
      console.log(`Generated OTP for ${mobileNumber}: ${otp}`);
      
      // Store the OTP (expires in 10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      otpStore.set(mobileNumber, { otp, expiresAt });
      
      // Send the OTP via Fast2SMS API
      const apiKey = process.env.FAST2SMS_API_KEY;
      
      if (!apiKey) {
        console.warn("FAST2SMS_API_KEY not found, falling back to development mode");
        return res.json({ 
          success: true, 
          message: "OTP sent successfully (development mode)", 
          devInfo: `OTP is: ${otp}`,
          smsMode: "development"
        });
      }
      
      // Prepare the message
      const message = `Your Verification Code : ${otp}`;
      const encodedMessage = encodeURIComponent(message);
      
      // Construct the API URL
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodedMessage}&flash=0&numbers=${mobileNumber}`;
      
      // Make the API call
      const response = await fetch(url);
      const data = await response.json();
      
      // Check if response has the expected structure
      if (typeof data === 'object' && data !== null && 'return' in data && data.return === true) {
        // Real SMS was sent successfully
        return res.json({ 
          success: true, 
          message: "OTP sent successfully to your mobile number",
          smsMode: "production"
        });
      } else {
        console.error("Fast2SMS API error:", data);
        
        // Fallback to development mode if API fails
        return res.json({ 
          success: true, 
          message: "OTP sent successfully (development mode)", 
          devInfo: `OTP is: ${otp}`,
          smsMode: "development"
        });
      }
      
    } catch (error) {
      console.error("Error sending OTP:", error);
      
      // Even on error, just show the test OTP
      const otp = otpStore.get(req.body.mobileNumber)?.otp;
      if (otp) {
        return res.json({ 
          success: true, 
          message: "OTP sent successfully (development mode)", 
          devInfo: `OTP is: ${otp}`,
          smsMode: "development"
        });
      }
      
      res.status(500).json({ 
        error: "Failed to generate OTP", 
        details: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  });
  
  // Verify OTP
  app.post("/api/verify-otp", (req, res) => {
    try {
      const { mobileNumber, otp } = req.body;
      
      if (!mobileNumber || !otp) {
        return res.status(400).json({ error: "Mobile number and OTP are required" });
      }
      
      const storedData = otpStore.get(mobileNumber);
      
      if (!storedData) {
        return res.status(400).json({ error: "No OTP was sent to this number or it has expired" });
      }
      
      const now = new Date();
      if (now > storedData.expiresAt) {
        otpStore.delete(mobileNumber);
        return res.status(400).json({ error: "OTP has expired" });
      }
      
      if (storedData.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
      
      // OTP verified successfully, delete it from store
      otpStore.delete(mobileNumber);
      
      // If the user is logged in, update their mobile verification status
      if (req.isAuthenticated()) {
        const userId = req.user!.id;
        
        // Update user mobile verification status
        storage.updateUser(userId, { isMobileVerified: true })
          .then(() => console.log(`User ${userId} mobile number verified successfully`))
          .catch(err => console.error("Error updating user mobile verification status:", err));
        
        // Also update any ads by this user that are not verified
        storage.getAdsByUserId(userId)
          .then(ads => {
            // Find ads that are not verified
            const unverifiedAds = ads.filter(ad => !ad.isVerified);
            
            // Update each unverified ad
            unverifiedAds.forEach(ad => {
              storage.updateAd(ad.id, { isVerified: true })
                .then(() => console.log(`Ad ${ad.id} automatically verified after mobile verification`))
                .catch(err => console.error(`Error auto-verifying ad ${ad.id}:`, err));
            });
          })
          .catch(err => console.error("Error fetching user's ads for verification update:", err));
      }
      
      res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Password Reset Endpoints
  
  // Store OTP codes with expiration for password reset
  const passwordResetOtpStore = new Map<string, { otp: string, expiresAt: Date }>();
  
  // Store password reset tokens with expiration
  const resetTokenStore = new Map<string, { email: string, token: string, expiresAt: Date }>();

  // Helper function to generate a reset token
  function generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Request password reset
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Check if user exists with this email
      const user = await storage.getUserByUsername(email);
      
      // For security, don't disclose if user exists or not
      // Always return success, but only actually send OTP if user exists
      
      if (user) {
        // Generate and store OTP
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valid for 15 minutes
        
        passwordResetOtpStore.set(email, { otp, expiresAt });
        
        // In a real application, we would send the OTP via email
        // For now, just log it for debugging in development 
        console.log(`Password reset OTP for ${email}: ${otp}`);
        
        // Return success with dev info in development mode
        if (process.env.NODE_ENV !== "production") {
          return res.json({ 
            success: true, 
            message: "OTP sent successfully (development mode)",
            email,
            devInfo: `OTP is: ${otp}` 
          });
        }
      }
      
      // Always return success to prevent email enumeration
      res.json({ 
        success: true, 
        message: "If an account with this email exists, a reset code has been sent",
        email
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  
  // Verify password reset OTP
  app.post("/api/verify-reset-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }
      
      const storedData = passwordResetOtpStore.get(email);
      
      if (!storedData) {
        return res.status(400).json({ error: "No reset code was sent to this email or it has expired" });
      }
      
      const now = new Date();
      if (now > storedData.expiresAt) {
        passwordResetOtpStore.delete(email);
        return res.status(400).json({ error: "Reset code has expired" });
      }
      
      if (storedData.otp !== otp) {
        return res.status(400).json({ error: "Invalid reset code" });
      }
      
      // OTP verified successfully, delete it from store
      passwordResetOtpStore.delete(email);
      
      // Generate a reset token
      const resetToken = generateResetToken();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15); // Token valid for 15 minutes
      
      // Store the reset token
      resetTokenStore.set(resetToken, { 
        email, 
        token: resetToken, 
        expiresAt: tokenExpiresAt 
      });
      
      res.json({ 
        success: true, 
        message: "Reset code verified successfully", 
        resetToken 
      });
    } catch (error) {
      console.error("Error verifying reset code:", error);
      res.status(500).json({ error: "Failed to verify reset code" });
    }
  });
  
  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, resetToken, password } = req.body;
      
      if (!email || !resetToken || !password) {
        return res.status(400).json({ error: "Email, reset token, and new password are required" });
      }
      
      // Check if token exists and is valid
      const storedData = resetTokenStore.get(resetToken);
      
      if (!storedData || storedData.email !== email) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      const now = new Date();
      if (now > storedData.expiresAt) {
        resetTokenStore.delete(resetToken);
        return res.status(400).json({ error: "Reset token has expired" });
      }
      
      // Check if user exists
      const user = await storage.getUserByUsername(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get hashed password
      
      // Update user's password
      const hashedPassword = await hashPassword(password);
      const updatedUser = await storage.updateUser(user.id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      
      // Delete the reset token
      resetTokenStore.delete(resetToken);
      
      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
