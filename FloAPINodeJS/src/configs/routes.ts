import { RequestMethod } from '@nestjs/common';

function appendPath(paths: string[]) {
  return paths.join('/');
}

export const routestCtr = {
  addressBookCtr: {
    mainPath: 'address-books',
  },
  apiLastModifiedCtr: {
    mainPath: 'api-last-modified',
  },
  authCtr: {
    mainPath: 'access-token-info',
  },
  autoUpdateCtr: {
    downloadPath: 'downloads',
    versionPath: 'versions',
    downloadMigrated: 'upgrades/flo-mac',
  },
  calendarCtr: {
    mainPath: 'calendars',
    deletePath: 'delete',
  },
  cloudCtr: {
    mainPath: 'clouds',
    deletePath: 'delete',
    sortPath: 'sort',
    resetOrderPath: 'reset-order',
  },
  memberCtr: {
    mainPath: 'share-members',
    byMember: 'member',
    status: 'status',
    unShare: 'un-share'
  },
  collectionCtr: {
    mainPath: 'collections',
    deletePath: 'delete',
  },
  collectionInstanceMemberCtr: {
    mainPath: 'collections-instance-member',
    deletePath: 'delete',
  },
  suggestedCollectionCtr: {
    mainPath: 'suggested-collections',
    deletePath: 'delete',
  },
  systemcollectionCtr: {
    mainPath: 'system-collections',
    deletePath: 'delete',
  },
  subcriptioncollectionCtr: {
    mainPath: 'subscription',
  },
  collectionMemberCtr: {
    mainPath: 'collections-member',
    leaveShare: 'leave-share',
  },
  contactCtr: {
    mainPath: 'contacts',
    deletePath: 'delete',
  },
  deviceTokenCtr: {
    mainPath: 'devicetoken',
    deletePath: 'delete',
    pushPath: 'send-invite',
  },
  dynamicKeyCtr: {
    mainPath: 'dynamic-key',
  },
  eventCtr: {
    mainPath: 'events',
    deletePath: 'delete',
    movePath: 'move',
  },
  fileCtr: {
    mainPath: 'files',
    deletePath: 'delete',
    downloadPath: 'download',
  },
  fileMemberCtr: {
    mainPath: 'file-member',
    deletePath: 'delete',
    uploadPath: 'upload',
    downloadPath: 'download',
  },
  historyCtr: {
    mainPath: 'histories',
    deletePath: 'delete',
  },
  videoHistoryCtr: {
    mainPath: 'call-history',
    inviteePath: 'invitee',
    deletePath: 'delete',
  },
  kanbanCtr: {
    mainPath: 'kanbans',
    deletePath: 'delete',
    sortPath: 'sort',
    resetOrderPath: 'reset-order',
  },
  kanbanCardCtr: {
    mainPath: 'kanban-cards',
    deletePath: 'delete',
    sortPath: 'sort',
    resetOrderPath: 'reset-order',
  },
  linkedCollectionCtr: {
    mainPath: 'linked-collection-objects',
    deletePath: 'delete',
  },
  linkedCollectionMemberCtr: {
    mainPath: 'linked-collection-object-members',
    deletePath: 'delete',
  },
  linkedObjectCtr: {
    mainPath: 'linked-objects',
    deletePath: 'delete',
  },
  metadataEmailCtr: {
    mainPath: 'metadata-emails',
    deletePath: 'delete',
  },
  monitorCtr: {
    mainPath: 'service-status',
  },
  noteCtr: {
    mainPath: 'notes',
    deletePath: 'delete',
    movePath: 'move',
  },
  platFormCtr: {
    mainPath: 'platform-release',
  },
  platFormSettingCtr: {
    mainPath: 'platform-setting',
  },
  platFormSettingDefaultCtr: {
    mainPath: 'platform-setting-defaults',
  },
  recentObjectCtr: {
    mainPath: 'recent-objects',
    deletePath: 'delete'
  },
  settingCtr: {
    mainPath: 'setting',
  },
  objectOrderCtr: {
    mainPath: 'object-orders',
    checkStatusPath: 'check-status',
    resetCheckStatusPath: 'reset-order-check-status',
  },
  thirdPartyAccountCtr: {
    mainPath: 'third-party-account',
    deletePath: 'delete',
  },
  todoCtr: {
    mainPath: 'todos',
    orderPath: 'order',
    sortPath: 'sort',
    resetOrderPath: 'reset-order',
    deleteOrderPath: 'delete-order',
  },
  trackingCtr: {
    mainPath: 'trackings',
    deletePath: 'delete',
  },
  trashCtr: {
    mainPath: 'trashes',
    deletePath: 'delete',
    recoverPath: 'recover',
  },
  trashMemberCtr: {
    mainPath: 'trash-members',
  },
  urlCtr: {
    mainPath: 'urls',
    deletePath: 'delete',
    sortPath: 'sort',
    resetOrderPath: 'reset-order',
  },
  urlMemberCtr: {
    mainPath: 'url-members',
    deletePath: 'delete'
  },
  userCtr: {
    mainPath: 'user',
    signInPath: 'swagger-login',
    profilePath: 'profile',
    terminate: 'terminate'
  },
  userMigrate: {
    trackStatus: 'migrate-status',
    startMigrate: 'start-migrate',
  },
  ManualRuleCtr: {
    mainPath: 'manual-rules',
    deletePath: 'delete',
    executePath: 'executes',
  },
  contactAvatarCtr: {
    mainPath: 'contact-avatar'
  },
  conferencingCtr: {
    mainPath: 'conference',
    validToken: 'valid-token',
    deletePath: 'delete',
    callPhonePath: 'call-phone',
    invitePath: 'send-invite',
    replyPath: 'reply-invite',
    invitePathRealtime: 'send-invite-realtime',
    replyPathRealtime: 'reply-invite-realtime',
    checkChannel: 'check-channel',
    moveChannel: 'move-channel',
    removeAttendee: 'attendees/remove',
    scheduleCall: 'schedule-call'
  },
  conferenceMemberCtr: {
    mainPath: 'conference-members',
    removePath: 'remove'
  },
  protectPageCtr: {
    mainPath: 'check-password-protect'
  },
  conferenceHistoryCtr: {
    mainPath: 'conference-history',
    deletePath: 'delete',
    replyPath: 'reply',
  },
  collectionIconsCtr: {
    mainPath: 'collection-icons'
  },
  commentCtr: {
    mainPath: 'collection-comments',
    deletePath: 'delete',
    mentionPath: 'mentions'
  },
  colHistoryCtr: {
    mainPath: 'collection-histories',
    deletePath: 'delete'
  },
  colActivityCtr: {
    mainPath: 'collection-activities',
  },
  colNotiCtr: {
    mainPath: 'collection-notifications',
    statusPath: 'status',
    deletePath: 'delete',
  },
  fileCommentCtr: {
    mainPath: 'files-comment',
    deletePath: 'delete',
    downloadPath: 'download',
    uploadPath: 'upload',
  },
  conferenceChatCtr: {
    mainPath: 'conference-chat',
    deletePath: 'delete',
    downloadPath: 'download',
    uploadPath: 'upload',
    messagePath: 'messages',
    messageDeletePath: 'messages/delete'
  },
  credentialCtr: {
    mainPath: 'credential',
    deletePath: 'delete',
    saltPath: 'salt',
  },
  chatCtr: {
    main: 'chat',
    message: `messages`,
    getAttachment: `attachments`,
    lastSeen: `last-seen`,
    deleteChat: 'delete',
    download: 'download',
    upload: 'upload',
  },
  communicationCtr: {
    realTime: 'real-time',
    socket: 'socket',
    statistics: 'statistics',
    settings: 'settings',
  },
  clientReportErrorCtr: {
    mainPath: 'client-report-error',
    realtimePath: 'realtime'
  }
};

