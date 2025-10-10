import { Sequelize } from "sequelize";
import logger from "../utils/logger.js";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

let sequelize;

const createConnection = () => {
  if (sequelize) {
    return sequelize;
  }

  const config = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || "mysql",
    // logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  };

  // Use different database based on environment
  const database =
    process.env.NODE_ENV === "test"
      ? process.env.DB_NAME_TEST
      : process.env.DB_NAME;

  sequelize = new Sequelize(
    database,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    config
  );
  return sequelize;
};

const connectDB = async () => {
  try {
    const db = createConnection();
    // Test the connection
    await db.authenticate();
    const config = db.config;
    const dbName =
      config.dialect === "sqlite" ? config.storage : config.database;
    logger.info(`Database Connected: ${config.host}:${config.port}/${dbName}`);

    // Sync database in development and test (be careful in production)
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      await db.sync({ force: process.env.NODE_ENV === "test" });
      logger.info("Database synchronized");
    }

    // Handle connection events (only for non-SQLite databases with connection pooling)
    if (
      config.dialect !== "sqlite" &&
      db.connectionManager &&
      db.connectionManager.pool &&
      typeof db.connectionManager.pool.on === "function"
    ) {
      db.connectionManager.pool.on("connection", () => {
        logger.debug("Database connection established");
      });

      db.connectionManager.pool.on("error", (err) => {
        logger.error("Database connection error:", err);
      });
    }

    // Handle application termination
    const handleShutdown = async (signal) => {
      logger.info(`${signal} received. Closing database connection...`);
      await db.close();
      logger.info("Database connection closed");
      process.exit(0);
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));

    return db;
  } catch (error) {
    logger.error("Database connection failed:", error);
    logger.error("Error connecting to database:", error.message);

    // Log specific error details for different database types
    if (error.name === "SequelizeConnectionError") {
      logger.error("Connection details:");
      logger.error(`- Host: ${process.env.DB_HOST || "localhost"}`);
      logger.error(`- Port: ${process.env.DB_PORT || 3306}`);
      logger.error(
        `- Database: ${
          process.env.NODE_ENV === "test"
            ? process.env.DB_NAME_TEST
            : process.env.DB_NAME
        }`
      );
      logger.error(`- Username: ${process.env.DB_USERNAME}`);
    }

    process.exit(1);
  }
};

// Create and export the sequelize instance
sequelize = createConnection();

// Export both the connection function and the sequelize instance
export default connectDB;
export { sequelize };
