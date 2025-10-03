
export const SIEVE_SCRIPT_NAME = ["active", "keep"];
export const DESTINATION_PATTERN = 'destinationPattern conditionEndPattern';
export const CONDITION_PATTERN = 'conditionStartPattern destinationPattern conditionEndPattern';
export const CONDITION_END_PATTERN = ' stop;';
export const CONDITION_BLANK_PATTERN = ' ';
export const CONDITION_KEEP_PATTERN = ' keep;';

export const SIEVE_MATCH_TYPE = {
  All: 'allof',
  Any: 'anyof'
};

export enum SIEVE_OPERATOR_RULE {
  regex = 1, // contains
  is = 3,
  _starts_with = 9,
  _ends_with = 10,
}

export enum SIEVE_MATCH_OPERATOR_RULE {
  regex = 'regex',
  contains = 'contains',
  starts_with = 'matches',
  ends_with = 'matches'
}

export enum SIEVE_CONDITION {
  Subject = 1,
  From = 2,
  Body = 3,
  Date = 4,
  Priority = 5,
  Status = 6,
  To = 7,
  Cc = 8
}

export enum SIEVE_ACTION_WEIGHT {
  add_to_collection = 1,
  add_to_collection_with_imap_folder = 1,
  move_to_folder = 998,
  move_to_collection = 998,
  move_to_trash = 999,
}

export enum SIEVE_ACTION {
  move_to_folder = 'fileinto :create "{{rule_value}}";',
  move_to_collection = 'addheader "Flo-Manual-Rule-Move-Collection-Id" "{{rule_collection}}"; fileinto :create "{{rule_file_path}}";',
  move_to_trash = 'addheader "Flo-Manual-Rule-Move-Trash-Collection" ""; fileinto :create "Trash";',
  add_to_collection = 'addheader "Flo-Manual-Rule-Add-Collection-Id" "{{rule_collection}}";',
  add_to_collection_with_imap_folder = 'addheader "Flo-Manual-Rule-Add-Collection-Id" "{{rule_collection}}"; fileinto :create "{{rule_file_path}}";',
}

export enum SIEVE_LIBS {
  init = 'require ["copy","mailbox","fileinto","regex","editheader"];'
}

export const INBOX = 'INBOX';