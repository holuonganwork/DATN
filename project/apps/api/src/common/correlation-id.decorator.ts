import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { CorrelatedRequest } from "./correlation-id.middleware";

export const CorrelationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<CorrelatedRequest>();
    return req.correlationId ?? "corr_unknown";
  },
);
