export const CIPHER_LIMITS = { key: 1024, encrypt: 64 * 1024, decrypt: 128 * 1024 }
const encoder = new TextEncoder()

export function validateCipherInput(input, mode) {
  if (typeof input.key !== 'string' || input.key.length === 0) {
    throw new Error('请输入密钥。')
  }
  if (typeof input.pwd !== 'string' || (mode === 'decrypt' && input.pwd.length === 0)) {
    throw new Error('请输入需要解密的密文。')
  }
  if (encoder.encode(input.key).length > CIPHER_LIMITS.key) {
    throw new Error('密钥不能超过 1 KiB（UTF-8 字节）。')
  }
  const limit = mode === 'decrypt' ? CIPHER_LIMITS.decrypt : CIPHER_LIMITS.encrypt
  if (encoder.encode(input.pwd).length > limit) {
    throw new Error(`${mode === 'decrypt' ? '密文不能超过 128' : '明文不能超过 64'} KiB（UTF-8 字节）。`)
  }
  return { key: input.key, pwd: input.pwd }
}

export function parsePasswordParameters(input) {
  function integer(value, fallback, min, max, label) {
    const text = String(value ?? '').trim()
    if (text === '') return fallback
    const number = Number(text)
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(number) || number < min || number > max) {
      throw new Error(`${label}必须是 ${min}～${max} 之间的整数。`)
    }
    return number
  }

  return {
    num: integer(input.num, 0, 0, 128, '密码位数'),
    quantity: integer(input.quantity, 1, 1, 100, '密码个数')
  }
}
