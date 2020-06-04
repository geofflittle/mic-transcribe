const queryString = require('query-string')
const crypto = require('crypto')

type Time = string | number | Date

const getTime = (time: Time) => new Date(time).toISOString().replace(/[:\-]|\.\d{3}/g, '')

const getDate = (time: Time) => getTime(time).substring(0, 8)

const getHash = (value: string, encoding: string) => crypto.createHash('sha256')
    .update(value, 'utf8')
    .digest(encoding)

const getHmac = (key: string, string: string, encoding?: string) => crypto.createHmac('sha256', key)
    .update(string, 'utf8')
    .digest(encoding)

const getSignature = (secret: string, time: Time, region: string, service: string, stringToSign: string) => {
    const h1 = getHmac('AWS4' + secret, getDate(time))
    const h2 = getHmac(h1, region)
    const h3 = getHmac(h2, service)
    const h4 = getHmac(h3, 'aws4_request')
    return getHmac(h4, stringToSign, 'hex')
}

const getCredentialScope = (time: Time, region: string, service: string) => {
    return [getDate(time), region, service, 'aws4_request'].join('/')
}

const getStringToSign = (time: Time, region: string, service: string, request: string) => {
    return [
        'AWS4-HMAC-SHA256',
        getTime(time),
        getCredentialScope(time, region, service),
        getHash(request, 'hex')
    ].join('\n')
}

type Str2Str = { [key: string]: string }

const getCanonicalQueryString = (params: Str2Str) =>
    Object.keys(params).sort().map((key) =>
        encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
    ).join('&')


const getCanonicalHeaders = (headers: Str2Str) =>
    Object.keys(headers).sort().map((name) =>
        name.toLowerCase().trim() + ':' + headers[name].toString().trim() + '\n'
    ).join('')

const getSignedHeaders = (headers: Str2Str) =>
    Object.keys(headers).sort().map((name) =>
        name.toLowerCase().trim()
    ).join(';')

const getCanonicalRequest = (method: string, pathname: string, query: Str2Str, headers: Str2Str, payload: string) => {
    return [
        method.toUpperCase(),
        pathname,
        getCanonicalQueryString(query),
        getCanonicalHeaders(headers),
        getSignedHeaders(headers),
        payload
    ].join('\n')
}

type Headers = object & {
    Host: string
}

interface PresignedUrlParams {
    method: string
    headers: Headers
    path: string,
    service: string,
    payload: string,
    key?: string
    secret?: string
    protocol?: string
    timestamp?: number
    region?: string
    expires?: number
    queryStr?: string
    sessionToken?: string
}

export const getPreSignedUrl = ({
    method,
    headers,
    path,
    service,
    payload,
    key = process.env.AWS_ACCESS_KEY_ID || '',
    secret = process.env.AWS_SECRET_ACCESS_KEY || '',
    protocol = "https",
    timestamp = Date.now(),
    region = process.env.AWS_REGION || "us-east-1",
    expires = 8400,
    queryStr = '{}',
    sessionToken = process.env.SESSION_TOKEN
}: PresignedUrlParams) => {
    const query = {
        ...queryString.parse(queryStr),
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": `${key}/${getCredentialScope(timestamp, region, service)}`,
        "X-Amz-Date": getTime(timestamp),
        "X-Amz-Expires": expires,
        "X-Amz-SignedHeaders": getSignedHeaders(headers),
        ...(sessionToken ? { "X-Amz-Security-Token": sessionToken } : {})
    }
    const canonicalRequest = getCanonicalRequest(method, path, query, headers, payload)
    const stringToSign = getStringToSign(timestamp, region, service, canonicalRequest)
    const signature = getSignature(secret, timestamp, region, service, stringToSign)
    const signedQuery = {
        ...query,
        ['X-Amz-Signature']: signature
    }
    return `${protocol}://${headers.Host}${path}?${queryString.stringify(signedQuery)}`
}