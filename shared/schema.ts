import { pgTable, text, serial, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  mobileNumber: text("mobile_number"),
  isAdmin: boolean("is_admin").default(false),
  points: integer("points").default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  mobileNumber: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Ad Promotion Plans model - controlled by admin
export const adPromotionPlans = pgTable("ad_promotion_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  durationDays: integer("duration_days").notNull(),
  position: text("position").notNull(),
  pointsCost: integer("points_cost").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const insertAdPromotionPlanSchema = createInsertSchema(adPromotionPlans).omit({
  id: true,
});

export type InsertAdPromotionPlan = z.infer<typeof insertAdPromotionPlanSchema>;
export type AdPromotionPlan = typeof adPromotionPlans.$inferSelect;

// Ad Promotions tracking model
export const adPromotions = pgTable("ad_promotions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  adId: integer("ad_id"),  // Make it optional for pre-promotion
  planId: integer("plan_id"),  // Optional for direct promotions
  position: text("position"),  // Store position directly for pre-promotion
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  pointsSpent: integer("points_spent").notNull(),
  transactionId: integer("transaction_id"),
});

export const insertAdPromotionSchema = createInsertSchema(adPromotions).omit({
  id: true,
  startedAt: true,
});

export type InsertAdPromotion = z.infer<typeof insertAdPromotionSchema>;
export type AdPromotion = typeof adPromotions.$inferSelect;

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  contactNumber: text("contact_number").notNull(),
  contactEmail: text("contact_email").notNull(),
  photoUrls: text("photo_urls").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  age: text("age"),
  gender: text("gender"),
  nationality: text("nationality"),
  eyeColor: text("eye_color"),
  hairColor: text("hair_color"),
  height: text("height"),
  weight: text("weight"),
  services: text("services"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false), // Default to draft mode
  viewCount: integer("view_count").default(0),
  // Promotion fields
  promotionId: integer("promotion_id"),
  promotionExpiresAt: timestamp("promotion_expires_at"),
  promotionPosition: text("promotion_position"),
});

export const insertAdSchema = createInsertSchema(ads).omit({
  id: true,
  createdAt: true,
  viewCount: true,
  promotionId: true,
  promotionExpiresAt: true,
  promotionPosition: true,
});

export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof ads.$inferSelect;

// Site settings schema
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;

// Content management schema
export const pageContents = pgTable("page_contents", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const insertPageContentSchema = createInsertSchema(pageContents).omit({
  id: true,
  updatedAt: true,
});

export type InsertPageContent = z.infer<typeof insertPageContentSchema>;
export type PageContent = typeof pageContents.$inferSelect;

// Point transactions schema
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  points: integer("points").notNull(),
  type: text("type").notNull(), // "credit", "debit", etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;
