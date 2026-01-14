import sharp from "sharp";
import type { IImageOperation } from "../IImageOperation";

export type FilterParams = { filter: "blur" | "sharpen" | "grayscale" };

export class FilterOperation implements IImageOperation<FilterParams> {
  async execute(buffer: Buffer, params: FilterParams): Promise<Buffer> {
    const img = sharp(buffer);

    if (params.filter === "grayscale") return img.grayscale().toBuffer();
    if (params.filter === "sharpen") return img.sharpen().toBuffer();
    return img.blur().toBuffer();
  }
}
