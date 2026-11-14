import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AppError } from "./app-error";
import { ERROR_CODES, ErrorCode } from "./error-codes";

interface RequestWithCorrelation extends Request {
  correlationId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithCorrelation>();
    const response = ctx.getResponse<Response>();
    const correlationId = request.correlationId ?? "corr_unknown";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = ERROR_CODES.VALIDATION_ERROR;
    let message = "Lỗi máy chủ nội bộ";
    let details: Record<string, unknown> = {};

    if (exception instanceof AppError) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details ?? {};
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code = this.mapHttpStatusToCode(status);

      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;
        if (Array.isArray(record.message)) {
          message = "Dữ liệu đầu vào không hợp lệ";
          details = { validationErrors: record.message };
        } else if (typeof record.message === "string") {
          message = record.message;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${correlationId}] Unhandled error: ${exception.message}`,
        exception.stack,
      );
      message = "Lỗi máy chủ nội bộ";
      details = {};
    }

    if (status >= 500) {
      this.logger.error(`[${correlationId}] HTTP ${status} ${code}: ${message}`);
    }

    response.status(status).json({
      error: {
        code,
        message,
        details,
      },
      meta: {
        correlationId,
      },
    });
  }

  private mapHttpStatusToCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODES.CONFLICT;
      default:
        return ERROR_CODES.VALIDATION_ERROR;
    }
  }
}
