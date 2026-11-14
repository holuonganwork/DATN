import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { CorrelationId } from "../../common/correlation-id.decorator";
import { CreateLearnerDto } from "./dto/create-learner.dto";
import { ListLearnersQueryDto } from "./dto/list-learners-query.dto";
import { UpdateLearnerDto } from "./dto/update-learner.dto";
import { LearnersService } from "./learners.service";

@ApiTags("Learners")
@ApiBearerAuth()
@Controller("learners")
export class LearnersController {
  constructor(private readonly learnersService: LearnersService) {}

  @Post()
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Tạo hồ sơ học viên trong tổ chức" })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLearnerDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.learnersService.create(user, dto, correlationId);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách học viên trong phạm vi tổ chức" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListLearnersQueryDto) {
    return this.learnersService.findAll(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết học viên" })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.learnersService.findOne(user, id);
  }

  @Patch(":id")
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Cập nhật thông tin học viên" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateLearnerDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.learnersService.update(user, id, dto, correlationId);
  }
}
