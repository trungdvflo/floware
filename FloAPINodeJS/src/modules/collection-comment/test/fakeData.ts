export const fakeComment = [
    {
        "id": 123, // ID record history
        "collection_activity_id": 123456,
        "collection_id": 123,
        "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
        "object_type": "VTODO",
        "email": "abcxyz@flostage.com",
        "action": 0, // created
        "action_time": 12345.345,
        "content": "created new item",
        mentions: [{
            mention_text: '@anph',
            email: 'anph@flodev.net'
        }],
        "created_date": 123456.234,
        "updated_date": 12345.678
    },
    {
        "id": 224,// ID record history
        "collection_activity_id": 123456,
        "collection_id": 123,
        "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
        "object_type": "VTODO",
        "email": "abcxyz@flostage.com",
        "action": 1, // edited
        "action_time": 12345.345,
        "content": "created new item",
        mentions: [{
            mention_text: '@anph',
            email: 'anph@flodev.net'
        }],
        "created_date": 123456.234,
        "updated_date": 12345.678
    }
];

export const fakeMention = [
    {
        "username": "anph.owner@flodev.net",
        "first_name": "",
        "last_name": "",
        "fullname": "anph.owner"
    },
    {
        "username": "anph_lead@flodev.net",
        "first_name": "Anph_lead",
        "last_name": "",
        "fullname": "anph_lead"
    },
    {
        "username": "anph_po@flodev.net",
        "first_name": "Anph_po",
        "last_name": "",
        "fullname": "anph_po"
    },
    {
        "username": "anph_member@flodev.net",
        "first_name": "Anph_member",
        "last_name": "",
        "fullname": "anph_member"
    }
];