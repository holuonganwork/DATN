import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { CorrelationId } from "../../common/correlation-id.decorator";
import { CredentialsService } from "./credentials.service";
import { ListCredentialsQueryDto } from "./dto/list-credentials-query.dto";
import { ReissueCredentialDto } from "./dto/reissue-credential.dto";
import { RevokeCredentialDto } from "./dto/revoke-credential.dto";

@ApiTags("Credentials")
@ApiBearerAuth()
@Controller("credentials")
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get()
  @ApiOperation({ summary: "Danh sách chứng chỉ trong phạm vi tổ chức" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCredentialsQueryDto) {
    return this.credentialsService.findAll(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết chứng chỉ theo ID hoặc mã chứng chỉ" })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.credentialsService.findOne(user, id);
  }

  @Get(":id/package")
  @ApiOperation({ summary: "Xuất gói JSON chứng chỉ (payload + anchor + Merkle proof)" })
  getPackage(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.credentialsService.getPackage(user, id);
  }

  @Post(":id/revoke")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiOperation({ summary: "Thu hồi chứng chỉ đang ISSUED" })
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: RevokeCredentialDto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @CorrelationId() correlationId: string,
  ) {
    return this.credentialsService.revoke(user, id, dto, idempotencyKey, correlationId);
  }

  @Post(":id/reissue")
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiOperation({ summary: "Cấp lại chứng chỉ mới từ bản ISSUED hoặc REVOKED" })
  reissue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReissueCredentialDto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @CorrelationId() correlationId: string,
  ) {
    return this.credentialsService.reissue(user, id, dto, idempotencyKey, correlationId);
  }
}
