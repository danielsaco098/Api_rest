import sharp from "sharp";
import type { IImageOperation } from "../IImageOperation";

export type RotateParams = { angle: 90 | 180 | 270 };

export class RotateOperation implements IImageOperation<RotateParams> {
  async execute(buffer: Buffer, params: RotateParams): Promise<Buffer> {
    return sharp(buffer).rotate(params.angle).toBuffer();
  }
}
