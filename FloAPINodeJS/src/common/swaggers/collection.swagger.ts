export const nameInstanceMemberSwagger = 'Collections Instance Member';
export const nameSwagger = 'Collections';
export const nameSuggestedCollectionSwagger = 'Suggested Collections';
export const nameSwaggerNoti = 'Notifications';

export const RequestParam = {
  id: {
    example: 1,
    description: 'id record',
  },
  owner_user_id: {
    example: 1234,
    description: 'ID record of the user table, belong to the owner user'
  },
  collection_id: {
    example: 1234,
    description: 'ID record of the collection table'
  },
  color: {
    example: '#ac725e',
    description: ' the color of the shared collection',
  },
  favorite: {
    example: 1,
    description: ' the favorite of the shared collection',
  },
  is_hide: {
    example: 0,
    description: 'Indicate if this collection should be hidden or not'
  },
  recent_time: {
    example: 1618486501.812,
    description: 'Recent time having activity of this collection in UNIX timestamp'
  },
  criterion_type: {
    example: 1,
    description: `the type of the criterion: </br>
    1: Email title </br>
    2: Note title</br>
    4: Todo title </br>
    8: Event title </br>
    16: Event invitee (email address) </br>
    32: Event location </br>
    64: URL bookmark type </br>
    128: Contact the company </br>
    256: Contact “email address domain” (domain name) </br>
    512: Cloud File type </br>
    1024: Contact name </br>
    2048: Select Local Filter </br>
    criterion_value: the UID of custom view (Flo Collection) </br>
    criterion_type: 2048 </br>
    frequency_used: 0 </br>
    4096: Open collection and Tab bar </br>
    8192: Email sender (email address ) </br>
    16384: Email body (Ex: for Extensibility not use) </br>
    32768: calendar third party account - NEW </br>
    65536: IMAP folder third party account - NEW`
  },
  criterion_value: {
    example: 'example value',
    description: 'The value of criterion, it will depend on criterion type, logic'
  },
  object_type: {
    example: 1618486501.812,
    description: `this feature support some object type: </br>
    VTODO (ToDo) </br>
    VJOURNAL (Note) </br>
    VEVENT (event) </br>
    VCARD (contact) </br>
    EMAIL (email) </br>
    CSFILE (Cloud Storage file) </br>
    URL (URL bookmark - website ) </br>
    LOCAL_FILTER (local filter) </br>
    CALENDAR (calendar ) </br>
    TAB_BAR (collection or tab bar) </br>
    IMAP_FOLDER (IMAP folder )`
  },
  frequency_used: {
    example: 1,
    description: 'The number of frequency used the collection'
  },
  action_time: {
    example: 1618486501.812,
    description: 'the time open the tab bar (get the value from client app)'
  },
  group_id: {
    example: 1,
    description: 'a group of suggestions for distinct, use on frequence use  (get the value from client app)'
  },
  account_id: {
    example: 123,
    description: `the third party account ID </br>
    default = 0 (flo) </br>
    != 0: belong to 3rd party account`
  },
  third_object_uid: {
    example: "3d98cf39-ef0c-44b5-bd51-b046fe11a66b",
    description: 'contain calendar URI or IMAP folder path string'
  },
  third_object_type: {
    example: 123,
    description: `the third party object type: </br>
    0 = flo collection (default ) </br>
    1: calendar </br>
    2: IMAP folder`
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};
