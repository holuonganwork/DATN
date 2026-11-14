import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class ReissueCredentialDto {
  @ApiPropertyOptional({ example: "Nguyễn Văn An" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  holderName?: string;

  @ApiProperty({ example: "9.2 / 10 (Xuất sắc)" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  result!: string;

  @ApiPropertyOptional({ example: "2028-11-14T00:00:00Z", nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiProperty({ example: "Cấp lại bản điều chỉnh kết quả đánh giá" })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
