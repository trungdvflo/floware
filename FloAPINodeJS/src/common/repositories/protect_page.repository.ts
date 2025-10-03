import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { ProtectPageEntity } from "../entities/protect_page.entity";
import { GetOptionInterface } from "../interfaces/collection.interface";
@Injectable()
@CustomRepository(ProtectPageEntity)
export class ProtectPageRepository extends Repository<ProtectPageEntity> {

  async getProtectPwd(options: GetOptionInterface<ProtectPageEntity>) {
    const protectPwd = this.findOne({
      select: options.fields,
      where: options.conditions
    });
    return protectPwd;
  }
}