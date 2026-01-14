import sharp from "sharp";
import type { IImageOperation } from "../IImageOperation";

export type FormatParams = { format: "jpeg" | "png" | "webp" };

export class FormatOperation implements IImageOperation<FormatParams> {
  async execute(buffer: Buffer, params: FormatParams): Promise<Buffer> {
    const img = sharp(buffer);
    if (params.format === "jpeg") return img.jpeg().toBuffer();
    if (params.format === "png") return img.png().toBuffer();
    return img.webp().toBuffer();
  }
}
