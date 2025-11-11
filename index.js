import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";

dotenv.config();

import connectDB from "./config/database.js";
import errorHandler from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/auth.js";
import routes from "./routes/index.js";
import logger from "./utils/logger.js";
import { validateEnv } from "./utils/validation.js";
import { cleanupOldFiles } from "./utils/fileUpload.js";
import { sendNotFoundResponse } from "./utils/apiHelpers.js";
// Import models to ensure they are registered
import "./models/index.js";

const app = express();

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || 5000;

function initializeMiddlewares() {
  app.use(helmet());

  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors({ origin: "*" }));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Custom request logging
  if (process.env.NODE_ENV !== "test") {
    app.use(requestLogger);
    app.use(
      morgan("combined", {
        stream: { write: (message) => logger.info(message.trim()) },
      })
    );
  }

  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: Math.ceil(
        (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000
      ),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);
}

function initializeRoutes() {
  // Use centralized routes
  app.use("/", routes);

  // Catch-all for undefined routes
  app.use("*", (req, res) => {
    return sendNotFoundResponse(res, `Route ${req.originalUrl} not found`);
  });
}

function initializeErrorHandling() {
  app.use(errorHandler);
}

async function startServer() {
  try {
    validateEnv();
    await connectDB();
    initializeMiddlewares();
    initializeRoutes();
    initializeErrorHandling();

    if (process.env.NODE_ENV === "production") {
      // Load SSL certificate and key (adjust paths accordingly)
      const sslKeyPath = "./apiSSL.key";
      const sslCertPath = "./apiSSL.crt";
      const sslCaPath = "./apiSSL.pem";

      const sslOptions = {
        key: fs.readFileSync(path.resolve(sslKeyPath)),
        cert: fs.readFileSync(path.resolve(sslCertPath)),
        ca: fs.readFileSync(path.resolve(sslCaPath)),
      };

      // Create HTTPS server
      const httpsServer = https.createServer(sslOptions, app);
      httpsServer.listen(port, host, () => {
        logger.info(`HTTPS Server running on port 443 in production mode`);
      });

      // Optional: also create HTTP redirect to HTTPS
      // const httpServer = http.createServer((req, res) => {
      //   res.writeHead(301, {
      //     Location: `https://${req.headers.host}${req.url}`,
      //   });
      //   res.end();
      // });
      // httpServer.listen(port, host, () => {
      //   logger.info(`HTTP Server redirecting to HTTPS on port 80`);
      // });
    } else {
      // Development / testing: just HTTP server on specified port
      const httpServer = http.createServer(app);
      httpServer.listen(port, host, () => {
        logger.info(
          `HTTP Server running on http://${host}:${port} in ${process.env.NODE_ENV} mode`
        );
        logger.info(
          `API Documentation available at http://${host}:${port}/api/v1/docs`
        );
        logger.info(`Health check available at http://${host}:${port}/health`);
      });
    }

    // Periodic cleanup logic
    setInterval(() => {
      cleanupOldFiles(30); // Clean files older than 30 days
    }, 24 * 60 * 60 * 1000); // daily
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Error handling for unhandled rejections and exceptions
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});
startServer();
// Only start server if this is the main module
// if (require.main === module) {
//     startServer();
// }
