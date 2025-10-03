import { Injectable } from "@nestjs/common";
import { ACTION, OBJ_TYPE, SOURCE_OBJECT_TYPE } from '../../../common/constants/common';
import { ErrorCode } from "../../../common/constants/error-code";
import { validateEmail } from "../../../common/utils/common";
import { CreateHistoryDTO } from "../dtos/create-history.dto";

@Injectable()
export class ExtendValidationHelper {
  static async validateTypeObj(item: CreateHistoryDTO) {
    const { destination_object_uid,
            destination_object_type, source_object_type,
      destination_object_href, action } = item;

    const sourceObjectUid = await this.validateSource(item);
    const rs: any = {
      isValid: false,
      data: {
        code: ErrorCode.VALIDATION_FAILED,
        message: 'destination_object_uid is wrong format',
        attributes: {destination_object_uid}
      }
    };
    if ([4,5,9,10].includes(action)) { // skip validate destination_object_type for action 4,5,9,10
      return sourceObjectUid;
    }
    if(sourceObjectUid.isValid) {
      switch (destination_object_type) {
        case OBJ_TYPE.EMAIL365:
          if (source_object_type === SOURCE_OBJECT_TYPE[3]) {
            rs.data = {
              code: ErrorCode.VALIDATION_FAILED,
              message: 'destination_object_type is not matching with source_object_type',
              attributes: { source_object_type, destination_object_type }
            };
            return rs;
          }
          if(typeof(destination_object_uid) === 'string') {
            rs.isValid = true;
          }
          return rs;
        case OBJ_TYPE.GMAIL:
          if (source_object_type === SOURCE_OBJECT_TYPE[3]) {
            rs.data = {
              code: ErrorCode.VALIDATION_FAILED,
              message: 'destination_object_type is not matching with source_object_type',
              attributes: { source_object_type, destination_object_type }
            };
            return rs;
          }
          if(typeof(destination_object_uid) === 'string') {
            rs.isValid = true;
          }
          return rs;
        case OBJ_TYPE.VEVENT:
          if ((!destination_object_href || destination_object_href === "")) {
            rs.data.message = 'destination_object_href is required';
            rs.data.attributes = {destination_object_href};
            return rs;
          }
          if(typeof(destination_object_uid) === 'string') {
            rs.isValid = true;
          }
          return rs;
        case OBJ_TYPE.EMAIL:
          if(typeof(destination_object_uid) === 'object') {
            if(destination_object_uid.uid != null && destination_object_uid.path != null) {
              rs.isValid = true;
              return rs;
            }
          }
          return rs;
        default:
          rs.data = {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'destination_object_type is not supported',
            attributes: {destination_object_type}
          };
          return rs;
      }
    }
    return sourceObjectUid;
  }

  static async validateSource(item: CreateHistoryDTO) {
    const { source_object_uid, action, source_object_type, source_object_href } = item;
    switch (source_object_type) {
      case SOURCE_OBJECT_TYPE[1]:
      case SOURCE_OBJECT_TYPE[2]:
      case SOURCE_OBJECT_TYPE[3]:
        if(validateEmail(source_object_uid)) {
          if(action === ACTION[2] && source_object_type === SOURCE_OBJECT_TYPE[1])
            return { isValid: true };
          if(action === ACTION[3] &&
            [SOURCE_OBJECT_TYPE[1], SOURCE_OBJECT_TYPE[2]].includes(source_object_type) )
            return { isValid: true };
          if ([6, 7, 8].indexOf(action) !== -1
            && [SOURCE_OBJECT_TYPE[1], SOURCE_OBJECT_TYPE[2], SOURCE_OBJECT_TYPE[3]]
              .includes(source_object_type))
            return { isValid: true };
          return {
            isValid: false,
            data: {
              code: ErrorCode.VALIDATION_FAILED,
              message: 'action is wrong number',
              attributes: {action}
            }
          };
        }
        return {
          isValid: false,
          data: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'source_object_uid must be email format',
            attributes: {source_object_uid}
          }
        };

      case SOURCE_OBJECT_TYPE[0]:
        const rs: any = {
          isValid: false,
          data: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'source_object_uid is wrong format',
            attributes: {source_object_uid}
          }
        };
        if ((!source_object_href || source_object_href === "")) {
          rs.data.message = 'source_object_href is required';
          rs.data.attributes = {source_object_href};
          return rs;
        }
        if(typeof(source_object_uid) === 'string') {
          rs.isValid = true;
        }
        return rs;
      default:
        return {
          isValid: false,
          data: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'not support source_object_type ',
            attributes: {source_object_uid}
          }
        };
    }
  }
}