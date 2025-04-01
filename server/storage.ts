import { users, type User, type InsertUser, ads, type Ad, type InsertAd, 
         siteSettings, type SiteSetting, pageContents, type PageContent,
         pointTransactions, type PointTransaction, type InsertPointTransaction,
         adPromotionPlans, type AdPromotionPlan, type InsertAdPromotionPlan,
         adPromotions, type AdPromotion, type InsertAdPromotion } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  makeUserAdmin(userId: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserPoints(userId: number, points: number): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Ad operations
  getAd(id: number): Promise<Ad | undefined>;
  getAdsByLocation(location: string): Promise<Ad[]>;
  getAdsByUserId(userId: number): Promise<Ad[]>;
  getAllAds(): Promise<Ad[]>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: number, ad: Partial<Ad>): Promise<Ad | undefined>;
  deleteAd(id: number): Promise<boolean>;
  incrementAdView(id: number): Promise<void>;
  verifyAd(id: number): Promise<Ad | undefined>;
  toggleAdActive(id: number, isActive: boolean): Promise<Ad | undefined>;
  
  // Ad Promotion Plans operations
  getPromotionPlan(id: number): Promise<AdPromotionPlan | undefined>;
  getAllPromotionPlans(): Promise<AdPromotionPlan[]>;
  getActivePromotionPlans(): Promise<AdPromotionPlan[]>;
  createPromotionPlan(plan: InsertAdPromotionPlan): Promise<AdPromotionPlan>;
  updatePromotionPlan(id: number, plan: Partial<AdPromotionPlan>): Promise<AdPromotionPlan | undefined>;
  deletePromotionPlan(id: number): Promise<boolean>;
  
  // Ad Promotions operations
  getAdPromotion(id: number): Promise<AdPromotion | undefined>;
  getAdPromotionsByAdId(adId: number): Promise<AdPromotion[]>;
  getAdPromotionsByUserId(userId: number): Promise<AdPromotion[]>;
  createAdPromotion(promotion: InsertAdPromotion): Promise<AdPromotion>;
  updateAdPromotionStatus(adId: number, promotionId: number | null, position: string | null, expiresAt: Date | null): Promise<Ad | undefined>;
  getActiveAdPromotions(): Promise<AdPromotion[]>;
  
  // Site settings operations
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Record<string, string>>;
  
  // Page content operations
  getPageContent(page: string): Promise<PageContent | undefined>;
  setPageContent(page: string, content: string, userId: number): Promise<PageContent>;
  getAllPageContents(): Promise<PageContent[]>;
  
  // Points and transactions
  getUserTransactions(userId: number): Promise<PointTransaction[]>;
  createTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private ads: Map<number, Ad>;
  private settings: Map<string, string>;
  private pageContents: Map<string, PageContent>;
  private transactions: Map<number, PointTransaction>;
  private promotionPlans: Map<number, AdPromotionPlan>;
  private adPromotions: Map<number, AdPromotion>;
  userCurrentId: number;
  adCurrentId: number;
  pageContentCurrentId: number;
  transactionCurrentId: number;
  promotionPlanCurrentId: number;
  adPromotionCurrentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.ads = new Map();
    this.settings = new Map();
    this.pageContents = new Map();
    this.transactions = new Map();
    this.promotionPlans = new Map();
    this.adPromotions = new Map();
    this.userCurrentId = 1;
    this.adCurrentId = 1;
    this.pageContentCurrentId = 1;
    this.transactionCurrentId = 1;
    this.promotionPlanCurrentId = 1;
    this.adPromotionCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions after one day
    });
    
    // Set default site name and footer text
    this.settings.set('siteName', 'ClassiSpot');
    this.settings.set('footerText', '© 2025 ClassiSpot - Post Free Classifieds Ads. All Rights Reserved.');
    
    // Set default promotion plans
    this.createPromotionPlan({
      name: "Top Position",
      durationDays: 1,
      position: "rank1",
      pointsCost: 500,
      description: "Your ad will appear at the very top of listings for 1 day",
      isActive: true,
      sortOrder: 1
    });
    
    this.createPromotionPlan({
      name: "Top Position",
      durationDays: 3,
      position: "rank1",
      pointsCost: 1200,
      description: "Your ad will appear at the very top of listings for 3 days",
      isActive: true,
      sortOrder: 2
    });
    
    this.createPromotionPlan({
      name: "Top Position",
      durationDays: 7,
      position: "rank1",
      pointsCost: 2500,
      description: "Your ad will appear at the very top of listings for 7 days",
      isActive: true,
      sortOrder: 3
    });
    
    this.createPromotionPlan({
      name: "Top 10",
      durationDays: 1,
      position: "top10",
      pointsCost: 100,
      description: "Your ad will appear in the top 10 listings for 1 day",
      isActive: true,
      sortOrder: 4
    });
    
    this.createPromotionPlan({
      name: "Top 10",
      durationDays: 3,
      position: "top10",
      pointsCost: 250,
      description: "Your ad will appear in the top 10 listings for 3 days",
      isActive: true,
      sortOrder: 5
    });
    
    this.createPromotionPlan({
      name: "Top 10",
      durationDays: 7,
      position: "top10",
      pointsCost: 500,
      description: "Your ad will appear in the top 10 listings for 7 days",
      isActive: true,
      sortOrder: 6
    });
    
    this.createPromotionPlan({
      name: "Top 10",
      durationDays: 15,
      position: "top10",
      pointsCost: 900,
      description: "Your ad will appear in the top 10 listings for 15 days",
      isActive: true,
      sortOrder: 7
    });
    
    // Set default page contents
    const defaultPages = [
      'about', 'contact', 'terms', 'privacy', 'sitemap'
    ];
    
    defaultPages.forEach((page) => {
      let pageContent = `Default content for ${page} page. This can be edited by an admin.`;
      
      // Set specific content for the about page
      if (page === 'about') {
        pageContent = `
# About ClassiSpot

ClassiSpot is your premier destination for local classified advertisements. Founded in 2025, we've quickly become the go-to platform for individuals and businesses looking to buy, sell, or advertise services in their local communities.

## Our Mission

At ClassiSpot, we're committed to creating a safe, user-friendly marketplace where people can connect, discover great deals, and find exactly what they need. Whether you're looking to sell unwanted items, find a new apartment, advertise your business, or discover local services, ClassiSpot makes it easy and accessible.

## Why Choose ClassiSpot?

- **Local Focus:** All ads are organized by location, making it easy to find what you need nearby
- **User Verification:** Enhanced security through user verification systems
- **Free Listings:** Basic ads are always free to post
- **Premium Options:** Boost your visibility with our affordable premium listing options
- **Mobile Friendly:** Browse and post ads from any device

We're constantly improving our platform based on user feedback. If you have suggestions or questions, please visit our Contact page.

Thank you for choosing ClassiSpot for your classified ad needs!
`;
      }
      
      this.pageContents.set(page, {
        id: this.pageContentCurrentId++,
        page,
        content: pageContent,
        updatedAt: new Date(),
        updatedBy: null
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user = { 
      id, 
      username: insertUser.username,
      password: insertUser.password,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      mobileNumber: insertUser.mobileNumber || null,
      isAdmin: false,
      points: 0
    } as User;
    this.users.set(id, user);
    return user;
  }
  
  async makeUserAdmin(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isAdmin: true };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const newPoints = (user.points || 0) + points;
    const updatedUser = { ...user, points: newPoints };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Ad operations
  async getAd(id: number): Promise<Ad | undefined> {
    return this.ads.get(id);
  }

  async getAdsByLocation(location: string): Promise<Ad[]> {
    return Array.from(this.ads.values()).filter(
      (ad) => ad.location.toLowerCase() === location.toLowerCase() && ad.isActive && ad.isPublic
    );
  }

  async getAdsByUserId(userId: number): Promise<Ad[]> {
    return Array.from(this.ads.values()).filter(
      (ad) => ad.userId === userId && ad.isActive
    );
  }

  async createAd(insertAd: InsertAd): Promise<Ad> {
    const id = this.adCurrentId++;
    const ad: Ad = {
      id,
      ...insertAd,
      createdAt: new Date(),
      viewCount: 0,
      isActive: true,
      isVerified: false,
      isPublic: false, // Default to draft/private until verification and promotion
      age: insertAd.age || null,
      promotionId: null,
      promotionExpiresAt: null,
      promotionPosition: null
    };
    this.ads.set(id, ad);
    return ad;
  }

  async updateAd(id: number, adUpdate: Partial<Ad>): Promise<Ad | undefined> {
    const existingAd = this.ads.get(id);
    if (!existingAd) return undefined;
    
    const updatedAd = { ...existingAd, ...adUpdate };
    this.ads.set(id, updatedAd);
    return updatedAd;
  }

  async deleteAd(id: number): Promise<boolean> {
    return this.ads.delete(id);
  }

  async incrementAdView(id: number): Promise<void> {
    const ad = this.ads.get(id);
    if (ad && ad.viewCount !== null) {
      ad.viewCount += 1;
      this.ads.set(id, ad);
    }
  }
  
  async getAllPublicAds(): Promise<Ad[]> {
    return Array.from(this.ads.values()).filter(ad => ad.isPublic && ad.isActive);
  }
  
  async getAllAds(): Promise<Ad[]> {
    return Array.from(this.ads.values());
  }
  
  async verifyAd(id: number): Promise<Ad | undefined> {
    const ad = this.ads.get(id);
    if (!ad) return undefined;
    
    const updatedAd = { ...ad, isVerified: true };
    this.ads.set(id, updatedAd);
    return updatedAd;
  }
  
  async toggleAdActive(id: number, isActive: boolean): Promise<Ad | undefined> {
    const ad = this.ads.get(id);
    if (!ad) return undefined;
    
    const updatedAd = { ...ad, isActive };
    this.ads.set(id, updatedAd);
    return updatedAd;
  }
  
  async toggleAdPublic(id: number, isPublic: boolean): Promise<Ad | undefined> {
    const ad = this.ads.get(id);
    if (!ad) return undefined;
    
    const updatedAd = { ...ad, isPublic };
    this.ads.set(id, updatedAd);
    return updatedAd;
  }
  
  // Site settings operations
  async getSetting(key: string): Promise<string | null> {
    return this.settings.get(key) || null;
  }
  
  async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }
  
  async getAllSettings(): Promise<Record<string, string>> {
    const settingsObj: Record<string, string> = {};
    this.settings.forEach((value, key) => {
      settingsObj[key] = value;
    });
    return settingsObj;
  }
  
  // Page content operations
  async getPageContent(page: string): Promise<PageContent | undefined> {
    return this.pageContents.get(page);
  }
  
  async setPageContent(page: string, content: string, userId: number): Promise<PageContent> {
    const existingContent = this.pageContents.get(page);
    
    const updatedContent: PageContent = {
      id: existingContent ? existingContent.id : this.pageContentCurrentId++,
      page,
      content,
      updatedAt: new Date(),
      updatedBy: userId
    };
    
    this.pageContents.set(page, updatedContent);
    return updatedContent;
  }
  
  async getAllPageContents(): Promise<PageContent[]> {
    return Array.from(this.pageContents.values());
  }
  
  // Points and transactions
  async getUserTransactions(userId: number): Promise<PointTransaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId
    );
  }
  
  async createTransaction(transaction: InsertPointTransaction): Promise<PointTransaction> {
    const id = this.transactionCurrentId++;
    const newTransaction: PointTransaction = {
      id,
      userId: transaction.userId,
      amount: transaction.amount,
      points: transaction.points,
      type: transaction.type,
      description: transaction.description || null,
      createdAt: new Date()
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  // Ad Promotion Plans operations
  async getPromotionPlan(id: number): Promise<AdPromotionPlan | undefined> {
    return this.promotionPlans.get(id);
  }
  
  async getAllPromotionPlans(): Promise<AdPromotionPlan[]> {
    return Array.from(this.promotionPlans.values());
  }
  
  async getActivePromotionPlans(): Promise<AdPromotionPlan[]> {
    return Array.from(this.promotionPlans.values()).filter(
      plan => plan.isActive
    ).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async createPromotionPlan(plan: InsertAdPromotionPlan): Promise<AdPromotionPlan> {
    const id = this.promotionPlanCurrentId++;
    const newPlan: AdPromotionPlan = {
      id,
      name: plan.name,
      durationDays: plan.durationDays,
      position: plan.position,
      pointsCost: plan.pointsCost,
      description: plan.description,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      sortOrder: plan.sortOrder !== undefined ? plan.sortOrder : 0
    };
    this.promotionPlans.set(id, newPlan);
    return newPlan;
  }
  
  async updatePromotionPlan(id: number, planUpdate: Partial<AdPromotionPlan>): Promise<AdPromotionPlan | undefined> {
    const existingPlan = this.promotionPlans.get(id);
    if (!existingPlan) return undefined;
    
    const updatedPlan = { ...existingPlan, ...planUpdate };
    this.promotionPlans.set(id, updatedPlan);
    return updatedPlan;
  }
  
  async deletePromotionPlan(id: number): Promise<boolean> {
    return this.promotionPlans.delete(id);
  }
  
  // Ad Promotions operations
  async getAdPromotion(id: number): Promise<AdPromotion | undefined> {
    return this.adPromotions.get(id);
  }
  
  async getAdPromotionsByAdId(adId: number): Promise<AdPromotion[]> {
    return Array.from(this.adPromotions.values()).filter(
      promo => promo.adId === adId
    );
  }
  
  async getAdPromotionsByUserId(userId: number): Promise<AdPromotion[]> {
    return Array.from(this.adPromotions.values()).filter(
      promo => promo.userId === userId
    );
  }
  
  async createAdPromotion(promotion: InsertAdPromotion): Promise<AdPromotion> {
    const id = this.adPromotionCurrentId++;
    const newPromotion: AdPromotion = {
      id,
      userId: promotion.userId,
      adId: typeof promotion.adId !== 'undefined' ? promotion.adId : null,
      planId: typeof promotion.planId !== 'undefined' ? promotion.planId : null,
      position: typeof promotion.position !== 'undefined' ? promotion.position : null,
      startedAt: new Date(),
      expiresAt: promotion.expiresAt,
      pointsSpent: promotion.pointsSpent,
      transactionId: promotion.transactionId || null
    };
    this.adPromotions.set(id, newPromotion);
    return newPromotion;
  }
  
  async updateAdPromotionStatus(adId: number, promotionId: number | null, position: string | null, expiresAt: Date | null): Promise<Ad | undefined> {
    const ad = this.ads.get(adId);
    if (!ad) return undefined;
    
    const updatedAd = { 
      ...ad, 
      promotionId, 
      promotionPosition: position, 
      promotionExpiresAt: expiresAt 
    };
    this.ads.set(adId, updatedAd);
    return updatedAd;
  }
  
  async getActiveAdPromotions(): Promise<AdPromotion[]> {
    const now = new Date();
    return Array.from(this.adPromotions.values()).filter(
      promo => promo.expiresAt > now
    );
  }
}

export const storage = new MemStorage();
