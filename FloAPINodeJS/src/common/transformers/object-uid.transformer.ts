import { isObject, isString } from "class-validator";
import { OBJ_TYPE, TRASH_TYPE } from "../constants";
import {
    Email365ObjectId, EmailObjectId, GeneralObjectId, GmailObjectId
} from "../dtos/object-uid";
import { FloObjectUid } from "../types/object-uid";

export const OBJECT_UID_TRANSFORMER = ({ value, key, obj, type }
    , isOptional = false) => {
    if (!isOptional && !value) {
        return undefined;
    }
    switch (obj.object_type) {
        case OBJ_TYPE.EMAIL:
            if (typeof value !== 'object') {
                return value;
            }
            if (value && value.path) {
                return new EmailObjectId({ uid: value.uid, path: value.path });
            }
            return value;
        case OBJ_TYPE.GMAIL:
            if (typeof value !== 'string') return value;
            return new GmailObjectId({ gmailId: value });
        case OBJ_TYPE.EMAIL365:
            if (typeof value !== 'string') return value;
            return new Email365ObjectId({ id: value });

        default:
            if (typeof value !== 'string') return value;
            return new GeneralObjectId({ uid: value }, obj.object_type);
    }
};

export const OBJECT_UID_TRASH_TRANSFORMER = ({ value, key, obj, type }) => {
    if (obj.object_type === TRASH_TYPE.EMAIL) {
        if (!isObject(value)) return value;
        return new EmailObjectId({ ...value });
    } else {
        if (!value || !isString(value)) return value;
        return new GeneralObjectId({ uid: value }, obj.object_type);
    }
};

export const OBJECT_UID_OLD_TRASH_TRANSFORMER = ({ value, key, obj, type }) => {
    if (obj.object_type === TRASH_TYPE.EMAIL) {
        if (!isObject(value)) return value;
        return new EmailObjectId({ ...value });
    }
};

export const EMAIL_OBJECT_UID_TRANSFORMER = ({ value, key, obj, type }) => {
    if (!isObject(value)) return value;
    return new EmailObjectId({ ...value });
};

export function transformObjectUid(value: any, obj: any, type: string): FloObjectUid {
    if (!value) return value;
    if (obj[type] === OBJ_TYPE.EMAIL) {
        if (typeof value !== 'object') return value;
        return new EmailObjectId({ uid: value.uid, path: value.path });
    } else if (obj[type] === OBJ_TYPE.GMAIL) {
        if (typeof value !== 'string') return value;
        return new GmailObjectId({ gmailId: value });
    }
    if (typeof value !== 'string' || !value) return value;
    return new GeneralObjectId({ uid: value }, obj[type]);
}

export const OBJECT_UID_LINKED_TRANSFORMER = ({ value, key, obj, type }) => {
    if (!value) return value;
    if (obj[type] === OBJ_TYPE.EMAIL) {
        if (typeof value !== 'object') return value;
        return new EmailObjectId({ uid: value.uid, path: value.path });
    } else if (obj[type] === OBJ_TYPE.GMAIL) {
        if (typeof value !== 'string') return value;
        return new GmailObjectId({ gmailId: value });
    } else if (obj[type] === OBJ_TYPE.EMAIL365) {
        if (typeof value !== 'string') return value;
        return new Email365ObjectId({ id: value });
    }
    if (typeof value !== 'string' || !value) return value;
    return new GeneralObjectId({ uid: value }, obj[type]);
};