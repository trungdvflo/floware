import {
  Email365ObjectId, EmailObjectId, GeneralObjectId, GmailObjectId
} from "../dtos/object-uid";

export type FloObjectUid = EmailObjectId | Email365ObjectId | GmailObjectId | GeneralObjectId;