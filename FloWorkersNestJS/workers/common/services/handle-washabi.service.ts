import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import cfgAWS from '../../common/configs/aws.config';
import { IWashabi } from '../interface/file-attachment.interface';
import { GetOptionInterface } from '../interface/typeorm.interface';
import { UserEntity } from '../models/user.entity';
import { UserRepository } from '../repository/user.repository';
import { createMd5Digest } from '../utils/crypto.util';

@Injectable()
export class WasabiService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async deleteOnWasabi(userId: number, fileItem: IWashabi): Promise<void> {
    const userOption: GetOptionInterface<UserEntity> = {
      fields: ['email'],
      conditions: {
        id: userId
      }
    };
    const userItem = await this.userRepo.getItemByOptions(userOption);
    if(userItem) {
      // const { s3Path, bucketName, endpoint, region, accessKeyId, secretAccessKey }
      //  = this.configService.get('aws');
      const { s3Path, bucketName, endpoint, region, accessKeyId, secretAccessKey }
       = cfgAWS();

      const s3 = new S3({
        endpoint,
        region,
        accessKeyId,
        secretAccessKey
      });
      const fName = `${fileItem.uid}${fileItem.ext}`;
      const md5Email = createMd5Digest(userItem.email);
      const keyUpload = `${s3Path}${md5Email}/${fName}`;
      await s3.deleteObject({
        Bucket: bucketName,
        Key: keyUpload
      }).promise();
    }
  }
}