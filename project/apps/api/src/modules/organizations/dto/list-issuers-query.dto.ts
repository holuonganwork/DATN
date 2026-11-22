import { ApiPropertyOptional } from "@nestjs/swagger";
import { OrganizationStatus } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination.dto";

export class ListIssuersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrganizationStatus })
  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;
}
