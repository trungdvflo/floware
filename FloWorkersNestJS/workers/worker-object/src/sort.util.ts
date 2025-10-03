
import { Decimal } from 'decimal.js';
import { SORT_OBJECT } from '../../common/constants/common.constant';

let baseMinus = 1;
let baseRange = 0;
let baseScale = 0;

export function generateNumber(number) {
  try {
    const stringNumber = number.toString();
    const dashedIndex = stringNumber.indexOf('-');

    if (dashedIndex >= 0) {
      const fixed = stringNumber.split('-');
      const fixedNumber = Number(fixed[1]);
      if (fixedNumber > SORT_OBJECT.MAX_ORDER_NUMBER_LENGTH) {
        baseMinus += 1;
      }
      return number.toFixed(fixedNumber);
    }
    return number;
  } catch (error) {
    return false;
  }
}

export function generateRangeLength(number) {
  try {
    const fixedNumber = generateNumber(number);
    return fixedNumber.toString().length;
  } catch (error) {
    return false;
  }
}

export function generateRangeNumber(number) {
  try {
    const fixedNumber = generateNumber(number);
    const fixedNumberString = fixedNumber.toString();
    const dotIndex = fixedNumberString.indexOf('.');

    if (dotIndex > 0) {
      const range = fixedNumberString.split('.');
      return range[1];
    }
    return fixedNumberString.replace('.', '');
  } catch (error) {
    throw error;
  }
}

function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
}

function generateChangeNumber(range) {
  const rangeDecimal = new Decimal(range.toString());
  return rangeDecimal.div(2).toFixed(SORT_OBJECT.MAX_ORDER_NUMBER_TO_FIXED); // 1 item change
}

export function generateNewOrderNumber(aNumber, bNumber, range) {
  const aNumberDecimal = new Decimal(aNumber.toString());
  const plusNumber = generateChangeNumber(range);
  const order = aNumberDecimal.plus(plusNumber);

  return {
    a: (aNumber),
    order,
    b: (bNumber)
  };
}

export function initSort(posA, posB) {
  const baseA = new Decimal(posA).toNumber();
  const baseB = new Decimal(posB).toNumber();
  const posADecimal = new Decimal(posA);
  const posBDecimal = new Decimal(posB);

  const range = posBDecimal.minus(posADecimal);
  if (range.lt(0) === true) {
    return false;
  }

  baseScale = generateRangeNumber(range);
  baseRange = generateRangeLength(baseScale);

  if (baseMinus > 0) {
    const tmp = new Decimal(baseScale).minus(baseMinus);
    const pad = padDigits(tmp, baseRange);
    baseScale = generateRangeNumber(pad);
    baseRange = generateRangeLength(baseScale);
  }

  return {
    baseA,
    baseB,
    baseScale,
    baseRange
  };
}