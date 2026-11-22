import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OrganizationStatus, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { AppError } from "../../common/errors/app-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, correlationId: string) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { organization: true },
    });

    if (!user) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        "Email hoặc mật khẩu không chính xác",
      );
    }

    const passwordMatched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatched) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        "Email hoặc mật khẩu không chính xác",
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        "Tài khoản hiện đang bị khóa",
      );
    }

    if (
      user.organization &&
      (user.organization.status === OrganizationStatus.SUSPENDED ||
        user.organization.status === OrganizationStatus.REVOKED)
    ) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.ORGANIZATION_NOT_ACTIVE,
        "Tổ chức của tài khoản đang bị tạm khóa hoặc thu hồi",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      });
      await this.auditService.record(tx, {
        actorUserId: user.id,
        actorRole: user.role,
        actorName: user.displayName,
        organizationId: user.organizationId,
        action: "USER_LOGGED_IN",
        aggregateType: "USER",
        aggregateId: user.id,
        correlationId,
        detail: `Đăng nhập thành công (${user.role})`,
        metadata: { role: user.role },
      });
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization
          ? {
              id: user.organization.id,
              code: user.organization.code,
              displayName: user.organization.displayName,
              status: user.organization.status,
            }
          : null,
      },
    };
  }

  async me(actor: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      include: { organization: true },
    });
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy người dùng");
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
      organization: user.organization
        ? {
            id: user.organization.id,
            code: user.organization.code,
            displayName: user.organization.displayName,
            status: user.organization.status,
          }
        : null,
    };
  }
}
