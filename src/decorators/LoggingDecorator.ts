import type { IImageHandler, ImageRequestContext, ImageResponse, JwtPayload } from "../types";
import type { ILogger, LogEntry } from "../logging/ILogger";

export class LoggingDecorator<P> implements IImageHandler<P> {
  constructor(
    private inner: IImageHandler<P>,
    private logger: ILogger
  ) {}

  async handle(ctx: ImageRequestContext<P>): Promise<ImageResponse> {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    const userEmail = ((ctx.req as unknown as { user?: JwtPayload }).user)?.email;

    try {
      const result = await this.inner.handle(ctx);

      // Construimos el log SIN propiedades opcionales en undefined
      const entry: LogEntry = {
        timestamp,
        level: "info",
        endpoint: ctx.endpoint,
        params: ctx.params,
        duration: Date.now() - start,
        result: "success"
      };

      if (userEmail) entry.user = userEmail;

      await this.logger.log(entry);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      const entry: LogEntry = {
        timestamp,
        level: "error",
        endpoint: ctx.endpoint,
        params: ctx.params,
        duration: Date.now() - start,
        result: "error",
        message
      };

      if (userEmail) entry.user = userEmail;

      await this.logger.log(entry);
      throw err;
    }
  }
}
