import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { CorrelationId } from "../../common/correlation-id.decorator";
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { ListCoursesQueryDto } from "./dto/list-courses-query.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@ApiTags("Courses")
@ApiBearerAuth()
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Tạo khóa học mới trong tổ chức" })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.coursesService.create(user, dto, correlationId);
  }

  @Get()
  @ApiOperation({ summary: "Danh sách khóa học trong phạm vi tổ chức" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCoursesQueryDto) {
    return this.coursesService.findAll(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết khóa học" })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.coursesService.findOne(user, id);
  }

  @Patch(":id")
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Cập nhật thông tin khóa học" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateCourseDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.coursesService.update(user, id, dto, correlationId);
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ISSUER_OPERATOR, Role.ISSUER_APPROVER)
  @ApiOperation({ summary: "Lưu trữ khóa học" })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @CorrelationId() correlationId: string,
  ) {
    return this.coursesService.archive(user, id, correlationId);
  }
}
