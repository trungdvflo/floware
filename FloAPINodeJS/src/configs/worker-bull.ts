
import { registerAs } from '@nestjs/config';

export default registerAs('worker', () => ({
  delay: +process.env.WORKER_TRASH_JOB_DELAY || 1,
  attempts: +process.env.WORKER_TRASH_JOB_NUMBER_TRY || 15,
  removeOnComplete: !(process.env.WORKER_TRASH_JOB_REMOVE_ON_COMPLETE==='false')
}));