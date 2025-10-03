import { RequestMethod } from '@nestjs/common';

export const routestCtr = {
  meetingCtr: {
    mainPath: 'meetings',
    getPath: ':MeetingId',
    deletePath: ':MeetingId',
    callPhonePath: 'call-phone',
    statisticsPath: 'statistics',
    activityPath: 'activities'
  },
  attendeeMeetingCtr: {
    mainPath: 'meetings/:MeetingId/attendees',
    getPath: ':AttendeeId',
    getListPath: '',
    deletePath: ':AttendeeId',
  },
  attendeeCtr: {
    mainPath: 'attendees',
  },
  apnPushCtr: {
    mainPath: 'devices',
    cancelPath: 'cancel-invite',
    callingPath: 'calling-invite',
  },
  chatCtr: {
    mainPath: 'chatting',
    channelPath: 'channels',
    channelMessages: 'messages',
    messagePath: 'message',
    filePath: 'file',
    getSocketPath: 'signature',
    delete: 'delete',
    addMember: 'members',
    removeMembers: 'remove-members',
  },
  chatIntCtr: {
    mainPath: 'chatting-int',
    generateMember: 'generate-members',
    addMember: 'members',
    getSocketPath: 'websocket',
    messagePath: 'messages',
    messageDeletePath: 'messages/delete',
    removeMember: 'remove-members',
    delete: 'delete',
  },
  channelCtr: {
    mainPath: 'channel',
    statusPath: 'status',
    meetingStatusPath: 'meeting/status'
  },
};

// ======== Authorized routes ========= //
export const authorizedRoutes = [
  // ======== Api chatting Internal =========
  {
    path: `/${routestCtr.chatIntCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.addMember}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.messagePath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.messageDeletePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.generateMember}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.removeMember}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.delete}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.messagePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.messagePath}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatIntCtr.mainPath}/${routestCtr.chatIntCtr.getSocketPath}`,
    method: RequestMethod.GET,
  },
  // ======== Channel status API =========
  {
    path: `/${routestCtr.channelCtr.mainPath}/${routestCtr.channelCtr.statusPath}`,
    method: RequestMethod.GET,
  },
  // ======== Push notification API =========
  {
    path: `/${routestCtr.apnPushCtr.mainPath}/${routestCtr.apnPushCtr.cancelPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.apnPushCtr.mainPath}/${routestCtr.apnPushCtr.callingPath}`,
    method: RequestMethod.POST,
  },
  // ======== Api meeting =========
  {
    path: `/${routestCtr.meetingCtr.mainPath}/${routestCtr.meetingCtr.getPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.meetingCtr.mainPath}/${routestCtr.meetingCtr.statisticsPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.meetingCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.meetingCtr.mainPath}/${routestCtr.meetingCtr.deletePath}`,
    method: RequestMethod.DELETE,
  },
  {
    path: `/${routestCtr.meetingCtr.mainPath}/${routestCtr.meetingCtr.callPhonePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.meetingCtr.mainPath}/${routestCtr.meetingCtr.activityPath}`,
    method: RequestMethod.GET,
  },
  
  // ======== Api attendee =========
  {
    path: `/${routestCtr.attendeeCtr.mainPath}`,
    method: RequestMethod.DELETE,
  },
  {
    path: `/${routestCtr.attendeeCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  // ======== Api chatting =========
  {
    path: `/${routestCtr.chatCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}/${routestCtr.chatCtr.channelPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}/${routestCtr.chatCtr.channelMessages}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}/${routestCtr.chatCtr.getSocketPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}/${routestCtr.chatCtr.messagePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}/${routestCtr.chatCtr.filePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}/${routestCtr.chatCtr.addMember}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}/${routestCtr.chatCtr.removeMembers}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.mainPath}/${routestCtr.chatCtr.delete}`,
    method: RequestMethod.POST,
  },
  // ======== Api attendee meeting =========
  // {
  //   path: `/${routestCtr.attendeeMeetingCtr.mainPath}/${routestCtr.attendeeMeetingCtr.getPath}`,
  //   method: RequestMethod.GET,
  // },
  // {
  //   path: `/${routestCtr.attendeeMeetingCtr.mainPath}/${routestCtr.attendeeMeetingCtr.getListPath}`,
  //   method: RequestMethod.GET,
  // },
  // {
  //   path: `/${routestCtr.attendeeMeetingCtr.mainPath}/${routestCtr.attendeeMeetingCtr.deletePath}`,
  //   method: RequestMethod.DELETE,
  // },
];
