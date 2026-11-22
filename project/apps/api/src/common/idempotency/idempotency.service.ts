import { createHash } from "node:crypto";
import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import canonicalize from "canonicalize";
import { ulid } from "ulid";
import { PrismaService } from "../../prisma/prisma.service";
import { AppError } from "../errors/app-error";
import { ERROR_CODES } from "../errors/error-codes";

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async executeInTransaction<T>(params: {
    scope: string;
    idempotencyKey: string | undefined;
    requestBody: unknown;
    statusCode?: number;
    run: (tx: Prisma.TransactionClient) => Promise<T>;
  }): Promise<T> {
    const key = params.idempotencyKey?.trim();
    if (!key || key.length > 128) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        "Header Idempotency-Key là bắt buộc (từ 1 đến 128 ký tự)",
      );
    }

    const serialized = canonicalize(params.requestBody ?? {}) ?? "{}";
    const requestHash = createHash("sha256").update(serialized).digest("hex");

    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: { scope_key: { scope: params.scope, key } },
    });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new AppError(
          HttpStatus.CONFLICT,
          ERROR_CODES.IDEMPOTENCY_CONFLICT,
          "Idempotency-Key đã được dùng cho một nội dung yêu cầu khác",
        );
      }
      return existing.responseJson as unknown as T;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const inside = await tx.idempotencyRecord.findUnique({
          where: { scope_key: { scope: params.scope, key } },
        });
        if (inside) {
          if (inside.requestHash !== requestHash) {
            throw new AppError(
              HttpStatus.CONFLICT,
              ERROR_CODES.IDEMPOTENCY_CONFLICT,
              "Idempotency-Key đã được dùng cho một nội dung yêu cầu khác",
            );
          }
          return inside.responseJson as unknown as T;
        }

        const result = await params.run(tx);

        await tx.idempotencyRecord.create({
          data: {
            id: `idem_${ulid().toLowerCase()}`,
            scope: params.scope,
            key,
            requestHash,
            statusCode: params.statusCode ?? HttpStatus.OK,
            responseJson: result as unknown as Prisma.InputJsonValue,
          },
        });

        return result;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await this.prisma.idempotencyRecord.findUnique({
          where: { scope_key: { scope: params.scope, key } },
        });
        if (raced) {
          if (raced.requestHash !== requestHash) {
            throw new AppError(
              HttpStatus.CONFLICT,
              ERROR_CODES.IDEMPOTENCY_CONFLICT,
              "Idempotency-Key đã được dùng cho một nội dung yêu cầu khác",
            );
          }
          return raced.responseJson as unknown as T;
        }
      }
      throw error;
    }
  }
}
