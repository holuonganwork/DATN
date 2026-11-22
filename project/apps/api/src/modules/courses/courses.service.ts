import { HttpStatus, Injectable } from "@nestjs/common";
import { Course, CourseStatus, OrganizationStatus, Prisma, Role } from "@prisma/client";
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
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

export interface CourseResponse {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  version: string;
  durationHours: number;
  gradingRule: string;
  description: string | null;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

const mapCourse = (course: Course): CourseResponse => ({
  id: course.id,
  organizationId: course.organizationId,
  code: course.code,
  name: course.name,
  version: course.version,
  durationHours: course.durationHours,
  gradingRule: course.gradingRule,
  description: course.description,
  status: course.status,
  createdAt: course.createdAt.toISOString(),
  updatedAt: course.updatedAt.toISOString(),
});

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateCourseDto,
    correlationId: string,
  ): Promise<CourseResponse> {
    const organizationId = resolveActorOrganizationId(actor, dto.organizationId);
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy tổ chức");
    }
    if (org.status !== OrganizationStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ORGANIZATION_NOT_ACTIVE,
        "Chỉ tổ chức đang ACTIVE mới được tạo khóa học",
      );
    }

    const code = normalizeText(dto.code).toUpperCase();
    const version = normalizeText(dto.version);
    const existing = await this.prisma.course.findUnique({
      where: { organizationId_code_version: { organizationId, code, version } },
    });
    if (existing) {
      throw new AppError(
        HttpStatus.CONFLICT,
        ERROR_CODES.CONFLICT,
        `Khóa học ${code} phiên bản ${version} đã tồn tại`,
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          id: `crs_${ulid().toLowerCase()}`,
          organizationId,
          code,
          name: normalizeText(dto.name),
          version,
          durationHours: dto.durationHours,
          gradingRule: normalizeText(dto.gradingRule),
          description: dto.description ? normalizeText(dto.description) : null,
          status: CourseStatus.ACTIVE,
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId,
        action: "COURSE_CREATED",
        aggregateType: "COURSE",
        aggregateId: course.id,
        correlationId,
        detail: `Tạo khóa học ${course.code} v${course.version}`,
        metadata: { code: course.code, version: course.version },
      });
      return course;
    });

    return mapCourse(created);
  }

  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & { organizationId?: string; status?: CourseStatus },
  ): Promise<PaginatedPayload<CourseResponse>> {
    const scopedOrgId =
      user.role === Role.SYSTEM_ADMIN ? query.organizationId : (user.organizationId ?? "__none__");

    const where: Prisma.CourseWhereInput = {
      ...(scopedOrgId ? { organizationId: scopedOrgId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items: rows.map(mapCourse),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<CourseResponse> {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy khóa học");
    }
    assertOrgScope(user, course.organizationId);
    return mapCourse(course);
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateCourseDto,
    correlationId: string,
  ): Promise<CourseResponse> {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy khóa học");
    }
    assertOrgScope(actor, existing.organizationId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: normalizeText(dto.name) } : {}),
          ...(dto.durationHours !== undefined ? { durationHours: dto.durationHours } : {}),
          ...(dto.gradingRule !== undefined ? { gradingRule: normalizeText(dto.gradingRule) } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description === null ? null : normalizeText(dto.description) }
            : {}),
        },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: course.organizationId,
        action: "COURSE_UPDATED",
        aggregateType: "COURSE",
        aggregateId: course.id,
        correlationId,
        detail: `Cập nhật khóa học ${course.code} v${course.version}`,
        metadata: { code: course.code, version: course.version },
      });
      return course;
    });

    return mapCourse(updated);
  }

  async archive(
    actor: AuthenticatedUser,
    id: string,
    correlationId: string,
  ): Promise<CourseResponse> {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy khóa học");
    }
    assertOrgScope(actor, existing.organizationId);
    if (existing.status === CourseStatus.ARCHIVED) {
      return mapCourse(existing);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { id },
        data: { status: CourseStatus.ARCHIVED },
      });
      await this.auditService.record(tx, {
        actorUserId: actor.userId,
        actorRole: actor.role,
        actorName: actor.displayName,
        organizationId: course.organizationId,
        action: "COURSE_ARCHIVED",
        aggregateType: "COURSE",
        aggregateId: course.id,
        correlationId,
        detail: `Lưu trữ khóa học ${course.code} v${course.version}`,
        metadata: { code: course.code, status: course.status },
      });
      return course;
    });

    return mapCourse(updated);
  }
}
