import { HttpError } from "../errors/HttpError";
import type { IImageOperation } from "./IImageOperation";

import { ResizeOperation } from "./operations/ResizeOperation";
import { FormatOperation } from "./operations/FormatOperation";
import { RotateOperation } from "./operations/RotateOperation";
import { FilterOperation } from "./operations/FilterOperation";

export type OperationType = "resize" | "format" | "rotate" | "filter";

export class OperationFactory {
  private ops: Map<OperationType, IImageOperation<any>> = new Map();

  constructor() {
    this.ops.set("resize", new ResizeOperation());
    this.ops.set("format", new FormatOperation());
    this.ops.set("rotate", new RotateOperation());
    this.ops.set("filter", new FilterOperation());
  }

  getOperation<P>(type: OperationType): IImageOperation<P> {
    const op = this.ops.get(type);

    if (!op) {
      throw new HttpError(400, "UNKNOWN_OPERATION", `Unknown operation: ${type}`);
    }

    return op as IImageOperation<P>;
  }
}
