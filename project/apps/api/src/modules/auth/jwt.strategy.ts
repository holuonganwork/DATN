import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { OrganizationStatus, UserStatus } from "@prisma/client";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { AppError } from "../../common/errors/app-error";
import { ERROR_CODES } from "../../common/errors/error-codes";
import { AppEnv } from "../../config/env.schema";
import { PrismaService } from "../../prisma/prisma.service";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<AppEnv, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get("JWT_SIGNING_KEY", { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { organization: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        "Tài khoản không tồn tại hoặc đã bị khóa",
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
        "Tổ chức phát hành đang bị tạm khóa hoặc thu hồi",
      );
    }

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId: user.organizationId,
    };
  }
}
