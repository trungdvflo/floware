import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('principals')
export class Principal {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column('varchar', { length: 80 })
  email: string;
}
