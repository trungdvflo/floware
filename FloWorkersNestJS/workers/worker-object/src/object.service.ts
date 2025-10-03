import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { EntityManager } from 'typeorm';
import { API_LAST_MODIFIED_NAME } from '../../common/constants/api-last-modify.constant';
import { RESET_ORDER_CONFIG } from '../../common/constants/common.constant';
import { OBJ_TYPE, RESET_FUNC, RESET_ORDER_STATUS } from '../../common/constants/sort-object.constant';
import { WORKER_OBJECT } from '../../common/constants/worker.constant';
import { IResetObject, IResetOrderStatus } from '../../common/interface/object.interface';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { ResetOrderCacheKey } from '../../common/utils/common';
import { Graylog } from '../../common/utils/graylog';
@Injectable()
export class ObjectService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly manager: EntityManager,
    private readonly apiLastModifiedService: CommonApiLastModifiedService
  ) { }

  async handleResetOrder(dataJob: IResetObject): Promise<void> {
    const keyResetOrder = ResetOrderCacheKey(dataJob);
    const exist = await this.cache.get(keyResetOrder);
    if (!exist) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_OBJECT.RESET_QUEUE,
        jobName: WORKER_OBJECT.RESET_JOB.NAME,
        message: `job ${dataJob.job_id} has not init`
      });
      return;
    }
    await this.cache.set(
      keyResetOrder,
      { status: RESET_ORDER_STATUS.IN_PROCESS },
      { ttl: RESET_ORDER_CONFIG.REDIS_TTL }
    );
    switch (dataJob.obj_type) {
      case OBJ_TYPE.CANVAS:
        const resetKanbanCard: IResetOrderStatus = {
          api_name: API_LAST_MODIFIED_NAME.KANBAN_CARD,
          reset_fn: RESET_FUNC.KANBAN_CARD
        };
        await this.handleProcessResetOrder(keyResetOrder, resetKanbanCard, dataJob);
        break;
      case OBJ_TYPE.URL:
        const resetUrl: IResetOrderStatus = {
          api_name: API_LAST_MODIFIED_NAME.URL,
          reset_fn: RESET_FUNC.URL
        };
        await this.handleProcessResetOrder(keyResetOrder, resetUrl, dataJob);
        break;
      case OBJ_TYPE.CSFILE:
        const resetCloud: IResetOrderStatus = {
          api_name: API_LAST_MODIFIED_NAME.CLOUD,
          reset_fn: RESET_FUNC.CLOUD
        };
        await this.handleProcessResetOrder(keyResetOrder, resetCloud, dataJob);
        break;
      case OBJ_TYPE.VTODO:
        const resetTodo: IResetOrderStatus = {
          api_name: API_LAST_MODIFIED_NAME.TODO,
          reset_fn: RESET_FUNC.TODO
        };
        await this.handleProcessResetOrder(keyResetOrder, resetTodo, dataJob);
        break;
      case OBJ_TYPE.KANBAN:
        const resetKanban: IResetOrderStatus = {
          api_name: API_LAST_MODIFIED_NAME.KANBAN,
          reset_fn: RESET_FUNC.KANBAN
        };
        await this.handleProcessResetOrder(keyResetOrder, resetKanban, dataJob);
        break;
      default:
        throw Error(`Job reset order not accept type ${dataJob.obj_type}`);
    }
  }

  async handleProcessResetOrder(keyReset: string,
    resetOrder: IResetOrderStatus, dataJob: IResetObject) {
    try {
      const data = await this.manager
        .query(`SELECT ${resetOrder.reset_fn}(?) vReturn`, [dataJob.user_id]);
      if (data[0].vReturn > 0) {
        await this.cache.set(
          keyReset,
          { status: RESET_ORDER_STATUS.DONE },
          { ttl: RESET_ORDER_CONFIG.REDIS_TTL_WHEN_DONE }
        );
        await this.apiLastModifiedService.createLastModify({
          api_name: resetOrder.api_name,
          user_id: dataJob.user_id,
          email: dataJob.email,
          updated_date: data[0].vReturn
        }, true);
      }
    } catch (error) {
      await this.cache.set(
        keyReset,
        { status: RESET_ORDER_STATUS.DONE },
        { ttl: RESET_ORDER_CONFIG.REDIS_TTL }
      );
      Graylog.getInstance().logInfo({
        moduleName: WORKER_OBJECT.RESET_QUEUE,
        jobName: WORKER_OBJECT.RESET_JOB.NAME,
        message: RESET_ORDER_STATUS.DONE,
        fullMessage: error.message
      });
      return error;
    }
  }
}