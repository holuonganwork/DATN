import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateLearnerDto {
  @ApiProperty({ example: "HV-2026-001" })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  subjectRef!: string;

  @ApiProperty({ example: "Nguyễn Văn An" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({ example: "K15-Web3" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  cohort?: string;

  @ApiPropertyOptional({ example: "contact-token-001" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;
}
