import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MockType, fakeReq } from '../../../../test';
import { DELETED_ITEM_TYPE } from '../../../common/constants';
import { ErrorCode } from "../../../common/constants/error-code";
import {
  MSG_FIND_NOT_FOUND, MSG_ORDER_NUMBER_OUT_OF_RANGE, SortObjectResponseMessage
} from '../../../common/constants/message.constant';
import { BaseGetDTO } from "../../../common/dtos/base-get.dto";
import { Cloud } from '../../../common/entities/cloud.entity';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { LoggerService } from '../../../common/logger/logger.service';
import * as CommonUtil from '../../../common/utils/common';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeleteObjectQueueService } from '../../bullmq-queue/delete-object-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { SortObjectService } from '../../sort-object/sort-object.service';
import { CloudService } from '../cloud.service';
import { CreateCloudDTO } from '../dtos/create-cloud.dto';
import { UpdateCloudDTO } from '../dtos/update-cloud.dto';
import * as Generator from './generator';


const repoMockFactory = jest.fn(() => ({
  save: jest.fn(entity => {
    entity.id = 1;
    return entity;
  }),
  find: jest.fn(entity => entity),
  findOne: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  update: jest.fn(entity => entity),
  metadata: {
    ownColumns: [
      {
        databaseName: 'id'
      },
      {
        databaseName: 'user_id'
      },
      {
        databaseName: 'uid'
      },
      {
        databaseName: 'real_filename'
      },
      {
        databaseName: 'ext'
      },
      {
        databaseName: 'device_uid'
      },
      {
        databaseName: 'bookmark_data'
      },
      {
        databaseName: 'created_date'
      },
      {
        databaseName: 'upload_status'
      },
      {
        databaseName: 'size'
      },
      {
        databaseName: 'updated_date'
      },
    ]
  }
}));

const repoMockDeletedItemFactory: () => MockType<Repository<DeletedItem>> = jest.fn(() => ({}));

const apiLastModifiedServiceMockFactory: () => MockType<ApiLastModifiedQueueService> =
  jest.fn(() => ({ addJob: jest.fn(entity => entity) }));

const deleteObjectQueueServiceMockFactory: () => MockType<DeleteObjectQueueService> =
  jest.fn(() => ({ addMultiJob: jest.fn(entity => entity) }));

const sortObjectServiceMockFactory: (
) => MockType<SortObjectService> = jest.fn(() => ({
  isResetOrderRunning: jest.fn()
}));

