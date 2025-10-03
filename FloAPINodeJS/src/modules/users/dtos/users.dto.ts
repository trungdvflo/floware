import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEmail, IsNotEmpty, IsString
} from 'class-validator';

export class UserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'test@flodev.net',
    description: ``
  })
  @Expose()
  username: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'raw_password',
    description: ``
  })
  @Expose()
  password: string;
}