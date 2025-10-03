import {
  isEmail,
  isEmpty,
  isEnum,
  isFQDN, isInt,
  isNotEmpty,
  isNumber, IsOptional as IsOptionalValidator, isPositive, isString,
  isUUID,
  maxLength,
  registerDecorator, ValidateIf, ValidationArguments, ValidationOptions
} from 'class-validator';
import { format } from 'util';
import { PostChatDTO, PutChatDTO } from '../../modules/chat-realtime/dtos';
import { CreateCommentDto } from '../../modules/collection-comment/dtos/comment.create.dto';
import { UpdateCommentDto } from '../../modules/collection-comment/dtos/comment.update.dto';
import { CreateHistoryDto } from '../../modules/collection-history/dtos/history.create.dto';
import { CreateDeviceTokenDTO } from '../../modules/devicetoken/dtos/create-devicetoken.dto';
import {
  CERT_ENV,
  DEVICE_TYPE,
  HISTORY_ACTION, MAX_INTEGER, OBJ_TYPE, OBJECT_SHARE_ABLE,
  REQUIRED_HREF_OBJECT, TRACKING_STATUS, TRASH_TYPE
} from '../constants/common';
import {
  ACTION_MANUAL_RULE,
  CONDITION_MANUAL_RULE, OPERATOR_BODY, OPERATOR_CC,
  OPERATOR_DATE, OPERATOR_FROM,
  OPERATOR_PRIORITY,
  OPERATOR_STATUS,
  OPERATOR_SUBJECT,
  OPERATOR_TO,
  PRIORITY_VALUE
} from '../constants/manual_rule.constant';
import {
  MSG_ERR_EVENT, MSG_VALIDATE_CHAT_OBJECT, MSG_VALIDATE_OBJECT
} from '../constants/message.constant';
import {
  Email365ObjectId, EmailObjectId, GeneralObjectId, GmailObjectId, ObjectId
} from '../dtos/object-uid';

const checkEmailObjectId = (args) => {
  if (!isInt(args.value.uid) || !isPositive(args.value.uid)) {
    return MSG_VALIDATE_OBJECT.UID_IS_NUMBER;
  }
  if (!isNotEmpty(args.value.path) || !isString(args.value.path)) {
    return MSG_VALIDATE_OBJECT.PATH_IS_STRING;
  }
  return MSG_VALIDATE_OBJECT.INVALID_EMAIL_OBJECT_ID;
};

function isHexColorCustom(hex) {
  return typeof hex === 'string'
    && (hex.length === 7 || hex.length === 4) && (hex.indexOf("#") === 0)
    && !isNaN(Number('0x' + hex.replace("#", "")));
}

export function IsHexColorCustom(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsHexColorCustom',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return isHexColorCustom(value);
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('%s must be a hexa color code', args.property);
        },
      },
    });
  };
}

export function CheckObjectId(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'checkObjectId',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value instanceof ObjectId) {
            if (value instanceof EmailObjectId) {
              if (isInt(value.uid) && isPositive(value.uid) &&
                isNotEmpty(value.path) && isString(value.path)) {
                return true;
              }
              return false;
            }
            if (value instanceof GeneralObjectId) {
              return isString(value.uid);
            }
            if (value instanceof GmailObjectId) {
              return isString(value.id);
            }
            if (value instanceof Email365ObjectId) {
              return isString(value.id);
            }
          }
          return false;
        },
        defaultMessage: (args: ValidationArguments) => {
          const [relatedPropertyName] = args.constraints;
          const type = (args.object as any)[relatedPropertyName];
          if (args.value instanceof ObjectId) {
            if (args.value instanceof EmailObjectId) {
              const msg = checkEmailObjectId(args);
              args.object[args.property] = args.value.getPlain();
              return msg;
            }
            args.object[args.property] = args.value.getPlain();
          }
          if (type === OBJ_TYPE.EMAIL) {
            return format(MSG_VALIDATE_OBJECT.OBJECT_UID_IS_JSON, args.property);
          }
          return format(MSG_VALIDATE_OBJECT.OBJECT_UID_IS_STRING, args.property);
        },
      },
    });
  };
}

