import { SortObjectDto } from "../../modules/sort-object/dto/sort-object.dto";
import { UpdateSortObjectTodoDto } from "../../modules/todo/dtos/update-sort-object.dto";

export interface IObjectOrder {
  data: SortObjectDto [];
  object_type: string;
}

export interface ITodoObjectOrder {
  data: UpdateSortObjectTodoDto [];
  object_type: string;
}

export interface ICloudObjectOrder {
  id: number;
  order_number: number;
}

export interface ITodoSort {
  uid: string;
  order_number: number;
}