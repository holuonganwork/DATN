import { HttpException } from "@nestjs/common";
import { ErrorCode } from "./error-codes";

export class AppError extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(status: number, code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super({ code, message, details }, status);
    this.code = code;
    this.details = details;
  }
}