export function CheckMessageType(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'CheckMessageType',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const entity: any = args.object;
          // if (value === 0) {
          //   if(entity.file_common_id) {
          //    return false;
          //   }
          // }
          if (value === 1) {
            if (entity.file_common_id === undefined || entity.file_common_id < 0) {
              return false;
            }
          }
          return true;
        },
        defaultMessage: (args: ValidationArguments) => {
          const messageType = args.object['message_type'];
          // if (messageType === 0) {
          //   return format(MSG_VALIDATE_CHAT_OBJECT.COMMON_FILE_ID, 'is not');
          // }
          return format(MSG_VALIDATE_CHAT_OBJECT.COMMON_FILE_ID, 'is');
        },
      },
    });
  };
}

export function CheckEmailObjectUid(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'CheckEmailObjectUid',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value instanceof EmailObjectId) {
            if (isInt(value.uid) && isPositive(value.uid) &&
              isNotEmpty(value.path) && isString(value.path)) {
              return true;
            }
            return false;
          }
          return false;
        },
        defaultMessage: (args: ValidationArguments) => {
          if (args.value instanceof EmailObjectId) {
            const msg = checkEmailObjectId(args);
            args.object[args.property] = args.value.getPlain();
            return msg;
          }
          return format(MSG_VALIDATE_OBJECT.OBJECT_UID_IS_JSON, args.property);
        },
      },
    });
  };
}

export function CheckObjectHref(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'checkObjectHref',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const type = (args.object as any)[relatedPropertyName];
          const isStringValue = isString(value) && value.trim();
          if (isEnum(type, REQUIRED_HREF_OBJECT)) {
            if (isStringValue) { return true; }
            return false;
          } else {
            if (value) { return false; }
            return true;
          }
        },
        defaultMessage: (args: ValidationArguments) => {
          const [relatedPropertyName] = args.constraints;
          const type = (args.object as any)[relatedPropertyName];
          if (isEnum(type, REQUIRED_HREF_OBJECT)) {
            return format(MSG_VALIDATE_OBJECT.OBJECT_HREF_IS_REQUIRED, args.property);
          }
          return format(MSG_VALIDATE_OBJECT.OBJECT_HREF_NOT_REQUIRED, args.property);
        },
      },
    });
  };
}

const checkStatCodeOutOfRange = (code) => {
  if (isString(code) || (code < 1 || code > 4.99)) {
    return true;
  }
  return false;
};

const checkInvalidDecimalStatCode = (code) => {
  if (Math.floor(code) !== code) {
    const decimals = code.toString().split(".")[1].length || 0;
    if (decimals > 2) {
      return true;
    }
    return false;
  }
  return false;
};

export function CheckStatCode(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'CheckStatCode',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: number[], args: ValidationArguments) {
          if (value && value.length) {
            let valid: boolean = true;
            for (const code of value) {
              if (checkStatCodeOutOfRange(code)) {
                valid = false;
                break;
              }
              if (checkInvalidDecimalStatCode(code)) {
                valid = false;
                break;
              }
            }
            return valid;
          }
          return false;
        },
        defaultMessage: (args: ValidationArguments) => {
          return MSG_ERR_EVENT.SCHEDULE_STATUS_CODE_INVALID;
        },
      },
    });
  };
}

const isUUIDWithDomain = (value: string) => {
  if (typeof value !== 'string') return false;
  const splitted = value.split('@');
  if (splitted[1]) return isFQDN(splitted[1]);
  return isUUID(splitted[0]);
};

export function IsUUIDWithDomain(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'checkObjectHref',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          return isUUIDWithDomain(value);
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('%s is an invalid UUID or with invalid FQDN', args.property);
        },
      },
    });
  };
}

