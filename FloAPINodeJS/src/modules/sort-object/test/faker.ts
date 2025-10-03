import { SortObject } from '../../../common/entities/sort-object.entity';
import { SORT_OBJECT_TYPE } from '../sort-object.constant';

export function fakeGetObjectOrders(): [Partial<SortObject>[], number] {
  return [
    [
      {
        created_date: 1606732399.815,
        updated_date: 1606732403.242,
        id: 1,
        object_uid: "465bea19-2a1b-410b-946e-ba29d0699ac2",
        object_type: SORT_OBJECT_TYPE.VTODO,
        object_href: null,
        order_number: 0.999999998998988,
        account_id: 0,
      },
      {
        created_date: 1606730905.33,
        updated_date: 1606730908.212,
        id: 3,
        object_uid: "a1e7f6d0-cef3-4f90-bab2-84bef2c8976d",
        object_type: SORT_OBJECT_TYPE.CANVAS,
        object_href: null,
        order_number: 0.999999999999999,
        account_id: 0,
      },
    ],
    2,
  ];
}

export function fakePutObjectOrders() {
  return {
    data: {
      uid: "0d644002-5bac-46ab-85dc-38ca49432089",
      items: [
        {
          "object_uid": "465bea19-2a1b-410b-946e-ba29d0699ac2",
          "object_type": "VTODO",
          "order_number": "12.00000",
          "updated_date": 1566464330.816
        }
      ]
    }
  };
}

export function fakePutTodoOrder() {
  return [
    {
      "object_uid": "465bea19-2a1b-410b-946e-ba29d0699ac2",
      "object_type": "VTODO",
      "order_number": "12.00000",
      "updated_date": 1566464330.816
    }
  ];
}