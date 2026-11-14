import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@certchain.local" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "pass12", minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
