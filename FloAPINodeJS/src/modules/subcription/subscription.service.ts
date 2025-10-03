import { Injectable } from '@nestjs/common';
import { ApiLastModifiedName } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ERR_NOT_EXIST } from '../../common/constants/message.constant';
import { ErrorDTO } from '../../common/dtos/error.dto';
import { SubscriptionEntity } from '../../common/entities/subscription.entity';
import { IReq } from '../../common/interfaces';
import { GetOptionInterface } from '../../common/interfaces/collection.interface';
import { SubscriptionPurchaseRepository, SubscriptionRepository } from '../../common/repositories/subscription.repository';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { CreateSubcriptionDTO } from './dtos/subcription.post.dto';
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subcriptionPurchaseRepo: SubscriptionPurchaseRepository,
    private readonly subcriptionRepo: SubscriptionRepository,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService
  ) { }

  async getAllFiles({ user, headers }: IReq) {
    try {
      const data = await this.subcriptionRepo.getSubscriptionUser(user.id);
      return {
        data
      };
    } catch (error) {
      return new ErrorDTO({
        code: ErrorCode.INVALID_SUBCRIPTION,
        message: error.sqlMessage,
      });
    }
  }

  async create(dto: CreateSubcriptionDTO, { user, headers }: IReq) {
    try {
      const subOption: GetOptionInterface<SubscriptionEntity> = {
        fields: ['id'],
        conditions: {
          id: dto.sub_id
        }
      };
      // check transaction and recipt valid or not
      const existSubId = await this.subcriptionRepo.getSubscriptionByOptions(subOption);
      if (!existSubId) {
        throw new ErrorDTO({
          code: ErrorCode.INVALID_SUBCRIPTION,
          message: MSG_ERR_NOT_EXIST,
          attributes: dto
        });
      }
      // save data
      const subcriptionData = await this.subcriptionPurchaseRepo
        .createnAndUpdateStatusSubcriptionPurchase(user.id, dto);
      if (subcriptionData) {
        if (dto.ref) subcriptionData['ref'] = dto.ref;
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.SUBSCRIPTION,
          userId: user.id,
          email: user.email,
          updatedDate: subcriptionData['updated_date']
        }, headers);
      }
      return { data: subcriptionData };
    } catch (err) {
      return {
        error: err,
      };
    }
  }
}
// TODO: use this code if we have feature charge by APPLE
// Verify receipt_data with Apple, if it is OK, will save transaction to DB, it's unique
// Call to check with Apple here
// const bodyTest = {
//   'receipt-data': dto.receipt_data,
//   'password': cfgApp().passTestSanbox
// };
// const rs = await this.httpClient.post(sanboxUrl, bodyTest).toPromise();
// if( rs.data.status > 0) {
//   throw new ErrorDTO({
//     code: ErrorCode.INVALID_SUBCRIPTION,
//     message: APPLE_CODE[rs.data.status],
//   });
// }