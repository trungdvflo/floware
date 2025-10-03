import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AttendeeParam {
  @IsNotEmpty()
  @ApiProperty({ example: 'quangndn@flomail.net' })
  @IsEmail()
  @IsString()
  @Expose()
  public email: string;
}