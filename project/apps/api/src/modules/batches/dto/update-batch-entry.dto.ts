import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateBatchEntryDto {
  @ApiPropertyOptional({ example: "9.0 / 10" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  result?: string;

  @ApiPropertyOptional({ example: "2026-11-14T00:00:00Z" })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional({ example: "2028-11-14T00:00:00Z", nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
