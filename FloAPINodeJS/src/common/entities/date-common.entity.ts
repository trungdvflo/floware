import { AfterInsert, AfterUpdate, BeforeInsert, BeforeUpdate, Column } from 'typeorm';

export class DateCommon {
  @BeforeInsert()
  createDate() {
    if (!this.created_date) {
      this.created_date = new Date().getTime() / 1000;
      this.updated_date = new Date().getTime() / 1000;
    }
  }
  @BeforeUpdate()
  updatedDate() {
    if (!this.updated_date) {
      this.updated_date = new Date().getTime() / 1000;
    }
  }

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
  })
  updated_date: number | null;

  @Column('bigint', { width: 20, name: "user_id", select: false })
  user_id: number;

  @AfterInsert()
  @AfterUpdate()
  deleteUserId() {
    this.user_id = undefined;
  }
}