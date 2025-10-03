import { ErrorCode } from '../../common/constants/error-code';
import { RecentObjectDto } from './dto/recent-object.dto';

export class RecentObjectError {
  code: ErrorCode;
  message: string;
  attributes: Partial<RecentObjectDto>;
  constructor(data: RecentObjectError) {
    Object.assign(this, data);
  }
}