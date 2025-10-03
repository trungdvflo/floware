import { RequestMethod } from '@nestjs/common';

export const routestCtr = {
  userCtr: {
    main: 'user',
    online: 'online',
  },
  wsCtr: {
    main: 'ws',
    online: 'online',
    token: 'token',
  },
  messageCtr: {
    main: 'messages',
    event: 'event',
    notification: 'notification',
    notificationStatus: 'notification/status',
    send: 'send',
  },
  chatCtr: {
    main: 'chat',
    messages: 'messages',
    channelAttachment: ':channelName/attachments',
    channelMessage: ':channelName/messages',
    channelLastSeen: ':channelName/lastseen',
    messageItem: 'messages/:messageUid',
  },
  channelCtr: {
    main: 'channels',
    item: ':channelName',
    member: ':channelName/members',
    memberItem: ':channelName/members/:email',
  },
  settingCtr: {
    main: 'settings',
    channel: ':channelName'
  },
  notificationCtr: {
    main: 'notification',
    send: 'send',
  },
  statisticCtr: {
    main: 'statistics',
  },
};

// ======= Authorized routes ======== //
export const authorizedRoutes = [
  {
    path: `/${routestCtr.channelCtr.main}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.channelCtr.main}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.channelCtr.main}/${routestCtr.channelCtr.member}`,
    method: RequestMethod.DELETE,
  },
  {
    path: `/${routestCtr.channelCtr.main}/${routestCtr.channelCtr.member}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.channelCtr.main}/${routestCtr.channelCtr.member}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.channelCtr.main}/${routestCtr.channelCtr.member}`,
    method: RequestMethod.PUT,
  },
  {
    path: `/${routestCtr.channelCtr.main}/${routestCtr.channelCtr.memberItem}`,
    method: RequestMethod.DELETE,
  },
  {
    path: `/${routestCtr.channelCtr.main}/${routestCtr.channelCtr.item}`,
    method: RequestMethod.DELETE,
  },
  // ======= Message API =======
  {
    path: `/${routestCtr.messageCtr.main}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.messageCtr.main}/${routestCtr.messageCtr.notification}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.messageCtr.main}/${routestCtr.messageCtr.notificationStatus}`,
    method: RequestMethod.PUT,
  },
  {
    path: `/${routestCtr.wsCtr.main}/${routestCtr.wsCtr.token}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.wsCtr.main}/${routestCtr.wsCtr.online}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.userCtr.main}/${routestCtr.userCtr.online}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.messageCtr.main}/${routestCtr.messageCtr.send}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.messageCtr.main}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.channelMessage}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.main}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.messageItem}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.messageItem}`,
    method: RequestMethod.DELETE,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.messages}`,
    method: RequestMethod.PUT,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.messages}`,
    method: RequestMethod.DELETE,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.channelAttachment}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.channelLastSeen}`,
    method: RequestMethod.PUT,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.channelLastSeen}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.statisticCtr.main}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.settingCtr.main}`,
    method: RequestMethod.PUT,
  },
  {
    path: `/${routestCtr.settingCtr.main}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.settingCtr.main}/${routestCtr.settingCtr.channel}`,
    method: RequestMethod.GET,
  },
];
