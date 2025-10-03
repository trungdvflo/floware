import { InjectQueue } from '@nestjs/bull';
import { Injectable, Optional } from '@nestjs/common';
import { Queue } from 'bull';
import { In } from 'typeorm';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import {
  COLLECTION_TYPE, IS_TRASHED,
  OBJ_TYPE,
  SABREDAV_URL
} from '../../common/constants/common.constant';
import { WORKER_CALDAV_QUEUE, WORKER_KANBAN } from '../../common/constants/worker.constant';
import { ICalendar } from '../../common/interface/calendar.interface';
import { IChildCollection } from '../../common/interface/collection.interface';
import { GetOptionInterface } from '../../common/interface/typeorm.interface';
import { KanbanEntity } from '../../common/models/kanban.entity';
import {
  LinkedCollectionObjectEntity
} from '../../common/models/linked-collection-object.entity';
import { EventRepository } from '../../common/repository/event.repository';
import { KanbanRepository } from '../../common/repository/kanban.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { NoteRepository } from '../../common/repository/note.repository';
import { TodoRepository } from '../../common/repository/todo.repository';
import { CommonCollectionService } from '../../common/services/collection.common.service';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { groupArrayOfObjects } from '../../common/utils/common';
@Injectable()
export class CollectionChildService {
  private readonly kanbanMQQueue: RabbitMQQueueService;
  private readonly calDavMQQueue: RabbitMQQueueService;
  constructor(
    @Optional()
    @InjectQueue(WORKER_KANBAN.DELETE_QUEUE)
    private kanbanQueue: Queue | null,
    @Optional()
    @InjectQueue(WORKER_CALDAV_QUEUE.QUEUE)
    private calDavQueue: Queue | null,
    private readonly kanbanRepo: KanbanRepository,
    private readonly todoRepo: TodoRepository,
    private readonly eventRepo: EventRepository,
    private readonly noteRepo: NoteRepository,
    private readonly linksCollectionObjectRepo: LinksCollectionObjectRepository,
    private readonly commonCollectionService: CommonCollectionService,
  ) {
    this.kanbanMQQueue = new RabbitMQQueueService(
      { name: WORKER_KANBAN.DELETE_QUEUE });
    this.calDavMQQueue = new RabbitMQQueueService(
      { name: WORKER_CALDAV_QUEUE.QUEUE });
  }

