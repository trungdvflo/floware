export const RequestParam = {
  page_size: {
    example: 50,
    description: 'It\'s a number integer, the number of item which want to get. In this version \
    will apply get object with page_size number. Value must be [1 - 1100]'
  },
  modified_gte: {
    required: false,
    example: 1247872251.212,
    description: 'It\'s a number float, get items have updated_date greater than equal the time.'
  },
  modified_lt: {
    required: false,
    example: 12354.232,
    description: 'It\'s a number float, get item have updated_date Less Than the time.'
  },
  min_id: {
    required: false,
    example: 12,
    description: 'It\'s a number integer, it is trash ID which you want to get items have ID > min_id'
  },
  min_del_id: {
    required: false,
    example: 12,
    description: 'It\'s a number integer, get data deleted from deleted_items table and filter by id.'
  },
  has_del: {
    required: false,
    example: 1,
    description: 'It\'s a number 1, get deleted items if you want to api return.\
  Ex: &has_del=1, it will return the list Trash object deleted'
  },
  ids: {
    required: false,
    example: '123,432,456',
    type: String,
    description: 'A text string, get items have ID in the list.\
    Ex: 123,432,456 It means api will return the object in the list ID'
  },
  fields: {
    required: false,
    type: String,
    description: 'A text string, get items with some fields which you want to show.\
    You can follow the table above'
  },
  collection_id: {
    required: false,
    type: Number,
    description: 'It\'s a number, the ID record of the collection table'
  },
  collection_ids: {
    required: false,
    example: '123,432,456',
    type: String,
    description: 'It\'s list of number, the ID records of the collection table'
  },
  channel_ids: {
    required: false,
    example: '123,432,456',
    type: String,
    description: 'It\'s list of number, the ID records of the conference_channel table'
  },
  channel_uids: {
    require: false,
    type: String,
    description: "It\'s a string, the UID of Flo comment able object"
  },
  shortcut: {
    required: false,
    type: String,
    description: 'It\'s a string, value of column shortcut in collection icon table'
  },
  object_uid: {
    require: false,
    type: String,
    description: "It\'s a string, the UID of Flo comment able object"
  },
  sort: {
    require: false,
    type: String,
    description: "It\'s a string, the field name with prefix (+: ASC, -: DESC).\
     Example: +email will return list with ordered email ascending"
  },
  page_no: {
    require: false,
    type: Number,
    description: "It\'s a number integer, the page number which want to get. In this version. Value must be [1 - 1100]"
  },
  is_web: {
    require: false,
    type: Number,
    description: "It\'s a number integer, value = 0 or 1. If Value = 1 then support Flo web"
  },
  filter_type: {
    require: false,
    type: Number,
    description: `It\'s a number integer, value = 1,2,3 or 4. support keyword param
    -- value = 1 >> search by channel name(keyword = channel name)
    -- value = 2 >> search by participant
    -- value = 3 >> search ALL (1 + 2)
    -- value = 4 >> 3 + missed call
    -- value = 5 >> search by participant and contain only one participant`
  },
  keyword: {
    required: false,
    type: String,
    description: 'It\'s a string, use to search and combined with filter_type'
  },
  object_type: {
    required: false,
    type: String,
    description: 'It\'s a string, type of flo_objects'
  },
  uid: {
    require: false,
    type: String,
    description: "It\'s a number, The uid of the Email object"
  },
  path: {
    require: false,
    type: String,
    description: "It\'s a string, the path that link to folder contain this email"
  },
  vip: {
    require: false,
    type: Number,
    description: "It\'s a number, filter the channel vip or not"
  },
  group_meeting: {
    require: false,
    type: Number,
    description: "This param will support the FloWeb to group history via meeting id & calculate the duration of the call"
  },
  before_time: {
    required: false,
    example: 1247872251.212,
    description: 'It\'s a number float, get items have create_date greater than equal the time.'
  },
  after_time: {
    required: false,
    example: 12354.232,
    description: 'It\'s a number float, get item have created_date Less Than the time.'
  },
};