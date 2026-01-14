import { Router } from "express";
import { upload } from "../middleware/upload";
import { HttpError } from "../errors/HttpError";

import { OperationFactory } from "../services/OperationFactory";
import { AuthService } from "../services/AuthService";

import { OperationHandler } from "../handlers/ImageHandler";

import { AuthDecorator } from "../decorators/AuthDecorator";
import { LoggingDecorator } from "../decorators/LoggingDecorator";

import { FileLogger } from "../logging/FileLogger";
import { PipelineValidator } from "../services/PipelineValidator";

import type {
  ResizeParams,
  FormatParams,
  RotateParams,
  FilterParams,
  ImageRequestContext,
  PipelineStep,
} from "../types";

export function buildImageRouter(
  factory: OperationFactory,
  authService: AuthService
): Router {
  const router = Router();

  // Logger único para todo el router
  const logger = new FileLogger();

  // Helper para ejecutar el pipeline de handlers
  async function runPipeline<P>(
    req: any,
    imageBuffer: Buffer,
    params: P,
    endpoint: string,
    operationKey: "resize" | "format" | "rotate" | "filter",
    contentType: string,
    filename: string
  ) {
    const operation = factory.getOperation<P>(operationKey);

    const baseHandler = new OperationHandler<P>(operation, contentType, filename);

    const handler = new LoggingDecorator(
      new AuthDecorator(baseHandler, authService),
      logger
    );

    const ctx: ImageRequestContext<P> = {
      req,
      imageBuffer,
      params,
      endpoint,
    };

    return handler.handle(ctx);
  }

  // =========================
  // RESIZE
  // =========================
  router.post("/resize", upload.single("image"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw new HttpError(400, "MISSING_IMAGE", "image file is required");
      }

      const width = Number(req.body.width);
      const height = Number(req.body.height);

      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
        throw new HttpError(400, "INVALID_PARAMS", "width and height must be positive numbers");
      }

      // ✅ FIX exactOptionalPropertyTypes: no mandar fit: undefined
      const rawFit = req.body.fit;
      const allowedFits: NonNullable<ResizeParams["fit"]>[] = ["cover", "contain", "fill", "inside", "outside"];

      let fit: ResizeParams["fit"] | undefined = undefined;
      if (rawFit !== undefined && rawFit !== "") {
        const fitLower = String(rawFit).toLowerCase();
        if (!allowedFits.includes(fitLower as any)) {
          throw new HttpError(400, "INVALID_PARAMS", "fit must be: cover, contain, fill, inside, outside");
        }
        fit = fitLower as ResizeParams["fit"];
      }

      const params: ResizeParams = fit ? { width, height, fit } : { width, height };

      const result = await runPipeline<ResizeParams>(
        req,
        req.file.buffer,
        params,
        "/images/resize",
        "resize",
        req.file.mimetype,
        "processed-image.jpg"
      );

      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.buffer);
    } catch (err) {
      next(err);
    }
  });

  // =========================
  // FORMAT
  // =========================
  router.post("/format", upload.single("image"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw new HttpError(400, "MISSING_IMAGE", "image file is required");
      }

      const formatRaw = String(req.body.format || "").toLowerCase();
      if (!["jpeg", "png", "webp"].includes(formatRaw)) {
        throw new HttpError(400, "INVALID_PARAMS", "format must be: jpeg, png, webp");
      }

      const params: FormatParams = { format: formatRaw as FormatParams["format"] };

      const filename =
        params.format === "png"
          ? "processed-image.png"
          : params.format === "webp"
          ? "processed-image.webp"
          : "processed-image.jpg";

      const contentType =
        params.format === "png"
          ? "image/png"
          : params.format === "webp"
          ? "image/webp"
          : "image/jpeg";

      const result = await runPipeline<FormatParams>(
        req,
        req.file.buffer,
        params,
        "/images/format",
        "format",
        contentType,
        filename
      );

      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.buffer);
    } catch (err) {
      next(err);
    }
  });

  // =========================
  // ROTATE
  // =========================
  router.post("/rotate", upload.single("image"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw new HttpError(400, "MISSING_IMAGE", "image file is required");
      }

      const angle = Number(req.body.angle);
      if (![90, 180, 270].includes(angle)) {
        throw new HttpError(400, "INVALID_PARAMS", "angle must be: 90, 180, 270");
      }

      const params: RotateParams = { angle: angle as RotateParams["angle"] };

      const result = await runPipeline<RotateParams>(
        req,
        req.file.buffer,
        params,
        "/images/rotate",
        "rotate",
        "image/jpeg",
        "processed-image.jpg"
      );

      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.buffer);
    } catch (err) {
      next(err);
    }
  });

  // =========================
  // FILTER
  // =========================
  router.post("/filter", upload.single("image"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw new HttpError(400, "MISSING_IMAGE", "image file is required");
      }

      const filterRaw = String(req.body.filter || "").toLowerCase();
      if (!["blur", "sharpen", "grayscale"].includes(filterRaw)) {
        throw new HttpError(400, "INVALID_PARAMS", "filter must be: blur, sharpen, grayscale");
      }

      const params: FilterParams = { filter: filterRaw as FilterParams["filter"] };

      const result = await runPipeline<FilterParams>(
        req,
        req.file.buffer,
        params,
        "/images/filter",
        "filter",
        "image/jpeg",
        "processed-image.jpg"
      );

      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.buffer);
    } catch (err) {
      next(err);
    }
  });

  // =========================
  // PROCESS (pipeline)
  // =========================
  router.post("/process", upload.single("image"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw new HttpError(400, "MISSING_IMAGE", "image file is required");
      }

      if (!req.body.pipeline) {
        throw new HttpError(400, "MISSING_PIPELINE", "pipeline is required");
      }

      // ✅ UNA sola validación: PipelineValidator debe devolverte steps listos
      // Si tu PipelineValidator hoy devuelve otra cosa, ajusta ahí para que retorne PipelineStep[]
      const steps: PipelineStep[] = PipelineValidator.validate(req.body.pipeline);

      let buffer = req.file.buffer;

      // output final (se actualiza si format cambia)
      let outContentType = req.file.mimetype;
      let outFilename = "processed-image.jpg";

      for (const step of steps) {
        switch (step.op) {
          case "resize": {
            const width = Number((step as any).width);
            const height = Number((step as any).height);

            if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
              throw new HttpError(400, "INVALID_PARAMS", "resize: width and height must be positive numbers");
            }

            const allowedFits: NonNullable<ResizeParams["fit"]>[] = ["cover", "contain", "fill", "inside", "outside"];
            const rawFit = (step as any).fit;

            let fit: ResizeParams["fit"] | undefined = undefined;
            if (rawFit !== undefined && rawFit !== "") {
              const fitLower = String(rawFit).toLowerCase();
              if (!allowedFits.includes(fitLower as any)) {
                throw new HttpError(400, "INVALID_PARAMS", "resize: fit must be cover, contain, fill, inside, outside");
              }
              fit = fitLower as ResizeParams["fit"];
            }

            // ✅ FIX exactOptionalPropertyTypes
            const params: ResizeParams = fit ? { width, height, fit } : { width, height };

            const result = await runPipeline<ResizeParams>(
              req,
              buffer,
              params,
              "/images/process",
              "resize",
              outContentType,
              outFilename
            );

            buffer = result.buffer;
            outContentType = result.contentType;
            outFilename = result.filename;
            break;
          }

          case "rotate": {
            const angle = Number((step as any).angle);
            if (![90, 180, 270].includes(angle)) {
              throw new HttpError(400, "INVALID_PARAMS", "rotate: angle must be 90, 180, 270");
            }

            const params: RotateParams = { angle: angle as RotateParams["angle"] };

            const result = await runPipeline<RotateParams>(
              req,
              buffer,
              params,
              "/images/process",
              "rotate",
              outContentType,
              outFilename
            );

            buffer = result.buffer;
            outContentType = result.contentType;
            outFilename = result.filename;
            break;
          }

          case "filter": {
            const filterRaw = String((step as any).filter || "").toLowerCase();
            if (!["blur", "sharpen", "grayscale"].includes(filterRaw)) {
              throw new HttpError(400, "INVALID_PARAMS", "filter: must be blur, sharpen, grayscale");
            }

            const params: FilterParams = { filter: filterRaw as FilterParams["filter"] };

            const result = await runPipeline<FilterParams>(
              req,
              buffer,
              params,
              "/images/process",
              "filter",
              outContentType,
              outFilename
            );

            buffer = result.buffer;
            outContentType = result.contentType;
            outFilename = result.filename;
            break;
          }

          case "format": {
            const formatRaw = String((step as any).format || "").toLowerCase();
            if (!["jpeg", "png", "webp"].includes(formatRaw)) {
              throw new HttpError(400, "INVALID_PARAMS", "format: must be jpeg, png, webp");
            }

            const params: FormatParams = { format: formatRaw as FormatParams["format"] };

            const contentType =
              params.format === "png" ? "image/png" :
              params.format === "webp" ? "image/webp" :
              "image/jpeg";

            const filename =
              params.format === "png" ? "processed-image.png" :
              params.format === "webp" ? "processed-image.webp" :
              "processed-image.jpg";

            const result = await runPipeline<FormatParams>(
              req,
              buffer,
              params,
              "/images/process",
              "format",
              contentType,
              filename
            );

            buffer = result.buffer;
            outContentType = result.contentType;
            outFilename = result.filename;
            break;
          }

          default:
            throw new HttpError(400, "UNKNOWN_OPERATION", `unknown op: ${(step as any).op}`);
        }
      }

      res.setHeader("Content-Type", outContentType);
      res.setHeader("Content-Disposition", `attachment; filename="${outFilename}"`);
      return res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
