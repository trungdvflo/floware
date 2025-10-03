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
    description: 'ID record of the collection table'
  },
  shortcut: {
    required: false,
    type: String,
    description: 'Shortcut to find exactly icon'
  },
  object_uid: {
    require: false,
    type: Number,
    description: "UID of Flo comment able object"
  }
};