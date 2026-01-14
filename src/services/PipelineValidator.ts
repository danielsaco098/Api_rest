// src/services/PipelineValidator.ts
import { HttpError } from "../errors/HttpError";
import type { ResizeParams, FormatParams, RotateParams, FilterParams } from "../types";

export type PipelineOp =
  | ({ op: "resize" } & ResizeParams)
  | ({ op: "format" } & FormatParams)
  | ({ op: "rotate" } & RotateParams)
  | ({ op: "filter" } & FilterParams);

const ALLOWED_FITS = new Set(["cover", "contain", "fill", "inside", "outside"]);
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const ALLOWED_ANGLES = new Set([90, 180, 270]);
const ALLOWED_FILTERS = new Set(["blur", "sharpen", "grayscale"]);

export class PipelineValidator {
  static validate(raw: unknown): PipelineOp[] {
    // 1) Parse: si viene como string (multipart), convertir a JSON
    const pipeline = this.parse(raw);

    // 2) Reglas generales
    if (!Array.isArray(pipeline)) {
      throw new HttpError(400, "INVALID_PIPELINE", "pipeline must be an array");
    }

    if (pipeline.length === 0) {
      throw new HttpError(400, "INVALID_PIPELINE", "pipeline cannot be empty");
    }

    if (pipeline.length > 10) {
      throw new HttpError(400, "INVALID_PIPELINE", "pipeline max length is 10 steps");
    }

    // 3) Validación por paso + reglas avanzadas
    let formatCount = 0;

    const normalized: PipelineOp[] = pipeline.map((step, idx) => {
      if (!step || typeof step !== "object") {
        throw new HttpError(400, "INVALID_PIPELINE", `step[${idx}] must be an object`);
      }

      const op = (step as any).op;
      if (!op || typeof op !== "string") {
        throw new HttpError(400, "INVALID_PIPELINE", `step[${idx}].op is required`);
      }

      switch (op) {
        case "resize": {
          const width = Number((step as any).width);
          const height = Number((step as any).height);
          const fit = (step as any).fit;

          if (!Number.isFinite(width) || width <= 0) {
            throw new HttpError(400, "INVALID_PARAMS", `resize.width must be a positive number (step[${idx}])`);
          }
          if (!Number.isFinite(height) || height <= 0) {
            throw new HttpError(400, "INVALID_PARAMS", `resize.height must be a positive number (step[${idx}])`);
          }

          if (fit !== undefined && !ALLOWED_FITS.has(String(fit))) {
            throw new HttpError(
              400,
              "INVALID_PARAMS",
              `resize.fit must be one of: ${Array.from(ALLOWED_FITS).join(", ")} (step[${idx}])`
            );
          }

          return { op: "resize", width, height, fit } as PipelineOp;
        }

        case "rotate": {
          const angle = Number((step as any).angle);
          if (!ALLOWED_ANGLES.has(angle)) {
            throw new HttpError(400, "INVALID_PARAMS", `rotate.angle must be 90, 180 or 270 (step[${idx}])`);
          }
          return { op: "rotate", angle: angle as RotateParams["angle"] } as PipelineOp;
        }

        case "filter": {
          const filter = String((step as any).filter || "").toLowerCase();
          if (!ALLOWED_FILTERS.has(filter)) {
            throw new HttpError(
              400,
              "INVALID_PARAMS",
              `filter.filter must be one of: ${Array.from(ALLOWED_FILTERS).join(", ")} (step[${idx}])`
            );
          }
          return { op: "filter", filter: filter as FilterParams["filter"] } as PipelineOp;
        }

        case "format": {
          const format = String((step as any).format || "").toLowerCase();
          if (!ALLOWED_FORMATS.has(format)) {
            throw new HttpError(400, "INVALID_PARAMS", `format.format must be jpeg, png or webp (step[${idx}])`);
          }
          formatCount++;
          return { op: "format", format: format as FormatParams["format"] } as PipelineOp;
        }

        default:
          throw new HttpError(400, "UNKNOWN_OPERATION", `unknown op '${op}' (step[${idx}])`);
      }
    });

    // 4) Reglas avanzadas post-parse
    if (formatCount > 1) {
      throw new HttpError(400, "INVALID_PIPELINE", "only one 'format' operation is allowed");
    }

    const formatIndex = normalized.findIndex((x) => x.op === "format");
    if (formatIndex !== -1 && formatIndex !== normalized.length - 1) {
      throw new HttpError(400, "INVALID_PIPELINE", "'format' must be the last step of the pipeline");
    }

    return normalized;
  }

  private static parse(raw: unknown): any {
    if (raw == null) return raw;

    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        throw new HttpError(400, "INVALID_PIPELINE", "pipeline must be valid JSON");
      }
    }

    return raw;
  }
}
