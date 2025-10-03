import { Exclude } from 'class-transformer';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'dynamic_key'})
export class DynamicKey extends BaseEntity {

  @PrimaryGeneratedColumn({type: "bigint"})
  readonly id: number;

  @Column('text')
  public_key: string;

  @Exclude()
  @Column({ length: 255 })
  secret_key: string;

  @Column('double',{
    name: 'updated_date',
    precision: 13,
    scale: 3
  })
  updated_date: number;

}