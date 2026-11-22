import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { CorrelatedRequest } from "./correlation-id.middleware";

export interface PaginatedPayload<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export function isPaginatedPayload<T>(value: unknown): value is PaginatedPayload<T> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.items) &&
    candidate.pagination !== null &&
    typeof candidate.pagination === "object"
  );
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<CorrelatedRequest>();
    const correlationId = request.correlationId ?? "corr_unknown";

    return next.handle().pipe(
      map((payload: unknown) => {
        if (payload && typeof payload === "object" && "data" in payload && "meta" in payload) {
          return payload;
        }
        if (isPaginatedPayload(payload)) {
          return {
            data: payload.items,
            meta: {
              correlationId,
              ...payload.pagination,
            },
          };
        }
        return {
          data: payload,
          meta: {
            correlationId,
          },
        };
      }),
    );
  }
}
