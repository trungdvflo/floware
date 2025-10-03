import { Injectable } from '@nestjs/common';
import {
  CALDAV_OBJ_TYPE,
  CARDAV_OBJ_TYPE,
  DEFAULT_CALENDAR_TIMEZONE, IS_TRASHED, SABREDAV_SHARED
} from '../constants/common.constant';
import { ICalendar, IObjectMoveCalendar } from '../interface/calendar.interface';
import { GetOptionInterface } from '../interface/typeorm.interface';
import { CalendarInstanceEntity } from '../models/calendar-instance.entity';
import { CollectionEntity } from '../models/collection.entity';
import { CalendarInstanceRepository } from '../repository/calendar-instance.repository';
import { CalendarRepository } from '../repository/calendar.repository';
import { CollectionRepository } from '../repository/collection.repository';
import { LinksCollectionObjectRepository } from '../repository/links-collection-object.repository';
import { SettingRepository } from '../repository/setting.repository';
@Injectable()
export class CommonCollectionService {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly settingRepo: SettingRepository,
    private readonly calendarRepo: CalendarRepository,
    private readonly calendarInstanceRepo: CalendarInstanceRepository,
    private readonly linksCollectionObjectRepo: LinksCollectionObjectRepository,
  ) { }

  async deleteCalInstanceByCalUri(calendarUri: string): Promise<void> {
    await this.calendarInstanceRepo.delete({uri: calendarUri});
  }

  async deleteCalendarByCalendarUri(calendarUri: string) {
    const calInstanceOption: GetOptionInterface<CalendarInstanceEntity> = {
      fields: ['id', 'calendarid'],
      conditions: {
        uri: calendarUri
      }
    };
    const calInstance = await this.calendarInstanceRepo.getItemByOptions(calInstanceOption);
    if(!calInstance) return;
    const result = await this.calendarRepo.delete(calInstance.calendarid);
    if(result.affected === 1) {
      await calInstance.remove();
    }
  }

  async deleteCollectionAndLinkedCollection( user_id: number) {
    await Promise.all([
      this.collectionRepo.delete({
        user_id, is_trashed: IS_TRASHED.DELETED
      }),
      this.linksCollectionObjectRepo.delete({
        user_id, is_trashed: IS_TRASHED.DELETED
      })
    ]);
  }

  async processForChangeCalendars(dataCalendar: ICalendar) {
    const { collectionId, calendarObjects, userInfo } = dataCalendar;
    const moveCalendarParams: IObjectMoveCalendar[] = [];
    if (calendarObjects && calendarObjects.length > 0) {
      for (const itemCalendar of calendarObjects) {
        let newCalId: number;
        let newCalUri: string;
        if (itemCalendar.linkedCount === 2) {
          const colId = itemCalendar.linked.split(',').find(l => +l !== collectionId);
          const colLinked: CollectionEntity = await this.collectionRepo.getItemByOptions({
            fields: ['color', 'calendar_uri', 'parent_id', 'name'],
            conditions: { id: colId }
          });
          if (!colLinked) {
            return;
          }
          const result = await this._getOrCreateCalendar(userInfo.email, colLinked);
          newCalId = result['calendarId'] || 0;
          newCalUri = colLinked.calendar_uri;
        } else {
          const setting =
            await this.settingRepo.getItemByOptions({
              fields: ['default_folder', 'default_cal', 'omni_cal_id'],
              conditions: { user_id: userInfo.userId }
            });
          const omniCalendarOption: GetOptionInterface<CalendarInstanceEntity> = {
            fields: ['id'],
            conditions: {
              uri: setting.omni_cal_id
            }
          };
          const omniCalendar =
           await this.calendarInstanceRepo.findOneByCalendarUri(omniCalendarOption);
          newCalId = omniCalendar.id;
          newCalUri = setting.omni_cal_id;
        }
        moveCalendarParams.push({
          userInfo: {
            userId: userInfo.userId,
            email: userInfo.email,
            rsa: userInfo.rsa
          },
          uid: itemCalendar.uid,
          calendarid: itemCalendar.calendarid,
          oldCalUri: dataCalendar.calendarUri,
          compType: itemCalendar.objectType as CALDAV_OBJ_TYPE | CARDAV_OBJ_TYPE,
          oldCalendarData: itemCalendar.oldCalendarData,
          newCalUri,
          newCalId
        });
      }
    }
    return moveCalendarParams;
  }

  private async _getOrCreateCalendar(userEmail: string, colLinked: CollectionEntity) {
    try {
      // get calendar id of collection linked
      const calendarLinked: CalendarInstanceEntity =
      await this.calendarInstanceRepo.getItemByOptions({
        fields: ['calendarid', 'principaluri'],
        conditions: { uri: colLinked.calendar_uri }
      });
      let calendarId: number;
      if(!calendarLinked) {
        const { parent_id, name, calendar_uri, color } = colLinked;
        const calName = (await this.buildCalendarNameByCollectionId(parent_id, name)) || '';
        const _principaluri = `principals/${userEmail}`;
        // check item existed with calendarUri
        calendarId = await this.createCalendarByCalUri(calendar_uri, {
          calendarcolor: color,
          description: calName,
          displayname: calName,
          principaluri: _principaluri
        });
      } else {
        calendarId = calendarLinked.calendarid;
      }
      return calendarId;
    } catch (error) {
      throw error;
    }
  }

  async createCalendarByCalUri(calUri: string, calendarInstanceItem) {

    const calendar = await this.calendarRepo.createCalendar();
    await this.calendarInstanceRepo.createCalendarInstance({
      ...calendarInstanceItem,
      calendarid: calendar.id,
      uri: calUri,
      access: 1,
      share_invitestatus: SABREDAV_SHARED.INVITEE,
      share_href: null,
      share_displayname: null,
      transparent: 0,
      timezone: DEFAULT_CALENDAR_TIMEZONE,
      calendarorder: 0
    });
    return calendar.id;
  }

  async buildCalendarNameByCollectionId(collectionId: number, initialName: string | null)
    : Promise<string> {
    const buildNameRecursive = async (colId, name) => {
      if (!colId) return name;
      const collection = await this.collectionRepo.getItemByOptions({
        fields: ['parent_id', 'name'],
        conditions: { id: collectionId }
      });
      if (!collection) {
        return name;
      }
      if (collection.parent_id) {
        return buildNameRecursive(collection.parent_id, name
          ? `${collection.name}/${name}`
          : collection.name);
      }
      return name ? `${collection.name}/${name}` : collection.name;
    };
    return buildNameRecursive(collectionId, initialName);
  }
}