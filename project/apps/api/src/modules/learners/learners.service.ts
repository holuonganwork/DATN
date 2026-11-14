import { HttpStatus, Injectable } from "@nestjs/common";
import { Learner, OrganizationStatus, Prisma, Role } from "@prisma/client";
import { ulid } from "ulid";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { assertOrgScope, resolveActorOrganizationId } from "../../common/auth/org-scope";
import { AppError } from "../../common/errors/app-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { PaginationQueryDto } from "../../common/pagination.dto";
import { PaginatedPayload } from "../../common/response-envelope.interceptor";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { normalizeText } from "../credential-core/payload";
import { CreateLearnerDto } from "./dto/create-learner.dto";
import { UpdateLearnerDto } from "./dto/update-learner.dto";

export interface LearnerResponse {
  id: string;
  organizationId: string;
  subjectRef: string;
  displayName: string;
  cohort: string | null;
  contactRef: string | null;
  createdAt: string;
  updatedAt: string;
}

const mapLearner = (learner: Learner): LearnerResponse => ({
  id: learner.id,
  organizationId: learner.organizationId,
  subjectRef: learner.subjectRef,
  displayName: learner.displayName,
  cohort: learner.cohort,
  contactRef: learner.contactRef,
  createdAt: learner.createdAt.toISOString(),
  updatedAt: learner.updatedAt.toISOString(),
});

@Injectable()
export class LearnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateLearnerDto,
    correlationId: string,
  ): Promise<LearnerResponse> {
    const organizationId = resolveActorOrganizationId(actor, dto.organizationId);
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy tổ chức");
    }
    if (org.status !== OrganizationStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ORGANIZATION_NOT_ACTIVE,
        "Chỉ tổ chức đang ACTIVE mới được tạo hồ sơ học viên",
      );
    }

    const subjectRef = normalizeText(dto.subjectRef).toUpperCase();
    const existing = await this.prisma.learner.findUnique({
      where: { organizationId_subjectRef: { organizationId, subjectRef } },
    });
    if (existing) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLICT,
        `Mã học viên ${subjectRef} đã tồn tại trong tổ chức`,
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const learner = await tx.learner.create({
        data: {
          id: `lrn_${ulid().toLowerCase()}`,
          organizationId,
          subjectRef,
          displayName: normalizeText(dto.displayName),
          cohort: dto.cohort ? normalizeText(dto.cohort) : null,
          contactRef: dto.contactRef ? normalizeText(dto.contactRef) : null,
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId,
        action: "LEARNER_CREATED",
        aggregateType: "LEARNER",
        aggregateId: learner.id,
        correlationId,
        detail: `Tạo hồ sơ học viên ${learner.subjectRef}`,
        metadata: { subjectRef: learner.subjectRef },
      });
      return learner;
    });

    return mapLearner(created);
  }

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & { organizationId?: string; search?: string },
  ): Promise<PaginatedPayload<LearnerResponse>> {
    const scopedOrgId =
      user.role === Role.SYSTEM_ADMIN ? query.organizationId : (user.organizationId ?? "__none__");
    const search = query.search?.trim();

    const where: Prisma.LearnerWhereInput = {
      ...(scopedOrgId ? { organizationId: scopedOrgId } : {}),
      ...(search
        ? {
            OR: [
              { subjectRef: { contains: search, mode: "insensitive" } },
              { displayName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.learner.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      this.prisma.learner.count({ where }),
    ]);

    return {
      items: rows.map(mapLearner),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<LearnerResponse> {
    const learner = await this.prisma.learner.findUnique({ where: { id } });
    if (!learner) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy học viên");
    }
    assertOrgScope(user, learner.organizationId);
    return mapLearner(learner);
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateLearnerDto,
    correlationId: string,
  ): Promise<LearnerResponse> {
    const existing = await this.prisma.learner.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy học viên");
    }
    assertOrgScope(actor, existing.organizationId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const learner = await tx.learner.update({
        where: { id },
        data: {
          ...(dto.displayName !== undefined ? { displayName: normalizeText(dto.displayName) } : {}),
          ...(dto.cohort !== undefined
            ? { cohort: dto.cohort === null ? null : normalizeText(dto.cohort) }
            : {}),
          ...(dto.contactRef !== undefined
            ? { contactRef: dto.contactRef === null ? null : normalizeText(dto.contactRef) }
            : {}),
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: learner.organizationId,
        action: "LEARNER_UPDATED",
        aggregateType: "LEARNER",
        aggregateId: learner.id,
        correlationId,
        detail: `Cập nhật hồ sơ học viên ${learner.subjectRef}`,
        metadata: { subjectRef: learner.subjectRef },
      });
      return learner;
    });

    return mapLearner(updated);
  }
}
