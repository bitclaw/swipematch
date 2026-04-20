import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { AllConfigType } from '../config/config.type';
import mongooseAutoPopulate from 'mongoose-autopopulate';

@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  createMongooseOptions(): MongooseModuleOptions {
    const username = this.configService.get('database.username', {
      infer: true,
    });
    const password = this.configService.get('database.password', {
      infer: true,
    });

    const options: MongooseModuleOptions = {
      uri: this.configService.get('database.url', { infer: true }),
      dbName: this.configService.get('database.name', { infer: true }),
      connectionFactory(connection) {
        connection.plugin(mongooseAutoPopulate);
        return connection;
      },
      readPreference: 'secondaryPreferred',
      writeConcern: { w: 'majority', journal: true, wtimeoutMS: 5000 },
    };

    if (username) {
      options.user = username;
    }
    if (password) {
      options.pass = password;
    }

    return options;
  }
}
