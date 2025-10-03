resources :users, :except => [:new, :show, :edit]
post "/users/token" => "users#token"
post "/users/changepass" => "users#change_pass"
get "/users/checkuser" => "users#check_user"
get "/users/islogged" => "users#islogged"
post "/users/verify_recaptcha" => "users#verify_recaptcha"
get "/users/usrtoken" => "users#user_token"
get "/users/resetpass" => "users#reset_pass"
post "/users/checkemail" => "users#check_email"
get "/users/verify" => "users#verify_secondary_email"
get "/users/get_3rd_by_acc" => "users#get_3rd_by_acc"
get "/users/get_floAcc_by_3rd" => "users#get_floAcc_by_3rd"
get "/users/usrterminate" => "users#user_terminate"
get "/users/recoverpass" => "users#recover_pass"
get "/users/terminate" => "users#terminate"
resources :settings, :except => [:new, :show, :edit]

resources :projects, :except => [:new, :show, :edit] do
  collection do
    post 'invite', to: 'projects#invite'
    post 'accept_invite', to: 'projects#accept_invite'
    post 'remove_members', to: 'projects#remove_members'
    get 'members', to: 'projects#members'
    delete '/', to: 'projects#destroy'
    put '/', to: 'projects#update'
    put '/update_personal_setting', to: 'projects#update_personal_setting'
    post "/find_flat_tree" => "projects#find_flat_tree"
  end
end
post "/del_all_proj" => "projects#destroy_all"

resources :delitems, :except => [:new, :show, :edit]
resources :setaccounts, :except => [:new, :show, :edit]
match '/setaccounts/:id' => 'setaccounts#destroy', via: [:delete]

post '/links/folders' => 'links#folder_ids'
get '/links/get_links_obj' => 'links#get_links_by_obj'
delete '/links/uid' => 'links#destroy_by_uid'
match '/links/destroyIds' => 'links#destroy', via: [:delete]
post '/links/uid/:uid' => 'links#links_by_uid'
post '/links/uid/' => 'links#links_by_uid'
get '/links/search/' => 'links#search_all_objects'
get '/get_email_links_by_folder_id' => 'links#get_email_links_by_folder_id'
get '/get_sorted_url_links_by_folder_id' => 'links#get_sorted_url_links_by_folder_id'
get '/get_sorted_calobj_links_by_folder_id' => 'links#get_sorted_calobj_links_by_folder_id'
get '/get_sorted_cardobj_links_by_folder_id' => 'links#get_sorted_cardobj_links_by_folder_id'
post '/links/count' => 'links#count_link'
put '/links/update_ids' => 'links#update_ids'
resources :links do
  collection do
    put '/', to: 'links#update'
    delete '/', to: 'links#destroy'
    get 'shared', to: 'links#shared'
    get 'get_links_group_by_type'
    delete 'destroy_all_by_email'
    delete 'destroy_all_by_emails'
    delete 'del_invalid_and_dup'
    get 'count_rows_invalid_flol_not_email'
    get 'count_rows_invalid_flol_not_email_projs_urls_cards_and_dup'
    get 'count_rows_invalid_flol_not_email_events_todos_notes'
    post 'flol_check_mail_link'
    get 'rows_invalid_3rd_not_email'
  end
end

# resources :links do
  # collection do
    # delete 'destroy'
    # put 'update'
  # end
# end

resources :calendars, :except => [:new, :show, :edit]
resources :collections, :except => [:new, :show, :edit]

resources :canvas do
  collection do
    put '/', to: 'canvas#update'
    delete '/', to: 'canvas#destroy'
    delete '/del_canvas_by_item_id' => 'canvas#destroy_by_item_id'
    post '/get_kanbans_by_item_id' => 'canvas#get_kanbans_by_item_id'
  end
end
match "/del_canvas_by_folder" => "canvas#destroy_by_folder", via: [:delete]

resources :urls, :except => [:new, :show, :edit] do
  collection do
    get 'get_bookmarks_of_col'
  end
end

resources :urlbookmark, :except => [:new, :show, :edit]
resources :docassets, :except => [:new, :show, :edit]
resources :backgrounds, :except => [:new, :show, :edit]

resources :objorder, :except => [:new, :show, :edit] do
  collection do
    post '/search' => 'objorder#index'
  end
