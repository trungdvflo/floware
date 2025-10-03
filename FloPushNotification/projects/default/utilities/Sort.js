const _ = require('lodash');
const Decimal = require('decimal.js');

let baseA = 0;
let baseB = 0;

let baseMinus = 1;
let baseRange = 0;
let baseScale = 0;

function generateNumber(number) {
    try {
        const stringNumber = number.toString();
        const dashedIndex = _.indexOf(stringNumber, '-');

        if (dashedIndex >= 0) {
            const fixed = stringNumber.split('-');
            const fixedNumber = Number(fixed[1]);
            if (fixedNumber > 14) {
                baseMinus += 1;
            }
            return number.toFixed(fixedNumber);
        }
        return number;
    } catch (error) {
        return false;
    }
}

function generateRangeLength(number) {
    try {
        const fixedNumber = generateNumber(number);
        return fixedNumber.toString().length;
    } catch (error) {
        return false;
    }
}

function generateRangeNumber(number) {
    try {
        const fixedNumber = generateNumber(number);
        const fixedNumberString = fixedNumber.toString();
        const dotIndex = _.indexOf(fixedNumberString, '.');

        // if (dotIndex > 0 && number.gt(1) === false) {
        if (dotIndex > 0) {
            const range = fixedNumberString.split('.');
            return range[1];
        }
        return _.replace(fixedNumberString, '.', '');
    } catch (error) {
        throw error;
    }
}
function generateChangeNumber(length) {
    return `1e-${length}`;
}

function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

function getLastNumber(number) {
    try {
        const fixedNumber = generateNumber(number).toString();
        return Number(fixedNumber[fixedNumber.length - 1]);
    } catch (error) {
        throw error;
    }
}

function generateNewOrderNumber(type, aNumber, bNumber, range, rangeLength) {
    let length = _.clone(rangeLength);
    if (type === 'moveDown') {
        const plusString = generateChangeNumber(length);
        let plusNumber = generateNumber(Number(plusString));
        const lastNumber = getLastNumber(Number(range));
        if (lastNumber === 1 && Number(range) !== 1) {
            length += 1;
            plusNumber = generateNumber(Number(
                generateChangeNumber(length)
            ));
        }
        const order = aNumber.plus(plusNumber);
        return {
            a: (aNumber),
            order,
            b: (bNumber)
        };
    }
    const minusString = generateChangeNumber(length);
    let minusNumber = generateNumber(Number(minusString));
    const lastNumber = getLastNumber(Number(range));

    if (lastNumber === 1 && Number(range) !== 1) {
        length += 1;
        minusNumber = generateNumber(Number(
            generateChangeNumber(length)
        ));
    }
    const order = bNumber.minus(minusNumber);
    return {
        a: (aNumber),
        order,
        b: (bNumber)
    };
}

function init(posA, posB) {
    baseA = new Decimal(posA);
    baseB = new Decimal(posB);
    const range = baseB.minus(baseA);
    if (range.lte(0) === true) {
        return false;
    }

    // if (rangeLength >= 16) {
    //     return false;
    // }

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

module.exports = {
    generateNewOrderNumber,
    generateNumber,
    generateRangeLength,
    generateRangeNumber,
    getLastNumber,
    generateChangeNumber,
    padDigits,
    init
};
