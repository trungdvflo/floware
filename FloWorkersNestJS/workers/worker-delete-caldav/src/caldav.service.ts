import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import DigestFetch from 'digest-fetch';
import { MSG_ERR_SABREDAV } from '../../common/constants/message.constant';
import { ICalendar, IObjectMoveCalendar } from '../../common/interface/calendar.interface';
import { CalendarObjectsRepository } from '../../common/repository/calendar-objects.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { CommonCollectionService } from '../../common/services/collection.common.service';
import { TimestampDouble } from '../../common/utils/common';
import { decryptRSA } from '../../common/utils/crypto.util';
@Injectable()
export class CaldavService {
  constructor(
    private readonly configService: ConfigService,
    private readonly linksCollectionObjectRepo: LinksCollectionObjectRepository,
    private readonly calObjectsRepo: CalendarObjectsRepository,
    private readonly commonCollectionService: CommonCollectionService,
  ) { }

  private buildRequest(uid: string, calendarUri: string, email: string) {
    const { floDavUrl } = this.configService.get('worker');
    return `${floDavUrl}/calendars/${email}/${calendarUri}/${uid}.ics`;
  }

  private async sendDeleteCalDavRequest(dataCalDav: IObjectMoveCalendar, client){
    try {
      const { userInfo, uid, newCalUri, oldCalendarData, calendarid } = dataCalDav;
      // create new caldav
      const urlNewCalDav = this.buildRequest(uid, newCalUri, userInfo.email);
      const createCalDav = await client.fetch(urlNewCalDav, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': 0,
          'Content-Type': 'text/calendar',
          'x-source': 'floworker'
        },
        method: 'PUT',
        body: oldCalendarData
      });
      if(createCalDav && createCalDav['status'] >= 200) {
        await this.updateLinkedCollection(uid, newCalUri, userInfo.email);
      }
      return true;
    } catch (error) {
      return Error(MSG_ERR_SABREDAV);
    }
  }

  private async updateLinkedCollection(uid: string, calUri: string, email: string) {
    const objHref = `/calendarserver.php/calendars/${email}/${calUri}/${uid}.ics`;
    await this.linksCollectionObjectRepo.update({ object_uid: Buffer.from(uid)} , {
      object_href: objHref,
      updated_date: TimestampDouble()
    });
  }

  public async changeCalendarOfObjects(dataCalendar: ICalendar[]) {
    const { userInfo, calendarUri } = dataCalendar[0];
    const decryptPassCaldav = decryptRSA(userInfo.rsa);
    const client = await new DigestFetch(userInfo.email, decryptPassCaldav);
    try {
      const mergeMoveCalendarData = [];
      // move calendar to omni or belong collection
      for(const itemCalendar of dataCalendar) {
        const moveCalendarData: IObjectMoveCalendar[] =
         await this.commonCollectionService.processForChangeCalendars(itemCalendar);

        if(moveCalendarData.length > 0) {
          await Promise.all(moveCalendarData.map(async (item: IObjectMoveCalendar) => {
            mergeMoveCalendarData.push(item);
          }));
        }
      }
      if(mergeMoveCalendarData.length > 0) {
        const rs = await this.calObjectsRepo.deleteCaldav(mergeMoveCalendarData[0].calendarid);
        /**
         * Keep this code to change solution if it can not rut parallel
         */
        // for(const item of mergeMoveCalendarData) {
        //   item.uid = Buffer.from(item.uid).toString();
        //   // create queue to create and delete caldav through the Sabredav
        //   const decryptPassCaldav = decryptRSA(userInfo.rsa);
        //   const client = new DigestFetch(userInfo.email, decryptPassCaldav);
        //   await this.sendDeleteCalDavRequest(item, client);
        // }
        await Promise.all(mergeMoveCalendarData.map(async (item: IObjectMoveCalendar) => {
          item.uid = Buffer.from(item.uid).toString();
          // create queue to create and delete caldav through the Sabredav
          await this.sendDeleteCalDavRequest(item, client);
        }));
      }
      await Promise.all([
        this.commonCollectionService.deleteCalendarByCalendarUri(calendarUri),
        this.commonCollectionService.deleteCollectionAndLinkedCollection(userInfo.userId)
      ]);

      return true;
    } catch (error) {
      return error;
    }
  }
}