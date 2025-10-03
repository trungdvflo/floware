import { Repository } from "typeorm";
import { getUtcMillisecond } from "../utils/date.util";

export class CommonRepository<T> extends Repository<T> {
  async getCurrentTime(): Promise<number> {
    let timeDB = 0;
    const currentTime = getUtcMillisecond();
    const rawObject = await this.createQueryBuilder('e')
        .select('MAX(e.updated_date)', 'max')
        .where('e.id > 0')
        .getRawOne();
    if (rawObject) timeDB = rawObject.max * 1000 + 1;

    return (timeDB > currentTime)? timeDB : currentTime;
  }
}