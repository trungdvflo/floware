import { RequestMethod } from '@nestjs/common';

function appendPath(paths: string[]) {
  return paths.join('/');
}

export const routestCtr = {
  apiLastModifiedCtr: {
    mainPath: 'api-last-modified',
  },
  authCtr: {
    mainPath: 'access-token-info',
  },
  fileCtr: {
    mainPath: 'files',
    deletePath: 'delete',
    downloadPath: 'download',
  },
  fileCommentCtr: {
    mainPath: 'files-comment',
    deletePath: 'delete',
    downloadPath: 'download',
    uploadPath: 'upload',
  },
  monitorCtr: {
    mainPath: 'service-status',
  },
};

export const headerNonAuthRoutes = [
];
// ======== No authorized routes  ========= //
export const nonAuthRoutes = [
  // ======== Monitor =========
  {
    path: `${routestCtr.monitorCtr.mainPath}`,
    method: RequestMethod.GET,
  },
];
export const internalRoutes = [
];
// ======== Authorized routes ========= //
export const externalAuthRoutes = [
  // ======== Api Last Modified =========
  {
    path: `${routestCtr.apiLastModifiedCtr.mainPath}`,
    method: RequestMethod.GET,
  },
  // ======== Auth =========
  {
    path: `${routestCtr.authCtr.mainPath}`,
    method: RequestMethod.GET,
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
];
