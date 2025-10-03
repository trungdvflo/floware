
export const MAIL_FOLDER = {
  OMNI: 'Omni',
};

export const MATCH_TYPE = {
  All: 0,
  Any: 1
};

export const MANUAL_RULE_STATUS = {
  Disabled: 0,
  Enabled: 1
};

export enum ACTION_MANUAL_RULE {
  move_to_folder = 1,
  priority_highest = 0,
  priority_high = 1,
  priority_normal = 2,
  forward_mail = 3,
  copy_mail = 4,
  delete_mail = 5,
  move_to_collection = 60,
  add_to_collection = 61,
  move_to_trash = 62,
}

export enum ACTION_FLO_RULE {
  move_to_collection = 60,
  add_to_collection = 61,
  move_to_trash = 62,
}

export enum CONDITION_MANUAL_RULE {
  Subject = 1,
  From = 2,
  Body = 3,
  Date = 4,
  Priority = 5,
  Status = 6,
  To = 7,
  Cc = 8
}

export enum OPERATOR_MANUAL_RULE {
  _contains = 1,
  _not_contain = 2,
  _is = 3,
  is_not = 4,
  is_empty = 5,
  is_not_empty = 6,
  is_less_than = 7,
  is_greater_than = 8
}

export const PRIORITY_VALUE = ['0', '1', '2'];

export const OPERATOR_SUBJECT = [
  OPERATOR_MANUAL_RULE._contains,
  OPERATOR_MANUAL_RULE._not_contain,
  OPERATOR_MANUAL_RULE._is,
  OPERATOR_MANUAL_RULE.is_not,
  OPERATOR_MANUAL_RULE.is_empty,
  OPERATOR_MANUAL_RULE.is_not_empty,
];

export const OPERATOR_FROM = [
  OPERATOR_MANUAL_RULE._contains,
  OPERATOR_MANUAL_RULE._not_contain,
  OPERATOR_MANUAL_RULE._is,
  OPERATOR_MANUAL_RULE.is_not,
  OPERATOR_MANUAL_RULE.is_empty,
  OPERATOR_MANUAL_RULE.is_not_empty,
];

export const OPERATOR_PRIORITY = [
  OPERATOR_MANUAL_RULE._contains,
  OPERATOR_MANUAL_RULE._not_contain,
  OPERATOR_MANUAL_RULE._is,
  OPERATOR_MANUAL_RULE.is_not,
  OPERATOR_MANUAL_RULE.is_empty,
  OPERATOR_MANUAL_RULE.is_not_empty,
];

export const OPERATOR_TO = [
  OPERATOR_MANUAL_RULE._contains,
  OPERATOR_MANUAL_RULE._not_contain,
  OPERATOR_MANUAL_RULE._is,
  OPERATOR_MANUAL_RULE.is_not,
  OPERATOR_MANUAL_RULE.is_empty,
  OPERATOR_MANUAL_RULE.is_not_empty,
];

export const OPERATOR_CC = [
  OPERATOR_MANUAL_RULE._contains,
  OPERATOR_MANUAL_RULE._not_contain,
  OPERATOR_MANUAL_RULE._is,
  OPERATOR_MANUAL_RULE.is_not,
  OPERATOR_MANUAL_RULE.is_empty,
  OPERATOR_MANUAL_RULE.is_not_empty,
];

export const OPERATOR_BODY = [
  OPERATOR_MANUAL_RULE._contains,
  OPERATOR_MANUAL_RULE._not_contain,
  OPERATOR_MANUAL_RULE._is,
  OPERATOR_MANUAL_RULE.is_not
];

export const OPERATOR_DATE = [
  OPERATOR_MANUAL_RULE._is,
  OPERATOR_MANUAL_RULE.is_greater_than,
  OPERATOR_MANUAL_RULE.is_less_than,
];

export const OPERATOR_STATUS = [
  OPERATOR_MANUAL_RULE._is,
  OPERATOR_MANUAL_RULE.is_not
];

export const OPERATOR_CONTAIN_TYPE = {
  DEFAULT: 0,
  WILDCARD: 1,
  START_WITH: 2,
  END_WITH: 3,
};

export const VALIDATE_CONTAINS_WILDCARD_RULE_CONDITION = /(\*{2,}|(\*.+\*.+))/g;
// match case: *@domain.abc.xyz...
export const VALIDATE_IS_WILDCARD_RULE_CONDITION = /^(\*@){1}(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/g;

export const FIND_END_WITH_CONDITION = /(^\*)/g;
export const FIND_START_WITH_CONDITION = /(\*$)/g;
export const FIND_CONTAIN_CONDITION = /(^\*.+\*$)/g;

export const REGEX_OPERATOR_BOUNDARY = '\\\\b';
export const REGEX_START_WORD = '(^|\\\\s)';
export const REGEX_END_WORD = '($|\\\\s)';