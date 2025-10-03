import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { RealtimeChannelMember } from "../models/realtime-channel-member.entity";
import { RealtimeChannelUserLastSeen } from "../models/realtime-channel-user-last-seen.entity";
import { RealtimeChannel } from "../models/realtime-channel.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(RealtimeChannelMember)
export class RealtimeChannelMemberRepository extends BaseRepository<RealtimeChannelMember> {
    async getMemberUnread(channel: string) {
        const query = this.createQueryBuilder('rcm')
        .select(['rc.name as channel',
            'rc.title as channel_title',
            'rcm.email as email',
            'rcculs.last_seen as last_seen',
            'rcculs.last_message_uid as last_message_uid',
            'rcculs.unread as unread'
        ])
        .innerJoin(RealtimeChannel, 'rc', 'rc.id = rcm.channel_id')
        .leftJoin(RealtimeChannelUserLastSeen, 'rcculs', 'rcm.email  = rcculs.email')
        .where('rc.name = :channel', { channel })
        .andWhere('(rcculs.unread > 0 or rcculs.unread is null)')
        .andWhere('(rcculs.remine = 0 or rcculs.remine is null)');
        return await query.getRawMany();
    }
}