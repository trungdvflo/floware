import {
  isArray, isEmail, isString,
  registerDecorator, ValidationArguments, ValidationOptions
} from "class-validator";
import { format } from 'util';
import { CIRTERION_TYPE, CIRTERION_VALUE, SUGGESTED_OBJ_TYPE } from "../../../common/constants";
export function IsMatchCriterionValue(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsMatchCriterionValue',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          let rsValidate = true;
          const criterionType = Number(args.object['criterion_type']);
          if([ CIRTERION_TYPE.EVENT_INVITEE, CIRTERION_TYPE.EMAIL_ADDRESS,
            CIRTERION_TYPE.EMAIL_SENDER].includes(criterionType)) {
              if(!isArray(value) || value.length > CIRTERION_VALUE.MAX_ARRAY
              || value.length === CIRTERION_VALUE.MIN_ARRAY) {
                return rsValidate = false;
              }
              // check emain in criterion_value
              value.map(item => {
                if(!isEmail(item['email'])) return rsValidate = false;
              });
          } else {
            if(!isString(value)) return rsValidate = false;
          }
          return rsValidate;
        },
        defaultMessage: (args: ValidationArguments) => {
          const criterionType = Number(args.object['criterion_type']);
          if([ CIRTERION_TYPE.EVENT_INVITEE, CIRTERION_TYPE.EMAIL_ADDRESS,
            CIRTERION_TYPE.EMAIL_SENDER].includes(criterionType)) {
              const criterionValue = args.object['criterion_value'];
              if(!isArray(criterionValue)) return format('criterion_value must be array');
              if(criterionValue.length > CIRTERION_VALUE.MAX_ARRAY
                 || criterionValue.length === CIRTERION_VALUE.MIN_ARRAY) {
                return format('Size of criterion_value invalid');
              }
              return format('Data of criterion_value is invalid');
          } else {
            return format('criterion_value must be a string');
          }
        },
      },
    });
  };
}

export function IsRequestByCollection(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsRequestByCollection',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const accountId = Number(args.object['account_id']);
          const thirdObjectUid = args.object['third_object_uid'];
          const thirdObjectType = Number(args.object['third_object_type']);
          if (value === 0 && !thirdObjectUid) {
            return false;
          }
          if (value === 0 && !thirdObjectType) {
            return false;
          }
          if (value === 0) {
            if(!accountId || accountId === 0) return false;
          }
          if (value === 0 && thirdObjectType === 0) {
            return false;
          }

          return true;
        },
        defaultMessage: (args: ValidationArguments) => {
          const collectionId = Number(args.object['collection_id']);
          const accountId = Number(args.object['account_id']);
          const thirdObjectUid = args.object['third_object_uid'];
          const thirdObjectType = Number(args.object['third_object_type']);
          if (collectionId === 0 && thirdObjectType === 0) {
            return format('third_object_type is not equal 0');
          }
          if (collectionId === 0) {
            if(!accountId || accountId === 0)  return format('account_id must larger than 0');
          } else {
            if (!thirdObjectUid) {
              return format('third_object_uid must have value');
            }
            if (!thirdObjectType) {
              return format('third_object_type must have value');
            }
          }
        }
      },
    });
  };
}

export function IsMatchCriterionType(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsMatchCriterionType',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          let validParam = false;
          const criterionType = Number(args.object['criterion_type']);
          switch(value) {
            case SUGGESTED_OBJ_TYPE.VEVENT:
              if (criterionType === CIRTERION_TYPE.EVENT_TITILE
                || criterionType === CIRTERION_TYPE.EVENT_INVITEE
                || criterionType === CIRTERION_TYPE.EVENT_LOCATION) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.VCARD:
              if (criterionType === CIRTERION_TYPE.CONTACT_COMPANY
                || criterionType === CIRTERION_TYPE.EMAIL_ADDRESS) {
                  validParam = true;
                }
              break;
            case SUGGESTED_OBJ_TYPE.EMAIL:
              if (criterionType === CIRTERION_TYPE.EMAIL_TITILE
                || criterionType === CIRTERION_TYPE.EMAIL_SENDER
                || criterionType === CIRTERION_TYPE.EMAIL_BODY) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.CSFILE:
              if (criterionType === CIRTERION_TYPE.FILE_TYPE) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.URL:
              if (criterionType === CIRTERION_TYPE.URL_BOOKMARK) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.LOCAL_FILTER:
              if (criterionType === CIRTERION_TYPE.LOCAL_FILTER) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.CALENDAR:
              if (criterionType === CIRTERION_TYPE.CALENDAR) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.VTODO:
              if (criterionType === CIRTERION_TYPE.TODO_TITILE) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.VJOURNAL:
              if (criterionType === CIRTERION_TYPE.NOTE_TITILE) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.TAB_BAR:
              if (criterionType === CIRTERION_TYPE.TAB_BAR) {
                validParam = true;
              }
              break;
            case SUGGESTED_OBJ_TYPE.IMAP_FOLDER:
              if (criterionType === CIRTERION_TYPE.IMAP_FOLDER) {
                validParam = true;
              }
              break;
            default:
              break;
          }
          return validParam;
        },
        defaultMessage: (args: ValidationArguments) => {
          const criterionType = Number(args.object['criterion_type']);
            return format('object_type is invalid');
          }
        },
    });
  };
}