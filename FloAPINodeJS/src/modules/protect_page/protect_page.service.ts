import { Injectable } from '@nestjs/common';
import { ErrorCode } from '../../common/constants/error-code';
import { PROTECT_PASSWORD_INVALID } from '../../common/constants/message.constant';
import { ErrorDTO } from '../../common/dtos/error.dto';
import { ProtectPageEntity } from '../../common/entities/protect_page.entity';
import { ProtectPageRepository } from '../../common/repositories/protect_page.repository';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { VerifyPwdDto } from './dtos/verify_pwd.dto';
@Injectable()
export class ProtectPageService {
  constructor(
    private readonly protectPageRepo: ProtectPageRepository
  ) { }
  async verify(dto: VerifyPwdDto) {
    try {
      const plainPwd = CryptoUtil.decryptRSA(dto.verify_code);
      const existedPwd: ProtectPageEntity = await this.protectPageRepo.getProtectPwd({
        fields: ['verify_code'],
        conditions: {
          checksum: CryptoUtil.converToMd5(plainPwd)
        }
      });
      if (!existedPwd) {
        return {
          data: {
            verify_status: 0
          }
        };
      }
      const decrypted = CryptoUtil.decryptRSA(existedPwd.verify_code);
      if (plainPwd !== decrypted) {
        return {
          data: {
            verify_status: 0
          }
        };
      }
      return {
        data: {
          verify_status: 1
        }
      };
    } catch (err) {
      return {
        error: new ErrorDTO({
          code: ErrorCode.BAD_REQUEST,
          message: PROTECT_PASSWORD_INVALID,
          attributes: dto
        })
      };
    }
  }
}