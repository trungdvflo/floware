const _ = require('lodash');
const moment = require('moment');
const { mimeWordDecode } = require('emailjs-mime-codec');
const AppsConstant = require('../constants/AppsConstant');
const Re2 = require('re2');

const Utils = {
  SubString: (str, length = 0, suffix = '...') => {
    if (_.isString(str) === false || _.isNumber(length) === false || length <= 0) {
      return '';
    }
    if (_.isEmpty(suffix) === false && str.length > length) {
      return `${str.trim().substr(0, length).trim()}${suffix}`;
    }

    return str.trim().substr(0, length).trim();
  },
  // format 1568269168.587
  Timestamp: (millisecond = Date.now()) => {
    try {
      if (_.isNumber(millisecond) === true && millisecond.toString().length >= 10) {
        return millisecond / 1000;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  replaceErrors: (key, value) => {
    if (value instanceof Error) {
      const error = {};
      Object.getOwnPropertyNames(value).forEach((k) => {
        error[k] = value[k];
      });
      return error;
    }
    return value;
  },

  // utc, ex : 1568269168587
  ValidDatetime: (millisecond) => {
    try {
      const diff = moment('1970-01-01').diff(millisecond, 'days');
      if (diff > 0) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  CachePatterns: (keyCache = AppsConstant.MAIN_KEY_CACHE, func, key, user = null) => {
    let mainKey = `${keyCache}:${func}:${key}`;
    if (user !== null) {
      mainKey = `${keyCache}:${user}:${func}:${key}`;
    }
    return mainKey;
  },

  ParseUserId: (userId) => {
    const number = userId.toLocaleString();
    const numberArr = number.split(',');
    const result = ['0', '0', '0', '0'];
    _.forEach(numberArr, (item, i) => {
      const index = (result.length) - numberArr.length + i;
      result[index] = Number(item);
    });
    return result.join('/');
  },

  validURL: (str) => {
    const pattern = new Re2(new RegExp('^(https?:\\/\\/)?' // protocol
      + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
      + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
      + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
      + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
      + '(\\#[-a-z\\d_]*)?$', 'i')); // fragment locator
    return !!pattern.test(str);
  },
  /**
   * @param str 
   * example: =?UTF-8?B?dGjhu6d5IHRpw6pu?= <thuytien1224@gmail.com>, 
   * =?UTF-8?Q?Ng=C3=B4_Th=C3=A0nh_=C4=90=C6=B0?= =?UTF-8?Q?=E1=BB=A3c?=\n <duocnt2012@flodev.net>
   * =?utf-8?Q?Ng=C3=B4_Th=C3=A0nh_=C4=90=C6=B0=E1=BB=A3c?=\n <duocnt2012@flodev.net>
   * =?UTF-8?Q?Ng=C3=B4_Th=C3=A0nh_=C4=90=C6=B0?=\n =?UTF-8?Q?=E1=BB=A3c_Th=C3=A8m_Nh=C3=A0_C=C3=B3_Ho?=\n =?UTF-8?Q?a_R=E1=BA=A5t_=C4=90=E1=BA=B9p?= <duocnt2012@flodev.net>
   * "=?utf-8?Q?thuy=40flomail.net?=" <thuy@flomail.net>
   */
  FromConvertUTF8ToStrings: (str) => {
    if (!str) return "";
    let rawStr = str;
    if (str.indexOf('=?UTF-8') !== -1 || str.indexOf('=?utf-8') !== -1) {
      const arrStr = str.split(' ');
      const email = arrStr[arrStr.length - 1];
      arrStr.splice(-1, 1);
      _.forEach(arrStr, (item, index) => {
        const tempStr = arrStr[index].match(/(=)(.*)(=)/);
        if(tempStr && tempStr[0]) {
          const strDecode = mimeWordDecode(tempStr[0]);
          arrStr[index] = arrStr[index].replace(tempStr[0], strDecode);
        }
        arrStr[index] = Utils.replaceAll(arrStr[index], '\n', '');
      });
      rawStr = `${arrStr.join('')} ${email}`;
    }
    return rawStr;
  },

  replaceAll: (str, find, replace) => {
    return str.replace(new RegExp(find, 'g'), replace);
  },

  /**
   * Function to fix native charCodeAt()
   *
   * Now, we can use fixedCharCodeAt("foo€", 3); for multibyte (non-bmp) chars too.
   *
   * @access public
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/charCodeAt
   * @note If you hit a non-bmp surrogate, the function will return false
   * @param str String Mixed string to get charcodes
   * @param idx Integer Position of the char to get
   * @return code Integer Result charCodeAt();
   */
  FixedCharCodeAt: (str, idx) => {
    idx = idx || 0;
    let code = str.charCodeAt(idx);
    let hi, low;
    if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        hi = code;
        low = str.charCodeAt(idx + 1);
        if (isNaN(low)) {
            throw 'Kein gültiges Schriftzeichen oder Speicherfehler!';
        }
        return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
    }
    if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
        // We return false to allow loops to skip this iteration since should have already handled high surrogate above in the previous iteration
        return false;
        /*hi = str.charCodeAt(idx-1);
        low = code;
        return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;*/
    }
    return code;
  },

  /**
   * Number of byte of char code
   * @param {*} charCode 
   * @returns 
   */
  BytesOfCharCode: (charCode) => {
    if (typeof charCode === "number") {
      if (charCode < 128) {
        return 1;
      } else if (charCode < 2048) {
        return 2;
      } else if (charCode < 65536) {
        return 3;
      } else if (charCode < 2097152) {
        return 4;
      } else if (charCode < 67108864) {
        return 5;
      } else {
        return  6;
      }
    }
    return 0;
  },

  /**
   * Gets size of a UTF-8 string in bytes
   *
   * @autor Frank Neff <fneff89@gmail.com>
   * @license GPL v2
   * @access public
   * @param str String Input string to get bytesize
   * @return result String Size of the input string in bytes
   */
  CountUtf8Bytes: (str) => {
    let result = 0;
    for (let n = 0; n < str.length; n++) {
      let charCode = Utils.FixedCharCodeAt(str, n);
      result = result + Utils.BytesOfCharCode(charCode);
    }
    return result;
  },

  /**
   * SubString by Bytes
   * @param {*} str 
   * @param {*} bytes 
   * @returns 
   */
  SubStringBytes: (str, bytes) => {
    let result = 0;
    let index = 0;
    for (let n = 0; n < str.length; n++) {
      let charCode = Utils.FixedCharCodeAt(str, n);
      result = result + Utils.BytesOfCharCode(charCode);
      if (result > bytes) {
        break;
      } else {
        index = n;
      }
    }
    return Utils.SubString(str, index + 1);
  },

  ParseToAddress: (to, maxItem, limitBytes) => {
    if (!to || typeof to !== 'string') {
      return { listSt: '', total: 0 };
    }
  
    const tos = to.split(',');
    const total = tos.length;
    const toArr = [];
    let bytesRemaining = limitBytes - total.toString().length;
    const numItems = Math.min(total, maxItem);
    for (let i = 0; i < numItems; i++) {
      const to = Utils.FromConvertUTF8ToStrings(tos[i]);
      const utf8Bytes = Utils.CountUtf8Bytes(to);
      if (bytesRemaining < utf8Bytes) break;
      bytesRemaining -= utf8Bytes;
      toArr.push(to);
    }
  
    return { listSt: toArr.join(','), total };
  },
};
module.exports = Utils;
