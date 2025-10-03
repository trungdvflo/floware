import { Repository } from "typeorm";
import { GetOptionInterface } from "../interface/typeorm.interface";

export class BaseRepository<T> extends Repository<T> {
  async getItemByOptions(options: GetOptionInterface<T>) {
    const item: T = await this.findOne({
      select: options.fields,
      where: options.conditions
    });
    return item;
  }
  async getAllByOptions(options: GetOptionInterface<T>): Promise<T[]> {
    const items: T[] = await this.find({
      select: options.fields,
      where: options.conditions
    });
    return items;
  }
  async getAllByOptionsWithSort(options: GetOptionInterface<T>): Promise<T[]> {
    const items: T[] = await this.find({
      select: options.fields,
      where: options.conditions,
      order: options.order
    });
    return items;
  }
}