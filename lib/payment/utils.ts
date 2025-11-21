import crypto from 'crypto'

/**
 * Sort parameters and generate sign string
 */
export function getSignString(params: Record<string, any>): string {
  const sortedParams: [string, any][] = []

  // Filter out sign, sign_type and empty values
  for (const key in params) {
    if (!params[key] || key === 'sign' || key === 'sign_type') {
      continue
    }
    sortedParams.push([key, params[key]])
  }

  // Sort by key name (ASCII)
  sortedParams.sort((a, b) => a[0].localeCompare(b[0]))

  // Build query string
  const prestr = sortedParams
    .map((item) => `${item[0]}=${item[1]}`)
    .join('&')

  return prestr
}

/**
 * Generate MD5 signature
 */
export function generateSign(params: Record<string, any>, key: string): string {
  const signString = getSignString(params)
  const sign = crypto.createHash('md5').update(signString + key).digest('hex')
  return sign
}

/**
 * Verify signature
 */
export function verifySign(params: Record<string, any>, key: string): boolean {
  const receivedSign = params.sign
  if (!receivedSign) return false

  const calculatedSign = generateSign(params, key)
  return receivedSign === calculatedSign
}

/**
 * Generate order number: YYYYMMDDHHMMSS + random 3 digits
 */
export function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')

  return `${year}${month}${day}${hour}${minute}${second}${random}`
}