  async handleDeleteCollectionChild(data: IChildCollection) {
    try {
      const { userInfo, collectionId, collectionType } = data;
      // get list kanban ids by collection and update is_trash = 2
      const kanbanOption: GetOptionInterface<KanbanEntity> = {
        fields: ['id', 'user_id'],
        conditions: {
          collection_id: collectionId
        }
      };
      const itemKanbans = await this.kanbanRepo
        .getAllByOptions(kanbanOption);
      const kanbanIds = itemKanbans.map(k => k.id);
      const is_rabbitmq = rabbitmqConfig().enable;
      if (kanbanIds && kanbanIds.length > 0) {
        await this.kanbanRepo.update({ id: In(kanbanIds) }, { is_trashed: IS_TRASHED.DELETED });
        // create queue delete kanban
        if (collectionType === COLLECTION_TYPE.SHARE_COLLECTION) {
          const groupUsers = groupArrayOfObjects(itemKanbans, "user_id");
          for (const key in groupUsers) {
            if (key) {
              const kanbanUsers = groupUsers[key];
              if (kanbanUsers && kanbanUsers.length > 0) {
                const kanbanUserIds = kanbanUsers.map(k => k.id);
                const user_id = kanbanUsers[0].user_id;
                if (is_rabbitmq) {
                  this.kanbanMQQueue.addJob(WORKER_KANBAN.DELETE_JOB.NAME, {
                    userId: user_id,
                    kanbanIds: kanbanUserIds
                  });
                } else {
                  this.kanbanQueue.add(WORKER_KANBAN.DELETE_JOB.NAME, {
                    userId: user_id,
                    kanbanIds: kanbanUserIds
                  });
                }
              }
            }
          }
        } else {
          if (is_rabbitmq) {
            this.kanbanMQQueue.addJob(WORKER_KANBAN.DELETE_JOB.NAME, {
              userId: userInfo.userId,
              kanbanIds
            });
          } else {
            this.kanbanQueue.add(WORKER_KANBAN.DELETE_JOB.NAME, {
              userId: userInfo.userId,
              kanbanIds
            });
          }
        }
      }

      /* handle delete web data
       * step 1: get note, todo event data by calendar id
       * step 2: create queue to handle each type of collection
      */
      const webDataCalendar = [];
      const linkCalendarUri = `${SABREDAV_URL}${userInfo.email}/${data.calendarUri}`;
      const calTodoObjs = await this.todoRepo.getAllTodoByUri(linkCalendarUri, userInfo.userId);
      if (calTodoObjs && calTodoObjs.length > 0) {
        // add object into data
        const dataCalendar: ICalendar = {
          calendarObjects: calTodoObjs,
          ...data
        };
        webDataCalendar.push(dataCalendar);
      }

      const calEventObjs = await this.eventRepo.getAllEventByUri(linkCalendarUri, userInfo.userId);
      if (calEventObjs && calEventObjs.length > 0) {
        // add object into data
        const dataCalendar: ICalendar = {
          calendarObjects: calEventObjs,
          ...data
        };
        webDataCalendar.push(dataCalendar);
      }

      const calNoteObjs = await this.noteRepo.getAllNoteByUri(linkCalendarUri, userInfo.userId);
      if (calNoteObjs && calNoteObjs.length > 0) {
        // add object into data
        const dataCalendar: ICalendar = {
          calendarObjects: calNoteObjs,
          ...data
        };
        webDataCalendar.push(dataCalendar);
      }
      if (webDataCalendar && webDataCalendar.length > 0) {
        if (is_rabbitmq) {
          await this.calDavMQQueue.addJob(WORKER_CALDAV_QUEUE.CALDAV_JOB.NAME, webDataCalendar);
        } else {
          await this.calDavQueue.add(WORKER_CALDAV_QUEUE.CALDAV_JOB.NAME, webDataCalendar);
        }
      } else {
        const optionLinkColObject: GetOptionInterface<LinkedCollectionObjectEntity> = {
          fields: ['object_uid', 'object_type'],
          conditions: {
            collection_id: collectionId
          }
        };
        const linkColObject =
          await this.linksCollectionObjectRepo.getAllByOptions(optionLinkColObject);
        if (linkColObject && linkColObject.length > 0) {
          const dataCalendarNoBelong = [];
          await Promise.all(linkColObject.map(async (item: LinkedCollectionObjectEntity) => {
            const webData = await this.handleWebCaldavNoBelong(item, userInfo.userId);
            if (webData && webData.length > 0) {
              // add object into data
              const dataCalendar: ICalendar = {
                calendarObjects: webData,
                ...data
              };
              dataCalendarNoBelong.push(dataCalendar);
            }
          }));
          if (dataCalendarNoBelong.length > 0) {
            if (is_rabbitmq) {
              await this.calDavMQQueue.addJob(
                WORKER_CALDAV_QUEUE.CALDAV_JOB.NAME, dataCalendarNoBelong);
            } else {
              await this.calDavQueue.add(
                WORKER_CALDAV_QUEUE.CALDAV_JOB.NAME, dataCalendarNoBelong);
            }
          }
          // delete calendar instance
          await this.commonCollectionService.deleteCalInstanceByCalUri(data.calendarUri);
        } else {
          await Promise.all([
            this.commonCollectionService.deleteCalendarByCalendarUri(data.calendarUri),
            this.commonCollectionService.deleteCollectionAndLinkedCollection(userInfo.userId)
          ]);
        }
      }
    } catch (error) {
      return error;
    }
  }

  async handleWebCaldavNoBelong(itemLinkColObject: LinkedCollectionObjectEntity, userId: number) {
    const { object_type, object_uid } = itemLinkColObject;
    if (object_type === OBJ_TYPE.VTODO) {
      return await this.todoRepo.getAllTodoObjUid(object_uid, userId);
    }
    if (object_type === OBJ_TYPE.VJOURNAL) {
      return await this.noteRepo.getAllNoteObjUid(object_uid, userId);
    }
    if (object_type === OBJ_TYPE.VEVENT) {
      return await this.eventRepo.getAllEventObjUid(object_uid, userId);
    }
  }
}