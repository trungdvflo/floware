import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    IsDefined, IsEmail, IsNotEmpty, IsString
} from 'class-validator';

export class OrganizerParam {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @IsEmail()
  @ApiProperty({ example: 'jsmith@host1.com' })
  @Expose()
  public email: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'John Smith' })
  @Expose()
  public cn: string;
}
