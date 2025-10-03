import { Injectable } from '@nestjs/common';
import { ApiLastModifiedName } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { CollectionIcon } from '../../common/entities/collection-icons.entity';
import { IReq } from '../../common/interfaces';
import { CollectionIconsRepository } from '../../common/repositories/collection-icons.repository';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
@Injectable()
export class CollectionIconsService {
  constructor(
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly collectionIconsRepo: CollectionIconsRepository,
  ) { }

  async getAllIcons(filter: BaseGetDTO, { user, headers }: IReq) {
    try {
      const icons: CollectionIcon[] = await this.collectionIconsRepo.getAllIcons({
        userId: user.id,
        filter
      });
      //
      await this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.COLLECTION_ICONS,
        userId: user.id,
        email: user.email,
        updatedDate: await this.collectionIconsRepo.getLastModifyDate()
      }, headers);
      return {
        data: icons.map(ic => {
          if (ic.cdn_url && ic.cdn_url.length) {
            ic.cdn_url = `${process.env.CDN_BASE_URL || ''}${ic.cdn_url}`;
          }
          return ic;
        })
      };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }
}