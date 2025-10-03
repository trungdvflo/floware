# user type
SESSION_USER = ':user'
SESSION_USER_EMAIL = ':user_email'
SESSION_USER_UUID = ':uuid'

# session time
SESSION_TIME = ':session_time'

#DIGEST STRING
DIGEST_STRING='LeftCoastLogic'

#host name for production - no change
HTTP_HOST_NAME_PROD = ENV['HTTP_HOST_NAME_PROD'] || "https://flo.floware.com"

#setting email to send
API_SEND_3RD_SUBJ = "Account @acc@ added to Flo "
API_WELCOME_SUBJ = "Welcome to Flo"
API_TIP_SUBJ_1 = "Swipe this Email to the Left (Sample Data)"
API_TIP_SUBJ_2 = "Swipe this Email to the Right (Sample Data)"
API_TIP_SUBJ_3 = "Tap the Green ToDo icon in the bottom Navigation Bar (Sample Data)"
API_RECOVER_PASS_SUBJ = "Password Recovery for "
API_SECONDARY_EMAIL_SUBJ = "Verify secondary email"
API_TERMINATE_EMAIL_SUBJ = "Request to Close Account "

#init email default
ARR_EMAIL_DEF = [
  # {:subject => API_WELCOME_SUBJ, :template => "flo_welcome.txt"}
  # {:subject => API_TIP_SUBJ_1, :template => "flo_tip1.txt"},
  # {:subject => API_TIP_SUBJ_2, :template => "flo_tip2.txt"},
  # {:subject => API_TIP_SUBJ_3, :template => "flo_tip3.txt"}
]

EMAIL_MATCHER = ENV['EMAIL_DOMAIN']

DEF_API_3RD = '{"Email" : 1,"Calendar" : 1}'

#const for footer
FOOTER_FLOWARE = "&copy; FloWare " + Time.now.strftime('%Y')
FOOTER_TERMS_OF_SV = "Terms of Service"
FOOTER_PRIVACY = "Privacy Policy"

PRIVACY_LINK = "http://www.floware.com/privacy-policy"
TERMS_OF_SERVICE_LINK = "http://www.floware.com/terms-of-service"

#for subscription link
#refer to: https://developer.apple.com/library/content/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateRemotely.html
API_PATH_SUBS_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt"
API_PATH_SUBS_BUY = "https://buy.itunes.apple.com/verifyReceipt"
API_SUBS_PASS_VERIFY = "4810645bf2e640d9a8914144b9fed439"
#thank you user upgrade Flo account
API_SUBS_THANKS_UPGRADE_SUBJ = "[Flo] Thank you!"
API_SUBS_THANKS_UPGRADE_MAIL = "ths_upgrade_subs.txt"
#message for 80% or 95% full storage
API_SUBS_NEAR_FULL_SUBJ = "[Flo] Almost Time for an Upgrade"
API_SUBS_NEAR_FULL_MAIL = "storage_near_full_subs.txt"
#message for 100% full storage
API_SUBS_FULL_SUBJ = "[Flo] Time for an Upgrade"
API_SUBS_FULL_MAIL = "storage_full_subs.txt"


#using push notification to device
VMAIL_PUSH_NOTI = "vmail@localhost"

#constant
DEF_CALENDAR_NAME = 'General'
DEF_CALENDAR_DESCRIPTION = 'This is Default Calendar'

DEF_FOLDER_NAME = 'General'
DEF_COLOR = '#4986e7'
DEF_GENERAL_TYPE = -1

# Default data Sample
DEF_WORK = "Work"
DEF_WORK_COLOR = "#ffad46"
DEF_WORK_TYPE = -5 
DEF_HOME = "Home"
DEF_HOME_COLOR = "#16a765"
DEF_HOME_TYPE = -3
DEF_PLAY = "Play"
DEF_PLAY_COLOR = "#cd74e6"
DEF_PLAY_TYPE = -2
DEF_SAMPLE = "Sample"
DEF_SAMPLE_COLOR = "#d06b64"
DEF_SAMPLE_TYPE = -4
DEF_OMNI_CALENDAR_COLOR = "#808080"
DEF_OMNI_CALENDAR_NAME = "Flo Uncollected" 
DEF_OMNI_TYPE = -6

