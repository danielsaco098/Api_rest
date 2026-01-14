import sharp from "sharp";
import { HttpError } from "../../errors/HttpError";
import type { IImageOperation } from "../IImageOperation";
import type { ResizeParams } from "../../types";

export class ResizeOperation implements IImageOperation<ResizeParams> {
  async execute(buffer: Buffer, params: ResizeParams): Promise<Buffer> {
    const { width, height, fit } = params;

    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      throw new HttpError(400, "INVALID_PARAMS", "width and height must be positive numbers");
    }

    return sharp(buffer)
      .resize(width, height, { fit: fit ?? "cover" })
      .toBuffer();
  }
}
