import { HttpStatus, Injectable } from "@nestjs/common";
import { Organization, OrganizationStatus, Prisma, Role } from "@prisma/client";
import { ulid } from "ulid";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { assertOrgScope } from "../../common/auth/org-scope";
import { AppError } from "../../common/errors/app-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { PaginationQueryDto } from "../../common/pagination.dto";
import { PaginatedPayload } from "../../common/response-envelope.interceptor";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { normalizeText } from "../credential-core/payload";
import { CreateIssuerDto } from "./dto/create-issuer.dto";
import { UpdateIssuerStatusDto } from "./dto/update-issuer-status.dto";
import { UpdateIssuerDto } from "./dto/update-issuer.dto";

export interface OrganizationResponse {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
  verificationRef: string | null;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

const ALLOWED_STATUS_TRANSITIONS: Record<OrganizationStatus, OrganizationStatus[]> = {
  [OrganizationStatus.PENDING]: [
    OrganizationStatus.ACTIVE,
    OrganizationStatus.SUSPENDED,
    OrganizationStatus.REVOKED,
  ],
  [OrganizationStatus.ACTIVE]: [OrganizationStatus.SUSPENDED, OrganizationStatus.REVOKED],
  [OrganizationStatus.SUSPENDED]: [OrganizationStatus.ACTIVE, OrganizationStatus.REVOKED],
  [OrganizationStatus.REVOKED]: [],
};

const mapOrganization = (org: Organization): OrganizationResponse => ({
  id: org.id,
  code: org.code,
  legalName: org.legalName,
  displayName: org.displayName,
  verificationRef: org.verificationRef,
  status: org.status,
  createdAt: org.createdAt.toISOString(),
  updatedAt: org.updatedAt.toISOString(),
});

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateIssuerDto,
    correlationId: string,
  ): Promise<OrganizationResponse> {
    const code = normalizeText(dto.code).toUpperCase();
    const legalName = normalizeText(dto.legalName);
    const displayName = normalizeText(dto.displayName);
    const verificationRef = dto.verificationRef ? normalizeText(dto.verificationRef) : null;

    const existing = await this.prisma.organization.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLICT,
        `Mã tổ chức ${code} đã tồn tại`,
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          id: `org_${ulid().toLowerCase()}`,
          code,
          legalName,
          displayName,
          verificationRef,
          status: OrganizationStatus.PENDING,
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: org.id,
        action: "ORGANIZATION_CREATED",
        aggregateType: "ORGANIZATION",
        aggregateId: org.id,
        correlationId,
        detail: `Đăng ký tổ chức mới ${org.code} (${org.displayName}) ở trạng thái PENDING`,
        metadata: { code: org.code, status: org.status },
      });
      return org;
    });

    return mapOrganization(created);
  }

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & { status?: OrganizationStatus },
  ): Promise<PaginatedPayload<OrganizationResponse>> {
    const where: Prisma.OrganizationWhereInput = {
      ...(user.role !== Role.SYSTEM_ADMIN ? { id: user.organizationId ?? "__none__" } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      items: rows.map(mapOrganization),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async findPublicDirectory(
    query: PaginationQueryDto,
  ): Promise<PaginatedPayload<OrganizationResponse>> {
    const where: Prisma.OrganizationWhereInput = { status: OrganizationStatus.ACTIVE };
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: { displayName: "asc" },
        skip,
        take: query.pageSize,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      items: rows.map(mapOrganization),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<OrganizationResponse> {
    assertOrgScope(user, id);
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy tổ chức");
    }
    return mapOrganization(org);
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateIssuerDto,
    correlationId: string,
  ): Promise<OrganizationResponse> {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy tổ chức");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id },
        data: {
          ...(dto.legalName !== undefined ? { legalName: normalizeText(dto.legalName) } : {}),
          ...(dto.displayName !== undefined ? { displayName: normalizeText(dto.displayName) } : {}),
          ...(dto.verificationRef !== undefined
            ? {
                verificationRef:
                  dto.verificationRef === null ? null : normalizeText(dto.verificationRef),
              }
            : {}),
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: org.id,
        action: "ORGANIZATION_UPDATED",
        aggregateType: "ORGANIZATION",
        aggregateId: org.id,
        correlationId,
        detail: `Cập nhật thông tin tổ chức ${org.code}`,
        metadata: { code: org.code },
      });
      return org;
    });

    return mapOrganization(updated);
  }

  async updateStatus(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateIssuerStatusDto,
    correlationId: string,
  ): Promise<OrganizationResponse> {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy tổ chức");
    }

    if (existing.status === dto.status) {
      return mapOrganization(existing);
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ERROR_CODES.INVALID_STATE_TRANSITION,
        `Không thể chuyển trạng thái tổ chức từ ${existing.status} sang ${dto.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id },
        data: { status: dto.status },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: org.id,
        action: "ORGANIZATION_STATUS_UPDATED",
        aggregateType: "ORGANIZATION",
        aggregateId: org.id,
        correlationId,
        detail: `Chuyển trạng thái tổ chức ${org.code}: ${existing.status} → ${dto.status}`,
        metadata: { previousStatus: existing.status, newStatus: dto.status },
      });
      return org;
    });

    return mapOrganization(updated);
  }
}
