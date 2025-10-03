export const nameSwagger = 'System collection';
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },
  name: {
    example: 'floware 1',
    description: 'this is the name of system collection'
  },
  update_name: {
    required: false,
    example: 'floware 1',
    description: 'this is the name of system collection'
  },
  type: {
    example: 1,
    description: `this is the type of system collection, we will allow type below:</br>
    Email = 1 >> it allows the user can filter email only </br>
    Calendar = 2 >> it allows the user can filter event object only </br>
    ToDo's = 3 >> it allows the user can filter ToDo object only </br>
    Contacts = 4 >> it allows the user can filter contact object only </br>
    Notes = 5 >> it allows the user can filter Note object only </br>
    Websites = 6  >> it allows the user can filter URL bookmark object only </br>
    Files = 7  >> it allows the user can filter Cloud File object only </br>
    Organizer = 8  >> it allows the user can filter: Event, ToDo, Note, Contact, URL bookmark, Cloud File and Email objects.`
  },
  order_number: {
    example: 1,
    description: ` it is order number of the system collection on top navigation bar.`
  },
  is_default: {
    example: 0,
    description: `value = 0: user system collection (default) </br>
    value = 1: default system collection (server will generate >> Email, Event, ToDo's, Notes, Contacts, Files, Bookmarks, Organizer)`
  },
  update_order_number: {
    required: false,
    example: 1,
    description: ` it is order number of the system collection on top navigation bar.`
  },
  order_update_time: {
    required: false,
    example: 1645092843.474,
    description: 'this is the time of the client app sort order system collection on local and sync to server side - UTC time'
  },
  enable_mini_month: {
    required: false,
    example: 1,
    description: `Allow the user enable mini month: </br>
    value = 0: disable (default ) </br>
    value = 1: enabled.`
  },
  enable_quick_view: {
    required: false,
    example: 1,
    description: `allow the user enable week view: </br>
    value = 0: disable (default ) </br>
    value = 1: enabled.`
  },
  show_mini_month: {
    required: false,
    example: 0,
    description: `Allow the user can show/hide the mini month: </br>
    value = 0: disable </br>
    value = 1: enabled (default )`
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};

export const requestBodyUpdateSystemCollecion = {
  "id": 1,
  "name": RequestParam.update_name.example,
  "order_number": RequestParam.update_order_number.example,
  "order_update_time": RequestParam.order_update_time.example,
  "enable_mini_month": RequestParam.enable_mini_month.example,
  "enable_quick_view": RequestParam.enable_quick_view.example,
  "show_mini_month": RequestParam.show_mini_month.example,
};

export const requestBodyDeleteSystemCollecion = {
  "id": 1,
};

export const requestBody = {
  "name": RequestParam.name.example,
  "type": RequestParam.type.example,
  "order_number": RequestParam.order_number.example,
  "enable_mini_month": RequestParam.enable_mini_month.example,
  "enable_quick_view": RequestParam.enable_quick_view.example,
  "show_mini_month": RequestParam.show_mini_month.example,
  "ref": RequestParam.ref.example
};
