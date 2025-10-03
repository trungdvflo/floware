export const GetCommonRequestParam = {
  page_size: {
    description: 'It\'s a number integer, the number of item which want to get. In this version \
        will apply get object with pItem number. Value must be [1 - 1100]\
        Ex: page_size=50'
  },
  min_id: {
    description: 'It\'s a number integer, it is trash ID which you want to get items have ID > min_id.\
        Ex: &min_id=2243, it means api will get all item have ID > 2243',
    minimum: 1
  },
  ids: {
    type: String,
    description: 'A text string, get items have ID in the list.\
        Ex: &ids=123,432,456 It means api will return the object in the list ID'
  }
};