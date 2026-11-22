import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateCourseDto {
  @ApiProperty({ example: "BC-SEC-101" })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: "Mã khóa học chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới",
  })
  code!: string;

  @ApiProperty({ example: "An toàn Smart Contract & EVM" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: "2026.1" })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  version!: string;

  @ApiProperty({ example: 48 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  durationHours!: number;

  @ApiProperty({ example: "Đạt >= 7.0/10" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  gradingRule!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
