# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2018_12_28_031251) do

  create_table "accounts_config", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "uid", limit: 150
    t.string "password", limit: 150
    t.string "email", limit: 150
    t.string "refreshToken"
    t.string "accessToken"
    t.integer "expire_time", null: false
    t.string "server_address"
    t.integer "con_type", default: 1, comment: "1: Login via Oauth2 Account"
    t.index ["email"], name: "email_UNIQUE", unique: true
  end

  create_table "ad_setting_subs", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "notice_by_email", default: 1, null: false
    t.integer "notice_by_push", default: 0, null: false
  end

  create_table "addressbookchanges", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "uri", collation: "utf8mb4_unicode_ci"
    t.integer "synctoken", null: false, unsigned: true
    t.integer "addressbookid", null: false, unsigned: true
    t.boolean "operation", null: false
    t.index ["addressbookid", "synctoken"], name: "addressbookid_synctoken"
  end

  create_table "addressbooks", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "principaluri"
    t.string "displayname"
    t.string "uri", limit: 200
    t.text "description"
    t.integer "synctoken", default: 1, null: false, unsigned: true
    t.index ["principaluri", "uri"], name: "principaluri", length: { principaluri: 100 }
  end

  create_table "admin", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "verify_code", default: "", null: false
    t.integer "time_code_expire", default: 0, null: false
  end

  create_table "admin_promotions", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "allow_pre_signup", default: 0, null: false
    t.string "description", default: "", null: false
  end

  create_table "app_register", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "app_regId", default: "", null: false
    t.string "app_alias", default: "", null: false
    t.integer "created_date", default: 0, null: false
    t.integer "updated_date", default: 0, null: false
    t.string "email_register", default: "", null: false
    t.string "app_name", default: "", null: false
  end

  create_table "app_token", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "app_pregId", default: "", null: false
    t.string "key_api", default: "", null: false
    t.float "time_expire", limit: 53, default: 0.0, null: false
    t.float "created_time", limit: 53, default: 0.0, null: false
    t.string "token", default: "", null: false
    t.integer "user_id", default: 0, null: false
    t.string "email", default: "", null: false
    t.index ["key_api"], name: "keyapi"
    t.index ["user_id"], name: "user_id"
  end

  create_table "calendarchanges", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "uri", limit: 200, null: false
    t.integer "synctoken", null: false, unsigned: true
    t.integer "calendarid", null: false, unsigned: true
    t.boolean "operation", null: false
    t.index ["calendarid", "synctoken"], name: "calendarid_synctoken"
  end

  create_table "calendarobjects", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.text "calendardata", limit: 4294967295, collation: "utf8_unicode_ci"
    t.binary "uri", limit: 200
    t.integer "calendarid", null: false, unsigned: true
    t.integer "lastmodified", unsigned: true
    t.binary "etag", limit: 32
    t.integer "size", null: false, unsigned: true
    t.binary "componenttype", limit: 255
    t.integer "firstoccurence", unsigned: true
    t.integer "lastoccurence", unsigned: true
    t.string "uid", limit: 200, collation: "utf8_unicode_ci"
    t.integer "invisible", default: 0, null: false
    t.index ["calendardata"], name: "calendardata", type: :fulltext
    t.index ["calendarid", "uri"], name: "calendarid"
    t.index ["uri"], name: "uri"
  end

  create_table "calendars", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.binary "principaluri", limit: 100
    t.string "displayname", limit: 100
    t.binary "uri", limit: 200
    t.integer "synctoken", default: 1, null: false, unsigned: true
    t.text "description"
    t.integer "calendarorder", default: 0, null: false, unsigned: true
    t.binary "calendarcolor", limit: 10
    t.text "timezone"
    t.binary "components", limit: 255
    t.boolean "transparent", default: false, null: false
    t.integer "invisible", default: 0, null: false
    t.index ["principaluri"], name: "principaluri"
    t.index ["uri"], name: "uri"
  end

  create_table "calendarsubscriptions", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "uri", limit: 200, null: false
    t.string "principaluri", limit: 100, null: false
    t.text "source"
    t.string "displayname", limit: 100
    t.string "refreshrate", limit: 10
    t.integer "calendarorder", default: 0, null: false, unsigned: true
    t.string "calendarcolor", limit: 10
    t.boolean "striptodos"
    t.boolean "stripalarms"
    t.boolean "stripattachments"
    t.integer "lastmodified", unsigned: true
    t.index ["principaluri", "uri"], name: "principaluri", unique: true
  end

  create_table "canvas_detail", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "latin1_swedish_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.float "created_date", limit: 53
    t.float "updated_date", limit: 53
    t.integer "collection_id", default: 0, null: false
    t.integer "item_card_order", default: 0
    t.string "item_id", default: ""
    t.string "item_type", default: ""
    t.integer "kanban_id", default: 0, null: false
    t.integer "source_account", default: 0, null: false
    t.integer "order_number", default: 0, null: false
    t.float "order_update_time", limit: 53, default: 0.0, null: false
  end

  create_table "cards", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "addressbookid", null: false, unsigned: true
    t.text "carddata", limit: 4294967295, collation: "utf8_general_ci"
    t.string "uri", limit: 200
    t.integer "lastmodified", unsigned: true
    t.binary "etag", limit: 32
    t.integer "size", null: false, unsigned: true
    t.index ["addressbookid"], name: "addressbookid"
    t.index ["carddata"], name: "carddata", type: :fulltext
    t.index ["uri"], name: "uri"
  end

  create_table "cloud_storages", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.text "real_filename"
    t.text "ext"
    t.float "created_date", limit: 53
    t.float "updated_date", limit: 53
    t.text "device_uid", null: false
    t.integer "size", default: 0, null: false
    t.integer "upload_status", default: 0, null: false
    t.text "bookmark_data", null: false
    t.text "uid_filename", null: false
  end

  create_table "collection_criteria_history", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.integer "project_id", default: 0, null: false
    t.string "object_type", default: "", null: false
    t.integer "criteria_type", default: 0, null: false
    t.text "criteria_value"
    t.integer "created_date", default: 0, null: false
    t.string "criteria_action_group", default: "", null: false
  end

  create_table "collections", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "collection_name", default: "", null: false
    t.integer "created_date", default: 0, null: false
    t.integer "updated_date", default: 0, null: false
    t.integer "user_id", default: 0, null: false
    t.integer "parent_id", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.integer "order_number", default: 0, null: false
  end

  create_table "config_push_silent", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "show_sound", default: "default", null: false
    t.string "show_alert", default: "Hello Flo User", null: false
    t.integer "has_alert", default: 0, null: false
    t.integer "interval_stop_push", default: 3600, null: false
  end

  create_table "criterions", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "criterion_type", default: 0, null: false
    t.string "name", limit: 100, default: "", null: false
    t.integer "point", default: 0, null: false
    t.integer "priority", default: 1, null: false
  end

  create_table "deleted_items", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "latin1_swedish_ci", force: :cascade do |t|
    t.string "item_type", default: ""
    t.string "item_id", default: ""
    t.float "created_date", limit: 53, default: 0.0
    t.float "updated_date", limit: 53, default: 0.0
    t.integer "user_id", default: 0
    t.integer "is_recovery", default: 0, null: false
  end

  create_table "device_token", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "latin1_swedish_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.string "device_token", default: "", null: false
    t.integer "created_date", default: 0, null: false
    t.integer "updated_date", default: 0, null: false
    t.integer "device_type", default: 0, null: false
    t.string "device_uuid", default: "", null: false
    t.integer "cert_env", default: 0
    t.integer "time_sent_silent", default: 0, null: false
    t.integer "time_received_silent", default: 0, null: false
    t.integer "status_app_run", default: 0, null: false
    t.integer "env_silent", default: 0, null: false
    t.integer "device_env", default: 0, null: false
  end

  create_table "doc_assets", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.blob "bookmark", limit: 255, null: false
    t.string "name", default: "", null: false
    t.integer "source_type", default: 0, null: false
    t.string "url", limit: 500, default: "", null: false
    t.integer "device_id", default: 0, null: false
    t.integer "created_date", default: 0, null: false
    t.integer "updated_date", default: 0, null: false
    t.integer "user_id", default: 0, null: false
  end

  create_table "email_filing", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "project_id"
    t.integer "account_id"
    t.integer "priority", default: 0
    t.integer "user_id", unsigned: true
    t.text "email_subject"
    t.integer "frequency_used", default: 0
    t.index ["project_id"], name: "FK_Project"
    t.index ["user_id"], name: "FK_User"
  end

  create_table "files", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "uid", default: "", null: false
    t.text "local_path", null: false
    t.text "url", null: false
    t.integer "source", default: 0, null: false
    t.text "filename", null: false
    t.string "ext", default: "", null: false
    t.integer "user_id", default: 0, null: false
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.string "obj_id"
    t.string "obj_type"
    t.string "client_id", default: "", null: false
    t.bigint "size", default: 0, null: false
  end

  create_table "groupmembers", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "principal_id", null: false, unsigned: true
    t.integer "member_id", null: false, unsigned: true
    t.index ["principal_id", "member_id"], name: "principal_id", unique: true
  end

  create_table "groups", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "name"
    t.integer "created_date"
    t.integer "updated_date"
    t.text "description"
    t.index ["name"], name: "name"
  end

  create_table "groups_users", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "user_id"
    t.integer "group_id"
    t.integer "created_date"
    t.integer "updated_date"
    t.index ["user_id", "group_id"], name: "user_group"
  end

  create_table "history", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.string "source_id", default: "", null: false, collation: "utf8_unicode_ci"
    t.string "source_type", limit: 50, default: "", collation: "utf8_unicode_ci"
    t.string "obj_id", default: "", collation: "utf8_unicode_ci"
    t.string "obj_type", limit: 50, default: "", null: false, collation: "utf8_unicode_ci"
    t.integer "action", default: 0, null: false
    t.text "action_data", collation: "utf8mb4_unicode_ci"
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.string "path", default: "", null: false, collation: "utf8_unicode_ci"
    t.integer "source_account", default: 0, null: false
    t.integer "destination_account", default: 0, null: false
    t.string "source_root_uid", limit: 500, default: "", null: false, collation: "utf8_unicode_ci"
    t.string "destination_root_uid", limit: 500, default: "", null: false, collation: "utf8_unicode_ci"
  end

  create_table "identical_senders", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "suggested_collection_id"
    t.integer "user_id", null: false
    t.string "email_address", limit: 320, collation: "utf8_general_ci"
    t.integer "filing_id"
  end

  create_table "import_contact", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "latin1_swedish_ci", force: :cascade do |t|
    t.string "file_name", default: ""
    t.integer "user_id", default: 0
    t.integer "created_date", default: 0, null: false
    t.integer "updated_date", default: 0, null: false
    t.integer "file_size", default: 0, null: false
    t.integer "last_modify", default: 0, null: false
  end

  create_table "kanbans", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.string "name", limit: 5000, default: ""
    t.float "updated_date", limit: 53
    t.float "created_date", limit: 53
    t.integer "project_id", default: 0, null: false
    t.string "color", limit: 100, default: "", null: false
    t.integer "order_number", default: 0, null: false
    t.integer "archive_status", default: 0
    t.text "order_kbitem", null: false
    t.float "order_update_time", limit: 53, default: 0.0, null: false
    t.integer "show_done_todo", default: 1, null: false
    t.integer "add_new_obj_type", default: 0, null: false
    t.integer "sort_by_type", default: 0, null: false
    t.float "archived_time", limit: 53, default: 0.0
    t.integer "kanban_type", default: 0, null: false
  end

  create_table "links", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "source_type", limit: 100, default: ""
    t.string "destination_type", limit: 100, default: ""
    t.integer "user_id", default: 0
    t.string "source_account", default: ""
    t.string "destination_account", default: ""
    t.string "source_id", limit: 9000
    t.string "destination_id", limit: 9000
    t.float "created_date", limit: 53, default: 0.0
    t.float "updated_date", limit: 53, default: 0.0
    t.string "email", default: ""
    t.integer "belongto", default: 1, null: false
    t.string "source_root_uid", limit: 500, default: "", null: false
    t.string "destination_root_uid", limit: 500, default: "", null: false
    t.text "meta_data"
    t.index ["destination_id"], name: "destination_id", length: 255
    t.index ["source_id"], name: "source_id", length: 255
    t.index ["user_id"], name: "user_id"
  end

  create_table "local_settings", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.text "setting", null: false, collation: "utf8_general_ci"
    t.text "device_uid", null: false, collation: "utf8_general_ci"
    t.integer "app_register_id", default: 0, null: false
    t.string "build_version", limit: 500, default: "", null: false, collation: "utf8_general_ci"
    t.float "created_date", limit: 53
    t.float "updated_date", limit: 53
  end

  create_table "locks", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "owner", limit: 100
    t.integer "timeout", unsigned: true
    t.integer "created"
    t.binary "token", limit: 100
    t.integer "scope", limit: 1
    t.integer "depth", limit: 1
    t.binary "uri", limit: 1000
    t.index ["token"], name: "token"
    t.index ["uri"], name: "uri", length: 100
  end

  create_table "obj_collection", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "latin1_swedish_ci", force: :cascade do |t|
    t.string "obj_id"
    t.string "obj_type", limit: 20, default: ""
    t.integer "collection_id"
    t.integer "created_date"
    t.integer "updated_date"
    t.integer "user_id", default: 0, null: false
  end

  create_table "obj_order", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "latin1_swedish_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.string "obj_id", default: "", null: false
    t.string "obj_type", limit: 50, default: "", null: false
    t.integer "order_number", default: 0, null: false
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.integer "source_account", default: 0, null: false
  end

  create_table "principals", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "uri", limit: 200, null: false
    t.string "email", limit: 80
    t.string "displayname", limit: 80
    t.string "vcardurl"
    t.index ["uri"], name: "uri", unique: true
  end

  create_table "projects", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "proj_name", default: "", null: false, collation: "utf8mb4_unicode_ci"
    t.string "proj_color", default: ""
    t.float "created_date", limit: 53, default: 0.0
    t.float "updated_date", limit: 53, default: 0.0
    t.integer "user_id", default: 0
    t.string "calendar_id", default: "0"
    t.integer "parent_id", default: 0
    t.float "due_date", limit: 53, default: 0.0
    t.integer "flag", default: 0, null: false
    t.integer "proj_type", default: 0, null: false
    t.integer "info_card_order", default: 0, null: false
    t.integer "current_mode", default: 0, null: false
    t.integer "is_hide", default: 0, null: false
    t.text "alerts", limit: 4294967295, null: false
    t.integer "state", default: 1
    t.float "recent_time", limit: 53, default: 0.0, null: false
    t.integer "is_expand", default: 0, null: false
    t.text "order_storyboard", null: false
    t.text "order_kanban", null: false
    t.integer "view_mode", default: 0, null: false
    t.integer "view_sort", default: 0, null: false
    t.integer "kanban_mode", default: 0
    t.index ["proj_name"], name: "proj_name", type: :fulltext
  end

  create_table "projects_cards", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "project_id"
    t.string "card_uid"
    t.string "href"
    t.integer "set_account_id", default: 0
    t.decimal "created_date", precision: 13, scale: 3
    t.decimal "updated_date", precision: 13, scale: 3
    t.index ["project_id"], name: "index_projects_cards_on_project_id"
    t.index ["set_account_id"], name: "index_projects_cards_on_set_account_id"
  end

  create_table "projects_users", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "project_id"
    t.integer "user_id"
    t.integer "status", default: 0
    t.integer "permission", default: 0
    t.decimal "created_date", precision: 13, scale: 3
    t.decimal "updated_date", precision: 13, scale: 3
    t.string "card_uri"
    t.integer "is_hide", default: 0
    t.index ["project_id"], name: "index_projects_users_on_project_id"
    t.index ["user_id"], name: "index_projects_users_on_user_id"
  end

  create_table "propertystorage", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.binary "path", limit: 1024, null: false
    t.binary "name", limit: 100, null: false
    t.binary "value", limit: 16777215
    t.index ["path", "name"], name: "path_property", unique: true, length: { path: 600 }
  end

  create_table "push_noti_queue", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.text "message"
    t.string "email", default: "", null: false
  end

  create_table "quota", primary_key: "username", id: :string, limit: 100, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.bigint "bytes", default: 0, null: false
    t.integer "messages", default: 0, null: false
    t.bigint "cal_bytes", default: 0, null: false
    t.bigint "card_bytes", default: 0, null: false
    t.bigint "file_bytes", default: 0, null: false
    t.integer "num_sent", default: 0, null: false
    t.bigint "qa_bytes", default: 0, null: false
  end

  create_table "recent_objects", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "user_id"
    t.string "dav_type"
    t.string "uid"
    t.integer "state", default: 0
    t.decimal "created_date", precision: 13, scale: 3
    t.decimal "updated_date", precision: 13, scale: 3
    t.index ["user_id", "uid", "updated_date"], name: "index_recent_objects_on_user_id_and_uid_and_updated_date", length: { uid: 191 }
  end

  create_table "restricted_users", id: false, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.string "name", limit: 50, default: "", null: false
    t.integer "type_matcher", default: 0
    t.index ["name"], name: "name", unique: true
  end

  create_table "schedulingobjects", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "principaluri"
    t.binary "calendardata", limit: 16777215
    t.string "uri", limit: 200
    t.integer "lastmodified", unsigned: true
    t.string "etag", limit: 32
    t.integer "size", null: false, unsigned: true
  end

  create_table "send_mail", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "to_email", default: "", null: false
    t.string "subject", default: "", null: false
    t.string "template", default: "", null: false
    t.integer "percent", default: 0, null: false
    t.string "upgradeTo", default: "", null: false
    t.string "expired", default: "", null: false
  end

  create_table "sent_mails", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.text "message_id"
    t.integer "predicted_next_uid"
    t.text "email_subject"
    t.text "link_item_id"
    t.integer "filing_item_id"
    t.integer "tracking_period"
    t.integer "sending_status"
    t.text "account"
  end

  create_table "set_accounts", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.string "server_income", default: "", null: false
    t.string "user_income", default: "", null: false
    t.string "pass_income", default: "", null: false
    t.string "port_income", default: "", null: false
    t.integer "useSSL_income", default: 0
    t.integer "type_income", default: 0
    t.string "server_smtp", default: ""
    t.string "user_smtp", default: ""
    t.string "pass_smtp", default: ""
    t.string "port_smtp", default: ""
    t.integer "useSSL_smtp", default: 0, null: false
    t.integer "auth_type_smtp", default: 0, null: false
    t.string "server_caldav", default: ""
    t.string "server_path_caldav", default: ""
    t.string "port_caldav", default: ""
    t.integer "useSSL_caldav", default: 0
    t.integer "useKerberos_caldav", default: 0
    t.integer "auth_type", default: 0
    t.integer "account_type", default: 0
    t.string "account_sync", default: ""
    t.string "auth_key", limit: 500, default: ""
    t.string "auth_token", limit: 500, default: ""
    t.string "full_name", default: ""
    t.string "description", default: ""
    t.string "refresh_token", limit: 1000, default: "", null: false
    t.string "provider", default: ""
    t.string "icloud_user_id", default: "", null: false
    t.string "user_caldav", default: "", null: false
    t.string "email_address"
    t.integer "token_expire", default: 0
    t.integer "activated_push", default: 0, null: false
    t.text "signature", null: false
    t.index ["user_id"], name: "user_id"
    t.index ["user_income"], name: "user_income", type: :fulltext
  end

  create_table "settings", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.float "created_date", limit: 53
    t.float "updated_date", limit: 53
    t.string "default_cal", default: "", null: false
    t.string "timezone", default: "America/Chicago", null: false
    t.string "tz_city"
    t.string "working_time", limit: 5000, default: "", null: false
    t.integer "event_duration", default: 0, null: false
    t.integer "alert_default", default: 0, null: false
    t.integer "snooze_default", default: 15, null: false
    t.integer "timezone_support", limit: 1, default: 0, null: false
    t.integer "task_duration", default: 0, null: false
    t.integer "deadline", default: 0, null: false
    t.integer "due_task", default: 0, null: false
    t.integer "number_stask", default: 0, null: false
    t.integer "total_duration", default: 0, null: false
    t.integer "buffer_time", default: 0, null: false
    t.integer "hide_stask", limit: 1, default: 0, null: false
    t.integer "background", default: 0, null: false
    t.integer "short_duration", default: 30, null: false
    t.integer "medium_duration", default: 60, null: false
    t.integer "long_duration", default: 180, null: false
    t.integer "default_folder", default: 0, null: false
    t.string "calendar_color", limit: 50, default: "", null: false
    t.string "folder_color", limit: 50, default: "", null: false
    t.text "navbar_system", null: false
    t.text "navbar_custom", null: false
    t.text "infobox", null: false
    t.string "infobox_order", limit: 5000, default: "[{\"type\":\"event\", \"order\":1},{\"type\":\"todo\", \"order\":2},{\"type\":\"note\", \"order\":3},{\"type\":\"email\", \"order\":4}]", null: false
    t.integer "contact_display_name", default: 0, null: false
    t.integer "contact_display_inlist", default: 0, null: false
    t.integer "m_ade", limit: 1, default: 1, null: false
    t.integer "m_event", limit: 1, default: 1, null: false
    t.integer "m_task", limit: 1, default: 1, null: false
    t.integer "m_stask", limit: 1, default: 1, null: false
    t.integer "m_done_task", limit: 1, default: 1, null: false
    t.integer "m_due_task", limit: 1, default: 1, null: false
    t.integer "m_note", limit: 1, default: 1, null: false
    t.integer "dw_due_task", limit: 1, default: 1, null: false
    t.integer "dw_ade", limit: 1, default: 1, null: false
    t.integer "dw_done_task", limit: 1, default: 1, null: false
    t.integer "dw_note", limit: 1, default: 1, null: false
    t.integer "del_warning", limit: 1, default: 1, null: false
    t.integer "hide_future_task", limit: 1, default: 0, null: false
    t.integer "ics_attachment", limit: 1, default: 1, null: false
    t.integer "mail_auto_download_check", default: 0, null: false
    t.integer "mail_num_time_dont_auto_download", default: 6, null: false
    t.integer "mail_time_dont_auto_download", default: 1, null: false
    t.integer "mail_display_act_button", default: 0, null: false
    t.integer "number_mail_lines_preview", default: 4, null: false
    t.integer "mail_moving_check", default: 1, null: false
    t.integer "mail_size_dont_download", default: 10, null: false
    t.integer "show_nutshell", limit: 1, default: 1, null: false
    t.integer "show_bg_by_weather", limit: 1, default: 0, null: false
    t.integer "week_start", default: 0, null: false
    t.integer "send_and_track", default: 2, null: false
    t.integer "action_icon", default: 0, null: false
    t.string "emailbox_order", limit: 5000, default: "[{\"type\":\"mail\", \"order\":1, \"show\":1},{\"type\":\"contact\", \"order\":2, \"show\":1}]", null: false
    t.integer "alert_before", default: 60, null: false
    t.integer "send_invite", limit: 1, default: 0, null: false
    t.string "from_email", default: "", null: false
    t.integer "default_ade_alert", default: 0
    t.integer "default_todo_alert", default: 0
    t.integer "default_milestone_alert", default: 0
    t.text "avatar", null: false
    t.integer "assign_tz_eve", limit: 1, default: 1, null: false
    t.integer "m_show", default: 0, null: false
    t.integer "dw_show", default: 0, null: false
    t.integer "move_email", default: 1, null: false
    t.integer "noti_bear_track", default: 0, null: false
    t.integer "state", default: 0, null: false
    t.text "recent_tz"
    t.text "order_url", limit: 16777215
    t.text "order_todo", limit: 16777215
    t.text "keep_state", collation: "utf8mb4_unicode_ci"
    t.string "omni_cal_id", limit: 500, default: "", null: false
    t.integer "url_option", default: 0, null: false
    t.integer "init_planner_st", default: 0, null: false
    t.text "order_storyboard", limit: 16777215
    t.integer "show_star", default: 0, null: false
    t.text "signature", null: false
    t.integer "filing_email", default: 0
  end

  create_table "subscription_components", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name", default: "", null: false
    t.integer "comp_type", default: 1, null: false
  end

  create_table "subscription_details", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "subID", default: "", null: false
    t.integer "comID", default: 0, null: false
    t.integer "sub_value", default: 0, null: false
    t.string "description", default: "", null: false
  end

  create_table "subscription_features", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name", default: "", null: false
    t.integer "feature_type", default: 0, null: false
  end

  create_table "subscription_purchase", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.string "subID", default: "", null: false
    t.string "description", limit: 500, default: "", null: false
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.integer "purchase_type", default: 0, null: false
    t.integer "purchase_status", default: 1, null: false
    t.string "transaction_id", limit: 500, default: "", null: false
    t.text "receipt_data", null: false
    t.integer "is_current", default: 0, null: false
    t.index ["user_id", "is_current", "subID"], name: "user_id"
  end

  create_table "subscriptions", id: :string, default: "", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "name", default: "", null: false
    t.float "price", default: 0.0, null: false
    t.integer "period", default: 0, null: false
    t.integer "auto_renew", default: 0, null: false
    t.string "description", default: "", null: false
    t.integer "subs_type", default: 0, null: false
    t.integer "order_number", default: 1, null: false
  end

  create_table "suggested_collections", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "project_id", default: 0, null: false
    t.integer "criterion_type", default: 0
    t.integer "user_id", default: 0, null: false
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.text "criterion_value"
    t.integer "frequency_used", default: 0, null: false
  end

  create_table "tracking", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "utf8mb4_unicode_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.string "message_id", default: "", null: false
    t.string "path", default: "", null: false
    t.string "emails", limit: 9000, default: "", null: false
    t.float "time_send", limit: 53, default: 0.0, null: false
    t.integer "time_tracking", default: 0, null: false
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.string "subject", limit: 2000, default: "", null: false
    t.string "uid", default: "", null: false
    t.integer "acc_id", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.float "replied_time", limit: 53, default: 0.0
  end

  create_table "tracking_apps", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "name"
    t.string "app_version"
    t.string "flo_version"
    t.integer "created_date"
    t.integer "updated_date"
    t.string "build_number", limit: 45
    t.index ["name", "app_version"], name: "name"
  end

  create_table "trash", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "latin1_swedish_ci", force: :cascade do |t|
    t.integer "user_id", default: 0, null: false
    t.text "obj_id"
    t.string "obj_type", limit: 20, null: false
    t.integer "sync_token", default: 0
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.integer "status", default: 1, null: false
    t.float "trash_time", limit: 53, default: 0.0, null: false
  end

  create_table "trash_change", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT", comment: "latin1_swedish_ci", force: :cascade do |t|
    t.integer "sync_token", default: 0
    t.integer "user_id", default: 0
    t.integer "created_date", default: 0
    t.integer "updated_date", default: 0
  end

  create_table "urls", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.text "url"
    t.integer "user_id", default: 0, null: false
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.text "title"
    t.integer "order_number", default: 0, null: false
    t.float "order_update_time", limit: 53, default: 0.0, null: false
    t.index ["title"], name: "title", type: :fulltext
    t.index ["url"], name: "url", type: :fulltext
  end

  create_table "users", id: :integer, unsigned: true, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "username"
    t.string "digesta1", limit: 32
    t.integer "domain_id", default: 0, null: false
    t.string "email", default: "", null: false
    t.string "password", limit: 150, default: "", null: false
    t.float "created_date", limit: 53, default: 0.0, null: false
    t.float "updated_date", limit: 53, default: 0.0, null: false
    t.string "appreg_id", default: "", null: false
    t.string "fullname", default: "", null: false
    t.text "rsa", null: false
    t.string "description", limit: 500, default: "", null: false
    t.string "secondary_email", default: "", null: false
    t.string "birthday", default: "", null: false
    t.integer "gender", default: 0, null: false
    t.string "country", default: "", null: false
    t.string "phone_number", default: "", null: false
    t.string "country_code", limit: 25, default: "", null: false
    t.string "token", limit: 500, default: "", null: false
    t.float "token_expire", limit: 53, default: 0.0, null: false
    t.text "question"
    t.text "answer"
    t.integer "active_sec_email", default: 0, null: false
    t.integer "max_uid", default: 0, null: false
    t.integer "activated_push", default: 0, null: false
    t.bigint "quota_limit_bytes", default: 0, null: false
    t.integer "disabled", default: 0, null: false
    t.index ["domain_id"], name: "domain_id"
    t.index ["email"], name: "email"
    t.index ["username"], name: "username", unique: true
    t.index ["username"], name: "username2", type: :fulltext
  end

  create_table "users_internal", id: :integer, default: nil, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", comment: "utf8_unicode_ci", force: :cascade do |t|
    t.string "email", default: "", null: false
  end

  create_table "users_tracking_apps", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "user_id"
    t.integer "tracking_app_id"
    t.integer "last_used_date"
    t.integer "created_date"
    t.integer "updated_date"
    t.index ["user_id", "tracking_app_id"], name: "user_id"
  end

  create_table "virtual_aliases", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.integer "domain_id", null: false
    t.string "source", limit: 100, null: false
    t.string "destination", limit: 100, null: false
    t.index ["domain_id"], name: "domain_id"
  end

  create_table "virtual_domains", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT", force: :cascade do |t|
    t.string "name", limit: 50, null: false
  end

end
