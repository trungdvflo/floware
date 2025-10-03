import { io } from "socket.io-client";
import { WorkerHealth } from "../workers/base-worker";
import { QueueName } from '../commons/constants/queues.contanst';
type SocketPayload = {
  type: string,
  side: string,
  payload: {
    name: string
  }
};

export default (_roomName: string) => {
  // tslint:disable-next-line: no-console
  console.log('>>start socket client worker');
  const socket = io(process.env.SOCKET_SERVANT_URL, {
    forceNew: true,
    auth: {
      workerName: _roomName,
    }
  });
  socket.on('connect', async () => {
    // tslint:disable-next-line: no-console
    console.log(`${_roomName} connected to socket server!`);
    const { healthCheck } = await import('./workerBehavior');
    const health: WorkerHealth = await healthCheck(_roomName);
    socket.emit('auth', {
      type: 'auth',
      side: 'worker',
      payload: {
        roomName: _roomName,
        health
      }
    });
  });
  /**
   * servant call to check health
   */
  socket.on("worker health check", async (data: SocketPayload) => {
    // tslint:disable-next-line: no-console
    console.log(`${_roomName} received health check request`);
    const { healthCheck } = await import('./workerBehavior');
    const health: WorkerHealth = await healthCheck(_roomName);
    emitDirect(socket, 'health report', health);
  });
  /**
   * servant call to terminate
   */
  socket.on("worker terminate", (async (data: SocketPayload) => {
    // tslint:disable-next-line: no-console
    console.log(`${_roomName} received terminate request`);
    const { terminate } = await import('./workerBehavior');
    emitDirect(socket, 'before terminate', { name: _roomName });
    await terminate(_roomName);
  }));
  /**
   * servant call to pause
   */
  socket.on("worker pause", (async (data: SocketPayload) => {
    // tslint:disable-next-line: no-console
    console.log(`${_roomName} received pause request`);
    const { pause, healthCheck } = await import('./workerBehavior');
    await pause(_roomName);
    const health: WorkerHealth = await healthCheck(_roomName);
    emitDirect(socket, 'health report', health);
  }));
  /**
   * servant call to resume
   */
  socket.on("worker resume", (async (data: SocketPayload) => {
    // tslint:disable-next-line: no-console
    console.log(`${_roomName} received resume request`);
    const { resume, healthCheck } = await import('./workerBehavior');
    resume(_roomName);
    const health: WorkerHealth = await healthCheck(_roomName);
    emitDirect(socket, 'health report', health);
  }));
  (() => {
    // interval self health check
    let counter: number = 0;
    setInterval(async () => {
      const { healthCheck, terminate } = await import('./workerBehavior');
      if (counter === +process.env.MAX_RETRY_HEALTH_CHECK) {
        emitDirect(socket, 'before terminate', { name: _roomName });
        await terminate(_roomName);
      }
      const health: WorkerHealth = await healthCheck(_roomName);
      emitDirect(socket, 'health report', health);
      if (health.isPaused && !health.isRunning && health.isSlow) {
        counter++;
      } else {
        counter = 0;
      }

    }, +process.env.HEALTH_CHECK_INTERVAL_TIME);
  })();
};

function emitDirect(socket, type: string, payload: any) {
  socket.emit(type, {
    type,
    side: 'worker',
    payload
  });
}

function getRoomName(workerPath: string): string {
  return {
    'report-cached-user.worker': QueueName.REPORT_CACHED_USER_QUEUE
  }[workerPath.replace('./workers/', '')];
}