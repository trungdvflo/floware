import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { filterMessage } from '../utils/common.util';

export const RequestParams = createParamDecorator(
  async (value: any, ctx: ExecutionContext) => {
    // extract headers
    const queryParams = ctx.switchToHttp().getRequest().params;
    // Convert headers to DTO object
    const dto = plainToClass(value, queryParams, {
      excludeExtraneousValues: true,
    });
    // Validate
    const errors = await validate(dto);
    if (errors.length > 0) {
      const dataError = {
        statusCode: 400,
        message: filterMessage(errors),
      };
      return dataError;
    }
    const dataParam = {
      statusCode: 200,
      attributes: dto,
    };
    return dataParam;
  },
);