end
get '/get_new_order' => 'objorder#get_new_order'
post '/get_update_order' => 'objorder#get_update_order'
put '/update_v2' => 'objorder#update_v2'

resources :objcollection, :except => [:new, :show, :edit]
resources :trash, :except => [:new, :show, :edit]
resources :appregisters, :except => [:new, :show, :edit]
resources :upload, :except => [:new, :show, :edit]

resources :kanbans do
  collection do
    put '/', to: 'kanbans#update'
    delete '/', to: 'kanbans#destroy'
    get '/archived', to: 'kanbans#archived'
  end
end
delete '/del_kanban_by_folder' => 'kanban#destroy_by_folder'

#file
resources :files, :except => [:new, :show, :edit]
post '/files/upload' => 'files#upload'
get '/files/download' => 'files#download'
post '/fileInfo' => 'files#save_file_info'

#send and tracking emai
resources :tracking, :except => [:new, :show, :edit] do 
  collection do 
    put '/destroy_by_ids' => "tracking#destroy_by_ids"
  end
end

resources :addressbook, :except => [:new, :show, :edit] do
  collection do
    get '/contacts' => 'addressbook#contacts'
  end
end

#support API for add device token to server
resources :devicetoken, :except => [:new, :show, :edit] do
  collection do
    put '/', to: 'devicetoken#update'
    delete "/" => "devicetoken#destroy"
  end
end

#subscription
resources :subscription, :except => [:new, :show, :edit]

#yahoo caldav api
get "/check_yahoo_auth" => "yahoo_caldav#check_auth"
put "/updateYCal" => "yahoo_caldav#update_calendar"
post "/deleteYCal" => "yahoo_caldav#delete_calendar"
get "/ycals" => "yahoo_caldav#getlist_calendars"
post "/ycalobjs" => "yahoo_caldav#get_calendar_objects_by_calendar_uri"
post "/createYCalObj" => "yahoo_caldav#update_calobj_by_ical_str"
post "/deleteYCalObj" => "yahoo_caldav#delete_calobj"
post "/get_yahoo_calobjs" => "yahoo_caldav#get_calendar_objects_by_calendars"
post "/ylogin" => "yahoo_caldav#yahoo_login"

#event
# get "/events" => "caldav#get_all_events"
get "/event/:uid" => "caldav#get_event"
# get "/createEvent" => "caldav#create_a_event_by_string"
# get "/event/update/:uuid" => "caldav#update_event_by_strIcalEvent"
post "/send_mi" => "caldav#send_meeting_invite"

#setting for web
post "/updateset" => "settings#update"
post "/updateprofiles" => "users#update"
# folder - project
post "/updatefolder" => "projects#update"
post "/delproj/:id" => "projects#destroy"
# urls object
post "/delurls/:id" => "urls#destroy"
post "/updateurl" => "urls#update"

#contact - carddav
get "/addressbooks" => "carddav#get_addressbooks"
post "/contacts" => "carddav#get_contacts_by_sql"
post "/avatars" => "carddav#get_avatar_by_uids"
get "/card/fulltext_search_contact" => "carddav#fulltext_search_contact"
get "/card/search_contact" => "carddav#search_contact_by_sql"
get "/search_contact" => "carddav#search_contact"
post "/get_contact_groups" => "carddav#get_contact_groups" # get contact groups by report method (carddav standard)

post "/createContact" => "carddav#create_contact"
post "/deleteContact" => "carddav#delete_contact"
post "/deleteContacts" => "carddav#delete_contacts"
post "/get_first_contacts_by_emails" => "carddav#get_first_contacts_by_email_addrs"
get "/avatar" => "carddav#get_avatar_img_by_uid"

get "/getChanges" => "addressbook#getChanges"

#support for app
get "/addressbookuri" => "addressbook#addressbook"

resources :cloud_storages, :except => [:new, :show, :edit] do
  collection do
    post 'recovery', to: 'cloud_storages#recovery'
    put '/', to: 'cloud_storages#update'
    delete '/', to: 'cloud_storages#destroy'
    post 'upload', to: 'cloud_storages#upload'
    get 'download', to: 'cloud_storages#download'
  end
end
resources :criterions, only: [:index]
resources :suggested_collections do
  collection do
    post 'suggested', to: 'suggested_collections#suggested'
  end
