import { isNumber } from "class-validator";

export function getUtcMillisecond(): number {
  return Date.now();
}

export function getUtcSecond(): number {
  return Date.now() / 1000;
}

export function getUpdateTimeByIndex(currentTime: number, idx: number) {
  const timeWithIndex = (currentTime + idx) / 1000;
  return timeWithIndex;
}

export function generateDeletedDateByLength(length: number): number[] {
  const now = getUtcMillisecond();
  return Array.from(new Array(length), function mapFn(element, index) {
    return (now + index + 1) / 1000;
  });
}

export function generateItemDateByLength(length: number): number[] {
  const now = getUtcMillisecond();
  return Array.from(new Array(length), function mapFn(element, index) {
    return (now + index + 1) / 1000;
  });
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