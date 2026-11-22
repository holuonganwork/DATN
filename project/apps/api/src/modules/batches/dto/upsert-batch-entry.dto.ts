import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpsertBatchEntryDto {
  @ApiProperty({ example: "lrn_01..." })
  @IsString()
  @MinLength(1)
  learnerId!: string;

  @ApiProperty({ example: "8.8 / 10 (Xuất sắc)" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  result!: string;

  @ApiProperty({ example: "2026-11-14T00:00:00Z" })
  @IsDateString()
  issuedAt!: string;

  @ApiPropertyOptional({ example: "2028-11-14T00:00:00Z", nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
