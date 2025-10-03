import { Sha256 } from '@aws-crypto/sha256-js';
import { toHex } from '@smithy/util-hex-encoding';
import { Attendee, AttendeeList } from 'aws-sdk/clients/chimesdkmeetings';
import { ValidationError } from 'class-validator';
import { ErrorMessage } from 'common/constants/erros-dict.constant';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export const getErrorMessage = (error: ValidationError): ValidationError => {
  if (!error.children || error.children.length === 0) return error;
  return getErrorMessage(error.children[0]);
};

export const filterMessage = (validationErr: ValidationError[]) => {
  return validationErr.map((error) => {
    let message = '';
    error = getErrorMessage(error);
    message = error.constraints && Object.values(error.constraints).join(', ');
    if (!message) message = `${error.property} is invalid`;
    return {
      code: ErrorMessage.VALIDATION_FAILED,
      message,
    };
  });
};

export function filterListAttendee(
  rsAttendees: AttendeeList,
  lstNonAttendees: string[],
) {
  const filterAttendees: Attendee[] = rsAttendees.filter(
    (a) => !lstNonAttendees.includes(a.ExternalUserId),
  );
  const filterNonAttendees: Attendee[] = rsAttendees.filter((a) =>
    lstNonAttendees.includes(a.ExternalUserId),
  );
  return { filterAttendees, filterNonAttendees };
}

export function detectDomainFlo(arrData: string[], arrDomain: string[]) {
  const nonFloUsers = [];
  const floUsers = arrData.filter((email) => {
    for (const domain of arrDomain) {
      if (email.endsWith(`@${domain}`)) {
        return true;
      }
    }
    nonFloUsers.push(email);
    return false;
  });
  return { floUsers, nonFloUsers };
}

export function filterDuplicateItem(data: any[]) {
  const dataError = [];
  const uniqueArr = data.filter((value, index) => {
    if (data.indexOf(value) === index) {
      return value;
    } else {
      dataError.push(value);
    }
  });
  return { uniqueArr, dataError };
}

export async function generateWebsocketChatUrl(
  memberArn: string,
  hostname: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
): Promise<string> {
  const serviceName = 'chime';
  const sessionId = uuidv4(); // using memberArn.split('/')[1] if only one use this ws
  const d = new Date();
  const now =
    d.getUTCFullYear() +
    makeTwoDigits(d.getUTCMonth() + 1) +
    makeTwoDigits(d.getUTCDate()) +
    'T' +
    makeTwoDigits(d.getUTCHours()) +
    makeTwoDigits(d.getUTCMinutes()) +
    makeTwoDigits(d.getUTCSeconds()) +
    'Z';
  const today = now.substring(0, now.indexOf('T'));
  const signedHeaders = 'host';
  const payload = '';
  const canonicalHeaders = 'host:' + hostname.toLowerCase() + '\n';
  const credentialScope = `${today}/${region}/${serviceName}/aws4_request`;
  let canonicalQuerystring = '';
  let params: Map<string, string[]> = new Map<string, string[]>();
  params.set('X-Amz-Algorithm', ['AWS4-HMAC-SHA256']);
  params.set('X-Amz-Credential', [
    encodeURIComponent(accessKeyId + '/' + credentialScope),
  ]);
  params.set('X-Amz-Date', [now]);
  params.set('X-Amz-Expires', ['1000']);
  params.set('X-Amz-SignedHeaders', ['host']);

  const queryParams = new Map<string, string[]>();
  queryParams.set('userArn', [memberArn]);
  queryParams.set('sessionId', [sessionId]);
  queryParams?.forEach((values: string[], key: string) => {
    const encodedKey = encodeURIComponent(key);
    values.sort().forEach((value: string) => {
      if (!params.has(encodedKey)) {
        params.set(encodedKey, []);
      }
      params.get(encodedKey).push(encodeURIComponent(value));
    });
  });

  params = new Map([...params.entries()].sort());
  params.forEach((values: string[], key: string) => {
    values.forEach((value) => {
      if (canonicalQuerystring.length) {
        canonicalQuerystring += '&';
      }
      canonicalQuerystring += key + '=' + value;
    });
  });

  const canonicalRequest =
    'GET' +
    '\n' +
    '/connect' +
    '\n' +
    canonicalQuerystring +
    '\n' +
    canonicalHeaders +
    '\n' +
    signedHeaders +
    '\n' +
    toHex(await hmac(payload));

  const hashedCanonicalRequest = toHex(await hmac(canonicalRequest));
  const stringToSign =
    'AWS4-HMAC-SHA256\n' +
    now +
    '\n' +
    credentialScope +
    '\n' +
    hashedCanonicalRequest;
  const signingKey = await getSignatureKey(
    secretAccessKey,
    today,
    region,
    serviceName,
  );
  const signature = toHex(await hmac(stringToSign, signingKey));
  const finalParams = canonicalQuerystring + '&X-Amz-Signature=' + signature;
  return 'wss://' + hostname + '/connect' + '?' + finalParams;
}

async function getSignatureKey(
  key: string,
  date: string,
  regionName: string,
  serviceName: string,
): Promise<Uint8Array> {
  const kDate = await hmac(date, 'AWS4' + key);
  const kRegion = await hmac(regionName, kDate);
  const kService = await hmac(serviceName, kRegion);
  const kSigning = await hmac('aws4_request', kService);
  return kSigning;
}

function makeTwoDigits(n: number): string {
  /* istanbul ignore if */
  /* istanbul ignore else */
  if (n > 9) {
    return n.toString();
  } else {
    return '0' + n.toString();
  }
}

function hmac(
  data: string | Uint8Array,
  secret?: string | Uint8Array,
): Promise<Uint8Array> {
  const hash = new Sha256(secret);
  hash.update(data);
  return hash.digest();
}

export function randomDecimal(): number {
  const maxInt = 4294967295;
  const randomInt = randomBytes(4).readUInt32LE(0);
  return randomInt / maxInt;
}

export async function retryWithExponentialBackoff(fn: any) {
  // Initial config data
  let maxAttempts: number = 4
  let baseDelayMs: number = 500
  const {CHIME_MAX_RETRY, CHIME_BASE_DELAY_MS} = process.env
  if (CHIME_MAX_RETRY) {
    maxAttempts = parseInt(CHIME_MAX_RETRY)
  }
  if (CHIME_BASE_DELAY_MS) {
    baseDelayMs = parseInt(CHIME_BASE_DELAY_MS)
  }

  const delayRandomeMs = Math.floor(randomDecimal() * (baseDelayMs - 100)) + 100
  const execute = async (retryCount: number) => {
    try {
      return await fn()
    } catch (error) {
      // || error?.retryable === false || ChimeErrorCodeNotAbleRetry.includes(error?.code)
      if (error?.statusCode != 429) {
        console.log(`Chime Call | NOT Retry error ${error?.code} , ${error?.statusCode} `)
        throw error
      }
      if (retryCount >= maxAttempts) {
        console.log(`Chime Call | MAX Retry error ${error?.code}, ${error?.statusCode}  after ${retryCount} retries time `)
        throw error
      }
      
      const delayMs = delayRandomeMs * 2 ** retryCount
      console.log(`Chime Call | Retry error ${error?.code} attempt ${retryCount} after ${delayMs}ms`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))

      retryCount ++ 
      return await execute(retryCount)
    }
  }

  return await execute(1)
}
