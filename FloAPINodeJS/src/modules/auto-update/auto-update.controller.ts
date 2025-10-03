import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as AWS from 'aws-sdk';
import { Response } from 'express';
import { CONTENT_TYPE } from '../../common/constants/content-type.constant';
import { ErrorCode } from '../../common/constants/error-code';
import { routestCtr } from '../../configs/routes';
import { AutoUpdateService } from './auto-update.service';
import { GetDownloadDto } from './dtos/download.get.dto';
import { GetVersionDto } from './dtos/version.get.dto';
@ApiTags('Auto Update')
@Controller()
export class AutoUpdateController {
  constructor(private readonly service: AutoUpdateService) {}

  @Get(routestCtr.autoUpdateCtr.downloadPath)
  @ApiOperation({
    summary: 'Download the update file',
    description: 'Download the update file',
  })
  async downloadAutoUpdate(
    @Query() getQuery: GetDownloadDto,
    @Res() res: Response,
  ) {
    try {
      const download = await this.service.downloadAutoUpdate(getQuery);
      if (download.wsa && download.wsa.Body) {
        const dlRes:AWS.S3.GetObjectOutput = download.wsa;
        const contentType = dlRes.ContentType? dlRes.ContentType.toLowerCase(): 'unkown';
        res.set({
          'Content-Disposition': 'attachment; filename="'+download.sourceName+'"',
          'Content-Type': CONTENT_TYPE[contentType] || contentType,
          'Content-Length': (dlRes.Body as Buffer).length,
        });
        const stream = this.service.getReadableStream(dlRes.Body as Buffer);
        return stream.pipe(res);
      } else if (download.code === ErrorCode.REQUEST_SUCCESS) {
        // download redirect from S3
        res.redirect(download.url);
      } else {
        res.status(400).send({ data: download });
      }
    } catch (err) {
      throw err;
    }
  }

  @Get(routestCtr.autoUpdateCtr.versionPath)
  @ApiOperation({
    summary: 'Check for information about new releases available on the system.',
    description: 'Check for information about new releases available on the system.',
  })
  async getLatestReleaseVersion(@Query() getQuery: GetVersionDto, @Req() req): Promise<any> {
    try {
      const res = await this.service.getLatestReleaseVersion(getQuery, req.user);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @Get(routestCtr.autoUpdateCtr.downloadMigrated)
  async downloadMigrated(@Res() res){
    return res.redirect(await this.service.getConfigDownloadLink());
  }
}
