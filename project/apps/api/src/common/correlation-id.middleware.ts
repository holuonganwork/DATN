import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { ulid } from "ulid";

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: CorrelatedRequest, res: Response, next: NextFunction): void {
    const incoming = req.header("x-correlation-id");
    const correlationId =
      incoming && incoming.trim().length > 0 && incoming.trim().length <= 100
        ? incoming.trim()
        : `corr_${ulid().toLowerCase()}`;
    req.correlationId = correlationId;
    res.setHeader("X-Correlation-Id", correlationId);
    next();
  }
}
