import { requestText } from './client.js'

export function encryptText(input, signal) {
  return requestText('tools/encryption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal
  })
}

export function decryptText(input, signal) {
  return requestText('tools/decryption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal
  })
}

export function generatePasswords(parameters, signal) {
  const query = new URLSearchParams(parameters)
  return requestText(`tools/get/randompwd?${query}`, { signal })
}
