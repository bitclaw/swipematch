import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { Error as MongooseError } from 'mongoose';

@Catch(MongooseError.ValidationError)
export class MongoDBValidationFilter implements ExceptionFilter {
  catch(exception: MongooseError.ValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errors: Record<string, string> = {};
    for (const [field, error] of Object.entries(exception.errors)) {
      errors[field] = error.message;
    }

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errors,
    });
  }
}

@Catch()
export class MongoDuplicateKeyFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      throw exception;
    }

    if (exception instanceof MongooseError.ValidationError) {
      throw exception;
    }

    const err = exception as Record<string, unknown>;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (err?.constructor?.name === 'MongoServerError' && err.code === 11000) {
      const keyPattern = err.keyPattern as Record<string, unknown> | undefined;
      const field = Object.keys(keyPattern ?? {})[0] ?? 'unknown';
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        errors: { [field]: 'alreadyExists' },
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errors: { server: 'internalError' },
    });
  }
}
