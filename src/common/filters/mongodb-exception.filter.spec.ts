import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';
import {
  MongoDuplicateKeyFilter,
  MongoDBValidationFilter,
} from './mongodb-exception.filter';

function createMockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost,
    status,
    json,
  };
}

describe('MongoDuplicateKeyFilter', () => {
  const filter = new MongoDuplicateKeyFilter();

  it('should return 409 for duplicate key error (code 11000)', () => {
    const { host, status, json } = createMockHost();
    const error = {
      constructor: { name: 'MongoServerError' },
      code: 11000,
      keyPattern: { email: 1 },
    };

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      errors: { email: 'alreadyExists' },
    });
  });

  it('should return 500 for unknown errors', () => {
    const { host, status, json } = createMockHost();
    const error = new Error('unknown');

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errors: { server: 'internalError' },
    });
  });
});

describe('MongoDBValidationFilter', () => {
  const filter = new MongoDBValidationFilter();

  it('should return 422 for validation errors', () => {
    const { host, status, json } = createMockHost();
    const error = new MongooseError.ValidationError();
    error.errors = {
      email: {
        message: 'email is required',
      } as MongooseError.ValidatorError,
    };

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: { email: 'email is required' },
    });
  });
});
