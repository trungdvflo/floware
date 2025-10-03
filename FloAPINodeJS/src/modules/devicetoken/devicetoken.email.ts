import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CreateDeviceTokenDTO } from './dtos/create-devicetoken.dto';
import { DeleteDevicetokenDTO } from './dtos/delete-devicetoken.dto';
import { UpdateDevicetokenDTO } from './dtos/update-devicetoken.dto';

@Injectable()
export class DeviceTokenEmailService {
  constructor(private readonly httpService: HttpService) {}

  public async createDevicetoken(data: CreateDeviceTokenDTO, username: string): Promise<any> {
    const BASE_PATH = process.env.INTERNAL_EMAIL_BASE_URI;
    const url = `${BASE_PATH}/devicetoken`;
    const body_data = {
      ...data, username
    };
    const response = await this.httpService.post(url, {
      data: body_data
    }, {
      headers: {
        Accept: 'application/json',
      },
    }).toPromise();
    return response;
  }

  public async updateDevicetoken(data: UpdateDevicetokenDTO, username: string) : Promise<any>{
    const BASE_PATH = process.env.INTERNAL_EMAIL_BASE_URI;
    const url = `${BASE_PATH}/devicetoken`;
    const body_data = {
      ...data, username
    };
    const response = await this.httpService.put(url, {
      data: body_data
    }, {
      headers: {
        Accept: 'application/json',
      },
    }).toPromise();
    return response?.data;
  }

  public async removeDevicetoken(data: DeleteDevicetokenDTO, username: string) : Promise<any>{
    const BASE_PATH = process.env.INTERNAL_EMAIL_BASE_URI;
    const url = `${BASE_PATH}/devicetoken/delete`;
    const body_data = {
      ...data, username
    };
    const response = await this.httpService.post(url, {
      data: body_data
    }, {
      headers: {
        Accept: 'application/json',
      },
    }).toPromise();
    return response;
  }

  // public async existUserEMailFromMailServer(email: string) : Promise<boolean>{
  //   const BASE_PATH = process.env.INTERNAL_EMAIL_BASE_URI;
  //   const url = `${BASE_PATH}/user/checkemail`;
  //   const response = await this.httpService.post(url, {
  //     data: { email }
  //   }, {
  //     headers: {
  //       Accept: 'application/json',
  //     },
  //   }).toPromise();
  //   const json = JSON.parse(response.data);
  //   if (json && (json.error || !json.data)) {
  //     return false;
  //   }
  //   return !!json.data.is_exist;
  // }
}