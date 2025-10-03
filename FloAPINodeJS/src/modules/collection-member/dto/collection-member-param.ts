import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsEmpty, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { MEMBER_ACCESS } from '../../../common/constants';
import { RequestParam } from '../../../common/swaggers/collection-member.swagger';
import { RequestParam as ShareMemberRequestParam } from '../../../common/swaggers/share-member.swagger';
import { CreateCollectionParam } from '../../collection/dto/collection-param';

export enum CollectionMemberStatus {
  Waiting = 0,
  Joined = 1,
  Declined = 2,
}

export class CollectionMemberParam extends CreateCollectionParam {
  @IsNumber()
  @ApiPropertyOptional(RequestParam.id)
  @Expose()
  public id: number;

  @IsInt()
  @IsOptional()
  @Expose()
  @IsEnum(CollectionMemberStatus)
  @ApiPropertyOptional(RequestParam.shared_status)
  public shared_status?: number;

  @IsNumber()
  @IsNotEmpty()
  @IsEnum(MEMBER_ACCESS)
  @ApiProperty(ShareMemberRequestParam.access)
  @Expose()
  access: number;

  @IsEmail()
  @IsEmpty()
  @ApiProperty(RequestParam.owner)
  @Expose()
  owner: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional(RequestParam.created_date)
  @Expose()
  public created_date: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional(RequestParam.updated_date)
  @Expose()
  public updated_date: number;
}
