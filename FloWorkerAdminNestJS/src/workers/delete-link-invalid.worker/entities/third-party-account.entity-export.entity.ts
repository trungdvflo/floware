import { ThirdPartyAccount } from '../../../commons/entities/third-party-account.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'third_party_account_exported', synchronize: true })
export class ThirdPartyAccountExport extends ThirdPartyAccount {
  @Column('datetime', { nullable: false })
  export_date: Date;
}
