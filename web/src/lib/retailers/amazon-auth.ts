import crypto from 'crypto';

interface AmazonPAAPICredentials {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
}

export function generateAmazonPAAPIHeaders(
  credentials: AmazonPAAPICredentials,
  payload: object,
  region: string = 'eu-west-1'
): Record<string, string> {
  const { accessKey, secretKey } = credentials;
  const host = 'webservices.amazon.in';
  const path = '/paapi5/searchitems';
  const target = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';
  
  const now = new Date();
  const xAmzDate = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateStamp = xAmzDate.substring(0, 8);
  const service = 'ProductAdvertisingAPI';

  const payloadString = JSON.stringify(payload);
  const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

  const headersToSign: Record<string, string> = {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=UTF-8',
    'host': host,
    'x-amz-date': xAmzDate,
    'x-amz-target': target,
  };

  const sortedKeys = Object.keys(headersToSign).sort();
  const canonicalHeaders = sortedKeys.map(k => `${k}:${headersToSign[k]}\n`).join('');
  const signedHeaders = sortedKeys.join(';');

  const canonicalRequest = [
    'POST',
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    xAmzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  function hmac(key: Buffer | string, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
  }

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    ...headersToSign,
    'Authorization': authorizationHeader,
  };
}
