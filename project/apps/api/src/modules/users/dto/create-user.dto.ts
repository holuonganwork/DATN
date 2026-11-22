import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "operator@bkhn.edu.vn" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "pass12", minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: "Nguyễn Văn Vận Hành" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ description: "Bắt buộc với các vai trò thuộc tổ chức" })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
