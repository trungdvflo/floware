import {
    Column, Entity,
    PrimaryGeneratedColumn
} from 'typeorm';
import { DateCommon } from './date-common.entity';

export class OutOfOrderErrorEntity {
  code: string;
  message: string;
  attributes: any;
  constructor(code, message, attributes) {
    this.code = code;
    this.message = message;
    this.attributes = attributes;
  }
}