import { OBJ_TYPE } from "../constants/sort-object.constant";

export interface IDeleteObject {
    user_id: number;
    object_uid: Buffer;
    object_type: OBJ_TYPE;
    object_id?: number;
}