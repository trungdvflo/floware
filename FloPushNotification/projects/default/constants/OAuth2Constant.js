module.exports = {
    // # Default data Sample
    DEF_CALENDAR_NAME: 'General',
    DEF_CALENDAR_DESCRIPTION: 'This is Default Calendar',
    DEF_FOLDER_NAME: 'General',
    DEF_COLOR: '#4986e7',
    DEF_GENERAL_TYPE: -1,
    
    DEF_WORK: 'Work',
    DEF_WORK_COLOR: '#ffad46',
    DEF_WORK_TYPE: -5,
    DEF_HOME: 'Home',
    DEF_HOME_COLOR: '#16a765',
    DEF_HOME_TYPE: -3,
    DEF_PLAY: 'Play',
    DEF_PLAY_COLOR: '#cd74e6',
    DEF_PLAY_TYPE: -2,
    DEF_SAMPLE: 'Sample',
    DEF_SAMPLE_COLOR: '#d06b64',
    DEF_SAMPLE_TYPE: -4,
    DEF_OMNI_CALENDAR_COLOR: '#808080',
    DEF_OMNI_CALENDAR_NAME: 'Flo Uncollected',
    DEF_OMNI_TYPE: -6,

    // #system collection
    DEF_SYSTEM_SOCIAL: 'Social',
    DEF_SYSTEM_SOCIAL_COLOR: '#0092ec',
    DEF_SYSTEM_NEWS: 'News',
    DEF_SYSTEM_NEWS_COLOR: '#ff5253',
    DEF_SYSTEM_SPORTS: 'Sports',
    DEF_SYSTEM_SPORTS_COLOR: '#64dd14',
    DEF_SYSTEM_FUN_STUFF: 'Fun Stuff',
    DEF_SYSTEM_FUN_STUFF_COLOR: '#ff9800',

    TIMEZONE: 'America/Chicago',
    API_WELCOME_SUBJ: 'Welcome to Flo',
    DATE_RFC2822: 'ddd, DD MMM YYYY HH:mm:ss ZZ',
    WKHOURS: [
        { day: 'Mon', iMin: 32400, iMax: 64800 },
        { day: 'Tue', iMin: 32400, iMax: 64800 },
        { day: 'Wed', iMin: 32400, iMax: 64800 },
        { day: 'Thu', iMin: 32400, iMax: 64800 },
        { day: 'Fri', iMin: 32400, iMax: 64800 },
        { day: 'Sat', iMin: 32400, iMax: 64800 },
        { day: 'Sun', iMin: 32400, iMax: 64800 }
    ],
    API_PRINCIPAL: 'principals/',
    REAL_NAME_DAV: 'LeftCoastLogic',
    VMAIL_PUSH_NOTI: 'vmail@localhost',
    // # API for VObj
    API_VEVENT: 'VEVENT',
    API_VTODO: 'VTODO',
    API_VJOURNAL: 'VJOURNAL',
    API_VCALENDAR: 'VCALENDAR',
    API_FOLDER: 'FOLDER',
    API_LINK: 'LINK',
    API_URL: 'URL',
    API_TRACK: 'TRACK',
    API_FILE: 'FILE',
    API_TRASH: 'TRASH',
    API_KANBAN: 'KANBAN',
    API_EMAIL: 'EMAIL',
    API_CANVAS_TYPE: 'CANVAS',
    API_HISTORY_TYPE: 'HISTORY',
    API_CONTACT_TYPE: 'VCARD',
    API_ORDER_OBJ: 'ORDER_OBJ',
    API_SET_3RD_ACC: 'SET_3RD_ACC',
    API_SUGGESTED_COLLECTION: 'SUGGESTED_COLLECTION',
    ARR_TODO_DEFAULT_iOS: [],
    ARR_NOTE_DEFAULT_iOS: [{
        summary: 'Quick Tip - Collections',
        collections: [
            { name: 'General' }
        ],
        description: ' <p><strong><span style="font-size: 16px;">Collections are like folder or categories.... but better.</span></strong></p><ul><li><span style="font-size: 16px;">Flo lets you put different things <strong><em>(emails, notes, events, people)</em></strong> in the same Collection.</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/collection/colectionGeneral@3x.png" style="width: 264px;"></p><ul><li><span style="font-size: 16px;">Or you can put the same thing in different Collections.<br><br></span></li><li><span style="font-size: 16px;">Tap the menu icon in any view to choose a <strong><em>specific Collection</em></strong>.</span></li></ul><p style="text-align: center;"><span style="font-size: 16px;"><img src="https://static.floware.com/templates/notes/collection/fillter@3x.png" style="width: 268px;"></span><br></p><p style="text-align: center;"><br></p><p style="margin-left: 40px;"><span style="font-size: 16px;">For example, you can select to see just the Notes in your Work Collection.</span></p><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/collection/colectionWork@3x.png" style="width: 272px;"></p><p><span style="font-size: 16px;"><br></span></p><ul><li><span style="font-size: 16px;">If you want to see everything in a <strong><em>Collection</em></strong>. Tap the Collection button in the Navigation Bar to go to the Collection.</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/collection/naviBar@3x.png" style="width: 269px;"></p><p style="margin-left: 40px;"><span style="font-size: 16px;">Then tap the <strong><em>icon/ title</em></strong> to pick a specific collection to view.</span></p><p style="margin-left: 40px;"><img src="https://static.floware.com/templates/notes/collection/iconTitle@3x.png" style="width: 290px;"></p><p style="margin-left: 40px;"><br></p>'
    }, {
        summary: 'Quick Tip - Linking',
        collections: [
            { name: 'General' },
            { name: 'Work' }
        ],
        description: '<ul><li><strong><em><span style="font-size: 16px;">Link things with Flo.</span></em></strong><span style="font-size: 16px;"><br>Note to Contact. Email to ToDo.</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/linking/noteContactEmailTodo@3x.png" style="width: 263px;"></p><p data-empty="true" style="margin-left: 40px;"><span style="font-size: 16px;"><strong><em>Anything to anything.</em></strong><br><br></span></p><ul><li><span style="font-size: 16px;">You can automatically create linked ToDo\'s, Events and Notes.<br><strong><em>Just swipe</em></strong>&nbsp; <img src="https://static.floware.com/templates/notes/linking/swipeRight.png">&nbsp; and &nbsp;<img src="https://static.floware.com/templates/notes/linking/tap2.png">&nbsp; <strong><em>tap</em></strong>.</span><span style="font-size: 16px;"><br><br></span></li><li><span style="font-size: 16px;">You can even link an <strong><em>iCloud&nbsp;</em></strong>message to a <strong><em>Google Calendar</em></strong> event.</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/linking/linkIcloudGoogle@3x.png" style="width: 268px;"></p><p><br></p><p><br></p>'
    }, {
        summary: 'Quick Tip - Filters',
        collections: [
            { name: 'General' },
            { name: 'Home' }
        ],
        description: '<ul><li><strong><em><span style="font-size: 16px;">Flo lets you filter what you see.</span></em></strong></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/filter/fillterEmail@3x.png" style="width: 262px;"></p><p style="text-align: center;"><br></p><ul><li><span style="font-size: 16px;"><strong><em>For example you can filter to see:</em></strong><br><em>All Unread Emails<br>All Starred ToDo\'s in your Work Collection<br>Recent Contacts in your Play Collection</em><br><br></span></li><li><span style="font-size: 16px;">It\'s super simple. Just <strong><em>tap the filter icon</em></strong> or <strong><em>title at the top</em></strong> of the screen to change what you want to see.</span></li></ul><p style="text-align: center;"><span style="font-size: 16px;"><img src="https://static.floware.com/templates/notes/filter/email@3x.png" style="width: 271px;"></span><br></p><p><br></p>'
    }, {
        summary: 'Quick Tip - Shortcuts',
        collections: [
            { name: 'General' },
            { name: 'Play' }
        ],
        description: '<ul><li><span style="font-size: 16px;">Flo has a lot of <strong><em>shortcuts&nbsp;</em></strong>to let you do things quickly with one hand.<br><br></span></li><li><span style="font-size: 16px;"><strong><em>Swipe objects</em></strong> in lists to:<br><em>Create linked ToDo\'s<br>Reply to Emails<br>Delete Objects<br>And many more</em></span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/shortcut/group20@3x.png" style="width: 273px;"></p><ul><li><span style="font-size: 16px;"><strong><em>Swipe&nbsp;</em></strong>opened emails, notes, etc to go back to a list view.</span><span style="font-size: 16px;">&nbsp;<img src="https://static.floware.com/templates/notes/shortcut/swipe@3x.png" style="width: 46px;"></span><br><span style="font-size: 16px;"><br></span></li><li><span style="font-size: 16px;">Tap on the icon in the <strong><em>Navigation Bar</em></strong> to filter what you see.</span></li></ul><p style="text-align: center;"><span style="font-size: 16px;"><img src="https://static.floware.com/templates/notes/shortcut/naviBarEmail@3x.png" style="width: 262px;"></span><br></p><ul><li><span style="font-size: 16px;"><strong><em>Rotate&nbsp;</em></strong>the Calendar to see a Week View</span></li></ul><p style="text-align: center;"><img src="https://static.floware.com/templates/notes/shortcut/calendar@3x.png" style="width: 273px;"></p><p><br></p>'
    }],
    ARR_CALS_DEFAULT: [{ 
        displayname: 'General', 
        description: 'This is Default Calendar', 
        calendarcolor: '#4986e7',
        proj_type: -1 
    }, { 
        displayname: 'Work', 
        description: 'Work',
        calendarcolor: '#ffad46',
        proj_type: -5
    }, { 
        displayname: 'Home',
        description: 'Home',
        calendarcolor: '#16a765', 
        proj_type: -3
    }, { 
        displayname: 'Play',
        description: 'Play',
        calendarcolor: '#cd74e6',
        proj_type: -2
    }, { 
        displayname: 'Sample', 
        description: 'Sample',
        calendarcolor: '#d06b64',
        proj_type: -4
    }, { 
        displayname: 'Flo Uncollected', 
        description: 'Flo Uncollected',
        calendarcolor: '#808080', 
        proj_type: '' 
    }],

    ARR_BOOKMARKS_URL: [
        { title: 'The Wall Street Journal & Breaking News, Business, Financial and Economic News, World News and Video', url: 'https://www.wsj.com/asia', belong_to: 1 },
        { title: 'The New York Times - Breaking News, World News & Multimedia', url: 'https://www.nytimes.com', belong_to: 2 },
        { title: 'Yahoo News - Latest News & Headlines', url: 'https://www.yahoo.com/news', belong_to: 1 },
        { title: 'USA TODAY: Latest World and US News  - USATODAY.com', url: 'https://www.usatoday.com', belong_to: 1 },
        { title: 'Yahoo Sports | Sports News, Scores, Fantasy Games', url: 'https://sports.yahoo.com', belong_to: 1 },
        { title: 'Expedia Travel: Search Hotels, Cheap Flights, Car Rentals & Vacations', url: 'https://www.expedia.com', belong_to: 1 },  
        { title: 'Digital Photography Review', url: 'https://www.dpreview.com', belong_to: 2 },
        { title: 'Floware - Less Work More Flo', url: 'https://floware.com', belong_to: 2 },  
        { title: 'Apple', url: 'https://www.apple.com/', belong_to: 2 }
    ],
    SYSTEM_KANBANS: [{
        name: 'Emails',
        color: '#0074b3'
    }, {
        name: 'Events',
        color: '#f94956'
    }, {
        name: 'Todo\'s',
        color: '#7CCD2D'
    }, {
        name: 'Contacts',
        color: '#BB8C7C'
    }, {
        name: 'Notes',
        color: '#FFA834'
    }, {
        name: 'Websites',
        color: '#B658DE'
    }, {
        name: 'Files',
        color: '#969696'
    }]
};
