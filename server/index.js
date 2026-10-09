import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { config } from "./config.js";

import authRoutes from "./routes/auth.routes.js";
import listingsRoutes from "./routes/listings.routes.js";
import offersRoutes from "./routes/offers.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();

// Security and CORS configuration
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging in development
if (config.nodeEnv !== "test") {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.originalUrl.startsWith("/api")) {
        console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
      }
    });
    next();
  });
}

// Serve uploaded user files with cache headers
app.use(
  "/uploads",
  express.static(config.uploadDir, {
    maxAge: "1d",
    etag: true,
  })
);

// Mount API routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/upload", uploadRoutes);

// Fallback for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Production SPA static file serving
if (fs.existsSync(config.distDir)) {
  console.log(`Serving static production build from ${config.distDir}`);
  app.use(
    express.static(config.distDir, {
      maxAge: "1d",
      etag: true,
    })
  );

  // SPA fallback for non-API client routes
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(config.distDir, "index.html"));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error occurred.",
    ...(config.nodeEnv === "development" ? { stack: err.stack } : {}),
  });
});

// Start listening if run directly
let server = null;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(config.port, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(` CampusCart Campus Backend running on port ${config.port}`);
    console.log(` Environment: ${config.nodeEnv}`);
    console.log(` Health check: http://localhost:${config.port}/api/health`);
    console.log(` API Docs & Endpoints: http://localhost:${config.port}/api/meta`);
    console.log(`====================================================`);
  });
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down CampusCart backend...`);
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;
