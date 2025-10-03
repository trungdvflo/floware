import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'access_token', synchronize: true })
export class AccessToken {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
    unsigned: true
  })
  id: number;

  @Column('bigint', {
    width: 20,
    name: 'user_id',
    unsigned: true
  })
  user_id: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3
  })
  created_date: number;
}