export function IsTrashObjectUid(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsTrashObjectUid',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value instanceof GeneralObjectId) {
            // not check uuid return isUUID(value);
            return isString(value.uid);
          }
          if (value instanceof EmailObjectId) {
            return isInt(value.uid) && isString(value.path)
              && isPositive(value.uid) && (value.uid <= MAX_INTEGER);
          }
          const obj_type = args.object['object_type'];
          if (obj_type === TRASH_TYPE.EMAIL
            || obj_type === TRASH_TYPE.VCARD
            || obj_type === TRASH_TYPE.VEVENT
            || obj_type === TRASH_TYPE.VJOURNAL
            || obj_type === TRASH_TYPE.VTODO) {
            return false;
          }
          return isString(value) || isEmpty(value);
        },
        defaultMessage: (args: ValidationArguments) => {
          const obj_type = args.object['object_type'];
          if (obj_type === TRASH_TYPE.EMAIL) {
            return format('%s is an invalid JSON of email uid,\
              uid must be > 0 and <= 4294967295, path must be string', args.property);
          } else {
            return format('%s is required and an invalid String', args.property);
          }
        },
      },
    });
  };
}

export function IsTrashObjectId(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsTrashObjectId',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj_type = args.object['object_type'];
          if (obj_type === TRASH_TYPE.URL
            || obj_type === TRASH_TYPE.FOLDER
            || obj_type === TRASH_TYPE.CSFILE) {
            return isNotEmpty(value) && isInt(value) && isPositive(value);
          } else {
            return isEmpty(value) || (isInt(value) && isPositive(value));
          }
        },
        defaultMessage: (args: ValidationArguments) => {
          const obj_type = args.object['object_type'];
          if (obj_type === TRASH_TYPE.URL
            || obj_type === TRASH_TYPE.FOLDER
            || obj_type === TRASH_TYPE.CSFILE) {
            return format('%s is not empty, must be an positive integer number', args.property);
          } else {
            return format('%s is empty or positive integer number', args.property);
          }
        },
      },
    });
  };
}

export function IsTrackingRepliedTime(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsTrackingRepliedTime',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          if (!value) {
            const entity: any = args.object;
            if (entity.status === TRACKING_STATUS.REPLIED) {
              return false;
            }
            return true;
          }
          return isNumber(value) && isPositive(value);
        },
        defaultMessage: (args: ValidationArguments) => {
          if (!args.value) {
            const entity: any = args.object;
            if (entity.status === TRACKING_STATUS.REPLIED) {
              return format('%s is required when status is replied', args.property);
            }
            return '';
          }
          if (!isNumber(args.value)) {
            return format('%s must be an integer number', args.property);
          }
          if (!isPositive(args.value)) {
            return format('%s must be a positive number', args.property);
          }

          return format('%s is invalid', args.property);
        },
      },
    });
  };
}

export function IsEmailOrEmpty(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsEmailOrEmpty',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          return isEmpty(value) || isEmail(value);
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('%s must be empty or an email', args.property);
        },
      },
    });
  };
}

/**
 * Checks if value is missing and if so, ignores all validators.
 *
 * @param nullable If `true`, all other validators will be skipped
 * even when the value is `null`. `false` by default.
 * @param validationOptions {@link ValidationOptions}
 *
 * @see IsOptional exported from `class-validator.
 */
export function IsOptionalCustom(
  nullable = false,
  validationOptions?: ValidationOptions,
) {
  if (nullable) {
    return IsOptionalValidator(validationOptions);
  }

  return ValidateIf((ob: any, v: any) => {
    return v !== undefined;
  }, validationOptions);
}

export function IsOptionalWithField(
  fieldName: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsOptionalWithField',
      target: object.constructor,
      propertyName,
      constraints: [fieldName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const fieldValue = args.object[fieldName];
          if (fieldValue?.length > 0) {
            return isEmpty(value) || (isString(value) && maxLength(value, 2000));
          } else {
            return isString(value) && isNotEmpty(value) && maxLength(value, 2000);
          }
        },
        defaultMessage(args: ValidationArguments) {
          if (!isString(args.value) || !maxLength(args.value, 2000)) {
            return `${args.property} must be shorter than or equal to 2000 characters, ${args.property} must be a string`;
          }
          return `${args.property} and ${fieldName} are not empty, is string, and max length 2000`;
        },
      },
    });
  };
}

