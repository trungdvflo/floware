import { Expose, Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class ListAttendeeQueryDTO {
  @Expose()
  @IsInt()
  @Min(1)
  @Max(99)
  @Transform(({ value }) => Number(value))
  'max-results': number;

  @Expose()
  @IsString()
  'next-token': string;
}