export const headerNonAuthRoutes = [
  {
    path: `${routestCtr.platFormCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.dynamicKeyCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.userCtr.mainPath}/${routestCtr.userCtr.signInPath}`,
    method: RequestMethod.POST,
  },
  // ========= conferencing =============
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.validToken}`,
    method: RequestMethod.GET,
  }
];

// ======== No authorized routes  ========= //
export const nonAuthRoutes = [
  // ======== Monitor =========
  {
    path: `${routestCtr.monitorCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.autoUpdateCtr.downloadMigrated}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.autoUpdateCtr.downloadPath}`,
    method: RequestMethod.GET,
  },
  // ======== Contact avatar =========
  {
    path: `/${routestCtr.contactAvatarCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  // ========= protect page rules =============
  {
    path: `${routestCtr.protectPageCtr.mainPath}`,
    method: RequestMethod.POST,
  },
];
export const internalRoutes = [
  {
    path: appendPath([
      '',
      routestCtr.ManualRuleCtr.mainPath,
      routestCtr.ManualRuleCtr.executePath
    ]),
    method: RequestMethod.POST,
  },
];
// ======== Authorized routes ========= //
export const externalAuthRoutes = [
  // ======== credential =========
  {
    path: `${routestCtr.credentialCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.credentialCtr.mainPath}/${routestCtr.credentialCtr.saltPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.credentialCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.credentialCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.credentialCtr.mainPath}/${routestCtr.credentialCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ======== Api Last Modified =========
  {
    path: `${routestCtr.apiLastModifiedCtr.mainPath}`,
    method: RequestMethod.GET,
  }, {
    path: `${routestCtr.apiLastModifiedCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  // ======== Auth =========
  {
    path: `${routestCtr.authCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  // ======== Auto Update =========
  {
    path: `${routestCtr.autoUpdateCtr.versionPath}`,
    method: RequestMethod.GET,
  },
  // ======== Subscription  =========
  {
    path: `${routestCtr.subcriptioncollectionCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.subcriptioncollectionCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  // ======== share - member =========
  {
    path: `${routestCtr.memberCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.memberCtr.mainPath}/${routestCtr.memberCtr.byMember}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.memberCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.memberCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.memberCtr.mainPath}/${routestCtr.memberCtr.status}`,
    method: RequestMethod.PUT,
  },
  {
    path: appendPath([
      routestCtr.memberCtr.mainPath,
      routestCtr.memberCtr.unShare
    ]),
    method: RequestMethod.PUT,
  },
  // ======== Clouds =========
  {
    path: `${routestCtr.cloudCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.cloudCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.cloudCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.cloudCtr.mainPath,
      routestCtr.cloudCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.cloudCtr.mainPath,
      routestCtr.cloudCtr.sortPath
    ]),
    method: RequestMethod.PUT,
  },
  {
    path: appendPath([
      routestCtr.cloudCtr.mainPath,
      routestCtr.cloudCtr.resetOrderPath
    ]),
    method: RequestMethod.PUT,
  },
  // ======== Collections =========
  {
    path: `${routestCtr.collectionCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.collectionCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.collectionCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.collectionCtr.mainPath,
      routestCtr.collectionCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Collections instance member =========
  {
    path: `${routestCtr.collectionInstanceMemberCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.collectionInstanceMemberCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.collectionInstanceMemberCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.collectionInstanceMemberCtr.mainPath,
      routestCtr.collectionInstanceMemberCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Suggested Collections =========
  {
    path: `${routestCtr.suggestedCollectionCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.suggestedCollectionCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.suggestedCollectionCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: appendPath([
      routestCtr.suggestedCollectionCtr.mainPath,
      routestCtr.suggestedCollectionCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Subcription  =========
  {
    path: `${routestCtr.subcriptioncollectionCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.subcriptioncollectionCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  // ======== System collections  =========
  {
    path: `${routestCtr.systemcollectionCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.systemcollectionCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.systemcollectionCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: appendPath([
      routestCtr.systemcollectionCtr.mainPath,
      routestCtr.systemcollectionCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Share Collections =========
  {
    path: `${routestCtr.collectionMemberCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.collectionMemberCtr.mainPath,
      routestCtr.collectionMemberCtr.leaveShare
    ]),
    method: RequestMethod.PUT,
  },
  // ======== Contacts =========
  {
    path: `${routestCtr.contactCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.contactCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.contactCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.contactCtr.mainPath}/${routestCtr.contactCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ======== Device Token =========
  {
    path: `${routestCtr.deviceTokenCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.deviceTokenCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.deviceTokenCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.deviceTokenCtr.mainPath}/${routestCtr.deviceTokenCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.deviceTokenCtr.mainPath}/${routestCtr.deviceTokenCtr.pushPath}`,
    method: RequestMethod.POST,
  },
  // ======== File Attachment =========
  {
    path: `${routestCtr.fileCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.fileCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.fileCtr.mainPath}/${routestCtr.fileCtr.downloadPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.fileCtr.mainPath}/${routestCtr.fileCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ======== File Member =========
  {
    path: `${routestCtr.fileMemberCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.fileMemberCtr.mainPath}/${routestCtr.fileMemberCtr.downloadPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.fileMemberCtr.mainPath}/${routestCtr.fileMemberCtr.uploadPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.fileMemberCtr.mainPath}/${routestCtr.fileMemberCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ======== Calling Histories =========
  {
    path: `${routestCtr.videoHistoryCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.videoHistoryCtr.mainPath}/${routestCtr.videoHistoryCtr.inviteePath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.videoHistoryCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.videoHistoryCtr.mainPath}/${routestCtr.videoHistoryCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ======== Contact Histories =========
  {
    path: `${routestCtr.historyCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.historyCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.historyCtr.mainPath}/${routestCtr.historyCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ======== Kanbans =========
  {
    path: `${routestCtr.kanbanCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.kanbanCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.kanbanCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.kanbanCtr.mainPath}/${routestCtr.kanbanCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.kanbanCtr.mainPath}/${routestCtr.kanbanCtr.sortPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.kanbanCtr.mainPath}/${routestCtr.kanbanCtr.resetOrderPath}`,
    method: RequestMethod.PUT,
  },
  // ======== Kanban Cards =========
  {
    path: `${routestCtr.kanbanCardCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.kanbanCardCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.kanbanCardCtr.mainPath}/${routestCtr.kanbanCardCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.kanbanCardCtr.mainPath}/${routestCtr.kanbanCardCtr.sortPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.kanbanCardCtr.mainPath}/${routestCtr.kanbanCardCtr.resetOrderPath}`,
    method: RequestMethod.PUT,
  },
  // ======== Linked Collection Object =========
  {
    path: `${routestCtr.linkedCollectionCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.linkedCollectionCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.linkedCollectionCtr.mainPath,
      routestCtr.linkedCollectionCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Linked Collection for Member Object =========
  {
    path: `${routestCtr.linkedCollectionMemberCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.linkedCollectionMemberCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.linkedCollectionMemberCtr.mainPath,
      routestCtr.linkedCollectionMemberCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Linked Object =========
  {
    path: `${routestCtr.linkedObjectCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.linkedObjectCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.linkedObjectCtr.mainPath,
      routestCtr.linkedObjectCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Metadata Email =========
  {
    path: `${routestCtr.metadataEmailCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.metadataEmailCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.metadataEmailCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.metadataEmailCtr.mainPath,
      routestCtr.metadataEmailCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Platform Setting =========
  {
    path: `${routestCtr.platFormSettingCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.platFormSettingCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.platFormSettingCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  // ======== Platform Setting =========
  {
    path: `/${routestCtr.platFormSettingDefaultCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  // ======== Recent Objects =========
  {
    path: `${routestCtr.recentObjectCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.recentObjectCtr.mainPath,
      routestCtr.recentObjectCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.recentObjectCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  // ======== Global Setting =========
  {
    path: `${routestCtr.settingCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.settingCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  // ======== ​Object Orders =========
  {
    path: appendPath([
      routestCtr.objectOrderCtr.mainPath,
      routestCtr.objectOrderCtr.checkStatusPath
    ]),
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.objectOrderCtr.mainPath,
      routestCtr.objectOrderCtr.resetCheckStatusPath
    ]),
    method: RequestMethod.GET,
  },
  // ======== Third Party Account =========
  {
    path: `${routestCtr.thirdPartyAccountCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.thirdPartyAccountCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.thirdPartyAccountCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.thirdPartyAccountCtr.mainPath,
      routestCtr.thirdPartyAccountCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Todo =========
  {
    path: `${routestCtr.todoCtr.mainPath}/${routestCtr.todoCtr.orderPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.todoCtr.mainPath}/${routestCtr.todoCtr.sortPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.todoCtr.mainPath}/${routestCtr.todoCtr.resetOrderPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.todoCtr.mainPath}/${routestCtr.todoCtr.deleteOrderPath}`,
    method: RequestMethod.POST,
  },
  // ======== Tracking =========
  {
    path: `${routestCtr.trackingCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.trackingCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.trackingCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.trackingCtr.mainPath}/${routestCtr.trackingCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ======== Trash =========
  {
    path: `${routestCtr.trashCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.trashCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.trashCtr.mainPath,
      routestCtr.trashCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.trashCtr.mainPath,
      routestCtr.trashCtr.recoverPath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.trashMemberCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  // ======== URLs =========
  {
    path: `${routestCtr.urlCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.urlCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.urlCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.urlCtr.mainPath,
      routestCtr.urlCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.urlCtr.mainPath,
      routestCtr.urlCtr.sortPath
    ]),
    method: RequestMethod.PUT,
  },
  {
    path: appendPath([
      routestCtr.urlCtr.mainPath,
      routestCtr.urlCtr.resetOrderPath
    ]),
    method: RequestMethod.PUT,
  },
  // ======== URL Members =========
  {
    path: `${routestCtr.urlMemberCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.urlMemberCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.urlMemberCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.urlMemberCtr.mainPath,
      routestCtr.urlMemberCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== User =========
  {
    path: `${routestCtr.userCtr.mainPath}/${routestCtr.userCtr.profilePath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.userCtr.mainPath}/${routestCtr.userCtr.profilePath}`,
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.userCtr.mainPath,
      routestCtr.userCtr.terminate
    ]),
    method: RequestMethod.POST,
  },
  // ========= manual rules =============
  {
    path: `${routestCtr.ManualRuleCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.ManualRuleCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.ManualRuleCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.ManualRuleCtr.mainPath}/${routestCtr.ManualRuleCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ========= conferencing rules =============
  {
    path: `${routestCtr.conferencingCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.scheduleCall}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ========= conference invite =============
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.invitePathRealtime}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.replyPathRealtime}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.invitePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.replyPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.checkChannel}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.moveChannel}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.callPhonePath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferencingCtr.mainPath}/${routestCtr.conferencingCtr.removeAttendee}`,
    method: RequestMethod.POST,
  },

  // ========= conferencing member =============
  {
    path: `${routestCtr.conferenceMemberCtr.mainPath}`,
    method: RequestMethod.GET,
  }, {
    path: `${routestCtr.conferenceMemberCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferenceMemberCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.conferenceMemberCtr.mainPath}/${routestCtr.conferenceMemberCtr.removePath}`,
    method: RequestMethod.PUT,
  },
  // ========= conferencing history member =============
  {
    path: `${routestCtr.conferenceHistoryCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.conferenceHistoryCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferenceHistoryCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.conferenceHistoryCtr.mainPath}/${routestCtr.conferenceHistoryCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.conferenceHistoryCtr.mainPath,
      routestCtr.conferenceHistoryCtr.replyPath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.collectionIconsCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.commentCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.commentCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.commentCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: appendPath([
      routestCtr.commentCtr.mainPath,
      routestCtr.commentCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.commentCtr.mainPath,
      routestCtr.commentCtr.mentionPath
    ]),
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.colHistoryCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.colHistoryCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.colHistoryCtr.mainPath,
      routestCtr.colHistoryCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ========= collection notification =============
  {
    path: `${routestCtr.colNotiCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.colNotiCtr.mainPath}/${routestCtr.colNotiCtr.statusPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: `${routestCtr.colNotiCtr.mainPath}/${routestCtr.colNotiCtr.deletePath}`,
    method: RequestMethod.POST,
  },
  // ========= collection activity =============
  {
    path: `${routestCtr.colActivityCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  // ======== File Comment Attachment =========
  {
    path: appendPath([
      routestCtr.fileCommentCtr.mainPath,
      routestCtr.fileCommentCtr.downloadPath
    ]),
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.fileCommentCtr.mainPath,
      routestCtr.fileCommentCtr.uploadPath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.fileCommentCtr.mainPath,
      routestCtr.fileCommentCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Conference Chat =========
  {
    path: `${routestCtr.conferenceChatCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  {
    path: `${routestCtr.conferenceChatCtr.mainPath}`,
    method: RequestMethod.POST,
  },
  {
    path: `${routestCtr.conferenceChatCtr.mainPath}`,
    method: RequestMethod.PUT,
  },
  {
    path: appendPath([
      routestCtr.conferenceChatCtr.mainPath,
      routestCtr.conferenceChatCtr.downloadPath
    ]),
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.conferenceChatCtr.mainPath,
      routestCtr.conferenceChatCtr.messagePath
    ]),
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.conferenceChatCtr.mainPath,
      routestCtr.conferenceChatCtr.uploadPath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.conferenceChatCtr.mainPath,
      routestCtr.conferenceChatCtr.messagePath
    ]),
    method: RequestMethod.PUT,
  },
  {
    path: appendPath([
      routestCtr.conferenceChatCtr.mainPath,
      routestCtr.conferenceChatCtr.deletePath
    ]),
    method: RequestMethod.POST,
  },
  {
    path: appendPath([
      routestCtr.conferenceChatCtr.mainPath,
      routestCtr.conferenceChatCtr.messageDeletePath
    ]),
    method: RequestMethod.POST,
  },
  // ======== Realtime Chat =========
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.message}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.getAttachment}`,
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.chatCtr.main,
      routestCtr.chatCtr.download
    ]),
    method: RequestMethod.GET,
  },
  {
    path: appendPath([
      routestCtr.chatCtr.main,
      routestCtr.chatCtr.upload
    ]),
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.message}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.deleteChat}`,
    method: RequestMethod.POST,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.message}`,
    method: RequestMethod.PUT,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.lastSeen}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.chatCtr.main}/${routestCtr.chatCtr.lastSeen}`,
    method: RequestMethod.PUT,
  },
  // ======== Real Time ==========
  {
    path: `/${routestCtr.communicationCtr.realTime}/${routestCtr.communicationCtr.socket}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.communicationCtr.realTime}/${routestCtr.communicationCtr.statistics}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.communicationCtr.realTime}/${routestCtr.communicationCtr.settings}`,
    method: RequestMethod.PUT,
  },
  {
    path: `/${routestCtr.communicationCtr.realTime}/${routestCtr.communicationCtr.settings}`,
    method: RequestMethod.GET,
  },
  {
    path: `/${routestCtr.clientReportErrorCtr.mainPath}/${routestCtr.clientReportErrorCtr.realtimePath}`,
    method: RequestMethod.POST
  }
];