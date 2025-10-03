import {
    BaseEntity, Column, Entity, PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
@Entity({ name: 'app_register' })
export class AppRegister extends BaseEntity {

  @PrimaryGeneratedColumn({type: "bigint"})
  readonly id: number;

  @Column({ length: 255 })
  app_reg_id: string;

  @Column({ length: 255 })
  app_alias: string;

  @Column({ length: 255 })
  email_register: string;

  @Column({ length: 255 })
  app_name: string;

  @UpdateDateColumn({
    name: 'updated_date',
    precision: 13,
    scale: 3
  })
  updated_date: number;

}