import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class RevokeCredentialDto {
  @ApiProperty({ example: "Phát hiện sai sót thông tin điểm thi" })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
