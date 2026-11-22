import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateBatchDto {
  @ApiProperty({ example: "crs_01..." })
  @IsString()
  @MinLength(1)
  courseId!: string;

  @ApiProperty({ example: "Đợt tốt nghiệp khóa 15 - tháng 11/2026" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
