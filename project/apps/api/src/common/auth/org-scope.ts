import { HttpStatus } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AppError } from "../errors/app-error";
import { ERROR_CODES } from "../errors/error-codes";
import { AuthenticatedUser } from "./auth-user.interface";

export const assertOrgScope = (user: AuthenticatedUser, targetOrganizationId: string): void => {
  if (user.role === Role.SYSTEM_ADMIN) {
    return;
  }
  if (!user.organizationId || user.organizationId !== targetOrganizationId) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      ERROR_CODES.FORBIDDEN,
      "Không có quyền truy cập tài nguyên của tổ chức khác",
    );
  }
};

export const resolveActorOrganizationId = (
  user: AuthenticatedUser,
  requestedOrgId?: string,
): string => {
  if (user.role === Role.SYSTEM_ADMIN) {
    if (!requestedOrgId) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "SYSTEM_ADMIN cần chỉ định organizationId",
      );
    }
    return requestedOrgId;
  }
  if (!user.organizationId) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      ERROR_CODES.FORBIDDEN,
      "Tài khoản chưa được gắn vào tổ chức phát hành nào",
    );
  }
  if (requestedOrgId && requestedOrgId !== user.organizationId) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      ERROR_CODES.FORBIDDEN,
      "Không được thao tác trên tổ chức khác",
    );
  }
  return user.organizationId;
};
