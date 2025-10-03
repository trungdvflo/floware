import { datatype } from 'faker';
import { Devicetoken } from '../../../common/entities/devicetoken.entity';
import { CreateDeviceTokenDTO } from '../dtos/create-devicetoken.dto';
import { GetDevicetokenDTO } from '../dtos/get-devicetoken.request';
import { UpdateDevicetokenDTO } from '../dtos/update-devicetoken.dto';

export function fakeFilter(): GetDevicetokenDTO {
  return {
    page_size: 10,
  };
}

export function fakeDevicetoken(): Partial<Devicetoken> {
  return {
    id: datatype.number(),
    user_id: datatype.number(),
    cert_env: datatype.number(),
    device_env: datatype.number(),
    device_type: datatype.number(),
    status_app_run: datatype.number(),
    env_silent: datatype.number(),
    device_token: datatype.string(),
    time_received_silent: datatype.number(),
    time_sent_silent: datatype.number(),
    created_date: datatype.number(),
    updated_date: datatype.number()
  };
}

export function fakeCreatedDevicetoken(): CreateDeviceTokenDTO {
  return {
    cert_env: datatype.number(),
    device_env: datatype.number(),
    device_type: datatype.number(),
    status_app_run: datatype.number(),
    env_silent: datatype.number(),
    device_token: datatype.string(),
    time_received_silent: datatype.number(),
    time_sent_silent: datatype.number(),
    ref: datatype.string()
  };
}

export function fakedUpdateEntity(): UpdateDevicetokenDTO {
  return {
    cert_env: datatype.number(),
    device_env: datatype.number(),
    status_app_run: datatype.number(),
    env_silent: datatype.number(),
    device_token: datatype.string(),
    time_received_silent: datatype.number(),
    replied: datatype.number(),
    time_sent_silent: datatype.number(),
  };
}