import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEmpty, IsNotEmpty, IsNumberString } from 'class-validator';

export class UrlsDto {
  @IsEmail()
  @IsEmpty()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  username: string;

  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @IsNumberString()
  @ApiPropertyOptional({
    description: 'The age of a cat',
    minimum: 1,
    default: 1,
  })
  age: number;
}