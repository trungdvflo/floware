import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_SALT } from '../constants';
import { DateCommon } from './date-common.entity';

@Entity({ name: TABLE_SALT })
export class SaltEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', { name: 'email', length: 255 })
  email: string;

  @Column('varchar', { name: 'salt0', length: 64 })
  salt0: string;

  @Column('varchar', { name: 'salt1', length: 64 })
  salt1: string;

  @Column('varchar', { name: 'salt2', length: 64 })
  salt2: string;

  @Column('varchar', { name: 'salt3', length: 64 })
  salt3: string;

  @Column('varchar', { name: 'salt4', length: 64 })
  salt4: string;

  @Column('varchar', { name: 'salt5', length: 64 })
  salt5: string;

  @Column('varchar', { name: 'salt6', length: 64 })
  salt6: string;

  @Column('varchar', { name: 'salt7', length: 64 })
  salt7: string;

  @Column('varchar', { name: 'salt8', length: 64 })
  salt8: string;

  @Column('varchar', { name: 'salt9', length: 64 })
  salt9: string;

  @Column('varchar', { name: 'salt10', length: 64 })
  salt10: string;

  @Column('varchar', { name: 'salt11', length: 64 })
  salt11: string;

  @Column('varchar', { name: 'salt12', length: 64 })
  salt12: string;

  @Column('varchar', { name: 'salt13', length: 64 })
  salt13: string;

  @Column('varchar', { name: 'salt14', length: 64 })
  salt14: string;

  @Column('varchar', { name: 'salt15', length: 64 })
  salt15: string;

  @Column('varchar', { name: 'salt16', length: 64 })
  salt16: string;

  @Column('varchar', { name: 'salt17', length: 64 })
  salt17: string;

  @Column('varchar', { name: 'salt18', length: 64 })
  salt18: string;

  @Column('varchar', { name: 'salt19', length: 64 })
  salt19: string;

  @Column('varchar', { name: 'salt20', length: 64 })
  salt20: string;

  @Column('varchar', { name: 'salt21', length: 64 })
  salt21: string;

  @Column('varchar', { name: 'salt22', length: 64 })
  salt22: string;

  @Column('varchar', { name: 'salt23', length: 64 })
  salt23: string;

  @Column('varchar', { name: 'salt24', length: 64 })
  salt24: string;

  @Column('varchar', { name: 'salt25', length: 64 })
  salt25: string;

  @Column('varchar', { name: 'salt26', length: 64 })
  salt26: string;

  @Column('varchar', { name: 'salt27', length: 64 })
  salt27: string;

  @Column('varchar', { name: 'salt28', length: 64 })
  salt28: string;

  @Column('varchar', { name: 'salt29', length: 64 })
  salt29: string;

  @Column('varchar', { name: 'salt30', length: 64 })
  salt30: string;

  @Column('varchar', { name: 'salt31', length: 64 })
  salt31: string;

  @Column('varchar', { name: 'salt32', length: 64 })
  salt32: string;

  @Column('varchar', { name: 'salt33', length: 64 })
  salt33: string;

  @Column('varchar', { name: 'salt34', length: 64 })
  salt34: string;

  @Column('varchar', { name: 'salt35', length: 64 })
  salt35: string;

  @Column('varchar', { name: 'salt36', length: 64 })
  salt36: string;

  @Column('varchar', { name: 'salt37', length: 64 })
  salt37: string;

  @Column('varchar', { name: 'salt38', length: 64 })
  salt38: string;

  @Column('varchar', { name: 'salt39', length: 64 })
  salt39: string;

  @Column('varchar', { name: 'salt40', length: 64 })
  salt40: string;

  @Column('varchar', { name: 'salt41', length: 64 })
  salt41: string;

  @Column('varchar', { name: 'salt42', length: 64 })
  salt42: string;

  @Column('varchar', { name: 'salt43', length: 64 })
  salt43: string;

  @Column('varchar', { name: 'salt44', length: 64 })
  salt44: string;

  @Column('varchar', { name: 'salt45', length: 64 })
  salt45: string;

  @Column('varchar', { name: 'salt46', length: 64 })
  salt46: string;

  @Column('varchar', { name: 'salt47', length: 64 })
  salt47: string;

  @Column('varchar', { name: 'salt48', length: 64 })
  salt48: string;

  @Column('varchar', { name: 'salt49', length: 64 })
  salt49: string;

  @Column('varchar', { name: 'salt50', length: 64 })
  salt50: string;
}
