import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsBase64, IsDefined, IsNotEmpty, IsString, ValidateNested } from "class-validator";

export class VerifyPwdDto {
    @IsString()
    @IsDefined()
    @IsNotEmpty()
    @Expose()
    @ApiProperty({
        example: 'dXI6CLleoimtw8RMBkhFe+ypGNIxtRo3KaJTyP/HYZ/hk7t00UAHjIMd9BktV4KGN82J4KXZuUbqEXZD+csv2R69AorrU1gYmLm5U2pwC9UH3xqsmH/WaCW63Dhq8Cxze+BpgAi0zCwdS8sV82N0Kd1rcrzxOTF5hcVeWkflTOObgLAZQcKinZZnijdp8u4HtDEPFhrJ+DMgFzU6OY7meStYqwKAG9huYaE5cbZ4MhgjFOXCsET9IC89bm46ku10iJHj4LU9mdXgC33ggU5XalXrPH8fki8kuu3smauRAt/RIpL4TniFcC0fUa+9T7hpBhTQ5ZUwehypH9NxIeHYtw=='
    })
    @IsBase64()
    verify_code: string;
}

export class VerifyPwdSwagger {
    @IsNotEmpty()
    @ApiProperty({
        type: VerifyPwdDto
    })
    @ValidateNested()
    @Type(() => VerifyPwdDto)
    @Expose()
    data: VerifyPwdDto;
    errors: any[];
}