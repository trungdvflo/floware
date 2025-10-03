import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { DEVICE_TYPE, LIST_OF_DEVICE_TOKEN, LIST_OF_DEVICE_UID } from "../constants";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { Devicetoken } from "../entities/devicetoken.entity";
import { getPlaceholderByN } from "../utils/common";
@Injectable()
@CustomRepository(Devicetoken)
export class DeviceTokenRepository extends Repository<Devicetoken> {
  /**
   * @param emailList 'anph@flomailnet,anph_dev@flomail.net'
   * @param silent
   * @param DeviceType
   * @returns
   */
  async listOfDeviceToken(emailList: string[], silent, deviceType: DEVICE_TYPE[]) {
    try {
      const { callType, spName, spParam } = LIST_OF_DEVICE_TOKEN;
      const resp = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`,
          [
            emailList.join(','),
            +silent || 0,
            !deviceType.length ? null : deviceType.join(',')
          ]);
      return resp.length && resp[0].length ? resp[0] : [];
    } catch (error) {
      return { error };
    }
  }

  /**
   * @param emailList 'anph@flomailnet,anph_dev@flomail.net'
   * @returns
   */
  async listOfDeviceUidForWeb(emailList: string[]) {
    try {
      const { callType, spName, spParam } = LIST_OF_DEVICE_UID;
      const resp = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`,
          [
            [...new Set(emailList)]?.join(','),
          ]);
      return resp.length && resp[0].length ? resp[0] : [];
    } catch (error) {
      return { error };
    }
  }
}