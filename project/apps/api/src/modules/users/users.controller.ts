import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { CorrelationId } from "../../common/correlation-id.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Tạo tài khoản quản trị hoặc nhân sự thuộc tổ chức" })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUserDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.create(user, dto, correlationId);
  }

  @Get()
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Danh sách tài khoản người dùng" })
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Patch(":id")
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: "Cập nhật vai trò, trạng thái hoặc đặt lại mật khẩu tài khoản" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.update(user, id, dto, correlationId);
  }
}
