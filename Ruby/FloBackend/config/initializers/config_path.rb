###################################################
# production server
# HTTP_HOST_NAME = "http://flomail.net"
# FLOL_CALDAV_SERVER_URL = "http://flomail.net:8087/calendarserver.php/calendars/"
# CALENDAR_PROCESS_URL = "/calendarserver.php/calendars/"
# HTTP_HOST_NAME_BG = "http://flomail.net:8086/images/"

# carddav server
# FLOL_CARDDAV_SERVER_URL = "http://flomail.net:8087/addressbookserver.php/addressbooks/"
# ADDRESSBOOK_PROCESS_URL = "/addressbookserver.php/addressbooks/"

# director IMAP folder
# IMAP_FOLDER_PATH = ""
# director Files server
# FILES_FOLDER_PATH = ""

#Note: 8085 = mail server, 8086 = Flow server, 8087 = calDAV/cardDAV server

###################################################
# test server
# HTTP_HOST_NAME = "http://flow-mail.com"
# FLOL_CALDAV_SERVER_URL = "http://flow-mail.com:8088/calendarserver.php/calendars/"
# CALENDAR_PROCESS_URL = "/calendarserver.php/calendars/"
# HTTP_HOST_NAME_BG = "http://flow-mail.com:8074/images/"

# carddav server
# FLOL_CARDDAV_SERVER_URL = "http://flow-mail.com:8088/addressbookserver.php/addressbooks/"
# ADDRESSBOOK_PROCESS_URL = "/addressbookserver.php/addressbooks/"

###################################################

# # test server 123flo.com
# HTTP_HOST_NAME = "http://localhost:3003"
# FLOL_CALDAV_SERVER_URL = "http://localhost/calendarserver.php/calendars/"
# CALENDAR_PROCESS_URL = "/calendarserver.php/calendars/"
# HTTP_HOST_NAME_BG = "http://123flo.com:8057/images/"
# 
# # carddav server
# FLOL_CARDDAV_SERVER_URL = "http://localhost/addressbookserver.php/addressbooks/"
# ADDRESSBOOK_PROCESS_URL = "/addressbookserver.php/addressbooks/"
# 
# # director IMAP folder
# IMAP_FOLDER_PATH = "/var/mail/vhosts/123flo.com/"
# # director Files server
# FILES_FOLDER_PATH = "/home/data/"

# test server 123flo.com
HTTP_HOST_NAME = "http://123flo.com:8056"
FLOL_CALDAV_SERVER_URL = ENV['FLOL_CALDAV_SERVER_URL'] || "http://123flo.com:8058/calendarserver.php/calendars/"
CALENDAR_PROCESS_URL = "/calendarserver.php/calendars/"
HTTP_HOST_NAME_BG = ENV['HTTP_HOST_NAME_BG'] || "http://123flo.com:8057/images/"

# carddav server
FLOL_CARDDAV_SERVER_URL = ENV['FLOL_CARDDAV_SERVER_URL'] || "http://123flo.com:8058/addressbookserver.php/addressbooks/"
ADDRESSBOOK_PROCESS_URL = "/addressbookserver.php/addressbooks/"

# director IMAP folder
IMAP_FOLDER_PATH = ENV['IMAP_FOLDER_PATH'] || "/var/mail/vhosts/123flo.com/"
# director Files server
FILES_FOLDER_PATH = "/home/data/"

###################################################
# development
# HTTP_HOST_NAME = "http://localhost:3003/#"
# FLOL_CALDAV_SERVER_URL = "http://localhost:8044/calendarserver.php/calendars/"
# CALENDAR_PROCESS_URL = "/calendarserver.php/calendars/"
# HTTP_HOST_NAME_BG = "http://localhost:3000/images/"

# carddav server
# FLOL_CARDDAV_SERVER_URL = "http://localhost:8044/addressbookserver.php/addressbooks/"
# ADDRESSBOOK_PROCESS_URL = "/addressbookserver.php/addressbooks/"

###################################################
# test server
# HTTP_HOST_NAME = "http://localhost:3005"
# FLOL_CALDAV_SERVER_URL = "http://192.168.1.25:8086/calendarserver.php/calendars/"
# CALENDAR_PROCESS_URL = "/calendarserver.php/calendars/"
# HTTP_HOST_NAME_BG = "http://192.168.1.25:8074/images/"
#
# # carddav server
# FLOL_CARDDAV_SERVER_URL = "http://192.168.1.25:8086/addressbookserver.php/addressbooks/"
# ADDRESSBOOK_PROCESS_URL = "/addressbookserver.php/addressbooks/"
###################################################

API_FROM_EMAIL = ENV['SMTP_EMAIL_FROM']
# API_FROM_EMAIL = "Flo Admin <noreply@flomail.net>"
API_FROM_EMAIL_SUPPORT = ENV['API_FROM_EMAIL_SUPPORT'] || "support@123flo.com"

HTTP_HOST_NAME_FOR_BETA = ENV['HTTP_HOST_NAME_FOR_BETA'] || "http://flo.floware.com"
ASSETS_PATH = HTTP_HOST_NAME_FOR_BETA + '/images'


# push notification lib path
PUSH_NOTI_LIB_PATH = ENV['PUSH_NOTI_LIB_PATH'] || "../FloBackend/lib/"
PUSH_NOTI_PEM_FILE = ENV['PUSH_NOTI_PEM_FILE'] || "../FloBackend/pem/"
