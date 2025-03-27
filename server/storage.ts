import { users, type User, type InsertUser, ads, type Ad, type InsertAd } from "@shared/schema";
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
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private ads: Map<number, Ad>;
  userCurrentId: number;
  adCurrentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.ads = new Map();
    this.userCurrentId = 1;
    this.adCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
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
      isAdmin: false
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

  // Ad operations
  async getAd(id: number): Promise<Ad | undefined> {
    return this.ads.get(id);
  }

  async getAdsByLocation(location: string): Promise<Ad[]> {
    return Array.from(this.ads.values()).filter(
      (ad) => ad.location.toLowerCase() === location.toLowerCase() && ad.isActive
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
      age: insertAd.age || null,
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
}

export const storage = new MemStorage();
