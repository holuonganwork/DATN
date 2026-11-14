import { ApiPropertyOptional } from "@nestjs/swagger";
import { BatchStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/pagination.dto";

export class ListBatchesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ enum: BatchStatus })
  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;
}
