import type { IImageHandler, ImageRequestContext, ImageResponse } from "../types";

export class OperationHandler<P> implements IImageHandler<P> {
  constructor(
    private op: { execute(buffer: Buffer, params: P): Promise<Buffer> },
    private contentType: string,
    private filename: string
  ) {}

  async handle(ctx: ImageRequestContext<P>): Promise<ImageResponse> {
    const out = await this.op.execute(ctx.imageBuffer, ctx.params as P);
    return { buffer: out, contentType: this.contentType, filename: this.filename };
  }
}
