import { isNumber } from 'class-validator';

export function getUtcMillisecond(): number {
  return Date.now();
}

export function getUpdateTimeByIndex(currentTime: number, idx: number) {
  const timeWithIndex = (currentTime + idx) / 1000;
  return timeWithIndex;
}

export const TimestampDouble = (millisecond = getUtcMillisecond()) => {
  try {
    if (isNumber(millisecond) === true && millisecond.toString().length >= 10) {
      return millisecond / 1000;
    }
    return millisecond;
  } catch (error) {
    throw error;
  }
};
