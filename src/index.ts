import express from "express";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { HttpError } from "./errors/HttpError";
import { AuthService } from "./services/AuthService";
import { buildAuthRouter } from "./routes/auth.routes";
import type { SignOptions } from "jsonwebtoken";
import { ImageService } from "./services/ImageService";
import { OperationFactory } from "./services/OperationFactory";
import { buildImageRouter } from "./routes/image.routes";



dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

const port = Number(process.env.PORT ?? 3000);

// Middleware de error (SIEMPRE al final)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const timestamp = new Date().toISOString();

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      timestamp
    });
  }

  console.error(err);
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    timestamp
  });
});

async function bootstrap() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new HttpError(500, "MISSING_ENV", "Missing MONGO_URI environment variable");
  }

  await connectDatabase(mongoUri);

  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"];
  
  if (!jwtSecret) throw new HttpError(500, "MISSING_ENV", "Missing JWT_SECRET environment variable");
  
  const authService = new AuthService(jwtSecret, jwtExpiresIn);
  app.use("/auth", buildAuthRouter(authService));

  const factory = new OperationFactory();
  app.use("/images", buildImageRouter(factory, authService));

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
