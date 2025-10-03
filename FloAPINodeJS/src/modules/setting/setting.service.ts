import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, LessThan, Repository } from 'typeorm';
import { ApiLastModifiedName, IS_TRASHED } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ERR_LINK, MSG_ERR_NOT_EXIST } from '../../common/constants/message.constant';
import { Collection, GlobalSetting } from '../../common/entities';
import { IReq } from '../../common/interfaces';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { filterGetAllFields } from "../../common/utils/typeorm.util";
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { GetGlobalSettingDto } from './dto/get-global-setting.dto';
import { UpdateGlobalSettingDto } from './dto/update-global-setting.dto';

@Injectable()
export class GlobalSettingService {
  constructor(
    @InjectRepository(GlobalSetting) private readonly settingRepo: Repository<GlobalSetting>,
    @InjectRepository(Collection) private readonly collectionRepo: Repository<Collection>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService) { }

  async findAll(userId: number, filter: GetGlobalSettingDto) {
    try {
      const fields = filterGetAllFields(this.settingRepo, filter.fields);
      const conditionQuery: FindOneOptions = {
        where: { user_id: userId }
      };

      if (fields && fields.length > 0) {
        conditionQuery.select = fields;
      }
      const allData = await this.settingRepo.findOne(conditionQuery);
      return {
        data: allData
      };
    } catch (err) {
      throw err;
    }
  }

  async checkCollectionExisted(collectionId: number, userId: number,
    item: UpdateGlobalSettingDto) {
    const isCollection = await this.collectionRepo.findOne({
      select: ['id'],
      where: {
        id: collectionId,
        user_id: userId,
        is_trashed: IS_TRASHED.NOT_TRASHED
      }
    });
    if (!isCollection) {
      const error = {
        attributes: item,
        code: ErrorCode.BAD_REQUEST,
        message: MSG_ERR_LINK.COLLECTION_NOT_EXIST,
      };

      throw new BadRequestException(error);
    }
  }

  async updateSetting(item: UpdateGlobalSettingDto, { user, headers }: IReq) {
    try {
      const currentTime = getUtcMillisecond();
      const dateItem = getUpdateTimeByIndex(currentTime, 0);
      const itemdSetting = await this.settingRepo.findOne({
        where: { user_id: user.id }
      });
      if (!itemdSetting) {
        const error = {
          attributes: item,
          code: ErrorCode.INVALID_DATA,
          message: MSG_ERR_NOT_EXIST,
        };

        throw new BadRequestException(error);
      }

      // check collection id is existed
      if (item.todo_collection_id > 0) {
        await this.checkCollectionExisted(item.todo_collection_id, user.id, item);
      }
      if (item.note_collection_id > 0) {
        await this.checkCollectionExisted(item.note_collection_id, user.id, item);
      }

      // Check folderId (collection id) is root or not.
      if (item.default_folder > 0) {
        const isParent = await this.collectionRepo.findOne({
          select: ['calendar_uri'],
          where: {
            id: item.default_folder,
            parent_id: 0,
            user_id: user.id,
            type: LessThan(3),
          }
        });
        /*
         * remove validate Default collection
         * https://www.pivotaltracker.com/n/projects/2350530/stories/186297829
        if (!isParent) {
          const error = {
            attributes: item,
            code: ErrorCode.BAD_REQUEST,
            message: MSG_COLECTION_NOT_ROOT,
          };
          throw new BadRequestException(error);
        }
         */
        // set default_cal is calendar_url of collection
        item['default_cal'] = isParent?.calendar_uri ? isParent.calendar_uri : "";
      }
      const entityUpdate = this.settingRepo.create({
        ...itemdSetting,
        ...item,
        updated_date: dateItem,
      });
      const updateItem: GlobalSetting = await this.settingRepo.save(entityUpdate);
      // send last modify
      if (updateItem) {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.SETTING,
          userId: user.id,
          email: user.email,
          updatedDate: dateItem
        }, headers);
      }
      return {
        data: updateItem
      };
    } catch (err) {
      throw err;
    }
  }

  async findOneByUserId(userId: number, options?: any) {
    return await this.settingRepo.findOne({
      select: options?.fields,
      where: {
        user_id: userId
      }
    });
  }
}
