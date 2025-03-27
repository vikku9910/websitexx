import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API routes
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

  const httpServer = createServer(app);

  return httpServer;
}
