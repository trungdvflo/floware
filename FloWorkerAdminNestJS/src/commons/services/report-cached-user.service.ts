import { stringMap } from 'aws-sdk/clients/backup';
import { type } from 'os';
import { platform } from 'process';
import { Repository, getRepository } from 'typeorm';
import { ReportCachedUser } from '../entities/report-cached-user.entity';
type Platform = {
  app_reg_id: string,
  api_version: string,
  app_name?: string
};
export class ReportCachedUserService {
  private readonly repo: Repository<ReportCachedUser>;
  constructor() {
    this.repo = getRepository(ReportCachedUser);
  }

  async upsert(data: any) {
    const model = await this.repo.findOne({
      where: { user_id: data.user_id }
    });
    const now = new Date().getTime() / 1000;
    if (model) {
      const savedPlatform = model.platform || [];
      const platform: string = JSON.stringify(this.removeDuplicatedPlatform([
        ...savedPlatform, ...data.platform]));
      await this.repo.update(model.id, { ...data, platform, updated_date: now });
    } else {
      await this.repo.insert({
        ...data,
        platform: JSON.stringify(data.platform.filter(Boolean)),
        created_date: now,
        updated_date: now
      });
    }
  }

  /**
   * Delete items by user id
   * @param userId
   * @returns
   */
  deleteByUserId(userId: number) {
    return this.repo.delete({ user_id: userId });
  }

  removeDuplicatedPlatform(platforms: Platform[]) {
    try {
      platforms = platforms.filter(Boolean);
      const setIds: Set<string> = new Set(platforms.map(
        ({ app_reg_id, api_version }: Platform) => `${app_reg_id}-${api_version}`));
      const appIds: string[] = Array.from(setIds);
      return appIds.map((app: string) => {
        const [appid, api_version] = app.split('-');
        return platforms
          .find((platform: Platform) => appid === platform.app_reg_id && platform.api_version === api_version)
      }).filter(Boolean);
    } catch (e) {
      console.log(e)
      return [];
    }
  }

}
