import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class TaskQueueService {
  private limit = 1;
  private queue: { taskId: string; task: () => Promise<any> }[] = [];
  private running = 0;
  private doneSet = new Set()
  private errSet = new Set()
  private isRunning = false;

  addTask<T>(task: () => Promise<T>, cb) {
    const taskId = uuidv4();
    this.queue.push({ taskId, task: async () => {
      this.running++;
      try {
        if (cb?.started) {
          cb.started(taskId)
        }
        const result = await task();
        if (cb?.done) {
          cb.done(taskId, result)
        }
        this.doneSet.add(taskId)
        this.running--;
      } catch (error) {
        this.errSet.add(taskId)
        if (cb?.error) {
          cb.error(taskId, error)
        }
      } finally {
        if (this.running > 0) {
          this.running--;
        }
        this.next();
      }
    }});
    
    if (!this.isRunning && this.running < this.limit) {
      this.next();
    }

    return taskId
  }

  private async next(): Promise<void> {
    // empty queue
    if (this.queue.length <= 0) {
      this.isRunning = false
      this.doneSet.clear()
      this.errSet.clear()
      return;
    }
    this.isRunning = true

    if (this.running < this.limit ) {
      const { task } = this.queue.shift();
      const result = await task();
      this.next();
      return result;
    }
  }

  public async waitForDone(task: string) {
    let isBreak = false
    setTimeout(()=> {
      isBreak = true
      console.log('Timeout to wait for done task', task)
    }, 120000)

    while(true) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (this.errSet.has(task)) {
        this.errSet.delete(task)
        break
      }
      if (this.doneSet.has(task)) {
        this.doneSet.delete(task)
        break
      }
      if (isBreak || !this.isRunning) { break }
    }

  }
}
