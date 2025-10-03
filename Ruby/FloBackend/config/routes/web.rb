match "*path" => "base#cors_preflight_check", via: [:options]
#user
get "/users/recoverpass" => "users#recover_pass"
# post "/users/verify_recaptcha" => "users#verify_recaptcha"
get "/users/resetpass" => "users#reset_pass"
get "/users/verify" => "users#verify_secondary_email"
get "/users/get_3rd_by_acc" => "users#get_3rd_by_acc"
get "/users/get_floAcc_by_3rd" => "users#get_floAcc_by_3rd"
get "/users/terminate" => "users#terminate"
post "/users/token" => "users#token"

resources :delitems, :except => [:new, :show, :edit]

resources :setaccounts, :except => [:new, :show, :edit]
match '/setaccounts/:id' => 'setaccounts#destroy', via: [:delete]

match '/links/update_ids' => 'links#update_ids', via: [:put]
match '/links/folders' => 'links#folder_ids', via: [:post]
get '/links/get_links_obj' => 'links#get_links_by_obj'
match '/links/uid' => 'links#links_by_uid', via: [:post]
match '/links/uid' => 'links#destroy_by_uid', via: [:delete]
get '/links/search/' => 'links#search_all_objects'
match '/links/count' => 'links#count_link', via: [:post]
get '/get_sorted_calobj_links_by_folder_id' => 'links#get_sorted_calobj_links_by_folder_id'
get '/get_sorted_cardobj_links_by_folder_id' => 'links#get_sorted_cardobj_links_by_folder_id'
get '/get_sorted_url_links_by_folder_id' => 'links#get_sorted_url_links_by_folder_id'
get '/get_email_links_by_folder_id' => 'links#get_email_links_by_folder_id'

resources :links do
  collection do
    delete 'destroy'
    put 'update'
    delete 'del_invalid_and_dup'
    get 'count_rows_invalid_flol_not_email'
    get 'count_rows_invalid_flol_not_email_projs_urls_cards_and_dup'
    get 'count_rows_invalid_flol_not_email_events_todos_notes'
    get 'count_rows_invalid_flol_not_email_events'
    get 'count_rows_invalid_flol_not_email_todos'
    get 'count_rows_invalid_flol_not_email_notes'
    get 'count_rows_invalid_flol_not_email_link_types'
    get 'count_rows_invalid_flol_not_email_src'
    get 'count_rows_invalid_flol_not_email_des'
    get 'rows_invalid_flol_not_email'
    get 'count_rows_invalid_3rd_not_email'
    get 'rows_invalid_3rd_not_email'
    post 'flol_check_mail_link'
    delete 'destroy_all_by_email'
    delete 'destroy_all_by_emails'
  end
end
match '/email_filing/suggest_collections' => 'email_filings#suggest_collections', via: [:post]
match '/email_filing/filing_to_collection' => 'email_filings#filing_to_collection', via: [:post]
match '/email_filing/filing_to_multiple_collections' => 'email_filings#filing_to_multiple_collections', via: [:post]
match '/email_filing/move_to_collection' => 'email_filings#move_to_collection', via: [:post]


resources :calendars, :except => [:new, :show, :edit]
resources :collections, :except => [:new, :show, :edit]
resources :urls, :except => [:new, :show, :edit] do
  collection do
    get 'get_bookmarks_of_col'
  end
end
resources :urlbookmark, :except => [:new, :show, :edit]
resources :docassets, :except => [:new, :show, :edit]
resources :backgrounds, :except => [:new, :show, :edit]
resources :objcollection, :except => [:new, :show, :edit]
resources :trash, :except => [:new, :show, :edit]
resources :appregisters, :except => [:new, :show, :edit]
resources :upload, :except => [:new, :show, :edit]

resources :addressbook, :except => [:new, :show, :edit]
resources :importcontact, :except => [:new, :show, :edit]
resources :kanban, :except => [:new, :show, :edit]
resources :history, :except => [:new, :show, :edit]
post '/history_by_event' => 'history#history_by_event'
put '/update_history_ids' => 'history#update_ids'
post '/delete_histories_by_objects' => 'history#delete_histories_by_objects'
post '/update_history_obj_ids' => 'history#update_obj_ids'

get '/get_histories' => 'history#get_histories'
post '/create_histories' => 'history#create_histories'
post '/delete_histories' => 'history#delete_histories'
post '/update_histories' => 'history#update_histories'

#get order objects
resources :objorder, :except => [:new, :show, :edit]
get '/get_new_order' => 'objorder#get_new_order'
put '/update_v2' => 'objorder#update_v2'

#subscription
resources :subscription, :except => [:show, :edit]

#file
resources :files, :except => [:new, :show, :edit]
post '/files/upload' => 'files#upload'
get '/files/download' => 'files#download'
post '/fileInfo' => 'files#save_file_info'

#caldav api
get "/cals" => "caldav#getlist_calendars"
# get "/cal" => "caldav#get_cal_info"
post "/create_calendar" => "caldav#create_calendar"
put "/cal/:uri" => "caldav#update_calendar"
post "/delete_calendar/:uri" => "caldav#delete_calendar"

#google caldav api
put "/update_google_cal" => "google_caldav#update_calendar"
post "/delete_google_cal" => "google_caldav#delete_calendar"
get "/get_google_cals" => "google_caldav#getlist_calendars"
post "/get_google_cos_by_cal" => "google_caldav#get_calendar_objects_by_calendar_uri"
post "/create_google_co" => "google_caldav#update_calobj_by_ical_str"
post "/delete_google_co" => "google_caldav#delete_calobj"
post "/get_google_cos" => "google_caldav#get_calendar_objects_by_calendars"

