import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDefined, IsEmail, IsNotEmpty } from 'class-validator';

export class EmailDTO {
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  @ApiProperty({ example: 'tester@gmail.com' })
  @Expose()
  email: string;

  constructor(partial?: Partial<EmailDTO>) {
    Object.assign(this, partial);
  }
}