import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "./lib/config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { parkingRouter } from "./routes/parking.routes.js";
import { sessionRouter } from "./routes/session.routes.js";
import { reportRouter } from "./routes/report.routes.js";
import { logRouter } from "./routes/log.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const openapiPath = join(__dirname, "..", "openapi.yaml");
  const openapiDoc = YAML.parse(readFileSync(openapiPath, "utf8")) as object;

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

  const api = express.Router();

  api.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  api.use("/auth", authLimiter, authRouter);
  api.use("/parkings", parkingRouter);
  api.use("/sessions", sessionRouter);
  api.use("/reports", reportRouter);
  api.use("/logs", logRouter);

  app.use("/api", api);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });

  app.use(errorHandler);

  return app;
}
