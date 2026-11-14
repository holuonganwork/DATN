import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateIssuerDto {
  @ApiProperty({ example: "BKHN-ACADEMY" })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: "Mã tổ chức chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới",
  })
  code!: string;

  @ApiProperty({ example: "Trung tâm Đào tạo Công nghệ Bách Khoa Hà Nội" })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  legalName!: string;

  @ApiProperty({ example: "BKHN Tech Academy" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({ example: "GP-BGD-2026-001" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  verificationRef?: string;
}
