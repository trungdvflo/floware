import { Expose } from "class-transformer";
import {
    IsDefined,
    IsNotEmpty, IsString
} from "class-validator";

export class ChimeDto {
    @Expose()
    @IsString()
    @IsNotEmpty()
    @IsDefined()
    externalAttendee: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
    @IsDefined()
    joinToken: string;
}
