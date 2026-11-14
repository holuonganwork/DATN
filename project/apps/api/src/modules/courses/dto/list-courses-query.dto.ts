import { ApiPropertyOptional } from "@nestjs/swagger";
import { CourseStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination.dto";

export class ListCoursesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