export function IsMatchOperator(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsMatchOperator',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const _operator = Number(args.object['operator']);
          switch (value) {
            case CONDITION_MANUAL_RULE.Subject:
              return OPERATOR_SUBJECT.includes(_operator);
            case CONDITION_MANUAL_RULE.From:
              return OPERATOR_FROM.includes(_operator);
            case CONDITION_MANUAL_RULE.Priority:
              return OPERATOR_PRIORITY.includes(_operator);
            case CONDITION_MANUAL_RULE.To:
              return OPERATOR_TO.includes(_operator);
            case CONDITION_MANUAL_RULE.Cc:
              return OPERATOR_CC.includes(_operator);
            case CONDITION_MANUAL_RULE.Body:
              return OPERATOR_BODY.includes(_operator);
            case CONDITION_MANUAL_RULE.Date:
              return OPERATOR_DATE.includes(_operator);
            case CONDITION_MANUAL_RULE.Status:
              return OPERATOR_STATUS.includes(_operator);
            default:
              return false;
          }
        },
        defaultMessage: (args: ValidationArguments) => {
          const _operator = Number(args.object['operator']);
          return format('operator is not match with condition', _operator);
        },
      },
    });
  };
}

export function IsLinkedObjectType(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsLinkedObjectType',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return isString(value) || isEmpty(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is required and an invalid Flo's object type`;
        },
      },
    });
  };
}

export function IsLinkedObjectUid(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsLinkedObjectUid',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj_type = args.object['object_type'];
          if (!isEmpty(value) && !obj_type) {
            return false;
          }
          if (value instanceof GeneralObjectId) {
            return isString(value.uid);
          }
          return isString(value) || isEmpty(value);
        },
        defaultMessage(args: ValidationArguments) {
          if (!args.object['object_type'] && !isEmpty(args.value)) {
            return "object_type is required when requesting with object_uid";
          }
          return `${args.property} is required and an invalid String`;
        },
      },
    });
  };
}

export function IsCommentObjectUid(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsCommentObjectUid',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value instanceof GeneralObjectId) {
            // not check uuid return isUUID(value);
            return isString(value.uid);
          }
          const obj_type = args.object['object_type'];
          if (obj_type === OBJ_TYPE.URL
            || obj_type === OBJ_TYPE.VEVENT
            || obj_type === OBJ_TYPE.VJOURNAL
            || obj_type === OBJ_TYPE.VTODO) {
            return false;
          }
          return isString(value) || isEmpty(value);
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('%s is required and an invalid String', args.property);
        },
      },
    });
  };
}

export function IsMatchAction(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsMatchAction',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === ACTION_MANUAL_RULE.move_to_collection ||
            value === ACTION_MANUAL_RULE.add_to_collection) {
            const collectionId = Number(args.object['collection_id']);
            return Number(collectionId) > 0 ? true : false;
          }
          if (value === ACTION_MANUAL_RULE.priority_normal) {
            const valueAction = args.object['value'];
            return PRIORITY_VALUE.includes(valueAction);
          }
          if (value === ACTION_MANUAL_RULE.forward_mail) {
            const valueAction = args.object['value'];
            return isEmail(valueAction);
          }
          return true;
        },
        defaultMessage: (args: ValidationArguments) => {
          if (Number(args.value) === ACTION_MANUAL_RULE.move_to_collection
            || Number(args.value) === ACTION_MANUAL_RULE.add_to_collection) {
            return format('collection_id is required');
          }
          if (Number(args.value) === ACTION_MANUAL_RULE.priority_normal) {
            return format('Value of action invalid');
          }
          if (Number(args.value) === ACTION_MANUAL_RULE.forward_mail) {
            return format('Value must be an email');
          }
        },
      },
    });
  };
}

export function IsValidateMention(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsValidateMention',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(comment: string, args: ValidationArguments) {
          const { mentions } = args.object as CreateCommentDto | UpdateCommentDto;
          // No mentions to validate
          if (!mentions?.length) {
            return true;
          }
          const mentionTexts = mentions.map(
            ({ email }) => email)
            .filter(Boolean);

          if (!mentionTexts.length) { return true; }
          const mentionPattern = new RegExp(mentionTexts
            .map(email => `(@${email})`)
            // desc by string length to match: @abc, @abcd
            .sort((a: string, b: string) => b.length - a.length)
            .join('|'), 'g');
          // DON'T change `str.match()` to RegExp(//).exec(str);
          // .. this func not good for this case
          const matched = [...new Set(comment.match(mentionPattern))];
          return matched.length === mentions.length;
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('Invalid mention in comment');
        },
      },
    });
  };
}
export function IsValidateMentionInChat(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsValidateMentionInChat',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(message_text: string, args: ValidationArguments) {
          if (!message_text) return false;
          const { metadata = null } = args.object as PostChatDTO | PutChatDTO;
          // No mentions to validate
          if (!metadata || !metadata?.mentions?.length) {
            return true;
          }
          const mentionTexts = metadata.mentions.map(
            ({ email }) => email)
            .filter(Boolean);

          if (!mentionTexts.length) { return true; }
          const mentionPattern = new RegExp(mentionTexts
            .map(email => `(@${email})`)
            // desc by string length to match: @abc, @abcd
            .sort((a: string, b: string) => b.length - a.length)
            .join('|'), 'g');
          // DON'T change `str.match()` to RegExp(//).exec(str);
          // .. this func not good for this case
          const matched = [...new Set(message_text.match(mentionPattern))];
          return matched.length === metadata.mentions.length;
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('Invalid mention in message');
        },
      },
    });
  };
}
export function IsValidateMentionText(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsValidateMention',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(mention_text: string, args: ValidationArguments) {
          // 1. must have @ at first character
          if (!/^@/.test(mention_text)) {
            return false;
          }
          // 2. match with allow letters
          const allowLettersRegex = /^@[A-Za-z0-9._]{2,100}$/g;
          if (!(allowLettersRegex.test(mention_text))) {
            return false;
          }
          return true;
        },

        defaultMessage: (args: ValidationArguments) => {
          return format('Invalid mention_text in mentions');
        },
      },
    });
  };
}

export function IsOnlyAssignedTOATodo(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsValidateMention',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(object_type: string, args: ValidationArguments) {
          const { action } = args.object as CreateHistoryDto;
          if ([
            HISTORY_ACTION.ASSIGNED
            , HISTORY_ACTION.UN_ASSIGNED
            , HISTORY_ACTION.UNDONE
            , HISTORY_ACTION.COMPLETED
            , HISTORY_ACTION.COMPLETED_SUB_TASK
            , HISTORY_ACTION.UN_COMPLETED_SUB_TASK
          ].includes(action)
            && object_type !== OBJECT_SHARE_ABLE.VTODO) {
            return false;
          }
          return true;
        },

        defaultMessage: (args: ValidationArguments) => {
          const { action, object_type } = args.object as CreateHistoryDto;
          return format(`Invalid action: ${action} for object: ${object_type}`);
        },
      },
    });
  };
}

export function IsCertEnv(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsCerEnv',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(cert_env: CERT_ENV, args: ValidationArguments) {
          const { device_type } = args.object as CreateDeviceTokenDTO;
          if ([
            DEVICE_TYPE.FLO_MAC_PROD,
            DEVICE_TYPE.FLO_MAC_QC
          ].includes(device_type)) {
            return [CERT_ENV.DEVELOPMENT, CERT_ENV.PRODUCTION]
              .includes(cert_env);
          }
          return Object.values(CERT_ENV).includes(cert_env);
        },

        defaultMessage: (args: ValidationArguments) => {
          const { device_type } = args.object as CreateDeviceTokenDTO;
          // Mac token must be
          if ([DEVICE_TYPE.FLO_MAC_PROD, DEVICE_TYPE.FLO_MAC_QC].includes(device_type)) {
            return format(`For MacOS cert_env must be ${CERT_ENV.PRODUCTION}, ${CERT_ENV.DEVELOPMENT}`);
          }
          return format(`For iPhone, iPad cert_env must be ${CERT_ENV.PRODUCTION}, ${CERT_ENV.DEVELOPMENT}, ${CERT_ENV.VOIP_PRODUCTION}, ${CERT_ENV.VOIP_DEVELOPMENT}`);
        },
      },
    });
  };
}