describe('CloudService', () => {
  let app: INestApplication;
  let cloundService: CloudService;
  let databaseUtilitiesService: DatabaseUtilitiesService;
  let deletedItemService: DeletedItemService;
  let repo: MockType<Repository<Cloud>>;
  let sortObjectService: SortObjectService;

  const user_id = 1;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudService,
        DeletedItemService,
        LoggerService,
        DatabaseUtilitiesService,
        {
          provide: getRepositoryToken(Cloud),
          useFactory: repoMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(DeletedItem),
          useFactory: repoMockDeletedItemFactory
        },
        {
          provide: SortObjectService,
          useFactory: sortObjectServiceMockFactory,
        },
        {
          // how you provide the injection token in a test instance
          provide: ApiLastModifiedQueueService,
          useFactory: apiLastModifiedServiceMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: DeleteObjectQueueService,
          useFactory: deleteObjectQueueServiceMockFactory
        },
        {
          // how you provide the injection token in a test instance
          provide: DatabaseUtilitiesService,
          useValue: {
            getAll: jest.fn((e) => e),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    cloundService = module.get<CloudService>(CloudService);
    sortObjectService = module.get(SortObjectService);
    deletedItemService = module.get<any>(DeletedItemService);
    databaseUtilitiesService = module.get<any>(DatabaseUtilitiesService);
    repo = module.get(getRepositoryToken(Cloud));
  });

  it('should be defined', () => {
    expect(cloundService).toBeDefined();
  });

  it('should get cloud', async () => {
    const req = {
      page_size: 10,
      has_del: 1,
      modified_gte: 1247872251.212,
      modified_lt: 1247872251.212,
      ids: []
    } as BaseGetDTO;
    databaseUtilitiesService.getAll = jest.fn().mockReturnValue([]);
    deletedItemService.findAll = jest.fn().mockReturnValue([]);
    const result = await cloundService.getAllFiles(req, fakeReq);
    expect(databaseUtilitiesService.getAll).toBeCalledTimes(1);
    expect(databaseUtilitiesService.getAll).toHaveBeenCalledWith({
      userId: fakeReq.user.id,
      filter: req,
      repository: repo
    });
    expect(deletedItemService.findAll).toBeCalledTimes(1);
    expect(deletedItemService.findAll).toHaveBeenCalledWith(user_id, DELETED_ITEM_TYPE.CSFILE, {
      modified_gte: req.modified_gte,
      modified_lt: req.modified_lt,
      ids: req.ids,
      page_size: req.page_size
    });

    expect(result).toMatchObject({
      data: [],
      data_del: []
    });
  });

  it('should create cloud but having error worker is running', async () => {
    const data = [
      {
        "bookmark_data": "Ym9vazwDAAAAAAQQMAAAAJy2yEyU9",
        "real_filename": "Screenshot_2018-02-22_11-08-14.png",
        "ext": "png",
        "device_uid": "D735AC90-F13C-4F68-AFC4-92D23B1C8302",
        "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C",
        "size": 123456
      }
    ];
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);
    const result = await cloundService.createCloud(data, fakeReq);
    expect(result.itemFail[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
  });

  it('should create cloud but having error out of order', async () => {
    const data = [
      {
        "bookmark_data": "Ym9vazwDAAAAAAQQMAAAAJy2yEyU9",
        "real_filename": "Screenshot_2018-02-22_11-08-14.png",
        "ext": "png",
        "device_uid": "D735AC90-F13C-4F68-AFC4-92D23B1C8302",
        "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C",
        "size": 123456
      }
    ];

    jest.spyOn(CommonUtil, 'getMinTable').mockResolvedValueOnce(-9999999);
    const result = await cloundService.createCloud(data, fakeReq);
    expect(result.itemFail[0].message).toEqual(MSG_ORDER_NUMBER_OUT_OF_RANGE);
  });

  it('should create cloud', async () => {
    const data = [
      {
        "bookmark_data": "Ym9vazwDAAAAAAQQMAAAAJy2yEyU9",
        "real_filename": "Screenshot_2018-02-22_11-08-14.png",
        "ext": "png",
        "device_uid": "D735AC90-F13C-4F68-AFC4-92D23B1C8302",
        "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C",
        "size": 123456
      },
      {
        "bookmark_data": "Ym9vazwDAAAAAAQQMAAAAJy2yEyU9",
        "real_filename": "Screenshot_2018-02-22_11-08-14.png",
        "ext": "png",
        "device_uid": "D735AC90-F13C-4F68-AFC4-92D23B1C830B",
        "ref": "e33c1b9a-8ee7-46d0-82e1-543cebc138fe",
        "size": 123456
      }
    ];
    // const firstFailItem = { code: ErrorCode.BAD_REQUEST,
    //   message: 'Create failed', attributes: data[0] };
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(false);
    const mock = jest.spyOn(CommonUtil, 'getMinTable');
    mock.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

    repo.insert = jest.fn().mockReturnValue({
      generatedMaps: [
        {
          id: 33785,
          order_number: -49.0851,
          order_update_time: 1655888103.36
        }, {
          id: 33786,
          order_number: -50.1137,
          order_update_time: 1655888103.361
        }
      ]
    });

    const result = await cloundService.createCloud(data, fakeReq);
    expect(repo.insert).toBeCalledTimes(1);
  });

  it('should update cloud and fail all items', async () => {
    let data = [
      {
        "id": 1,
        "bookmark_data": "Ym9vazwDAAAAAAQQMAAAAJy2yEyU9",
        "real_filename": "Screenshot_2018-02-22_11-08-14.png",
        "ext": "png",
        "device_uid": "D735AC90-F13C-4F68-AFC4-92D23B1C830B",
        "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C",
        "size": 123456
      }
    ];
    data = [...data, ...data];
    const firstFailItem = {
      code: ErrorCode.CLOUD_NOT_FOUND,
      message: MSG_FIND_NOT_FOUND,
      attributes: data[0]
    };
    const secondFailItem = {
      code: ErrorCode.BAD_REQUEST,
      message: 'update fail',
      attributes: data[1]
    };
    cloundService.findItem = jest.fn().mockReturnValueOnce(null)
      .mockRejectedValueOnce({ message: 'update fail' });
    const result = await cloundService.updateCloud(data, fakeReq);
    expect(cloundService.findItem).toBeCalledTimes(2);
    expect(result.itemFail[0]).toEqual(firstFailItem);
    expect(result.itemFail[1]).toEqual(secondFailItem);
    expect(result.itemPass).toEqual([]);
  });

  it('should delete cloud', async () => {
    const data = [{ "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }];
    cloundService.findItem = jest.fn().mockReturnValueOnce(null)
      .mockReturnValueOnce(true).
      mockReturnValueOnce(true).mockRejectedValueOnce({ message: 'fail' });
    deletedItemService.create = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    repo.delete = jest.fn().mockReturnValueOnce(true);
    const result = await cloundService.deleteCloud(data, fakeReq);
    expect(cloundService.findItem).toBeCalledTimes(4);
    expect(deletedItemService.create).toBeCalledTimes(2);
    expect(result.itemFail.length).toEqual(3);
    expect(result.itemPass.length).toEqual(1);
  });

  it('should create new cloud and fail by having running reset order', async () => {
    const fakedData = Generator.fakeCreatedCloud();
    sortObjectService.isResetOrderRunning = jest.fn().mockResolvedValueOnce(true);
    const result = await cloundService.createCloud(fakedData as CreateCloudDTO[], fakeReq);
    expect(result.itemFail).toHaveLength(1);
    expect(result.itemFail[0].message).toEqual(SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS);
  });

  it('should update cloud', async () => {
    const fakedUpdateData = Generator.fakeUpdateCloud();
    cloundService.findItem = jest.fn().mockResolvedValueOnce(fakedUpdateData[0])
      .mockResolvedValueOnce(fakedUpdateData[0]);
    repo.save = jest.fn();
    const result = await cloundService.updateCloud(fakedUpdateData as UpdateCloudDTO[], fakeReq);
    const { real_filename, ext, device_uid, bookmark_data } = result.itemPass[0];
    expect(result.itemPass).not.toBeNull();
    expect(real_filename).toEqual(fakedUpdateData[0].real_filename);
    expect(ext).toEqual(fakedUpdateData[0].ext);
    expect(device_uid).toEqual(fakedUpdateData[0].device_uid);
    expect(bookmark_data).toEqual(fakedUpdateData[0].bookmark_data);
  });

  afterAll(async () => {
    await app.close();
  });
});
