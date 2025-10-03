import { getRepository, Repository } from 'typeorm';

import { UserTrackingApp } from '../entities/user-tracking-app.entity';
import { TrackingApp } from '../entities/tracking-app.entity';

export class TrackingAppService {
  private readonly repo: Repository<TrackingApp>;
  constructor() {
    this.repo = getRepository(TrackingApp);
  }
  getLastUsedDate(userId: number) {
    return this.repo
      .createQueryBuilder('ta')
      .select(['uta.last_used_date AS last_used_date'])
      .innerJoin(UserTrackingApp, 'uta', 'ta.id = uta.tracking_app_id')
      .where('uta.user_id= :userId', { userId })
      .orderBy('1', 'DESC')
      .execute();
  }
}