#yahoo caldav api
get "/check_yahoo_auth" => "yahoo_caldav#check_auth"
put "/update_yahoo_cal" => "yahoo_caldav#update_calendar"
post "/delete_yahoo_cal" => "yahoo_caldav#delete_calendar"
get "/get_yahoo_cals" => "yahoo_caldav#getlist_calendars"
post "/get_yahoo_cos_by_cal" => "yahoo_caldav#get_calendar_objects_by_calendar_uri"
post "/create_yahoo_co" => "yahoo_caldav#update_calobj_by_ical_str"
post "/delete_yahoo_co" => "yahoo_caldav#delete_calobj"
post "/get_yahoo_cos" => "yahoo_caldav#get_calendar_objects_by_calendars"

#event
get "/events" => "caldav#get_all_events"
get "/event/:uid" => "caldav#get_event"
get "/createEvent" => "caldav#create_a_event_by_string"
get "/event/update/:uuid" => "caldav#update_event_by_strIcalEvent"
post "/send_mi" => "caldav#send_meeting_invite"
#create calendar object

post "/createCalObj" => "caldav#create_calobj_by_string"
post "/deleteCalObj" => "caldav#delete_calendar_obj"
post "/deleteCalObjs" => "caldav#delete_cos"
# get "/getAllItemByCalUri" => "caldav#get_all_items_by_caluri"
post "/calobj" => "caldav#get_calendar_object"

post "/check_change_job", to: "caldav#check_change_job"
post "/check_change_job_status", to: "caldav#check_change_job_status"
post "/check_change_download", to: "caldav#check_change_download"

post "/calobjs" => "caldav#get_calendar_objects"
post "/cd_calobjs" => "caldav#get_all_cos_via_caldav"
# post "/get_calobjs" => "caldav#get_calendar_objects_via_caldav"
# get "/searchcalobjs" => "caldav#search_calendar_objects"
# get "/searchcalobjs_folderid" => "caldav#search_calobjs_by_folderid"
# get "/find_events" => "caldav#find_events_by_range"
# get "/count_objs" => "caldav#count_objs"
get "/search_calobj" => "caldav#search_calobj"

# folder - project
match "/del_all_proj" => "projects#destroy_all", via: [:post]
post "/projects/find_flat_tree" => "projects#find_flat_tree"
# urls object
post "/delurls/:id" => "urls#destroy"
post "/updateurl" => "urls#update"
get "/fetchurl" => "urls#fetch_url"
get "/getimport" => "urls#get_import"
get "/search_url" => "urls#search_url"

#contact - carddav
get "/addressbooks" => "carddav#get_addressbooks"
# match "/contacts" => "carddav#get_contacts" #get contacts by report method (carddav standard)
post "/contacts" => "carddav#get_contacts_by_sql"
# get "/contact_groups" => "carddav#get_contacts_group_by_sql"
post "/avatars" => "carddav#get_avatar_by_uids"
post "/get_contact_groups" => "carddav#get_contact_groups" # get contact groups by report method (carddav standard)
get "/avatar" => "carddav#get_avatar_img_by_uid"
get "/search_contact" => "carddav#search_contact"
post "/get_first_contacts_by_emails" => "carddav#get_first_contacts_by_email_addrs"

post "/createContact" => "carddav#create_contact"
post "/deleteContact" => "carddav#delete_contact"
post "/deleteContacts" => "carddav#delete_contacts"
get "/card/search_contact" => "carddav#search_contact_by_sql"
get "/card/fulltext_search_contact" => "carddav#fulltext_search_contact"
# trash collection
match "/trash" => "trash#destroy", via: [:delete]
# match "/del_trash_cal" => "trash#destroy_cal", via: [:delete]
# match "/restore_trash_cal" => "trash#restore_cal", via: [:delete]
match "/del_all_trash" => "trash#destroy_all", via: [:delete]
match "/restore_all_trash" => "trash#restore_all", via: [:delete]

#icloud

get "/checkicloud" => "icloud#check_auth_with_icloud"
put "/update_icloud_cal" => "icloud#update_calendar"
post "/delete_icloud_cal" => "icloud#delete_calendar"
get "/get_icloud_cals" => "icloud#getlist_calendars"
post "/get_icloud_cos_by_cal" => "icloud#get_calendar_objects_by_calendar_uri"
post "/create_icloud_co" => "icloud#update_calobj_by_ical_str"
post "/delete_icloud_co" => "icloud#delete_calobj"
post "/get_icloud_cos" => "icloud#get_calendar_objects_by_calendars"

#icloud - carddav
get "/get_icloud_addressbooks" => "icloud_carddav#get_addressbooks"
get "/get_icloud_contacts" => "icloud_carddav#get_contacts"
get "/search_icloud_contact" => "icloud_carddav#search_contact_by_emails"
post "/create_icloud_contact" => "icloud_carddav#create_contact"
post "/delete_icloud_contact" => "icloud_carddav#delete_contact"
post "/get_icloud_contacts_by_uris" => "icloud_carddav#get_contacts_by_uris"

#url bookmark
get "/checkOpenURL" => "urlbookmark#checkOpenURL"

#push notifiction for testing
get "/push" => "push#push_noti"
post "/pushpayload" => "push#push_payload"

get "/subs_update" => "push#subs_update"
get "/users_disabled" => "push#users_disabled"

post "/create_calobjs" => "caldav#create_calobjs"

get "/test" => "urlbookmark#testunicode"

resources :recent_objects, :except => [:new, :show, :edit, :update]