end

resources :histories
get '/get_histories' => 'histories#get_histories'
post '/create_histories' => 'histories#create_histories'
post '/delete_histories' => 'histories#delete_histories'
post '/update_histories' => 'histories#update_histories'

resources :caldavs do
  collection do
    get 'calendar_objects', to: 'caldavs#calendar_objects'
    get '/', to: 'caldavs#index'
    post '/', to: 'caldavs#create'
    put '/', to: 'caldavs#update'
    delete '/', to: 'caldavs#destroy'
  end
end

# ==================== Web ===================================================

get '/feed/getWeatherInfo' => 'feed#getWeatherInfo'
get '/feed/getLocationInfo' => 'feed#getLocationInfo'

#google caldav api
put "/updateGCal" => "google_caldav#update_calendar"
post "/deleteGCal" => "google_caldav#delete_calendar"
get "/gcals" => "google_caldav#getlist_calendars"
post "/gcalobjs" => "google_caldav#get_calendar_objects_by_calendar_uri"
post "/createGCalObj" => "google_caldav#update_calobj_by_ical_str"
post "/deleteGCalObj" => "google_caldav#delete_calobj"
post "/get_google_calobjs" => "google_caldav#get_calendar_objects_by_calendars"

#caldav api
get "/cals" => "caldav#getlist_calendars"
get "/cal" => "caldav#get_cal_info"
post "/create_calendar" => "caldav#create_calendar"
put "/cal/:uri" => "caldav#update_calendar"
put "/cal/ins/:uri" => "caldav#show_hide_calendar"
post "/delete_calendar/:uri" => "caldav#delete_calendar"

post "/createCalObj" => "caldav#create_calobj_by_string"
post "/deleteCalObj" => "caldav#delete_calendar_obj"
post "/deleteCalObjs" => "caldav#delete_cos"
# get "/getAllItemByCalUri" => "caldav#get_all_items_by_caluri"
post "/calobj" => "caldav#get_calendar_object"
post "/calobjs" => "caldav#get_calendar_objects"
post "/cd_calobjs" => "caldav#get_all_cos_via_caldav"
post "/get_calobjs" => "caldav#get_calendar_objects_via_caldav"
# get "/searchcalobjs" => "caldav#search_calendar_objects"
# get "/searchcalobjs_folderid" => "caldav#search_calobjs_by_folderid"
# get "/find_events" => "caldav#find_events_by_range"
# get "/count_objs" => "caldav#count_objs"
get "/search_calobj" => "caldav#search_calobj"
post "/create_calobjs" => "caldav#create_calobjs"

#icloud
get "/checkicloud" => "icloud#check_auth_with_icloud"
put "/update_icloud_cal" => "icloud#update_calendar"
post "/delete_icloud_cal" => "icloud#delete_calendar"
get "/icloud_cals" => "icloud#getlist_calendars"
post "/icloud_cos" => "icloud#get_calendar_objects_by_calendar_uri"
post "/create_icloud_co" => "icloud#update_calobj_by_ical_str"
post "/delete_icloud_co" => "icloud#delete_calobj"
post "/get_icloud_calobjs" => "icloud#get_calendar_objects_by_calendars"
post "/ilogin" => "icloud#icloud_login"

#icloud - carddav
get "/icloud_addressbooks" => "icloud_carddav#get_addressbooks"
get "/icloud_contacts" => "icloud_carddav#get_contacts"
get "/search_icloud_contact" => "icloud_carddav#search_contact_by_emails"
post "/create_icloud_contact" => "icloud_carddav#create_contact"
post "/delete_icloud_contact" => "icloud_carddav#delete_contact"
post "/get_icloud_contacts_by_uris" => "icloud_carddav#get_contacts_by_uris"

resources :importcontact, :except => [:new, :show, :edit]

delete "/del_all_trash" => "trash#destroy_all"
delete "/restore_all_trash" => "trash#restore_all"

# url
get "/fetchurl" => "urls#fetch_url"
get "/getimport" => "urls#get_import"
get "/search_url" => "urls#search_url"

resources :recent_objects, :except => [:new, :show, :edit, :update]
resources :monitors, :except => [:new, :show, :edit] do
  collection do
    get 'database_timeout', to: 'monitors#database_timeout'
  end
end