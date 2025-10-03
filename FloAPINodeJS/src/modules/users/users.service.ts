import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { ApiLastModifiedName } from '../../common/constants';
import { UserDeleted } from '../../common/entities/user-deleted.entity';
import { Users } from '../../common/entities/users.entity';
import { IReq, IUser } from '../../common/interfaces';
import { UsersRepository } from '../../common/repositories/user.repository';
import { getUtcMillisecond } from '../../common/utils/date.util';
import cfApp from '../../configs/app';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { UserDto } from './dtos/users.dto';
export interface UserServiceOptions {
  fields: (keyof Users)[];
}
@Injectable()
export class UsersService {
  private readonly oAuthDomain: string;
  constructor(
    private readonly userRepository: UsersRepository,
    @InjectRepository(UserDeleted)
    private readonly userDeletedRepository: Repository<UserDeleted>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly httpClient: HttpService,
  ) {
    this.oAuthDomain = cfApp().serverAuthDomain;
  }

  private async revoke(user: IUser) {
    try {
      const tokenUrl = `${this.oAuthDomain}/revoke`;
      const rs = await lastValueFrom(this.httpClient.post(tokenUrl,
        {
          revoke_type: "all_device"
        },
        {
          headers: {
            app_id: user.appId,
            device_uid: user.deviceUid,
            authorization: `Bearer ${user.token}`
          }
        }));
      return rs['data'];
    } catch (error) {
      return false;
    }
  }

  async getToken(postData: UserDto, app_id: string, device_uid: string) {
    try {
      const tokenUrl = `${this.oAuthDomain}/token`;
      const rs = await lastValueFrom(this.httpClient.post(tokenUrl, postData,
        {
          headers: {
            app_id,
            device_uid
          }
        }));
      return rs['data'];
    } catch (error) {
      return false;
    }
  }

  public async getUserProfileByEmail(email: string): Promise<Users> {
    return await this.userRepository.findOne({
      select:
        ['email', 'fullname', 'description', 'birthday', 'gender', 'quota_limit_bytes', 'disabled', 'updated_date'],
      where: {
        email,
      },
    });
  }

  public async getUserIdByEmail(email: string): Promise<Users> {
    return await this.userRepository.findOne({
      select:
        ['id'],
      where: {
        email,
      },
    });
  }

  public async getUserProfileById(id: number): Promise<Users> {
    const userAlias = 'user';
    const adminAlias = 'admin';
    const user = await this.userRepository
      .createQueryBuilder(userAlias)
      .leftJoin(`admin`, adminAlias, `${adminAlias}.email = ${userAlias}.email`)
      .where(`${userAlias}.id = :id`, { id })
      .select([
        `${userAlias}.email AS email`,
        `${userAlias}.fullname AS fullname`,
        `${userAlias}.description AS description`,
        `${userAlias}.birthday AS birthday`,
        `${userAlias}.gender AS gender`,
        `${userAlias}.quota_limit_bytes AS quota_limit_bytes`,
        `${userAlias}.disabled AS disabled`,
        `${userAlias}.updated_date AS updated_date`,
        `IFNULL(${adminAlias}.role, -1) AS role`
      ])
      .getRawOne();
    return user;
  }

  public async updateUserProfile(updateDoc: Users, { user, headers }: IReq): Promise<Users> {
    const result = await this.getUserProfileById(user.id);
    const updatedDate = new Date().getTime() / 1000;
    if (result) {
      await this.userRepository.update(user.id,
        this.userRepository.create({ ...updateDoc, updated_date: updatedDate }));

      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.USER,
        userId: +user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return this.userRepository.create({ ...result, ...updateDoc, updated_date: updatedDate });
  }

  public async terminateAcc(user) {
    const terDate = getUtcMillisecond() / 1000;
    try {
      await this.revoke(user);
      await this.userRepository.disableUserAndReport(user.userId, terDate);
      const userDeleted = this.userDeletedRepository.create({
        user_id: user.userId,
        username: user.email,
        created_date: terDate
      });
      await this.userDeletedRepository.insert(userDeleted);

      // terminal email
      (async () => {
        const timeout = process.env.INTERNAL_MAIL_REQUEST_TIMEOUT ?
          Number(process.env.INTERNAL_MAIL_REQUEST_TIMEOUT) : 10000;
        const BASE_PATH = process.env.INTERNAL_EMAIL_BASE_URI;
        const url = `${BASE_PATH}/user/terminate`;
        const body_data = {
          username: user.email,
        };
        try {
          const rs = await lastValueFrom(this.httpClient.post(url,
            {
              data: body_data
            },
            {
              headers: {
                Accept: 'application/json',
              },
              timeout
            }));
          return rs['data'];
        } catch (error) {
          return false;
        }
      })();
      return { id: user.userId };
    } catch (error) {
      return {
        code: error.code,
        message: error.sqlMessage,
        attributes: error.parameters
      };
    }
  }
}
