import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { JwtAuthGuard } from "./common/auth/jwt.guard";
import { RolesGuard } from "./common/auth/roles.guard";
import { CorrelationIdMiddleware } from "./common/correlation-id.middleware";
import { HttpExceptionFilter } from "./common/errors/http-exception.filter";
import { IdempotencyModule } from "./common/idempotency/idempotency.module";
import { ResponseEnvelopeInterceptor } from "./common/response-envelope.interceptor";
import { validateEnv } from "./config/env.schema";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BatchesModule } from "./modules/batches/batches.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { CredentialsModule } from "./modules/credentials/credentials.module";
import { HealthController } from "./modules/health/health.controller";
import { IssuanceModule } from "./modules/issuance/issuance.module";
import { LearnersModule } from "./modules/learners/learners.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { UsersModule } from "./modules/users/users.module";
import { VerificationModule } from "./modules/verification/verification.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    PrismaModule,
    IdempotencyModule,
    IssuanceModule,
    AuditModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    CoursesModule,
    LearnersModule,
    BatchesModule,
    CredentialsModule,
    VerificationModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
