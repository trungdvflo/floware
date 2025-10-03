import crypto from 'crypto';
import minimist = require('minimist');

export const getArgs = () => {
  const argv = minimist(process.argv.slice(2));
  return argv['name'];
};

export function createMd5Digest(string: string) {
  const hash = crypto.createHash('md5');
  hash.update(string);
  return hash.digest('hex');
}

export function getUtcMillisecond(): number {
  return Date.now();
}

export function getUpdateTimeByIndex(currentTime: number, idx: number) {
  const timeWithIndex = (currentTime + idx) / 1000;
  return timeWithIndex;
}