#system collection
DEF_SYSTEM_SOCIAL = "Social"
DEF_SYSTEM_SOCIAL_COLOR = "#0092ec"
DEF_SYSTEM_NEWS = "News"
DEF_SYSTEM_NEWS_COLOR = "#ff5253"
DEF_SYSTEM_SPORTS = "Sports"
DEF_SYSTEM_SPORTS_COLOR = "#64dd14"
DEF_SYSTEM_FUN_STUFF = "Fun Stuff"
DEF_SYSTEM_FUN_STUFF_COLOR = "#ff9800"

################# For API ####################
API_KEY_ROOT = "root"

API_APPREG = "appreg"
API_USER = "user"
API_TOKEN = "token"
API_SETTING = "setting"
API_SET_ACC = "set_accounts"
API_LINKS = "links"
API_URLS = "urls"
API_TRASHS = "trashs"
API_KANBANS = "kanbans"
API_FILES = "files"
API_DEVICE_TOKEN = "device_token"
API_COLLECTIONS = "collections"
API_CALENDARS = "calendars"
API_CANVAS = "canvas"
API_HISTORY = "history"
API_PROJECTS = "projects"
API_DOC_ASSETS = "assets"
API_CALDAV = "caldav"
API_BACKGROUNDS = "backgrounds"
API_OBJ_ORDER = "obj_order"
API_OBJ_COLLECTIONS = "objcollections"
API_TRACKING = "tracking"
API_ADDRESSBOOK = "addressbook"
API_CONTACT = "contact"

#support subscription
API_SUBSCRIPTON = "subscription"
API_SUBS_FREE_TYPE = 0
API_SUBS_PRE_TYPE = 1
API_SUBS_PRO_TYPE = 2
API_STORAGE_10GB = 10737418240
API_SECURITY_RESET_SUBS = "18ba8cdfe33eff3eef2c54c764da7531" #Sm4rtt1m3

API_COMP_STORAGE_TYPE = 1
API_COMP_3RD_TYPE = 2
API_COMP_FEATURE_TYPE = 3

#############################

API_FLOW_ONLINE = "FlowOnline"
API_PRINCIPAL = "principals/"
API_CAL_COMPONENTS = "VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM"

# API for VObj
API_VEVENT = 'VEVENT'
API_VTODO = 'VTODO'
API_VJOURNAL = 'VJOURNAL'
API_VCALENDAR = 'VCALENDAR'
API_FOLDER = 'FOLDER'
API_LINK = 'LINK'
API_URL = 'URL'
API_TRACK = 'TRACK'
API_FILE = 'FILE'
API_TRASH = 'TRASH'
API_KANBAN = 'KANBAN'
API_EMAIL = 'EMAIL'
API_CANVAS_TYPE = 'CANVAS'
API_HISTORY_TYPE = 'HISTORY'
API_CONTACT_TYPE = 'VCARD'
API_ORDER_OBJ = 'ORDER_OBJ'
API_SET_3RD_ACC = 'SET_3RD_ACC'
API_SUGGESTED_COLLECTION = 'SUGGESTED_COLLECTION'

SYS_KB_EMAIL = "EMAIL"
SYS_KB_VEVENT = "EVENT"
SYS_KB_VTODO = "TODO"
SYS_KB_CONTACT = "CONTACT"
SYS_KB_NOTE = "NOTE"
SYS_KB_URL = "URL"
SYS_KB_FILE = "FILE"

SYS_KANBAN = 1

#define asset to link
API_ASSET_VEVENT = 0
API_ASSET_VTODO = 1
API_ASSET_VJOURNAL = 2
API_ASSET_EMAIL = 3
API_ASSET_CALENDAR = 4
API_ASSET_CONTACT = 5
API_ASSET_URL = 6
API_ASSET_FILE = 7 #doc asset
API_ASSET_FOLDER = 8
API_ASSET_COLLECTION = 9

#define account type
# YAHOO_ACC_TYPE = 2
# GOOGLE_ACC_TYPE = 1
# FLOW_ACC_TYPE = 0
# SMARTDAY_ACC_TYPE = -1
# OTHER_ACC_TYPE = -2

FLOW_ACC_TYPE = 0
GOOGLE_ACC_TYPE = 1
YAHOO_ACC_TYPE = 2
OTHER_EMAIL_ACC_TYPE = 3
OTHER_CALDAV_ACC_TYPE = 4
ICLOUD_ACC_TYPE = 5
SMARTDAY_ACC_TYPE = 6
OTHER_CARDDAV_ACC_TYPE = 7

