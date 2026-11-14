import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { AuditService } from "./audit.service";
import { AuditQueryDto } from "./dto/audit-query.dto";

@ApiTags("Audit")
@ApiBearerAuth()
@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.SYSTEM_ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: "Tra cứu lịch sử thao tác (audit logs)" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: AuditQueryDto) {
    return this.auditService.findAll(user, query);
  }
}
