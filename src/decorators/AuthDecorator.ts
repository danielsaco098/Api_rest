import type { IImageHandler, ImageRequestContext, ImageResponse } from "../types";
import { HttpError } from "../errors/HttpError";
import { AuthService } from "../services/AuthService";

function getBearerToken(header?: string): string | undefined {
  if (!header) return undefined;
  const [type, token] = header.split(" ");
  if (type !== "Bearer") return undefined;
  return token;
}

export class AuthDecorator<P> implements IImageHandler<P> {
  constructor(
    private inner: IImageHandler<P>,
    private authService: AuthService
  ) {}

  async handle(ctx: ImageRequestContext<P>): Promise<ImageResponse> {
    const token = getBearerToken(ctx.req.headers.authorization);
    if (!token) throw new HttpError(401, "MISSING_TOKEN", "Missing Authorization Bearer token");

    // valida y devuelve payload
    const payload = this.authService.verifyToken(token);

    // guardamos el usuario en el request para que Logging lo use
    (ctx.req as any).user = payload;

    return this.inner.handle(ctx);
  }
}
