export const RequestParam = {
  destination_object_uid: {
    example: {"uid":123, "path": "dsadsadsadsadsads" },
    description: `Base on 'destination_object_type'<br>
    * If destination_object_type:<br>
      ** Case 1: 'GMAIL' type: we allow email_id string<br>
      ** Case 2: 'EMAIL' type, it means Flo and 3rd party account, we allow json format. Example {"uid":123,"path":"inbox"}<br>
      ** Case 3: 'VEVENT' type: we allow uid string of the event object
      ** Case 4: 'EMAIL365' type: we allow email_id string<br>
      `
  },
  is_trashed: {
    example: 1,
    description: `
    * If is_trashed:<br>
      ** Case 0: not trashed<br>
      ** Case 1: is trashed<br>`
  },
  source_object_uid: {
    example: '1234@gmail.com',
    description: `Rule & description:<br>
    * source_type = VCARD, it is "d0a96439-374b-48d0-9687-c788dbc437ec"<br>
    * source_type = SENDER/RECEIVER, it is "abc@gmail.com"<br>
    * source_type = INVITEE, it is "xyz@gmail.com"<br>
    `
  },
  source_object_type: {
    example: 'RECEIVER',
    description: `Contain object type of contact, it will depend on case. Can be either:<br>
    * VCARD<br>
    * RECEIVER<br>
    * SENDER<br>
    * INVITEE<br>
    -- Note:
        ** When action = 6, source_type = RECEIVER
        ** When action = 7, source _type = SENDER
    `
  },
  destination_object_type: {
    example: 'EMAIL',
    description: `Can be either:<br>
    * EMAIL<br>
    * VEVENT<br>
    * GMAIL<br>
    * EMAIL365<br>`
  },
  source_account_id: {
    required: false,
    example: 0,
    description: `Rule & description:<br>
    * Validate this field with ID of table "third_party_account" (if != 0)<br>
    * Contain ID of third_party_account table, it is 3rd party account`
  },
  destination_account_id: {
    required: false,
    example: 0,
    description: `Rule & description:<br>
    * Contain third_party_account ID, default = 0: belong to Flo account, != 0: belong to 3rd party account<br>
    * ID record of table third_party_accounts<br>
    * Validate this field with ID of table "third_party_accounts" (if != 0)`
  },
  source_object_href: {
    required: false,
    example: '/addressbookserver.php/addressbooks/floware@flodev.net/floware@flodev.net/',
    description: `Rule & description:<br>
    * Validate NOT BLANK if When source_object_type = VCARD<br>
    `
  },
  destination_object_href: {
    required: false,
    example: '/addressbookserver.php/addressbooks/floware@flodev.net/floware@flodev.net/',
    description: `Rule & description:<br>
    * Validate NOT BLANK if When destination_object_type = VEVENT<br>
   `
  },
  action_data: {
    required: false,
    description: `Note: we just apply feature "search email if it does not exist" when PO approved ticket for Contact history, follow the ticket`
  },
  action: {
    example: 6,
    description: `Can be either:<br>
    * 4: Skype chat<br>
    * 5: Skype call<br>
    * 6: Email sent<br>
    * 7: Email received<br>
    * 8: Meeting invitee (VEVENT)<br>
    * 9: Phone call (iOS)<br>
    * 10: SMS(iOS)<br>`
  },
  path: {
    required: false,
    example: 'Sent',
    description: `Contain IMAP folder. Ex: Inbox, abc IMAP folder,…`
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};

export const requestBody = {
  "destination_object_uid": RequestParam.destination_object_uid.example,
  "source_object_uid": RequestParam.source_object_uid.example,
  "source_object_type": RequestParam.source_object_type.example,
  "destination_object_type": RequestParam.destination_object_type.example,
  "source_account_id": RequestParam.source_account_id.example,
  "destination_account_id": RequestParam.destination_account_id.example,
  "source_object_href": RequestParam.source_object_href.example,
  "destination_object_href": RequestParam.destination_object_href.example,
  "is_trashed": RequestParam.is_trashed.example,
  "action": RequestParam.action.example,
  "path": RequestParam.path.example,
  "ref": RequestParam.ref.example,
};
