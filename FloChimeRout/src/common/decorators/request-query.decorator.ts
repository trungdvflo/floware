import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { filterMessage } from '../utils/common.util';

export const RequestQueries = createParamDecorator(
  async (value: any, ctx: ExecutionContext) => {
    // extract headers
    const queryQueries = ctx.switchToHttp().getRequest().query;
    // Convert headers to DTO object
    const dto = plainToClass(value, queryQueries, {
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
