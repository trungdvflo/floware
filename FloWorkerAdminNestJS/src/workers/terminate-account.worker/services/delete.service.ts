import { getConnection } from 'typeorm';

export class TableNames {
  access_token;
  accounts_config;
  ad_setting_sub;
  addressbookchanges;
  addressbooks;
  // admin;
  // admin_promotion;
  api_last_modified;
  app_register;
  app_token;
  ar_internal_metadata;
  cal_event;
  cal_note;
  cal_todo;
  calendarchanges;
  calendarinstances;
  calendarobjects;
  calendars;
  calendarsubscriptions;
  calling_history;
  card_contact;
  cards;
  cloud;
  collection;
  collection_card;
  collection_criteria_history;
  collection_shared_member;
  collection_system;
  collection_system_user_generated;
  collection_user;
  config;
  config_push_silent;
  contact_avatar;
  contact_history;
  criterion;
  deleted_item;
  device_token;
  doc_asset;
  dynamic_key;
  email_filing;
  email_group;
  email_group_user;
  email_tracking;
  file;
  file_worker;
  filter;
  filter_action;
  filter_action_value;
  filter_condition;
  filter_operator;
  gmail_accesstoken;
  gmail_history;
  group;
  group_user;
  groupmembers;
  identical_sender;
  import_contact;
  kanban;
  kanban_card;
  linked_collection_object;
  linked_object;
  locks;
  meeting_invite;
  metadata_email;
  obj_collection;
  os_version;
  platform_release_push_notification;
  platform_setting;
  principals;
  propertystorage;
  push_change;
  push_noti_queue;
  quota;
  recent_object;
  release;
  release_group;
  release_user;
  report_cached_migrated_platform;
  report_cached_user;
  restricted_user;
  rule;
  rule_filter_action;
  rule_filter_condition;
  schedulingobjects;
  schema_migration;
  send_mail;
  sent_mail;
  setting;
  sort_object;
  subscription;
  subscription_component;
  subscription_detail;
  subscription_feature;
  subscription_purchase;
  suggested_collection;
  third_party_account;
  // timezone;
  tmp_email_setting;
  tracking_app;
  trash_collection;
  url;
  user;
  // user_deleted;
  // user_internal;
  user_platform_version;
  user_release;
  user_tracking_app;
  virtual_alias;
  virtual_domain;
  user_notification;
  collection_notification;
}

export class DeleteService {
  /**
   * Delete from table by user id
   * @param userId
   * @param tableName
   * @returns
   */
  deleteByUserId(userId: number, tableName: keyof TableNames) {
    return getConnection()
    .createQueryBuilder()
    .delete()
    .from(tableName)
    .where("user_id = :userId", { userId })
    .execute();
  }

  /**
   * Delete from table by username
   * @param userName
   * @param tableName
   * @returns
   */
  deleteByUsername(userName: string, tableName: keyof TableNames) {
    return getConnection()
    .createQueryBuilder()
    .delete()
    .from(tableName)
    .where("username = :userName", { userName })
    .execute();
  }
}
