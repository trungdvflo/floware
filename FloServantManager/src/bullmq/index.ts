import { queueScheduler } from './queueScheduler';
import queues from '.././queues.json';

queues.forEach(q => {
  queueScheduler(q.name);
});