import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Public } from "../../common/auth/public.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { CorrelationId } from "../../common/correlation-id.decorator";
import { PaginationQueryDto } from "../../common/pagination.dto";
import { CreateIssuerDto } from "./dto/create-issuer.dto";
import { ListIssuersQueryDto } from "./dto/list-issuers-query.dto";
import { UpdateIssuerStatusDto } from "./dto/update-issuer-status.dto";
import { UpdateIssuerDto } from "./dto/update-issuer.dto";
import { OrganizationsService } from "./organizations.service";

@ApiTags("Issuers")
@ApiBearerAuth()
@Controller("issuers")
export class IssuersController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Tạo tổ chức phát hành mới (trạng thái PENDING)" })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIssuerDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.organizationsService.create(user, dto, correlationId);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách tổ chức phát hành (theo quyền)" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListIssuersQueryDto) {
    return this.organizationsService.findAll(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết tổ chức phát hành" })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.organizationsService.findOne(user, id);
  }

  @Patch(":id")
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Cập nhật thông tin tổ chức phát hành" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateIssuerDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.organizationsService.update(user, id, dto, correlationId);
  }

  @Patch(":id/status")
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Kích hoạt, tạm khóa hoặc thu hồi tổ chức phát hành" })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateIssuerStatusDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.organizationsService.updateStatus(user, id, dto, correlationId);
  }
}

@ApiTags("Public")
@Controller("public/issuers")
export class PublicIssuersController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Danh bạ công khai các đơn vị đào tạo đang ACTIVE" })
  listPublic(@Query() query: PaginationQueryDto) {
    return this.organizationsService.findPublicDirectory(query);
  }
}
