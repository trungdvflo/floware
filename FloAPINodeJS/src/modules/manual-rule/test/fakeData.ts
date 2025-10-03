import { datatype } from 'faker';
import { EmailObjectId } from '../../../common/dtos/object-uid';
import { RuleEntity } from '../../../common/entities/manual-rule.entity';
import { ExecuteManualRuleDTO } from '../dtos/execute-manual-rule.dto';
import { CreateManualRuleDTO } from '../dtos/manual-rule.post.dto';
import { UpdateManualRuleDTO } from '../dtos/manual-rule.put.dto';

export function fakeEntity(
  condition = 1,
  operator = 2,
  action = 1,
  value = "example",
  destinationValue = "move_to_imap_folder"
): Partial<RuleEntity> {
  return {
    id: datatype.number(),
    user_id: 1,
    name: datatype.string(),
    match_type: 0,
    order_number: datatype.number(),
    is_enable: 1,
    apply_all: 1,
    conditions: [
      {
        "condition": condition,
        "operator": operator,
        "value": value // string
      }
    ],
    destinations: [
      {
        "action": action,
        "value": destinationValue,
        "collection_id": datatype.number(),
      }
    ],
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}

export function fakeCreatedDTO(): CreateManualRuleDTO {
  return {
    name: datatype.string(),
    match_type: 0,
    order_number: datatype.number(),
    is_enable: 1,
    apply_all: 1,
    account_id: 0,
    conditions: [
      {
        "condition": 1,
        "operator": 2,
        "value": "example" // string
      }
    ],
    destinations: [
      {
        "action": 1,
        "value": "",
        "collection_id": datatype.number(),
      }
    ],
    ref: 'dusi9w3kjeksjs'
  };
}

export function fakeExecuteDTO(): ExecuteManualRuleDTO {
  const uid = new EmailObjectId({
    uid: datatype.number(),
    path: "inbox"
  });
  return {
    uid,
    username: "trungdv3@flodev.net",
    collection_id: datatype.number(),
    action: 60,
    value: "inbox",
    ref: 'dusi9w3kjeksjs'
  };
}

export function fakeUpdatedDTO(): UpdateManualRuleDTO {
  return {
    id: datatype.number(),
    name: datatype.string(),
    match_type: 0,
    order_number: datatype.number(),
    account_id: 0,
    is_enable: 1,
    apply_all: 1,
    conditions: [
      {
        "condition": 1,
        "operator": 2,
        "value": "example" // string
      }
    ],
    destinations: [
      {
        "action": 1,
        "value": "",
        "collection_id": datatype.number(),
      }
    ],
  };
}