import { datatype } from 'faker';
import { SystemCollection } from '../../../../common/entities/collection-system.entity';
import { CollectionType, CreateCollectionParam } from '../../dto/collection-param';
import { CreateSystemCollectionDTO } from '../dtos/system-collection.post.dto';
import { UpdateSystemCollectionDTO } from '../dtos/system-collection.put.dto';

export const checkParentCollectionSharePayload: CreateCollectionParam[] = [
  {
    name: 'General',
    color: '#d06b64',
    calendar_uri: '2906e564-a40d-11eb-b55c-070f99e81ded',
    type: 3,
    parent_id: 123,
    due_date: 0,
    flag: 0,
    is_hide: 0,
    alerts: null,
    icon: 'ic_symbols_70',
    kanban_mode: 0,
  },
  {
    name: 'General',
    color: '#ac725e',
    calendar_uri: '47d34f40-6871-415a-bb61-06de87b89b98',
    type: CollectionType.UserDefined,
    parent_id: 123,
    due_date: 0,
    flag: 0,
    is_hide: 0,
    alerts: null,
    kanban_mode: 0,
    icon: 'ic_symbols_70',
  },
  {
    name: 'Favorite',
    color: '#ac725e',
    calendar_uri: '3452e01d-66ff-4c4c-9d24-45606385d46f',
    type: CollectionType.UserDefined,
    parent_id: 0,
    due_date: 0,
    flag: 0,
    is_hide: 0,
    alerts: null,
    kanban_mode: 0,
    icon: 'ic_symbols_70',
  },
  {
    name: 'Temp',
    color: '#ac725e',
    calendar_uri: '20f0aa5b-8dad-442c-aae2-d4c8aabcb1b6',
    type: CollectionType.UserDefined,
    parent_id: 0,
    due_date: 0,
    flag: 0,
    is_hide: 0,
    alerts: null,
    kanban_mode: 0,
    icon: 'ic_symbols_70',
  },
];

export const checkDbLevelAndCreateEntity: CreateCollectionParam[] = [
  {
    name: 'General',
    calendar_uri: '47d34f40-6871-415a-bb61-06de87b89b98',
    color: '#d06b64',
    type: 3,
    parent_id: 123,
    due_date: 0,
    flag: 0,
    is_hide: 0,
    alerts: null,
    icon: 'ic_symbols_70',
    kanban_mode: 0,
    ref: '1233444'
  },
  {
    name: 'General',
    color: '#ac725e',
    type: CollectionType.UserDefined,
    parent_id: 123,
    due_date: 0,
    flag: 0,
    is_hide: 0,
    alerts: null,
    kanban_mode: 0,
    icon: 'ic_symbols_70',
    ref: 'checkDbLevelAndCreateEntity'
  }
];
export function fakeEntity(): Partial<SystemCollection> {
  return {
    id: datatype.number(),
    user_id: 1,
    name: datatype.string(),
    type: 1,
    local_filter: datatype.json(),
    sub_filter: datatype.json(),
    is_default: 0,
    enable_mini_month: 1,
    enable_quick_view: 1,
    show_mini_month: 1,
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}

export function fakeCreatedDTO(): CreateSystemCollectionDTO {
  return {
    name: datatype.string(),
    type: 1,
    local_filter: datatype.json(),
    sub_filter: datatype.json(),
    enable_mini_month: 1,
    enable_quick_view: 1,
    show_mini_month: 1,
    ref: 'dusi9w3kjeksjs'
  };
}

export function fakeUpdatedDTO(): UpdateSystemCollectionDTO {
  return {
    id: datatype.number(),
    name: datatype.string(),
    type: 1,
    local_filter: datatype.json(),
    sub_filter: datatype.json(),
    enable_mini_month: 1,
    enable_quick_view: 1,
    show_mini_month: 1,
  };
}