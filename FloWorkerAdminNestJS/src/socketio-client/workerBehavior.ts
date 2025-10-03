import {
    ReportCachedUserWorker
} from "../workers/report-cached-user.worker";
import { QueueName } from '../commons/constants/queues.contanst';
import { WorkerHealth } from "../workers/base-worker";

type WorkerInstance = ReportCachedUserWorker;

function getWorker(wkrName: string) {
    const listWorker: [string, WorkerInstance][] = [
        [QueueName.REPORT_CACHED_USER_QUEUE, ReportCachedUserWorker.instance],
    ];
    return listWorker
        .find(([workerName]: [string, WorkerInstance]) => workerName === wkrName);
}

export async function terminate(workerName: string) {
    const [, worker] = getWorker(workerName);
    setTimeout(async () => {
        await worker.terminate();
    }, 500);
    return { message: `worker ${workerName} is terminated successfully` };
}

export async function healthCheck(workerName: string): Promise<WorkerHealth> {
    const [, currentWorker]: [string, WorkerInstance] = getWorker(workerName);
    const health: WorkerHealth = await currentWorker.healthCheck();
    return health;
}

export async function pause(workerName: string): Promise<void> {
    const [, currentWorker]: [string, WorkerInstance] = getWorker(workerName);
    return await currentWorker.pause();
}

export async function resume(workerName: string): Promise<void> {
    const [, currentWorker]: [string, WorkerInstance] = getWorker(workerName);
    return await currentWorker.resume();
}