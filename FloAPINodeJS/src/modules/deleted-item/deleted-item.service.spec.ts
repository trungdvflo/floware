import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockType } from 'test';
import { Repository } from 'typeorm';
import { DELETED_ITEM_TYPE } from '../../common/constants/common';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { DeletedItemService } from './deleted-item.service';


const ENTITY_ALIAS = 'deletedItem';

// @ts-ignore
const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
  find: jest.fn(entity => entity),
  findOne: jest.fn(entity => entity),
  save: jest.fn(entity => entity),
  metadata: { name: ENTITY_ALIAS, ownColumns: [] },
  update: jest.fn(entity => entity),
  create: jest.fn(entity => entity),
  createQueryBuilder: jest.fn(e => e)
}));

describe('DeletedItemService', () => {
  let app: INestApplication;
  let deletedItemRepository: MockType<Repository<DeletedItem>>;
  let deletedItemService: DeletedItemService;
  let createQueryBuilder: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletedItemService,
      {
          provide: getRepositoryToken(DeletedItem),
          useFactory: repositoryMockFactory
        }
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    deletedItemRepository = module.get(getRepositoryToken(DeletedItem));
    deletedItemService = module.get<DeletedItemService>(DeletedItemService);
    createQueryBuilder = {
      select: jest.fn(entity => createQueryBuilder),
      where: jest.fn(entity => createQueryBuilder),
      andWhere: jest.fn(entity => createQueryBuilder),
      orderBy: jest.fn(entity => createQueryBuilder),
      getMany: jest.fn(entity => entity),
      limit: jest.fn(entity => createQueryBuilder),
      addOrderBy: jest.fn(entity => createQueryBuilder),
      groupBy: jest.fn(entity => createQueryBuilder),
      addGroupBy: jest.fn(entity => createQueryBuilder),
      addSelect: jest.fn(entity => createQueryBuilder),
    };
    deletedItemRepository.createQueryBuilder = jest.fn(() => createQueryBuilder);
  });

  it('should be defined', () => {
    expect(deletedItemService).toBeDefined();
  });

  it('should return empty array', async () => {
    createQueryBuilder.getMany.mockReturnValue([]);

    const result = await deletedItemService.findAll(0, DELETED_ITEM_TYPE.VTODO, {
      modified_gte: 2,
      modified_lt: 1,
      page_size: 1
    });

    expect(deletedItemRepository.createQueryBuilder).toBeCalledTimes(1);
    // expect(createQueryBuilder.addSelect).toBeCalledTimes(1);
    expect(createQueryBuilder.where.mock.calls)
      .toEqual([[`${ENTITY_ALIAS}.user_id = :userId`, {userId: 0}]]);
    expect(createQueryBuilder.where).toBeCalledTimes(1);
    expect(createQueryBuilder.andWhere).toBeCalledTimes(3);
    expect(createQueryBuilder.andWhere.mock.calls)
      .toEqual([
        [`${ENTITY_ALIAS}.item_type = :itemType`, {itemType: DELETED_ITEM_TYPE.VTODO}],
        [`${ENTITY_ALIAS}.updated_date < :modified_lt`, {modified_lt: 1}],
        [`${ENTITY_ALIAS}.updated_date >= :modified_gte`, {modified_gte: 2}]
      ]);
    expect(createQueryBuilder.limit).toBeCalledTimes(1);
    expect(createQueryBuilder.limit).toBeCalledWith(1);
    expect(createQueryBuilder.getMany).toBeCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result).not.toBeNull();
    expect(result).toHaveLength(0);
    expect(result).toHaveLength(0);
  });

  it('should return deleted item array', async () => {
    const entities: Partial<DeletedItem>[] = [
      {
        id: 1,
        item_id: 1,
        item_type: DELETED_ITEM_TYPE.VTODO
      },
      {
        id: 2,
        item_id: 2,
        item_type: DELETED_ITEM_TYPE.VTODO
      }
    ];
    createQueryBuilder.getMany.mockReturnValue(entities);

    const result = await deletedItemService.findAll(0, DELETED_ITEM_TYPE.VTODO, {
      page_size: 2
    });

    expect(deletedItemRepository.createQueryBuilder).toBeCalledTimes(1);
    // expect(createQueryBuilder.addSelect).toBeCalledTimes(1);
    expect(createQueryBuilder.where.mock.calls)
      .toEqual([[`${ENTITY_ALIAS}.user_id = :userId`, {userId: 0}]]);
    expect(createQueryBuilder.where).toBeCalledTimes(1);
    expect(createQueryBuilder.andWhere).toBeCalledTimes(1);
    expect(createQueryBuilder.andWhere.mock.calls)
      .toEqual([
        [`${ENTITY_ALIAS}.item_type = :itemType`, {itemType: DELETED_ITEM_TYPE.VTODO}],
      ]);
    expect(createQueryBuilder.limit).toBeCalledTimes(1);
    expect(createQueryBuilder.limit).toBeCalledWith(2);
    expect(createQueryBuilder.getMany).toBeCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    result.forEach((e, idx) => {
      expect(e.id).toEqual(entities[idx].id);
      expect(e.item_id).toEqual(entities[idx].item_id);
      expect(e.item_type).toEqual(entities[idx].item_type);
    });
  });

  it('should create deleted item', async () => {
    const entity: Partial<DeletedItem> =
      {
        id: 1,
        item_id: 1,
        item_type: DELETED_ITEM_TYPE.VTODO
      };
      deletedItemRepository.save.mockReturnValue(entity);
  });

  it('should find all with full options', async () => {
    const entities: Partial<DeletedItem>[] = [
      {
        id: 1,
        item_id: 1,
        item_type: DELETED_ITEM_TYPE.VTODO
      },
      {
        id: 2,
        item_id: 2,
        item_type: DELETED_ITEM_TYPE.VEVENT
      }
    ];
    createQueryBuilder.getMany.mockReturnValue(entities.map(e => {
      return {id: e.id, item_id: e.item_id};
    }));
    const result = await deletedItemService.findAll(0,
      [DELETED_ITEM_TYPE.VTODO , DELETED_ITEM_TYPE.VEVENT]
      ,{
      page_size: 2,
      fields: ['id','item_id'],
      modified_lt: 10,
      modified_gte: 1,
      ids: [1,2]
    },1);
    result.forEach(r => {
      expect(r.id).toBeDefined();
      expect(r.item_id).toBeDefined();
      expect(r.item_type).not.toBeDefined();
    });
  });

  it('should success find one by id', async () => {
    deletedItemRepository.findOne.mockReturnValue({
      id: 101,
      user_id: 1
    })
    const result = await deletedItemService.findOneById(1,101);
    expect(result.id).toEqual(101);
    expect(result.user_id).toEqual(1);
  });

  it('should success create deleted item', async () => {
    const newDelete =  {
      id: 1,
      item_id: 1,
      item_type: DELETED_ITEM_TYPE.VTODO
    };
    const result = await deletedItemService.create(1, newDelete);
    expect(result.item_id).toEqual(newDelete.item_id);
    expect(result.item_type).toEqual(newDelete.item_type);
  });

  it('should success create list deleted items', async () => {
    const newDeletes =  [{
      id: 1,
      item_id: 1,
      item_type: DELETED_ITEM_TYPE.VTODO
    },
    {
      id: 2,
      item_id: 2,
      item_type: DELETED_ITEM_TYPE.VEVENT
    }];
    const results = await deletedItemService.batchCreateWithDate(1, newDeletes);
    results.forEach((result, index) => {
      expect(result.item_id).toEqual(newDeletes[index].item_id);
      expect(result.item_type).toEqual(newDeletes[index].item_type);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
