import sharp from "sharp";
import { HttpError } from "../errors/HttpError";

export class ImageService {
  async resize(buffer: Buffer, width: number, height: number, fit?: string): Promise<Buffer> {
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      throw new HttpError(400, "INVALID_PARAMS", "width and height must be positive numbers");
    }

    const fitValue = fit ?? "cover";

    return sharp(buffer)
      .resize(width, height, { fit: fitValue as any }) // luego tipamos fit sin any, por ahora avanzamos
      .toBuffer();
  }
}
