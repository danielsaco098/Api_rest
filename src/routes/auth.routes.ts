import { Router } from "express";
import { HttpError } from "../errors/HttpError";
import { AuthService } from "../services/AuthService";

export function buildAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        throw new HttpError(400, "MISSING_FIELDS", "email and password are required");
      }

      await authService.register(email, password);
      return res.status(201).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        throw new HttpError(400, "MISSING_FIELDS", "email and password are required");
      }

      const token = await authService.login(email, password);
      return res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
