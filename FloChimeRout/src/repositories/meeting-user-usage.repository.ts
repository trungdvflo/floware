import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { MeetingUserUsageEntity } from 'entities/meeting_user_usage.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(MeetingUserUsageEntity)
export class MeetingUserUsageRepository extends Repository<MeetingUserUsageEntity> {
  async userUsage(email: string) {
    let usage = await this.findOneBy({
      email
    })
    if (!usage) {
      usage = this.create({
        email,
        meeting_dial_outbound_spent: 0,
        meeting_internet_spent: 0,
      })
    }

    const save = async () => {
      return await this.save(usage)
    }
  
    return {
      usage: { meeting_spent_time_in_seconds: usage.meeting_internet_spent },
      save,
      increMeetingDialOutboundSpent: (n: number) => { 
        if(n <= 0) { return; }
        usage.meeting_dial_outbound_spent += n; 
      }, 
      increMeetingInternetSpent: (n: number) => { 
        if(n <= 0) { return; }
        usage.meeting_internet_spent += n; 
      }, 
    }
  }
}