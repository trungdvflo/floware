import { Expose, Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsIn,
	IsInt,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Matches,
	Max,
	ValidateIf,
	isString
} from 'class-validator';

export class BaseGetDTO {
	@IsInt()
	@IsPositive()
	@Max(1100)
	@Transform(({ value }) => +value)
	@Expose()
	public page_size: number;

	@IsNumber()
	@IsPositive()
	@IsOptional()
	@Transform(({ value }) => Number(value))
	@Expose()
	public modified_gte?: number;

	@IsNumber()
	@IsPositive()
	@IsOptional()
	@Transform(({ value }) => Number(value))
	@Expose()
	public modified_lt?: number;

	@IsInt()
	@IsOptional()
	@Transform(({ value }) => +value)
	@Expose()
	public min_id?: number;

	@IsInt()
	@IsOptional()
	@Transform(({ value }) => +value)
	@Expose()
	public min_del_id?: number;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	@Type(() => String)
	@Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))

	@Expose()
	public ids?: number[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	@Type(() => String)
	@Transform(({ value }) => {
		if (typeof value === 'string') {
			value = value.split(',');
		}
		return value.map(v => v.trim());
	})
	public fields?: string[];
}

export class GetConferencePagingDTO extends BaseGetDTO {
	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	@Type(() => String)
	@Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
	@Expose()
	collection_ids?: number[];

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	@Type(() => String)
	@Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
	@Expose()
	channel_ids?: number[];

	@IsOptional()
	keyword?: string;

	@IsString()
	@IsOptional()
	@Type(() => String)
	@Expose()
	sort?: string;

	@IsNumber()
	@IsInt()
	@IsPositive()
	@IsOptional()
	@Type(() => Number)
	@Expose()
	page_no?: number;

	@IsPositive()
	@IsOptional()
	@Type(() => Number)
	@Expose()
	filter_type?: number;

	@IsNumber()
	@IsInt()
	@IsIn([0, 1])
	@IsOptional()
	@Type(() => Number)
	vip?: number;

	@IsOptional()
	@ValidateIf((o) => o.filter_type > 1)
	@IsString()
	@Type(() => String)
	@Expose()
	@Matches(`^((([\\w\._]+)@([\\w\-]+\.)+[\\w]{2,6}),?)+$`)
	emails?: string;
}