import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('device_token')
export class DeviceToken {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true
  })
  id: number;

  @Column('varchar', { length: 255 })
  username: string;
}
