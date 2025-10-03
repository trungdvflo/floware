import { Expose, Transform, Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, Max, Min, isString } from "class-validator";

const TRIM_STRING_TRANSFORMER = ({ value }) => typeof value === 'string' ? value.trim()
    : (value !== null ? value : undefined);

export class GetAllFilter<T> {
    @IsInt()
    @Min(1)
    @Max(1100)
    @Transform(({ value }) => Number(value))
    public page_size: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    public modified_gte?: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => Number(value))
    public modified_lt?: number;

    @IsOptional()
    @IsInt()
    @Transform(({ value }) => Number(value))
    public min_id?: number;

    @IsOptional()
    @IsIn([0, 1])
    @Transform(({ value }) => Number(value))
    public has_del?: number;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Type(() => String)
    @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
    public ids?: number[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @Type(() => String)
    @Transform(({ value }) => value.split(',').map(v => v.trim()))
    public fields?: (keyof T)[];

    public remove_deleted?: boolean;

}
export class GetConferencePaging<T> extends GetAllFilter<T> {
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Type(() => String)
    @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
    collection_ids?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Type(() => String)
    @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
    channel_ids?: number[];

    @IsOptional()
    keyword?: string;

    @IsString()
    @IsOptional()
    @Type(() => String)
    @Expose()
    @Transform(TRIM_STRING_TRANSFORMER)
    sort?: string;

    @IsNumber()
    @IsInt()
    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    page_no?: number;

    @IsNumber()
    @IsInt()
    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    filter_type?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    @Expose()
    @Matches(`^((([\\w\._]+)@([\\w\-]+\.)+[\\w]{2,6}),?)+$`)
    emails?: string;

    @IsNumber()
    @IsInt()
    @IsIn([0, 1])
    @IsOptional()
    @Type(() => Number)
    vip?: number;
}