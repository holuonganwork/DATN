import { Injectable } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { ulid } from "ulid";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { PaginatedPayload } from "../../common/response-envelope.interceptor";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditQueryDto } from "./dto/audit-query.dto";

const REDACTED_KEYS = new Set([
  "password",
  "passwordhash",
  "accesstoken",
  "refreshtoken",
  "jwtsigningkey",
  "contactref",
  "payloadjson",
  "rawpii",
]);

function redactMetadataValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactMetadataValue);
  }
  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        output[key] = "[REDACTED]";
      } else {
        output[key] = redactMetadataValue(val);
      }
    }
    return output;
  }
  return value;
}

export interface RecordAuditInput {
  actorUserId?: string | null;
  actorRole?: Role | null;
  actorName?: string | null;
  organizationId?: string | null;
  action: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  detail: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEventResponse {
  id: string;
  action: string;
  actorRole: Role | null;
  actorName: string | null;
  organizationId: string | null;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  detail: string;
  metadataRedacted: Record<string, unknown>;
  time: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(tx: Prisma.TransactionClient, input: RecordAuditInput): Promise<void> {
    const metadataRedacted = redactMetadataValue(input.metadata ?? {}) as Prisma.InputJsonValue;

    await tx.auditLog.create({
      data: {
        id: `aud_${ulid().toLowerCase()}`,
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        actorName: input.actorName ?? null,
        organizationId: input.organizationId ?? null,
        action: input.action,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        correlationId: input.correlationId,
        detail: input.detail,
        metadataRedacted,
      },
    });
  }

  async findAll(
    user: AuthenticatedUser,
    query: AuditQueryDto,
  ): Promise<PaginatedPayload<AuditEventResponse>> {
    const scopedOrgId =
      user.role === Role.SYSTEM_ADMIN ? query.organizationId : (user.organizationId ?? "__none__");

    const where: Prisma.AuditLogWhereInput = {
      ...(scopedOrgId ? { organizationId: scopedOrgId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.aggregateType ? { aggregateType: query.aggregateType } : {}),
      ...(query.aggregateId ? { aggregateId: query.aggregateId } : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        actorRole: row.actorRole,
        actorName: row.actorName,
        organizationId: row.organizationId,
        aggregateType: row.aggregateType,
        aggregateId: row.aggregateId,
        correlationId: row.correlationId,
        detail: row.detail,
        metadataRedacted: (row.metadataRedacted ?? {}) as Record<string, unknown>,
        time: row.createdAt.toISOString(),
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
      },
    };
  }
}
