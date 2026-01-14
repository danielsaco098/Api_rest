import type { Request } from "express";

export type SupportedOutputFormat = "jpeg" | "png" | "webp";
export type FilterType = "blur" | "sharpen" | "grayscale";

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface ImageRequestContext<P = unknown> {
  req: Request;
  // Imagen ya cargada en memoria (multer)
  imageBuffer: Buffer;

  // Parámetros del endpoint (body/query)
  params: P;

  // Info útil para logging/auth
  endpoint: string;
  token?: string;
  user?: JwtPayload;
}

export interface ImageResponse {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export interface IImageHandler<P = unknown> {
  handle(ctx: ImageRequestContext<P>): Promise<ImageResponse>;
}

/** Params por operación (los usaremos más adelante) */
export interface ResizeParams {
  width: number;
  height: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export interface CropParams {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FormatParams {
  format: SupportedOutputFormat;
}

export interface RotateParams {
  angle: 90 | 180 | 270;
}

export interface FilterParams {
  filter: FilterType;
  // si luego quieres, blur podría recibir sigma
  sigma?: number;
}

export type PipelineStep =
  | ({ op: "resize" } & ResizeParams)
  | ({ op: "rotate" } & RotateParams)
  | ({ op: "filter" } & FilterParams)
  | ({ op: "format" } & FormatParams);
