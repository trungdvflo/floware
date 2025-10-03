import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_CREDENTIAL } from '../constants/mysql.func';
import { DateCommon } from './date-common.entity';

@Entity({ name: TABLE_CREDENTIAL })
@Index('unq_credential', ['user_id', 'type', 'checksum'], { unique: true })
export class CredentialEntity extends DateCommon {
	@PrimaryGeneratedColumn('increment', { name: 'id' })
	id: number;

	@Column('tinyint', { name: 'type', width: 1, default: 0,})
	type: number;

	@Column("text", { name: 'data_encrypted' })
	data_encrypted: string;

	@Column("varchar", { name: 'checksum', length: 100, nullable: false })
	checksum: string;
}