API_CALENDAR_OBJECTS = 'CALENDAR_OBJECTS'
REGEXP_CALENDAR_OBJ_FULL_URL = /^\/((([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/$/i
REGEXP_CALENDAR_OBJ_URL = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
REGEXP_EMAIL = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

################# For Web ####################
#calendars data
ARR_CALS_DEFAULT = [
  {:displayname => DEF_CALENDAR_NAME, :description => DEF_CALENDAR_DESCRIPTION, :calendarcolor => DEF_COLOR, :proj_type => DEF_GENERAL_TYPE },
  {:displayname => DEF_WORK, :description => DEF_WORK, :calendarcolor => DEF_WORK_COLOR, :proj_type => DEF_WORK_TYPE },
  {:displayname => DEF_HOME, :description => DEF_HOME, :calendarcolor => DEF_HOME_COLOR, :proj_type => DEF_HOME_TYPE },
  {:displayname => DEF_PLAY, :description => DEF_PLAY, :calendarcolor => DEF_PLAY_COLOR, :proj_type => DEF_PLAY_TYPE },
  {:displayname => DEF_SAMPLE, :description => DEF_SAMPLE, :calendarcolor => DEF_SAMPLE_COLOR, :proj_type => DEF_SAMPLE_TYPE },
  {:displayname => DEF_OMNI_CALENDAR_NAME, :description => DEF_OMNI_CALENDAR_NAME, :calendarcolor => DEF_OMNI_CALENDAR_COLOR, :proj_type => "" }
]


#Note default data
ARR_NOTE_DEFAULT_iOS = [
  {
    :summary => "Quick Tip - Collections",
    :collections => [
      {:name => DEF_CALENDAR_NAME}
    ],
    :description => '
      <p><strong><span style="font-size: 16px;">Collections are like folder or categories.... but better.</span></strong></p><ul><li><span style="font-size: 16px;">Flo lets you put different things <strong><em>(emails, notes, events, people)</em></strong> in the same Collection.</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/collection/colectionGeneral@3x.png" style="width: 264px;"></p><ul><li><span style="font-size: 16px;">Or you can put the same thing in different Collections.<br><br></span></li><li><span style="font-size: 16px;">Tap the menu icon in any view to choose a <strong><em>specific Collection</em></strong>.</span></li></ul><p style="text-align: center;"><span style="font-size: 16px;"><img src="https://static.floware.com/templates/notes/collection/fillter@3x.png" style="width: 268px;"></span><br></p><p style="text-align: center;"><br></p><p style="margin-left: 40px;"><span style="font-size: 16px;">For example, you can select to see just the Notes in your Work Collection.</span></p><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/collection/colectionWork@3x.png" style="width: 272px;"></p><p><span style="font-size: 16px;"><br></span></p><ul><li><span style="font-size: 16px;">If you want to see everything in a <strong><em>Collection</em></strong>. Tap the Collection button in the Navigation Bar to go to the Collection.</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/collection/naviBar@3x.png" style="width: 269px;"></p><p style="margin-left: 40px;"><span style="font-size: 16px;">Then tap the <strong><em>icon/ title</em></strong> to pick a specific collection to view.</span></p><p style="margin-left: 40px;"><img src="https://static.floware.com/templates/notes/collection/iconTitle@3x.png" style="width: 290px;"></p><p style="margin-left: 40px;"><br></p>
    '
  },
  {
    :summary => "Quick Tip - Linking",
    :collections => [
      {:name => DEF_CALENDAR_NAME},
      {:name => DEF_WORK}
    ],
    :description => '
      <ul><li><strong><em><span style="font-size: 16px;">Link things with Flo.</span></em></strong><span style="font-size: 16px;"><br>Note to Contact. Email to ToDo.</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/linking/noteContactEmailTodo@3x.png" style="width: 263px;"></p><p data-empty="true" style="margin-left: 40px;"><span style="font-size: 16px;"><strong><em>Anything to anything.</em></strong><br><br></span></p><ul><li><span style="font-size: 16px;">You can automatically create linked ToDo\'s, Events and Notes.<br><strong><em>Just swipe</em></strong>&nbsp; <img src="https://static.floware.com/templates/notes/linking/swipeRight.png">&nbsp; and &nbsp;<img src="https://static.floware.com/templates/notes/linking/tap2.png">&nbsp; <strong><em>tap</em></strong>.</span><span style="font-size: 16px;"><br><br></span></li><li><span style="font-size: 16px;">You can even link an <strong><em>iCloud&nbsp;</em></strong>message to a <strong><em>Google Calendar</em></strong> event.</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/linking/linkIcloudGoogle@3x.png" style="width: 268px;"></p><p><br></p><p><br></p>
    '
  },
  {
    :summary => "Quick Tip - Filters",
    :collections => [
      {:name => DEF_CALENDAR_NAME},
      {:name => DEF_HOME}
    ],
    :description => '
      <ul><li><strong><em><span style="font-size: 16px;">Flo lets you filter what you see.</span></em></strong></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/filter/fillterEmail@3x.png" style="width: 262px;"></p><p style="text-align: center;"><br></p><ul><li><span style="font-size: 16px;"><strong><em>For example you can filter to see:</em></strong><br><em>All Unread Emails<br>All Starred ToDo\'s in your Work Collection<br>Recent Contacts in your Play Collection</em><br><br></span></li><li><span style="font-size: 16px;">It\'s super simple. Just <strong><em>tap the filter icon</em></strong> or <strong><em>title at the top</em></strong> of the screen to change what you want to see.</span></li></ul><p style="text-align: center;"><span style="font-size: 16px;"><img src="https://static.floware.com/templates/notes/filter/email@3x.png" style="width: 271px;"></span><br></p><p><br></p>
    '
  },
  {
    :summary => "Quick Tip - Shortcuts",
    :collections => [
      {:name => DEF_CALENDAR_NAME},
      {:name => DEF_PLAY}
    ],
    :description => '
      <ul><li><span style="font-size: 16px;">Flo has a lot of <strong><em>shortcuts&nbsp;</em></strong>to let you do things quickly with one hand.<br><br></span></li><li><span style="font-size: 16px;"><strong><em>Swipe objects</em></strong> in lists to:<br><em>Create linked ToDo\'s<br>Reply to Emails<br>Delete Objects<br>And many more</em></span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/shortcut/group20@3x.png" style="width: 273px;"></p><ul><li><span style="font-size: 16px;"><strong><em>Swipe&nbsp;</em></strong>opened emails, notes, etc to go back to a list view.</span><span style="font-size: 16px;">&nbsp;<img src="https://static.floware.com/templates/notes/shortcut/swipe@3x.png" style="width: 46px;"></span><br><span style="font-size: 16px;"><br></span></li><li><span style="font-size: 16px;">Tap on the icon in the <strong><em>Navigation Bar</em></strong> to filter what you see.</span></li></ul><p style="text-align: center;"><span style="font-size: 16px;"><img src="https://static.floware.com/templates/notes/shortcut/naviBarEmail@3x.png" style="width: 262px;"></span><br></p><ul><li><span style="font-size: 16px;"><strong><em>Rotate&nbsp;</em></strong>the Calendar to see a Week View</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/shortcut/calendar@3x.png" style="width: 273px;"></p><p><br></p>
    '
  }
]


#Todo default data
# ARR_TODO_SAMPLE_DEFAULT_iOS = [
  # {:summary => "Sample Todo for @colnm@ Collection", :location => "" }
# ]

ARR_TODO_DEFAULT_iOS = [ ]
  
#Event default data
ARR_EVENT_DEFAULT_iOS = [
  {:summary => "Breakfast meeting (Sample Data)", :location => "", :st => (Time.now.beginning_of_day + 8*3600).to_datetime.to_s, :et => (Time.now.beginning_of_day + 9*3600).to_datetime.to_s},
  {:summary => "Study Time (Sample Data)", :location => "", :st => (Time.now.beginning_of_day + 10*3600).to_datetime.to_s, :et => (Time.now.beginning_of_day + 12*3600).to_datetime.to_s},
  {:summary => "Work Time (Sample Data)", :location => "", :st => (Time.now.beginning_of_day + 14*3600).to_datetime.to_s, :et => (Time.now.beginning_of_day + 16*3600).to_datetime.to_s},
  {:summary => "Soccer game (Sample Data)", :location => "", :st => (Time.now.beginning_of_day + 18*3600).to_datetime.to_s, :et => (Time.now.beginning_of_day + 20*3600).to_datetime.to_s}]  

#URL default data
#belong_to: =1: social, =2: news, =3: sport, =4: fun stuff
ARR_BOOKMARKS_URL = [
  {:title => "The Wall Street Journal & Breaking News, Business, Financial and Economic News, World News and Video", :url => "https://www.wsj.com/asia", :belong_to => 1},
  {:title => "The New York Times - Breaking News, World News & Multimedia", :url => "https://www.nytimes.com", :belong_to => 2},
  {:title => "Yahoo News - Latest News & Headlines", :url => "https://www.yahoo.com/news", :belong_to => 1},
  {:title => "USA TODAY: Latest World and US News  - USATODAY.com", :url => "https://www.usatoday.com", :belong_to => 1},
  {:title => "Yahoo Sports | Sports News, Scores, Fantasy Games", :url => "https://sports.yahoo.com", :belong_to => 1},
  {:title => "Expedia Travel: Search Hotels, Cheap Flights, Car Rentals & Vacations", :url => "https://www.expedia.com", :belong_to => 1},  
  {:title => "Digital Photography Review", :url => "https://www.dpreview.com", :belong_to => 2},
  {:title => "Floware - Less Work More Flo", :url => "https://floware.com", :belong_to => 2},  
  {:title => "Apple", :url => "https://www.apple.com/", :belong_to => 2}
]


REAL_NAME_DAV = "LeftCoastLogic"

EXPIRE_TIME = 14400 # 4 hours
API_TIME_DEFAULT = 14500 #time default > 4 hours
API_MAX_RECORD = 49
API_LIMIT_PARAMS = 50

API_TOKEN_EXPIRE = 86400 #24 hours

API_PARAMS_JSON = "_json"
API_JPG_EXT = "jpg"
API_BG_NAME_PRE = "bg_"

#download url
DOWNLOAD_URL_FILE = "/files/download.json?&uid="

#for captchar
GOOGLE_VERIFY_CAPTCHAR_LNK = 'http://www.google.com/recaptcha/api/verify'
RECAPTCHA_PRIVATE_KEY = ENV['RECAPTCHA_PRIVATE_KEY']

PRIV_KEY = "-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQDYUMGmnacmc4w7ZcWnXmkosf8p54xcOzPgFTDlKiO2NXWuLQPj
ZARLCcfve7F2LJd/HbGoL5ByuZMadnAII3C8rb6ALy86T6Zv2Xgi/VItynGOyZyM
uuTySGlbuj7UM1W4C+2GJVOxwk2bdI6XlVa9V/yzIGDGXJ43Ag7jjTt9UQIDAQAB
AoGADDxNJ9qFCOTCSt3P1068zgN7dmhVhSYIIiWwtVWz3Wuas3ZyYNtYbtIn0AEE
IbYV/6ezU9sU5ZhfnMCUR7GRf9AIZ3kAvHvtm8fTnwfP+uvwYJ2VmQ0UdQJatqVa
6S5HWXm7utWZNbNEpBT6P0L+V6eXgKZPN3w/NvC0GvQ9aAECQQDuO6dHqvBeHMMe
ws7d4/JH2iChQOA3qKMz2mtf7hF3QcZ/kBT7cc8shxfmtuAfRvx/8uojHMdJH0Z3
g6y7t5GBAkEA6HKnFcWD+dGEBhethg0EMydPXDTRsDoGGTRVhNEsLImi4okvmriR
RSka9Oyf9vO9ZUCIKAWmlISW6Krd2OEz0QJAXF/9KSj7M0Lr1c2r8RYmJ/5IkL5b
MrnNLpoO8I+bbiavFV+FA0rKDnYDqo5WsUoRNnu2lg7ep1fdNxJztAYmAQJBANVp
fnIEt9jDPZ2CW7R5euOkMb6MWACeJT86x1F74jy52Sx3m5dH4UhIJxG7tlo7CiZO
CzQDjB9LZGoVhj069iECQEncM5dUUyeU3U9IMpChmt4aPyYMug4d0t10Hw7aLNf4
ZUnpbtGg5rUXXofplDjWlDnU5IbLUJs40NQUhWzG6Zg=
-----END RSA PRIVATE KEY-----"

# Zendesk Shared Key
ZENDESK_SHARED_SECRET = '3ZlVB4KMrzULp9ULPZtrPzhMThmF4WCKTfUbkXTUWavC9B6b'
ZD_SSO = 'ZDSSO'

#*** security note: DO NOT CHANGE OR UPDATE THIS CONST, it just use for admin
API_MAIL_DIR = "/maildata/vhost/flomail.net/"
API_PASS_CODE = "18ba8cdfe33eff3eef2c54c764da7531"
# ***** end security note ******


