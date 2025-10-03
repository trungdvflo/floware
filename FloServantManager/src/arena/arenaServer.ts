import Arena from 'bull-arena';
import express from 'express';
import { Queue } from "bullmq";
import Redis from 'ioredis';
import queues from '../queues.json';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const router = express.Router();

const arena = Arena({
  BullMQ: Queue,
  queues: queues.map(q => ({
    type: 'bullmq',
    name: q.name,
    hostId: 'localhost',
    redis: redisClient
  })),
},{
  disableListen: true,
  port: parseInt(process.env.PORT || '3000'),
  host: '0.0.0.0'
});

router.use('/', arena);

const app = express();
app.use('', router);
app.listen(parseInt(process.env.PORT || '3000'), function () {
  console.log(`Arena is running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Process ${process.pid} is running on port: ${parseInt(process.env.PORT || '3000')}`);
});
