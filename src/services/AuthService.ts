import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions, type JwtPayload as JwtPayloadLib } from "jsonwebtoken";
import { UserModel } from "../models/User";
import { HttpError } from "../errors/HttpError";

export class AuthService {
  constructor(
    private jwtSecret: Secret,
    private expiresIn: SignOptions["expiresIn"] // <- CLAVE
  ) {}

  async register(email: string, password: string): Promise<void> {
    const existing = await UserModel.findOne({ email });
    if (existing) throw new HttpError(400, "EMAIL_EXISTS", "Email already registered");

    const passwordHash = await bcrypt.hash(password, 10);

    await UserModel.create({
      email,
      passwordHash,
      createdAt: new Date()
    });
  }

  async login(email: string, password: string): Promise<string> {
    const user = await UserModel.findOne({ email });
    if (!user) throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid credentials");

    const payload = { userId: user.id, email: user.email };

    const options: SignOptions = {};
    
    if (this.expiresIn !== undefined) {
      options.expiresIn = this.expiresIn;
   }
   
   return jwt.sign(payload, this.jwtSecret, options);
  }

  verifyToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayloadLib;
      return {
        userId: decoded.userId as string,
        email: decoded.email as string
      };
    } catch {
      throw new HttpError(401, "INVALID_TOKEN", "Invalid or expired token");
    }
  }
}
