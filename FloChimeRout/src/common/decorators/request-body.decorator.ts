import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { filterMessage } from '../utils/common.util';

export const RequestBody = createParamDecorator(
  async (value: any, ctx: ExecutionContext) => {
    // extract headers
    const body = ctx.switchToHttp().getRequest().body;
    if (!body['data']) {
      const dataError = {
        statusCode: 400,
        message: 'Please input fields in data',
      };
      return dataError;
    }
    // Convert body to DTO object
    const dto = plainToClass(value, body['data'], {
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
