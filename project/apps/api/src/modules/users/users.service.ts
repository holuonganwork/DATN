import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, Role, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { ulid } from "ulid";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { AppError } from "../../common/errors/app-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { PaginationQueryDto } from "../../common/pagination.dto";
import { PaginatedPayload } from "../../common/response-envelope.interceptor";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { normalizeText } from "../credential-core/payload";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

export interface UserResponse {
  id: string;
  organizationId: string | null;
  email: string;
  displayName: string;
  role: Role;
  status: string;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const mapUser = (user: User): UserResponse => ({
  id: user.id,
  organizationId: user.organizationId,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  status: user.status,
  lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateUserDto,
    correlationId: string,
  ): Promise<UserResponse> {
    const email = dto.email.trim().toLowerCase();
    const displayName = normalizeText(dto.displayName);
    const organizationId = await this.validateRoleAndOrg(dto.role, dto.organizationId ?? null);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(HttpStatus.CONFLICT, ERROR_CODES.CONFLICT, "Email đã được sử dụng");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const userId = `usr_${ulid().toLowerCase()}`;

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          email,
          passwordHash,
          displayName,
          role: dto.role,
          organizationId,
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId,
        action: "USER_CREATED",
        aggregateType: "USER",
        aggregateId: user.id,
        correlationId,
        detail: `Tạo tài khoản ${user.role} (${user.id})`,
        metadata: { role: user.role, organizationId },
      });
      return user;
    });

    return mapUser(created);
  }

  async findAll(
    query: PaginationQueryDto & { organizationId?: string; role?: Role },
  ): Promise<PaginatedPayload<UserResponse>> {
    const where: Prisma.UserWhereInput = {
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.role ? { role: query.role } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: rows.map(mapUser),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateUserDto,
    correlationId: string,
  ): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy người dùng");
    }

    const nextRole = dto.role ?? existing.role;
    const nextOrgId =
      dto.organizationId !== undefined ? dto.organizationId : existing.organizationId;
    const validatedOrgId = await this.validateRoleAndOrg(nextRole, nextOrgId);
    const nextPasswordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(dto.displayName !== undefined ? { displayName: normalizeText(dto.displayName) } : {}),
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.organizationId !== undefined || dto.role !== undefined
            ? { organizationId: validatedOrgId }
            : {}),
          ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: user.organizationId,
        action: "USER_UPDATED",
        aggregateType: "USER",
        aggregateId: user.id,
        correlationId,
        detail: `Cập nhật tài khoản ${user.id} (${user.role}, ${user.status})`,
        metadata: {
          role: user.role,
          status: user.status,
          organizationId: user.organizationId,
          passwordReset: Boolean(dto.password),
        },
      });
      return user;
    });

    return mapUser(updated);
  }

  private async validateRoleAndOrg(
    role: Role,
    organizationId: string | null,
  ): Promise<string | null> {
    if (role === Role.SYSTEM_ADMIN) {
      if (organizationId) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
          "SYSTEM_ADMIN không gắn vào tổ chức phát hành cụ thể",
        );
      }
      return null;
    }

    if (!organizationId) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        `Vai trò ${role} bắt buộc phải gắn với một tổ chức phát hành`,
      );
    }

    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        "Không tìm thấy tổ chức phát hành",
      );
    }

    return org.id;
  }
}
