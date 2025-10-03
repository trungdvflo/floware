import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { GenerateArnService } from './generate-arn.service';

const cronStatus = { isRunning: false };
@Injectable()
export class GenerateArnMQProcessor {
  constructor(private readonly generateService: GenerateArnService) {
    this.handleWithCommand();
  }

  async handleCronJob () {
    try {
      const cronTime = process.env.MIGRATE_CHIME_CHAT_CTIME || 'OFF';
      if (cronTime === 'OFF') {
        console.log('migrate generate channel arn turn OFF');
        process.exit(0);
        return;
      }
      const cronJob = new CronJob(
        cronTime,
        async () => {
          if (cronStatus.isRunning) return;
          cronStatus.isRunning = true;
          try {
            await this.generateService.generateArn(0, 'all', false);
          } finally {
            cronStatus.isRunning = false;
          }
        }
      );
      cronJob.start();
      console.log('migrate generate channel arn running');
      return true;
    } catch (err) {
      console.log('process:: ', err);
      return err;
    }
  }

  async handleWithCommand () {
    try {
      const args = this.getArgs();
      const emails = args['emails'];
      const limit = args['limit'] || args['l'];
      const collection = args['collection'] || args['c'];
      const message = args['message'] || args['m'];
      if (emails === undefined || emails.length <= 0) {
        console.log('miss parameters');
      } else if (collection) {
        console.log('migrate generate channel for share collection arn running');
        await this.generateService.deleteChannelWithoutCol(0, emails, limit);
        const res = await this.generateService
        .migrateConf4ShareColl(0, emails, limit);
        console.log('result collection arn: ', res);
      } else if (message) {
        console.log('migrate message uid running');
        const res = await this.generateService
        .migrateMessages(0, emails, limit);
        console.log('result message uid: ', res);
      } else {
        console.log('migrate generate channel arn running');
        await this.generateService.deleteChannelWithoutConference(0, emails, limit);
        const res = await this.generateService.fixAllChannels(0, emails, limit);
        console.log('result generate arn: ', res);
      }
      this.generateService.processExit();
      return true;
    } catch (err) {
      console.log('process:: ', err);
      this.generateService.processExit();
      return err;
    }
  }

  getArgs () {
    const args = {};
    let argv = process.argv
        .slice(2, process.argv.length);
    if(argv.length > 0 && argv[0].indexOf(' ') > 0) {
      const argv0 = argv[0].split(' ');
      argv = [...argv0, ...argv.slice(1, argv.length)];
    }
    argv.forEach( arg => {
      // long arg
      if (arg.slice(0,2) === '--') {
        const longArg = arg.split('=');
        const longArgFlag = longArg[0].slice(2,longArg[0].length);
        const longArgValue = longArg.length > 1 ? longArg[1] : true;
        args[longArgFlag] = longArgValue;
      }
      else if (arg.indexOf('-') < 0) {
        const longArg = arg.split('=');
        const longArgFlag = longArg[0];
        const longArgValue = longArg.length > 1 ? longArg[1] : true;
        args[longArgFlag] = longArgValue;
      }
      // flags
      else if (arg[0] === '-') {
        const flags = arg.slice(1,arg.length).split('');
        flags.forEach(flag => {
        args[flag] = true;
        });
      }
    });
    return args;
  }
}