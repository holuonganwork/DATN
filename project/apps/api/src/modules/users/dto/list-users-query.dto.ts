import { ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination.dto";

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
